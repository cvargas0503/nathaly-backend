const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateAdjustment, adjustedStock } = require('../dist/src/modules/ajustes/ajustes.service');
const { dates, pagination } = require('../dist/src/utils/feature');
const body = { idBodega: 2, observacion: 'Conteo físico', detalles: [{ idProducto: 15, tipo: 'SALIDA', cantidad: 4 }] };
test('F01: validates before writing and calculates exact stock', () => {
  assert.equal(adjustedStock('10.00', '4.00', 'SALIDA'), '6.00');
  assert.equal(adjustedStock('10.00', '3.00', 'ENTRADA'), '13.00');
  assert.equal(adjustedStock('0.10', '0.20', 'ENTRADA'), '0.30');
  assert.throws(() => adjustedStock('10.00', '11.00', 'SALIDA'), { status: 409 });
  for (const cantidad of [0, -1, Infinity, NaN, 0.001, '1e2', null]) assert.throws(() => validateAdjustment({ ...body, detalles: [{ ...body.detalles[0], cantidad }] }), { status: 400 });
  assert.throws(() => validateAdjustment({ ...body, detalles: [body.detalles[0], body.detalles[0]] }), { status: 400 });
  assert.throws(() => validateAdjustment({ ...body, observacion: '' }), { status: 400 });
  assert.throws(() => validateAdjustment({ ...body, detalles: [{ ...body.detalles[0], costoUnitario: 1 }] }), { status: 400 });
});
test('F01: rejects invalid dates, reversed ranges and malformed pagination', () => {
  for (const q of [{ desde: '2026-02-30T00:00:00Z' }, { desde: '2026-10-12T00:00:00Z', hasta: '2026-10-11T00:00:00Z' }, { desde: 'invalid' }]) assert.throws(() => dates(q), { status: 400 });
  for (const q of [{ page: '1x' }, { limit: 101 }, { page: 0 }]) assert.throws(() => pagination(q), { status: 400 });
});
