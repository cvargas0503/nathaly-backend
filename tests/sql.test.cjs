const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sql, sqlJoin } = require('../dist/src/utils/sql');

test('binds hostile input without changing the SQL statement', () => {
  const value = "' OR 1=1; DROP TABLE Usuario; --";
  const [query, parameters] = sql`SELECT * FROM Usuario WHERE Login = ${value}`.toQuery();
  assert.equal(query, 'SELECT * FROM Usuario WHERE Login = @0');
  assert.deepEqual(parameters, [value]);
});

test('renumbers nested filters and union fragments', () => {
  const dates = sql`Fecha BETWEEN ${'2026-01-01'} AND ${'2026-12-31'}`;
  const first = sql`SELECT * FROM Venta WHERE UsuarioId = ${7} AND ${dates}`;
  const second = sql`SELECT * FROM Compra WHERE ${dates}`;
  const [query, parameters] = sqlJoin([first, second]).toQuery();
  assert.equal(query, 'SELECT * FROM Venta WHERE UsuarioId = @0 AND Fecha BETWEEN @1 AND @2 UNION ALL SELECT * FROM Compra WHERE Fecha BETWEEN @3 AND @4');
  assert.deepEqual(parameters, [7, '2026-01-01', '2026-12-31', '2026-01-01', '2026-12-31']);
});

test('empty filters and fixed column substitutions preserve values', () => {
  const filter = sql`Fecha >= ${'2026-01-01'}`.replace('Fecha', 'v.Fecha');
  assert.deepEqual(sql`SELECT * FROM Venta v WHERE ${filter}${sql``}`.toQuery(),
    ['SELECT * FROM Venta v WHERE v.Fecha >= @0', ['2026-01-01']]);
});
