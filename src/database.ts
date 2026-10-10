import sql from 'mssql';
import { environment } from './config/environment';

const sqlConfig: sql.config = {
  user: environment.database.username,
  password: environment.database.password,
  server: environment.database.host,
  database: environment.database.name,
  port: environment.database.port,
  options: {
    encrypt: environment.database.encrypt,
    trustServerCertificate: environment.database.trustServerCertificate,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise: Promise<sql.ConnectionPool> | undefined;
export const getMSSQLPool = (): Promise<sql.ConnectionPool> => {
  if (!poolPromise) {
    poolPromise = sql.connect(sqlConfig).catch(error => {
      poolPromise = undefined;
      throw error;
    });
  }
  return poolPromise;
};
