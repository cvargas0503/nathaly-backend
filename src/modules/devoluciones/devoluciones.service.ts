import { createHash } from 'node:crypto';
import { EntityManager } from 'typeorm';
import { HttpError, id, integer, quantity, lock, units, decimal } from '../../utils/feature';
export function validateReturn(body: any) {
  if (!body || typeof body.motivo !== 'string' || !body.motivo.trim() || body.motivo.trim().length > 250) throw new HttpError(400, 'Motivo requerido, máximo 250 caracteres');
  if (!Array.isArray(body.detalles) || !body.detalles.length || body.detalles.length > 100) throw new HttpError(400, 'Detalles: 1 a 100');
  const seen = new Set<string>();
  const detalles = body.detalles.map((d: any) => {
    const line = d?.idVentaDetalle !== undefined;
    if (!line && d?.idProducto === undefined) throw new HttpError(400, 'Línea o producto requerido');
    const identifier = line ? id(d.idVentaDetalle, 'idVentaDetalle') : String(integer(d.idProducto, 'idProducto'));
    const key = `${line ? 'line' : 'product'}:${identifier}`;
    if (seen.has(key)) throw new HttpError(400, 'Detalle repetido');
    seen.add(key);
    return { ...(line ? { idVentaDetalle: identifier } : { idProducto: Number(identifier) }), cantidad: quantity(d.cantidad) };
  }).sort((a: any, b: any) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return { idVenta: id(body.idVenta, 'idVenta'), motivo: body.motivo.trim(), detalles };
}
export function bodyHash(input: ReturnType<typeof validateReturn>) { return createHash('sha256').update(JSON.stringify(input)).digest('hex'); }
export function returnKey(value: unknown): string | null {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^[\x21-\x7e]{1,128}$/.test(value)) throw new HttpError(400, 'Idempotency-Key inválida');
  return value;
}
export const availabilitySQL = `SELECT CONVERT(varchar(30),vd.IdVentaDetalle) AS idVentaDetalle,vd.IdProducto AS idProducto,
  CONVERT(varchar(40),vd.Cantidad) AS vendida,CONVERT(varchar(40),COALESCE(r.devuelta,0)) AS devuelta,
  CONVERT(varchar(40),vd.Cantidad-COALESCE(r.devuelta,0)) AS disponible,
  CONVERT(varchar(40),vd.PrecioUnitario) AS precioUnitario
  FROM VENTAS.VentaDetalle vd OUTER APPLY (
    SELECT SUM(d.Cantidad) AS devuelta FROM VENTAS.NotaCreditoDetalle d
    JOIN VENTAS.NotaCredito n ON n.IdNotaCredito=d.IdNotaCredito
    WHERE d.IdVentaDetalle=vd.IdVentaDetalle AND d.Eliminado=0 AND n.Eliminado=0
  ) r WHERE vd.IdVenta=@0 AND vd.Eliminado=0 ORDER BY vd.IdVentaDetalle`;
