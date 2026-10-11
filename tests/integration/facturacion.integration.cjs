// Explicit opt-in: npm run test:integration, using an isolated LOCAL QA database.
// Every invoice created here belongs to an outer transaction which is rolled back.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const sql = require('mssql');
const { getMSSQLPool } = require('../../dist/src/database');
const { crearUnidad } = require('../../dist/src/modules/ventas/facturacion/facturacion.sql');
const { FacturacionFacade } = require('../../dist/src/modules/ventas/facturacion/facturacion.facade');
let pool;
async function obtenerFixture() {
  pool ??= await getMSSQLPool();
  const r = await pool.request().query(`SELECT TOP(1) e.IdProducto,b.IdSucursal,e.Stock,
    (SELECT TOP(1) IdCliente FROM CATALOGOS.Cliente WHERE Eliminado=0) AS IdCliente,
    (SELECT TOP(1) IdEmpleado FROM RRHH.Empleado WHERE Eliminado=0) AS IdEmpleado,
    (SELECT TOP(1) IdUsuario FROM SEGURIDAD.Usuario WHERE Activo=1 AND Eliminado=0) AS IdUsuario,
    (SELECT TOP(1) IdTermino FROM CATALOGOS.Termino) AS IdTermino
    FROM INVENTARIO.Existencia e JOIN INVENTARIO.Bodega b ON b.IdBodega=e.IdBodega
    JOIN INVENTARIO.Producto p ON p.IdProducto=e.IdProducto JOIN CATALOGOS.Sucursal s ON s.IdSucursal=b.IdSucursal
    WHERE e.Stock>=1 AND e.Eliminado=0 AND b.Eliminado=0 AND b.Activo=1 AND b.EsPrincipal=1
      AND s.Eliminado=0 AND s.Activo=1 AND p.Eliminado=0 ORDER BY e.IdProducto`);
  const f = r.recordset[0];
  assert.ok(f?.IdCliente && f?.IdEmpleado && f?.IdUsuario && f?.IdTermino, 'Se requiere fixture de catálogos y stock en QA');
  return { f, body: { idCliente: f.IdCliente, idEmpleado: f.IdEmpleado, idSucursal: f.IdSucursal,
    idTermino: f.IdTermino, fecha: new Date().toISOString(), detalles: [{ idProducto: f.IdProducto, cantidad: 1, precioUnitario: 1, descuento: 0 }] } };
}
async function reversible(fn) {
  const tx = new sql.Transaction(pool); let reverted = false; tx.on('rollback', () => { reverted = true; });
  await tx.begin();
  try { await fn(tx); } finally { if (!reverted) await tx.rollback(); }
}
test('SQL Server: invoice, stock and Kardex written atomically; retry creates no second invoice', async () => {
  const { f, body } = await obtenerFixture(); const clave = randomUUID();
  const before = await pool.request().input('p', sql.Int, f.IdProducto).input('s', sql.Int, f.IdSucursal)
    .query('SELECT e.Stock FROM INVENTARIO.Existencia e JOIN INVENTARIO.Bodega b ON b.IdBodega=e.IdBodega WHERE e.IdProducto=@p AND b.IdSucursal=@s AND b.EsPrincipal=1');
  await reversible(async tx => {
    const facade = new FacturacionFacade({ ejecutar: op => op(crearUnidad(tx)) });
    const first = await facade.confirmar(body, f.IdUsuario, clave);
    assert.equal(first.reutilizada, false);
    assert.equal((await facade.confirmar(body, f.IdUsuario, clave)).reutilizada, true);
    const r = await new sql.Request(tx).input('clave', sql.UniqueIdentifier, clave).query(`
      SELECT sf.IdVenta, (SELECT COUNT(*) FROM VENTAS.VentaDetalle d WHERE d.IdVenta=sf.IdVenta) AS Detalles,
      (SELECT COUNT(*) FROM INVENTARIO.Kardex k WHERE k.ReferenciaId=sf.IdVenta AND k.IdTipoMov=7) AS Movimientos
      FROM ADMIN.SolicitudFacturacion sf WHERE sf.Clave=@clave`);
    assert.equal(r.recordset.length, 1); assert.equal(r.recordset[0].Detalles, 1); assert.equal(r.recordset[0].Movimientos, 1);
    await assert.rejects(facade.confirmar({ ...body, idCliente: body.idCliente+1 }, f.IdUsuario, clave), { status: 409 });
  });
  const after = await pool.request().input('p', sql.Int, f.IdProducto).input('s', sql.Int, f.IdSucursal)
    .query('SELECT e.Stock FROM INVENTARIO.Existencia e JOIN INVENTARIO.Bodega b ON b.IdBodega=e.IdBodega WHERE e.IdProducto=@p AND b.IdSucursal=@s AND b.EsPrincipal=1');
  assert.deepEqual(after.recordset, before.recordset);
  assert.equal((await pool.request().input('clave', sql.UniqueIdentifier, clave).query('SELECT 1 FROM ADMIN.SolicitudFacturacion WHERE Clave=@clave')).recordset.length, 0);
});
test('SQL Server: insufficient stock fails before invoice registration', async () => {
  const { f, body } = await obtenerFixture();
  await reversible(async tx => {
    const facade = new FacturacionFacade({ ejecutar: op => op(crearUnidad(tx)) });
    await assert.rejects(facade.confirmar({ ...body, detalles: [{ ...body.detalles[0], cantidad: Number(f.Stock)+1 }] }, f.IdUsuario, randomUUID()), /Existencia insuficiente/);
  });
});
test('SQL Server: ten competing transactions wait for the inventory lock', async () => {
  const { f, body } = await obtenerFixture();
  await reversible(async first => {
    const { validarSolicitud } = require('../../dist/src/modules/ventas/facturacion/facturacion.facade');
    await crearUnidad(first).inventario.validarDisponibilidad(validarSolicitud(body, f.IdUsuario, randomUUID()));
    const tiempoOriginal = pool.config.requestTimeout;
    pool.config.requestTimeout = 1000;
    const resultados = await Promise.all(Array.from({ length: 10 }, async () => {
      const tx = new sql.Transaction(pool); await tx.begin();
      try {
        await new sql.Request(tx).query('SET LOCK_TIMEOUT 150');
        await crearUnidad(tx).inventario.validarDisponibilidad(validarSolicitud(body, f.IdUsuario, randomUUID()));
        return 'unexpected';
      } catch (e) { return e.number || e.code; } finally { await tx.rollback(); }
    }));
    pool.config.requestTimeout = tiempoOriginal;
    assert.ok(resultados.every(n => n === 1222 || n === 'ETIMEOUT'), 'Las solicitudes rivales deben bloquearse mientras la primera retiene inventario');
  });
});
after(async () => { if (pool) await pool.close(); });
