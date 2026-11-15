'use strict';
// Explicit opt-in for the database-level Azure-resources exception in the demo.
// No server-wide firewall rule is created or changed by this script.
const fs = require('node:fs');
const path = require('node:path');
const sql = require('mssql');
function required(name, fallback) {
  const value = process.env[name] || (fallback && process.env[fallback]);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
const flag = '--allow-azure-resources-for-demo';
if (!process.argv.includes(flag)) {
  console.error(`No changes made. Explicit demo-network opt-in required: ${flag}`);
  process.exit(2);
}
const database = required('DB_NAME');
const server = required('DB_HOST');
const port = Number(process.env.DB_PORT || 1433);
if (database !== 'NATHALY_DEMO') throw new Error('Network configuration is restricted to NATHALY_DEMO');
if (!/^[a-z][a-z0-9-]{1,62}\.database\.windows\.net$/i.test(server)) throw new Error('An Azure SQL Database hostname is required');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid database port');
const ruleName = 'nathaly-azure-resources-demo';
const config = {
  server, port, database,
  user: required('SQL_ADMIN_USER', 'DB_ADMIN_USER'),
  password: required('SQL_ADMIN_PASSWORD', 'DB_ADMIN_PASSWORD'),
  connectionTimeout: 60000, requestTimeout: 60000,
  options: { encrypt: true, trustServerCertificate: false },
  pool: { min: 0, max: 1 },
};
async function main() {
  let admin;
  let app;
  let master;
  try {
    admin = await new sql.ConnectionPool(config).connect();
    const identity = (await admin.request().query('SELECT DB_NAME() AS databaseName')).recordset[0];
    if (identity.databaseName !== 'NATHALY_DEMO') throw new Error('Connected database differs from guarded target');
    await admin.request()
      .input('name', sql.NVarChar(128), ruleName)
      .input('start_ip_address', sql.VarChar(50), '0.0.0.0')
      .input('end_ip_address', sql.VarChar(50), '0.0.0.0')
      .execute('sys.sp_set_database_firewall_rule');
    const rule = (await admin.request().input('name', sql.NVarChar(128), ruleName)
      .query('SELECT name,start_ip_address,end_ip_address FROM sys.database_firewall_rules WHERE name=@name')).recordset[0];
    if (!rule || rule.start_ip_address !== '0.0.0.0' || rule.end_ip_address !== '0.0.0.0') throw new Error('Database-level rule verification failed');
    await admin.close(); admin = null;

    master = await new sql.ConnectionPool({ ...config, database: 'master' }).connect();
    const serverRules = await master.request().query(`SELECT COUNT(*) AS count FROM sys.firewall_rules
      WHERE start_ip_address='0.0.0.0' AND end_ip_address='0.0.0.0'`);
    const serverAzureRuleCount = serverRules.recordset[0].count;
    if (serverAzureRuleCount !== 0) throw new Error('Unexpected server-wide Azure-resources rule already exists; this script did not create it');
    await master.close(); master = null;

    app = await new sql.ConnectionPool({ ...config, user: required('DB_USER'), password: required('DB_PASSWORD') }).connect();
    const appIdentity = (await app.request().query(`SELECT DB_NAME() AS databaseName,USER_NAME() AS applicationUser,
      IS_MEMBER('db_owner') AS databaseOwner,HAS_PERMS_BY_NAME(DB_NAME(),'DATABASE','CONTROL') AS databaseControl`)).recordset[0];
    if (appIdentity.databaseName !== 'NATHALY_DEMO' || appIdentity.databaseOwner !== 0 || appIdentity.databaseControl !== 0) throw new Error('Application identity has unexpected database ownership/control');
    const proof = {
      verifiedAt: new Date().toISOString(),
      database: identity.databaseName,
      scope: 'database-level', rule,
      serverWideAzureResourcesRuleCount: serverAzureRuleCount,
      tls: { encrypt: true, trustServerCertificate: false },
      applicationIdentity: appIdentity,
      exposure: 'Resources from any Azure subscription can attempt authentication against this demo database; credentials are still required.',
      productionPrivateIsolation: false,
      businessDataChanged: false,
    };
    const proofPath = process.env.NETWORK_EVIDENCE_PATH || path.resolve(__dirname, '../evidence/azure-demo-network.json');
    fs.mkdirSync(path.dirname(proofPath), { recursive: true });
    fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2) + '\n');
    console.log(JSON.stringify(proof, null, 2));
  } finally {
    if (admin) await admin.close();
    if (master) await master.close();
    if (app) await app.close();
  }
}
main().catch(error => {
  let message = String(error.message);
  for (const key of ['SQL_ADMIN_PASSWORD', 'DB_ADMIN_PASSWORD', 'DB_PASSWORD', 'DEMO_ADMIN_PASSWORD']) {
    if (process.env[key]) message = message.replaceAll(process.env[key], '[redacted]');
  }
  console.error(`Demo network configuration failed: ${message}`);
  process.exitCode = 1;
});
