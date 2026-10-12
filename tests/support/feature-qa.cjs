const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
require('reflect-metadata');
// Every run creates its own empty database. Never point fixtures at an existing business DB.
process.env.DB_HOST ??= 'localhost'; process.env.DB_USER ??= 'qa'; process.env.DB_PASSWORD ??= 'unused-with-trusted-auth';
process.env.DB_NAME ??= 'master'; process.env.JWT_SECRET ??= randomUUID()+randomUUID();
const { AppDataSource } = require('../../dist/ormconfig');
let admin, name, driver;
async function setup(feature) {
  const { environment } = require('../../dist/src/config/environment');
  if (process.env.QA_NATIVE_MODULE_DIR) {
    process.env.NODE_PATH = process.env.QA_NATIVE_MODULE_DIR;
    require('node:module').Module._initPaths();
    driver = require('mssql/msnodesqlv8');
  } else driver = require('mssql');
  const extra = process.env.QA_NATIVE_MODULE_DIR ? { connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.QA_SQL_SERVER || '.\\SQLEXPRESS'};Database=master;Trusted_Connection=Yes;` } : {};
  admin = await new driver.ConnectionPool({ server: environment.database.host, port: environment.database.port,
    user: environment.database.username, password: environment.database.password, database: 'master',
    options: { encrypt: environment.database.encrypt, trustServerCertificate: environment.database.trustServerCertificate }, ...extra }).connect();
  name = 'CODEX_NATHALY_QA_'+randomUUID().replaceAll('-', '');
  await admin.request().query(`CREATE DATABASE [${name}]`);
  AppDataSource.driver.mssql = driver;
  AppDataSource.setOptions({ database: name, pool: { max: 20 }, options: { ...AppDataSource.options.options, useUTC: true },
    extra: process.env.QA_NATIVE_MODULE_DIR ? { connectionString: extra.connectionString.replace('Database=master;', `Database=${name};`), options: { trustedConnection: true, useUTC: true } } : {} });
  await AppDataSource.initialize();
  for (const file of ['tests/fixtures/feature-schema.sql', 'src/migrations/001_nuevas_funcionalidades.sql', 'src/migrations/003_revocacion_sesiones.sql']) {
    for (const batch of fs.readFileSync(path.resolve(file), 'utf8').split(/^GO\s*$/mi)) if (batch.trim()) await AppDataSource.query(batch);
  }
  await insert('SEGURIDAD.Usuario', { Login: 'qa_a', PassHash: 'ficticio', Activo: true, Eliminado: false });
  await insert('SEGURIDAD.Usuario', { Login: 'qa_b', PassHash: 'ficticio', Activo: true, Eliminado: false });
  const migrations = fs.readdirSync('src/migrations').filter(f => f.includes(`_${feature.toLowerCase()}_`));
  for (const file of migrations) for (const batch of fs.readFileSync('src/migrations/'+file, 'utf8').split(/^GO\s*$/mi)) if (batch.trim()) await AppDataSource.query(batch);
  // Rerunning proves the migration is idempotent.
  for (const file of migrations) for (const batch of fs.readFileSync('src/migrations/'+file, 'utf8').split(/^GO\s*$/mi)) if (batch.trim()) await AppDataSource.query(batch);
  await insert('CATALOGOS.Proveedor', { Nombre: 'PROVEEDOR A', RazonSocial: 'DEMO A', RUC: 'DEMO-A', Eliminado: false });
  await insert('CATALOGOS.Proveedor', { Nombre: 'PROVEEDOR B', RazonSocial: 'DEMO B', RUC: 'DEMO-B', Eliminado: false });
  await insert('INVENTARIO.Bodega', { Nombre: 'BODEGA A', Eliminado: false });
  await insert('INVENTARIO.Bodega', { Nombre: 'BODEGA B', Eliminado: false });
  for (let i=1; i<=27; i++) await insert('INVENTARIO.Producto', { Codigo: `QA-${String(i).padStart(3,'0')}`, Descripcion: `PRODUCTO ${i}`, Costo: '20.0000', ExistenciaMin: '5.00', ExistenciaMax: '12.00', IdProveedor: i===27?2:1, Eliminado: false });
  for (let i=1; i<=26; i++) await insert('INVENTARIO.Existencia', { IdBodega: 1, IdProducto: i, Stock: '3.00', Eliminado: false });
  await insert('INVENTARIO.Existencia', { IdBodega: 2, IdProducto: 1, Stock: '20.00', Eliminado: false });
  return AppDataSource;
}
async function insert(table, values) {
  if (!/^(SEGURIDAD|CATALOGOS|INVENTARIO|VENTAS)\.[A-Za-z]+$/.test(table)) throw new Error('Invalid fixture table');
  const cols = await AppDataSource.query(`SELECT name,TYPE_NAME(user_type_id) AS type,is_nullable,is_identity,is_computed,default_object_id FROM sys.columns WHERE object_id=OBJECT_ID(@0) ORDER BY column_id`, [table]);
  const entry = { ...values };
  for (const c of cols) if (!c.is_identity && !c.is_computed && !c.is_nullable && !c.default_object_id && !(c.name in entry)) {
    entry[c.name] = ['nvarchar','varchar','char','nchar'].includes(c.type) ? 'DEMO' : c.type.startsWith('date') ? new Date() : 1;
  }
  const keys = Object.keys(entry);
  return AppDataSource.query(`INSERT INTO ${table} (${keys.map(k=>'['+k+']').join(',')}) VALUES (${keys.map((_,i)=>'@'+i).join(',')})`, keys.map(k=>entry[k]));
}
async function cleanup() {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  if (admin && /^CODEX_NATHALY_QA_[a-f0-9]{32}$/.test(name)) await admin.request().query(`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${name}]`);
  if (admin) await admin.close();
}
async function authChecks(paths, permission) {
  const assert = require('node:assert/strict'), jwt = require('jsonwebtoken');
  const app = require('../../dist/src/app').default;
  const server = app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const token = jwt.sign({ idUsuario: 2, login: 'qa_b' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  try {
    for (const [method,p] of paths) {
      assert.equal((await fetch(base+p, { method })).status, 401);
      assert.equal((await fetch(base+p, { method, headers: { Cookie: `token=${token}` } })).status, 403);
    }
  } finally { await new Promise(r=>server.close(r)); }
}
module.exports = { setup, cleanup, insert, authChecks, db: AppDataSource };