export async function applyReturn(m: EntityManager, input: ReturnType<typeof validateReturn>, user: number, key: string | null) {
  const hash = bodyHash(input);
  if (key) {
    await lock(m, `devolucion:${user}:${key}`);
    const [previous] = await m.query('SELECT BodyHash,Resultado FROM ADMIN.SolicitudDevolucion WHERE UsuarioId=@0 AND Clave=@1', [user, key]);
    if (previous) {
      if (previous.BodyHash !== hash) throw new HttpError(409, 'Clave utilizada con otro body');
      return { ...JSON.parse(previous.Resultado), replayed: true };
    }
  }
  const [sale] = await m.query('SELECT IdBodega FROM VENTAS.Venta WITH (UPDLOCK,HOLDLOCK) WHERE IdVenta=@0 AND Eliminado=0', [input.idVenta]);
  if (!sale) throw new HttpError(404, 'Venta no encontrada');
  const lines = await m.query(availabilitySQL, [input.idVenta]);
  const seen = new Set<string>(), validated: any[] = [];
  let total = 0;
  for (const detail of input.detalles) {
    const candidates = lines.filter((l: any) => 'idVentaDetalle' in detail ? l.idVentaDetalle === detail.idVentaDetalle : l.idProducto === detail.idProducto);
    if (candidates.length > 1) throw new HttpError(409, 'Producto ambiguo: utilice idVentaDetalle');
    if (!candidates.length) throw new HttpError(400, 'Línea no pertenece a la venta');
    const line = candidates[0];
    if (seen.has(line.idVentaDetalle)) throw new HttpError(400, 'Línea repetida');
    seen.add(line.idVentaDetalle);
    if (units(detail.cantidad, 2) > units(line.disponible, 2)) throw new HttpError(409, 'Cantidad excede saldo disponible');
    // Preserve existing monetary contract: quantity * unit price, without discount proration.
    const monto = Number(detail.cantidad) * Number(line.precioUnitario); total += monto;
    validated.push({ idVentaDetalle: line.idVentaDetalle, idProducto: line.idProducto, cantidad: detail.cantidad, monto, precioUnitario: Number(line.precioUnitario) });
  }
  validated.sort((a, b) => a.idProducto - b.idProducto);
  for (const d of validated) {
    const [stock] = await m.query('SELECT Stock,Eliminado FROM INVENTARIO.Existencia WITH (UPDLOCK,HOLDLOCK) WHERE IdBodega=@0 AND IdProducto=@1', [sale.IdBodega, d.idProducto]);
    if (!stock || stock.Eliminado) throw new HttpError(409, 'Existencia no disponible para reintegro');
  }
  await lock(m, 'consecutivo:NOTA_CREDITO');
  const [seq] = await m.query("UPDATE ADMIN.Consecutivos SET ValorActual=ValorActual+1 OUTPUT INSERTED.ValorActual WHERE Entidad='NOTA_CREDITO'");
  if (!seq) throw new HttpError(409, 'Falta consecutivo NOTA_CREDITO');
  const numeroNC = `NC-${String(seq.ValorActual).padStart(8, '0')}`;
  const [note] = await m.query(`INSERT INTO VENTAS.NotaCredito (NumeroNC,IdVenta,Fecha,IdEstadoNota,Motivo,Total,CreadoPor,FechaCreacion,Eliminado)
    OUTPUT CONVERT(varchar(30),INSERTED.IdNotaCredito) AS idNotaCredito VALUES (@0,@1,SYSUTCDATETIME(),1,@2,@3,@4,SYSUTCDATETIME(),0)`, [numeroNC, input.idVenta, input.motivo, total, user]);
  for (const d of validated) {
    await m.query(`INSERT INTO VENTAS.NotaCreditoDetalle (IdNotaCredito,IdVentaDetalle,Cantidad,Monto,IdMotivoDevol,CreadoPor,FechaCreacion,Eliminado)
      VALUES (@0,@1,@2,@3,1,@4,SYSUTCDATETIME(),0)`, [note.idNotaCredito, d.idVentaDetalle, d.cantidad, d.monto, user]);
    await m.query('UPDATE INVENTARIO.Existencia SET Stock=Stock+@2,ModificadoPor=@3,FechaModificacion=SYSUTCDATETIME() WHERE IdBodega=@0 AND IdProducto=@1', [sale.IdBodega, d.idProducto, d.cantidad, user]);
    await m.query(`INSERT INTO INVENTARIO.Kardex (IdTipoMov,ReferenciaId,IdBodega,IdProducto,Fecha,Cantidad,CostoUnit,Observacion,CreadoPor,FechaCreacion,Eliminado)
      VALUES (5,@0,@1,@2,SYSUTCDATETIME(),@3,@4,@5,@6,SYSUTCDATETIME(),0)`, [note.idNotaCredito, sale.IdBodega, d.idProducto, d.cantidad, d.precioUnitario, `Devolución NC: ${numeroNC}`, user]);
  }
  const result = { ...note, numeroNC, totalDevolucion: total, detalles: validated, replayed: false };
  if (key) await m.query('INSERT INTO ADMIN.SolicitudDevolucion (UsuarioId,Clave,BodyHash,Resultado,Fecha) VALUES (@0,@1,@2,@3,SYSUTCDATETIME())', [user, key, hash, JSON.stringify(result)]);
  return result;
}
