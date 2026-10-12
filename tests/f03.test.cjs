const { test } = require('node:test');
const assert = require('node:assert/strict');
const { notificationFilters, readNotification } = require('../dist/src/modules/notificaciones/notificaciones.service');
test('F03: validates filters and never accepts a caller-supplied user', () => {
  for (const q of [{ leida: 'yes' }, { tipo: "x' OR 1=1" }, { usuarioId: 9 }, { limit: 101 }]) assert.throws(() => notificationFilters(q), { status: 400 });
  assert.equal(notificationFilters({ leida: 'false' }).leida, false);
});
test('F03: rejects another user private notification and propagates write failures', async () => {
  const hidden = { query: async sql => sql.includes('sp_getapplock') ? [{ result: 0 }] : [] };
  await assert.rejects(readNotification(hidden, 1, '12'), { status: 404 });
  await assert.rejects(readNotification(hidden, 1, 'stock-15'), { status: 409 });
  const failed = { query: async sql => {
    if (sql.includes('sp_getapplock')) return [{ result: 0 }];
    if (sql.startsWith('SELECT')) return [{ IdNotificacion: '12' }];
    throw new Error('Persistence failure');
  } };
  await assert.rejects(readNotification(failed, 1, '12'), /Persistence failure/);
});
