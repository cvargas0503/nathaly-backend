import 'reflect-metadata'
import { AppDataSource } from '../ormconfig'
import app from './app'

const PORT = process.env.PORT || 3000
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Base de datos conectada')
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('❌ Error al conectar BD:', error)
  })
    .finally(() => {
        console.log('🔄 Proceso de inicialización finalizado')
    })