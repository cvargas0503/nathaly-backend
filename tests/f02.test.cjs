const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateReturn, bodyHash, returnKey, applyReturn } = require('../dist/src/modules/devoluciones/devoluciones.service');
const body = { idVenta: '120', motivo: 'Producto devuelto', detalles: [{ idVentaDetalle: '350', cantidad: 2 }, { idVentaDetalle: '351', cantidad: 1 }] };
test('F02: canonicalizes order, IDs and decimal quantities; rejects malformed lines', () => {
  const first = bodyHash(validateReturn(body));
  assert.equal(first, bodyHash(validateReturn({ detalles: [...body.detalles].reverse().map(d => ({ cantidad: String(d.cantidad)+'.00', idVentaDetalle: d.idVentaDetalle })), motivo: body.motivo, idVenta: 120 })));
  assert.notEqual(first, bodyHash(validateReturn({ ...body, motivo: 'Otro motivo' })));
  assert.equal(validateReturn({ ...body, detalles: [{ idProducto: 1, cantidad: 2 }] }).detalles[0].idProducto, 1);
  for (const cantidad of [Infinity, 0, -1, 0.001]) assert.throws(() => validateReturn({ ...body, detalles: [{ idVentaDetalle: '350', cantidad }] }), { status: 400 });
  assert.throws(() => validateReturn({ ...body, detalles: [body.detalles[0], body.detalles[0]] }), { status: 400 });
  assert.throws(() => validateReturn({ ...body, motivo: 'x'.repeat(251) }), { status: 400 });
  assert.throws(() => returnKey('x'.repeat(129)), { status: 400 });
});
test('F02: confirmed replay returns original result without stock or note writes', async () => {
  const input = validateReturn(body), calls = [];
  const manager = { query: async (sql, args) => {
    calls.push(sql);
    if (sql.includes('sp_getapplock')) return [{ result: 0 }];
    if (sql.includes('SolicitudDevolucion')) return [{ BodyHash: bodyHash(input), Resultado: JSON.stringify({ idNotaCredito: '900', replayed: false }) }];
    throw new Error('Unexpected write');
  } };
  assert.deepEqual(await applyReturn(manager, input, 2, 'retry-key'), { idNotaCredito: '900', replayed: true });
  assert.equal(calls.length, 2);
  await assert.rejects(applyReturn(manager, validateReturn({ ...body, motivo: 'Different' }), 2, 'retry-key'), { status: 409 });
});
