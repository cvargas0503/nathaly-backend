const { test } = require('node:test');
const assert = require('node:assert/strict');

Object.assign(process.env, {
  DB_HOST: 'example.invalid', DB_USER: 'test', DB_PASSWORD: 'test-only',
  DB_NAME: 'test', JWT_SECRET: 'health-test-only-'.repeat(4),
});

const app = require('../dist/src/app').default;

test('health probes distinguish a live process from unavailable persistence without exposing details', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const live = await fetch(base + '/health');
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: 'ok' });
    const ready = await fetch(base + '/ready');
    assert.equal(ready.status, 503);
    assert.deepEqual(await ready.json(), { status: 'not_ready' });
    assert.equal((await fetch(base + '/api/v1/ventas')).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
