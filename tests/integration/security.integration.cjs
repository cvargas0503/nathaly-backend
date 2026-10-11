const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('reflect-metadata');
const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../../dist/ormconfig');
const { environment } = require('../../dist/src/config/environment');
const { huellaToken } = require('../../dist/src/modules/auth/session.service');
const app = require('../../dist/src/app').default;
test('HTTP: anonymous access is rejected, unknown resources are denied, and logout rejects token replay', async () => {
  let server; let token;
  await AppDataSource.initialize();
  try {
    const [u] = await AppDataSource.query('SELECT TOP(1) IdUsuario,Login FROM SEGURIDAD.Usuario WHERE Activo=1 AND Eliminado=0');
    assert.ok(u, 'Se requiere un usuario de QA');
    token = jwt.sign({ idUsuario: u.IdUsuario, login: u.Login }, environment.jwtSecret, { expiresIn: '5m', jwtid: randomUUID() });
    server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    assert.equal((await fetch(base+'/ventas')).status, 401);
    const headers = { Cookie: `token=${token}` };
    assert.equal((await fetch(base+'/unknown', { headers })).status, 403);
    assert.equal((await fetch(base+'/auth/profile', { headers })).status, 200);
    assert.equal((await fetch(base+'/auth/logout', { method: 'POST', headers })).status, 200);
    assert.equal((await fetch(base+'/auth/profile', { headers })).status, 401);
  } finally {
    if (server) await new Promise(r => server.close(r));
    if (token) await AppDataSource.query('DELETE FROM SEGURIDAD.SesionRevocada WHERE Huella=@0', [huellaToken(token)]);
    await AppDataSource.destroy();
  }
});
