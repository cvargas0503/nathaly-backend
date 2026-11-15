import { environment } from './config/environment'
import 'reflect-metadata'
import type { Server } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'
import { AppDataSource } from '../ormconfig'
import { closeMSSQLPool } from './database'
import app from './app'

let server: Server | undefined
let stopping = false

async function shutdown() {
  if (stopping) return
  stopping = true
  const deadline = setTimeout(() => process.exit(1), 30000)
  deadline.unref()
  try {
    if (server?.listening) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()))
    await closeMSSQLPool()
    if (AppDataSource.isInitialized) await AppDataSource.destroy()
  } catch {
    process.exitCode = 1
  } finally {
    clearTimeout(deadline)
  }
}

process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)

async function start() {
  for (let attempt = 1; attempt <= environment.databaseConnectAttempts && !stopping; attempt++) {
    try {
      await AppDataSource.initialize()
      if (stopping) {
        await AppDataSource.destroy()
        return
      }
      server = app.listen(environment.port, '0.0.0.0', () => {
        console.log(`API disponible en el puerto ${environment.port}`)
      })
      server.on('error', async () => {
        console.error('No se pudo iniciar el servidor HTTP')
        process.exitCode = 1
        await shutdown()
      })
      return
    } catch {
      console.error(`Conexión de base de datos no disponible (${attempt}/${environment.databaseConnectAttempts})`)
      if (attempt === environment.databaseConnectAttempts) {
        process.exitCode = 1
        return
      }
      if (!stopping) await delay(2000)
    }
  }
}

void start()
