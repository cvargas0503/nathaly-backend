// src/database/dbMSSQL.ts
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'REDACTED_DATABASE_PASSWORD',
  server: '172.20.10.4', // o IP
  database: 'TIENDAS_NATHALY',
  port: 1433, // Puerto por defecto de SQL Server
  options: {
    encrypt: false,      // true si usas Azure
    trustServerCertificate: true // para evitar errores de SSL
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool;

export const getMSSQLPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    pool = await sql.connect(sqlConfig);
  }
  return pool;
};
