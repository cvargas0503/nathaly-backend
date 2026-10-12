const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FacturacionFacade, validarSolicitud } = require('../dist/src/modules/ventas/facturacion/facturacion.facade');
const clave = 'b227c0a8-6496-4c30-980b-05a373557651';
const body = () => ({ idCliente: 1, idEmpleado: 1, idSucursal: 1, idTermino: 1, fecha: '2026-10-11', detalles: [{ idProducto: 1, cantidad: 1, precioUnitario: 10 }] });
function contexto(falla) {
  const events = []; let previa;
  const unidad = {
    solicitudes: { buscar: async () => previa, guardar: async (_s, f) => { events.push('idempotencia'); previa = f; } },
    inventario: { validarDisponibilidad: async () => { events.push('existencias'); if (falla === 'stock') throw Error('stock'); } },
    facturas: { registrar: async () => { events.push('factura'); return '15'; }, consultar: async () => { events.push('reporte'); if (falla === 'reporte') throw Error('reporte'); return { IdVenta: '15' }; } },
  };
  return { events, facade: new FacturacionFacade({ ejecutar: async op => {
    events.push('begin'); const snapshot = previa;
    try { const r = await op(unidad); events.push('commit'); return r; }
    catch (e) { previa = snapshot; events.push('rollback'); throw e; }
  } }) };
}
test('rejects malformed IDs, quantities, discounts and repeated products before opening a transaction', () => {
  for (const cambio of [{ idCliente: '1abc' }, { detalles: [{ idProducto: 1, cantidad: Infinity, precioUnitario: 10 }] },
    { detalles: [{ idProducto: 1, cantidad: 1.001, precioUnitario: 10 }] },
    { detalles: [{ idProducto: 1, cantidad: 1, precioUnitario: 10, descuento: -1 }] },
    { detalles: [{ idProducto: 1, cantidad: 1, precioUnitario: 10, descuento: 11 }] },
    { detalles: [body().detalles[0], body().detalles[0]] }]) {
    assert.throws(() => validarSolicitud({ ...body(), ...cambio }, 1, clave));
  }
  assert.throws(() => validarSolicitud(body(), 1, 'invalid'));
});
test('coordinates stock validation, invoice, idempotency record and report before commit', async () => {
  const c = contexto(); const r = await c.facade.confirmar(body(), 1, clave);
  assert.equal(r.reutilizada, false);
  assert.deepEqual(c.events, ['begin', 'existencias', 'factura', 'idempotencia', 'reporte', 'commit']);
});
test('a retry returns the previous invoice without writing stock or invoice again', async () => {
  const c = contexto(); await c.facade.confirmar(body(), 1, clave); c.events.length = 0;
  assert.equal((await c.facade.confirmar(body(), 1, clave)).reutilizada, true);
  assert.deepEqual(c.events, ['begin', 'reporte', 'commit']);
});
test('a key cannot be reused for another business payload', async () => {
  const c = contexto(); await c.facade.confirmar(body(), 1, clave); c.events.length = 0;
  await assert.rejects(c.facade.confirmar({ ...body(), idCliente: 2 }, 1, clave), { status: 409 });
  assert.deepEqual(c.events, ['begin', 'rollback']);
});
test('insufficient stock aborts before writing the invoice', async () => {
  const c = contexto('stock'); await assert.rejects(c.facade.confirmar(body(), 1, clave));
  assert.deepEqual(c.events, ['begin', 'existencias', 'rollback']);
});
test('failure reading the receipt aborts the whole unit of work', async () => {
  const c = contexto('reporte'); await assert.rejects(c.facade.confirmar(body(), 1, clave));
  assert.equal(c.events.at(-1), 'rollback'); assert.ok(!c.events.includes('commit'));
});
