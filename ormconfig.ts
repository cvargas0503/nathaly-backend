import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'localhost',
  port: 1433,
  username: 'sa',
  password: '12345678',
  database: 'TIENDAS_NATHALY',
  entities: [__dirname + '/src/modules/**/entities/*.ts'],
  synchronize: false,
  options: {
    encrypt: false,
    enableArithAbort: true,
  }
})
