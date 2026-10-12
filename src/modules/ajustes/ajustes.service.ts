import { EntityManager } from 'typeorm';
import { HttpError, integer, quantity, units, decimal } from '../../utils/feature';

export function validateAdjustment(body: any) {
  if (!body || typeof body.observacion !== 'string' || body.observacion.trim().length < 5 || body.observacion.trim().length > 250)
    throw new HttpError(400, 'Observación requerida: 5 a 250 caracteres');
  if (!Array.isArray(body.detalles) || body.detalles.length < 1 || body.detalles.length > 100) throw new HttpError(400, 'Detalles: 1 a 100');
  const seen = new Set<number>();
  const detalles = body.detalles.map((d: any) => {
    const idProducto = integer(d?.idProducto, 'idProducto');
    if (seen.has(idProducto)) throw new HttpError(400, 'Producto repetido');
    seen.add(idProducto);
    if (!['ENTRADA', 'SALIDA'].includes(d.tipo) || d.costoUnitario !== undefined || d.costoUnit !== undefined || d.costo !== undefined) throw new HttpError(400, 'Tipo o costo inválido');
    return { idProducto, tipo: d.tipo as string, cantidad: quantity(d.cantidad) };
  }).sort((a: any, b: any) => a.idProducto - b.idProducto);
  return { idBodega: integer(body.idBodega, 'idBodega'), observacion: body.observacion.trim(), detalles };
}
export function adjustedStock(stock: string, amount: string, type: string) {
  const next = units(stock, 2) + (type === 'ENTRADA' ? 1n : -1n) * units(amount, 2);
  if (next < 0n) throw new HttpError(409, 'Existencia insuficiente');
  return decimal(next, 2);
}
export async function applyAdjustment(m: EntityManager, input: ReturnType<typeof validateAdjustment>, user: number) {
  const [bodega] = await m.query('SELECT IdBodega FROM INVENTARIO.Bodega WITH (HOLDLOCK) WHERE IdBodega=@0 AND Eliminado=0', [input.idBodega]);
  if (!bodega) throw new HttpError(404, 'Bodega no disponible');
  const tipos = await m.query("SELECT IdTipoMov,Nombre,Signo FROM CATALOGOS.TipoMovimientoInventario WHERE Nombre IN ('AJUSTE_ENTRADA','AJUSTE_SALIDA') AND Eliminado=0");
  const valid: any[] = [];
  for (const d of input.detalles) {
    const [p] = await m.query('SELECT CONVERT(varchar(40),Costo) AS Costo FROM INVENTARIO.Producto WITH (HOLDLOCK) WHERE IdProducto=@0 AND Eliminado=0', [d.idProducto]);
    if (!p) throw new HttpError(404, 'Producto no disponible');
    const candidates = tipos.filter((t: any) => t.Nombre === `AJUSTE_${d.tipo}` && t.Signo === (d.tipo === 'ENTRADA' ? 1 : -1));
    if (candidates.length !== 1) throw new HttpError(409, 'Configurar movimiento AJUSTE_ENTRADA/AJUSTE_SALIDA');
    const [e] = await m.query('SELECT CONVERT(varchar(40),Stock) AS Stock,Eliminado FROM INVENTARIO.Existencia WITH (UPDLOCK,HOLDLOCK) WHERE IdBodega=@0 AND IdProducto=@1', [input.idBodega, d.idProducto]);
    if (e?.Eliminado || (!e && d.tipo === 'SALIDA')) throw new HttpError(409, 'Existencia no disponible');
    valid.push({ ...d, idTipoMov: candidates[0].IdTipoMov, costoUnit: p.Costo, stockPosterior: adjustedStock(e?.Stock ?? '0.00', d.cantidad, d.tipo), exists: !!e });
  }
  const [header] = await m.query(`INSERT INTO INVENTARIO.Ajuste (IdBodega,Fecha,Observacion,CreadoPor,FechaCreacion,Eliminado)
    OUTPUT CONVERT(varchar(30),INSERTED.IdAjuste) AS idAjuste
    VALUES (@0,SYSUTCDATETIME(),@1,@2,SYSUTCDATETIME(),0)`, [input.idBodega, input.observacion, user]);
  for (const d of valid) {
    await m.query(`INSERT INTO INVENTARIO.AjusteDetalle (IdAjuste,IdProducto,Cantidad,CostoUnit,IdTipoMov,CreadoPor,FechaCreacion,Eliminado)
      VALUES (@0,@1,@2,@3,@4,@5,SYSUTCDATETIME(),0)`, [header.idAjuste, d.idProducto, d.cantidad, d.costoUnit, d.idTipoMov, user]);
    if (d.exists) await m.query('UPDATE INVENTARIO.Existencia SET Stock=@2,ModificadoPor=@3,FechaModificacion=SYSUTCDATETIME() WHERE IdBodega=@0 AND IdProducto=@1', [input.idBodega, d.idProducto, d.stockPosterior, user]);
    else await m.query('INSERT INTO INVENTARIO.Existencia (IdBodega,IdProducto,Stock,CreadoPor,FechaCreacion,Eliminado) VALUES (@0,@1,@2,@3,SYSUTCDATETIME(),0)', [input.idBodega, d.idProducto, d.stockPosterior, user]);
    await m.query(`INSERT INTO INVENTARIO.Kardex (IdTipoMov,ReferenciaId,IdBodega,IdProducto,Fecha,Cantidad,CostoUnit,Observacion,CreadoPor,FechaCreacion,Eliminado)
      VALUES (@0,@1,@2,@3,SYSUTCDATETIME(),@4,@5,@6,@7,SYSUTCDATETIME(),0)`, [d.idTipoMov, header.idAjuste, input.idBodega, d.idProducto, d.cantidad, d.costoUnit, input.observacion, user]);
  }
  return { ...header, idBodega: input.idBodega, observacion: input.observacion, detalles: valid.map(({ exists, ...d }) => d) };
}
