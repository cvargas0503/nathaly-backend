const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const modulePath = path.resolve(__dirname, '../dist/src/config/environment.js');
const settings = {
  DB_HOST: 'example.invalid', DB_USER: 'test', DB_PASSWORD: 'test-only',
  DB_NAME: 'test', JWT_SECRET: 'a'.repeat(48),
};

function run(overrides, expression = 'require(process.argv[1])') {
  const env = { ...process.env, ...settings, ...overrides };
  for (const key of Object.keys(overrides)) if (overrides[key] === undefined) delete env[key];
  return spawnSync(process.execPath, ['-e', expression, modulePath], {
    cwd: os.tmpdir(), env, encoding: 'utf8',
  });
}

test('refuses startup with missing credentials or a short JWT key', () => {
  for (const key of Object.keys(settings)) {
    const result = run({ [key]: undefined });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(key));
  }
  assert.notEqual(run({ JWT_SECRET: 'short' }).status, 0);
});

test('rejects invalid database ports and boolean options', () => {
  assert.notEqual(run({ DB_PORT: 'NaN' }).status, 0);
  assert.notEqual(run({ DB_PORT: '65536' }).status, 0);
  assert.notEqual(run({ DB_ENCRYPT: 'yes' }).status, 0);
});

test('accepts deployment settings and parses comma-separated origins', () => {
  const result = run({ CORS_ORIGINS: 'https://one.example, https://two.example', DB_ENCRYPT: 'true' },
    'console.log(JSON.stringify(require(process.argv[1]).environment.allowedOrigins))');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ['https://one.example', 'https://two.example']);
});
