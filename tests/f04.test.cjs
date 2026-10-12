const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.DB_HOST ??= 'localhost'; process.env.DB_USER ??= 'test'; process.env.DB_PASSWORD ??= 'test';
process.env.DB_NAME ??= 'isolated_test'; process.env.JWT_SECRET ??= 'unit-test-key-that-is-at-least-thirty-two-characters';
require('reflect-metadata');
const { snapshot, recordEvent } = require('../dist/src/modules/auditoria/services/catalog-events');
const { auditFilters } = require('../dist/src/modules/auditoria/auditoria.controller');
test('F04: snapshots use an explicit allowlist excluding request secrets', async () => {
  const row = { idCategoria: 1, nombre: 'DEMO', token: 'secret', password: 'secret', headers: { cookie: 'secret' } };
  assert.equal(JSON.stringify(snapshot(row, 'idCategoria')).includes('secret'), false);
  let parameters;
  await recordEvent({ query: async (_, args) => { parameters = args; } }, 'categorias', 'idCategoria', null, row, { id: 3, login: 'demo' }, 'CREAR');
  assert.equal(parameters[4], null);
  assert.equal(JSON.parse(parameters[5]).nombre, 'DEMO');
  assert.equal(parameters[6], 3);
});
test('F04: validates combined filters and snapshots are opt-in', () => {
  assert.equal(auditFilters({}).incluirDatos, false);
  for (const q of [{ incluirDatos: 'yes' }, { accion: 'BORRAR' }, { usuarioId: '1 OR 1=1' }, { hasta: 'bad' }]) assert.throws(() => auditFilters(q), { status: 400 });
});
