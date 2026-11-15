'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sql = require('mssql');
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
const database = required('DB_NAME');
const azure = process.env.DB_PLATFORM === 'azure';
if (database !== 'NATHALY_DEMO') throw new Error('Initializer is restricted to NATHALY_DEMO');
const appUser = required('DB_USER');
if (!/^[A-Za-z][A-Za-z0-9_]{1,50}$/.test(appUser)) throw new Error('Invalid application database user');
const quote = value => `'${value.replaceAll("'", "''")}'`;
const identifier = value => `[${value.replaceAll(']', ']]')}]`;
const config = {
  server: required('DB_HOST'), port: Number(process.env.DB_PORT || 1433),
  user: required('DB_ADMIN_USER'), password: required('DB_ADMIN_PASSWORD'),
  database: azure ? database : 'master', requestTimeout: 120000,
  options: { encrypt: process.env.DB_ENCRYPT !== 'false', trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' },
  pool: { max: 3, min: 0, idleTimeoutMillis: 10000 },
};
async function apply(pool, filename, label) {
  const original = fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, '');
  const content = original.replace(/\r\n/g, '\n');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  const prior = await pool.request().input('name', sql.NVarChar(200), label)
    .query('SELECT Hash FROM dbo.DeploymentMigration WHERE Name=@name');
  if (prior.recordset.length) {
    if (prior.recordset[0].Hash !== hash) {
      const originalHash = crypto.createHash('sha256').update(original).digest('hex');
      if (prior.recordset[0].Hash !== originalHash) throw new Error(`Already applied migration changed: ${label}`);
      await pool.request().input('name',sql.NVarChar(200),label).input('hash',sql.Char(64),hash)
        .query('UPDATE dbo.DeploymentMigration SET Hash=@hash WHERE Name=@name');
    }
    console.log(`Already applied: ${label}`); return;
  }
  if (label === 'baseline') {
    const existing = await pool.request().query("SELECT COUNT(*) AS n FROM sys.tables WHERE is_ms_shipped=0 AND name<>'DeploymentMigration'");
    if (existing.recordset[0].n) throw new Error('Baseline requires an empty database; no existing objects were overwritten');
  }
  const tx = new sql.Transaction(pool); await tx.begin();
  try {
    for (const batch of content.split(/^\s*GO\s*(?:--.*)?$/mi).filter(text => text.trim())) {
      await new sql.Request(tx).batch(batch);
    }
    await new sql.Request(tx).input('name', sql.NVarChar(200), label).input('hash', sql.Char(64), hash)
      .query('INSERT INTO dbo.DeploymentMigration(Name,Hash) VALUES(@name,@hash)');
    await tx.commit(); console.log(`Applied: ${label}`);
  } catch (error) { try { await tx.rollback(); } catch {} throw error; }
}
async function main() {
  let master; let pool;
  try {
    if (!azure) {
      master = await new sql.ConnectionPool(config).connect();
      await master.request().query(`IF DB_ID(${quote(database)}) IS NULL CREATE DATABASE ${identifier(database)}`);
      await master.close(); master = null;
    }
    pool = await new sql.ConnectionPool({...config, database}).connect();
    await pool.request().batch(`IF OBJECT_ID(N'dbo.DeploymentMigration',N'U') IS NULL
      CREATE TABLE dbo.DeploymentMigration(Name nvarchar(200) NOT NULL PRIMARY KEY, Hash char(64) NOT NULL, AppliedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME())`);
    await apply(pool, '/app/deploy/database/001-baseline.sql', 'baseline');
    const seedModule = require('/app/deploy/database/seed-demo.cjs');
    const seed = typeof seedModule === 'function' ? seedModule : seedModule.seed;
    await seed(pool, required('DEMO_ADMIN_PASSWORD'));
    for (const filename of fs.readdirSync('/app/migrations').filter(n => n.endsWith('.sql')).sort()) {
      await apply(pool, path.join('/app/migrations', filename), filename);
    }
    await seed(pool, required('DEMO_ADMIN_PASSWORD'));
    await pool.close(); pool = null;
    const password = required('DB_PASSWORD');
    if (!azure) {
      master = await new sql.ConnectionPool(config).connect();
      await master.request().batch(`IF SUSER_ID(${quote(appUser)}) IS NULL CREATE LOGIN ${identifier(appUser)} WITH PASSWORD=${quote(password)},CHECK_POLICY=ON`);
      await master.close(); master = null;
    }
    pool = await new sql.ConnectionPool({...config, database}).connect();
    const createUser = azure ? `WITH PASSWORD=${quote(password)}` : `FOR LOGIN ${identifier(appUser)}`;
    await pool.request().batch(`IF DATABASE_PRINCIPAL_ID(${quote(appUser)}) IS NULL CREATE USER ${identifier(appUser)} ${createUser};
      ALTER ROLE db_datareader ADD MEMBER ${identifier(appUser)};
      ALTER ROLE db_datawriter ADD MEMBER ${identifier(appUser)};
      GRANT EXECUTE TO ${identifier(appUser)};`);
    console.log('Demo schema, migrations and application permissions ready. Business records were not copied.');
  } finally { if(pool) await pool.close(); if(master) await master.close(); }
}
main().catch(error => {
  let message = String(error.message);
  for (const name of ['DB_ADMIN_PASSWORD','DB_PASSWORD','DEMO_ADMIN_PASSWORD']) {
    if(process.env[name]) message = message.replaceAll(process.env[name], '[redacted]');
  }
  console.error(`Initialization failed: ${message}`); process.exitCode=1;
});
