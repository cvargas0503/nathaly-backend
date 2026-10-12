import { EntityManager } from 'typeorm';
import { decimal, HttpError, integer, pagination, units } from '../../utils/feature';
export function replenishment(rows: any[]) {
  const propuesta: any[] = [], diagnosticos: any[] = [], groups = new Map<number, { products: number; amount: bigint; cost: bigint }>();
  let sinExistencia = 0;
  for (const r of rows) {
    if (r.stock === null) { sinExistencia++; continue; }
    const stock = units(r.stock, 2), min = units(r.minimo, 2), max = units(r.maximo, 2), cost = units(r.costoUnitario, 4);
    const base = { idProducto: r.idProducto, codigo: r.codigo, idBodega: r.idBodega, idProveedor: r.idProveedor,
      stock: decimal(stock, 2), minimo: decimal(min, 2), maximo: decimal(max, 2), costoUnitario: decimal(cost, 4) };
    const reasons: string[] = [];
    if (stock < 0n) reasons.push('STOCK_NEGATIVO');
    if (max < min || max <= 0n || cost < 0n) reasons.push('CONFIGURACION_INVALIDA');
    if (r.proveedorEliminado !== false && r.proveedorEliminado !== 0) reasons.push('PROVEEDOR_NO_DISPONIBLE');
    if (reasons.length) { diagnosticos.push({ ...base, motivos: reasons, motivo: reasons[0], cantidadSugerida: null, costoEstimado: null }); continue; }
    if (min <= 0n || stock >= min) continue;
    const amount = max > stock ? max - stock : 0n;
    // quantity(scale2)*cost(scale4) -> cost(scale4), half-up rounding, nonnegative.
    const estimated = (amount * cost + 50n) / 100n;
    propuesta.push({ ...base, cantidadSugerida: decimal(amount, 2), costoEstimado: decimal(estimated, 4), motivo: 'STOCK_BAJO' });
    const g = groups.get(r.idProveedor) ?? { products: 0, amount: 0n, cost: 0n };
    g.products++; g.amount += amount; g.cost += estimated; groups.set(r.idProveedor, g);
  }
  return { propuesta, diagnosticos, advertencias: { productosSinExistencia: sinExistencia }, resumen: [...groups].map(([idProveedor, g]) => ({ idProveedor, totalProductos: g.products, cantidadSugerida: decimal(g.amount, 2), costoEstimado: decimal(g.cost, 4) })) };
}
export async function queryReplenishment(m: EntityManager, q: any, summary: boolean) {
  const idBodega = integer(q.idBodega, 'idBodega'), idProveedor = q.idProveedor === undefined ? null : integer(q.idProveedor, 'idProveedor');
  const { page, limit, skip } = pagination(q);
  const [warehouse] = await m.query('SELECT IdBodega FROM INVENTARIO.Bodega WHERE IdBodega=@0 AND Eliminado=0', [idBodega]);
  if (!warehouse) throw new HttpError(404, 'Bodega no disponible');
  const rows = await m.query(`SELECT p.IdProducto AS idProducto,p.Codigo AS codigo,@0 AS idBodega,p.IdProveedor AS idProveedor,
    CONVERT(varchar(40),e.Stock) AS stock,CONVERT(varchar(40),p.ExistenciaMin) AS minimo,
    CONVERT(varchar(40),p.ExistenciaMax) AS maximo,CONVERT(varchar(40),p.Costo) AS costoUnitario,s.Eliminado AS proveedorEliminado
    FROM INVENTARIO.Producto p LEFT JOIN INVENTARIO.Existencia e ON e.IdProducto=p.IdProducto AND e.IdBodega=@0 AND e.Eliminado=0
    LEFT JOIN CATALOGOS.Proveedor s ON s.IdProveedor=p.IdProveedor
    WHERE p.Eliminado=0 AND (@1 IS NULL OR p.IdProveedor=@1) ORDER BY p.IdProveedor,p.Codigo,p.IdProducto`, [idBodega, idProveedor]);
  const result = replenishment(rows);
  const fechaGeneracion = new Date().toISOString();
  return summary ? { data: result.resumen, diagnosticos: result.diagnosticos, advertencias: result.advertencias, fechaGeneracion }
    : { data: result.propuesta.slice(skip, skip + limit), diagnosticos: result.diagnosticos, advertencias: result.advertencias,
      pagination: { page, limit, total: result.propuesta.length }, fechaGeneracion };
}
