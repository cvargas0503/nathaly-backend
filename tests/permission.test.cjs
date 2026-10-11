const { test } = require('node:test');
const assert = require('node:assert/strict');
const { permisosPara, tienePermiso } = require('../dist/src/modules/auth/permission.policy');
test('an authenticated viewer cannot issue or cancel invoices or manage users', () => {
  for (const [method, path] of [['POST', '/ventas'], ['DELETE', '/ventas/1'], ['POST', '/usuarios']]) {
    assert.equal(tienePermiso(['VER_VENTAS'], permisosPara(method, path)), false);
  }
  assert.equal(tienePermiso(['NUEVA_VENTA'], permisosPara('POST', '/ventas')), true);
  assert.equal(tienePermiso(['ANULAR_VENTA'], permisosPara('DELETE', '/ventas/1')), true);
});
test('unknown resources are denied and operational lookup reads do not grant write access', () => {
  assert.equal(tienePermiso(['GESTIONAR_USUARIOS'], permisosPara('GET', '/unknown')), false);
  assert.equal(tienePermiso(['NUEVA_VENTA'], permisosPara('GET', '/clientes')), true);
  assert.equal(tienePermiso(['NUEVA_VENTA'], permisosPara('POST', '/clientes')), false);
  assert.equal(tienePermiso(['PAGAR_VENTAS'], permisosPara('POST', '/caja/movimiento-caja/pago/1')), true);
  assert.equal(tienePermiso(['NUEVA_VENTA'], permisosPara('GET', '/datos/datos-productos-factura/1')), true);
  assert.equal(tienePermiso(['NUEVA_VENTA'], permisosPara('GET', '/datos/datos-formulario-producto')), false);
});
