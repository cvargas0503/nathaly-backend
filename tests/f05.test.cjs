const { test } = require('node:test');
const assert = require('node:assert/strict');
const { replenishment } = require('../dist/src/modules/reposicion/reposicion.service');
const row = { idProducto: 15, codigo: 'PROD-015', idBodega: 2, idProveedor: 3, stock: '3.00', minimo: '5.00', maximo: '12.00', costoUnitario: '20.0000', proveedorEliminado: false };
test('F05: exact thresholds, diagnostics and cost rounding', () => {
  const r = replenishment([row]);
  assert.equal(r.propuesta[0].cantidadSugerida, '9.00'); assert.equal(r.propuesta[0].costoEstimado, '180.0000');
  for (const changed of [{ stock: '5.00' }, { minimo: '0.00' }, { stock: '20.00' }]) assert.equal(replenishment([{ ...row, ...changed }]).propuesta.length, 0);
  const bad = replenishment([{ ...row, stock: '-1.00' }, { ...row, maximo: '2.00' }, { ...row, proveedorEliminado: true }, { ...row, stock: null }]);
  assert.equal(bad.propuesta.length, 0); assert.equal(bad.diagnosticos.length, 3); assert.equal(bad.advertencias.productosSinExistencia, 1); assert.equal(bad.resumen.length, 0);
  assert.equal(replenishment([{ ...row, stock: '4.99', maximo: '5.00', costoUnitario: '0.0050' }]).propuesta[0].costoEstimado, '0.0001');
});
test('F05: totals include all rows and sum rounded line costs', () => {
  const r = replenishment(Array.from({ length: 25 }, (_, i) => ({ ...row, idProducto: i + 1 })));
  assert.deepEqual(r.resumen, [{ idProveedor: 3, totalProductos: 25, cantidadSugerida: '225.00', costoEstimado: '4500.0000' }]);
});
