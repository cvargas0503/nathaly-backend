import { DataSource } from 'typeorm';
import { environment } from './src/config/environment';

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: environment.database.host,
  port: environment.database.port,
  username: environment.database.username,
  password: environment.database.password,
  database: environment.database.name,
  entities: [__dirname + '/src/modules/**/entities/*.{ts,js}'],
  synchronize: false,
  options: {
    encrypt: environment.database.encrypt,
    trustServerCertificate: environment.database.trustServerCertificate,
    enableArithAbort: true,
  },
});
