import { environment } from './config/environment'
import 'reflect-metadata'
import { AppDataSource } from '../ormconfig'
import app from './app'

const PORT = environment.port
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Base de datos conectada')
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('❌ Error al conectar BD:', error)
    process.exitCode = 1
  })
    .finally(() => {
        console.log('🔄 Proceso de inicialización finalizado')
    })
