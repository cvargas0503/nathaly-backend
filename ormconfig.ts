import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: '172.20.10.4',
  port: 1433,
  username: 'sa',
  password: 'REDACTED_DATABASE_PASSWORD',
  database: 'TIENDAS_NATHALY',
  entities: [__dirname + '/src/modules/**/entities/*.ts'],
  synchronize: false,
  options: {
    encrypt: false,
    enableArithAbort: true,
  }
})
