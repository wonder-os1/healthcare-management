import { app } from './app'
import { env } from './config/env'
import { prisma } from './config/database'

async function start() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('[db] Connected to PostgreSQL')

    app.listen(env.PORT, () => {
      console.log(`[server] ${env.APP_NAME} API running on port ${env.PORT}`)
      console.log(`[server] Environment: ${env.NODE_ENV}`)
      console.log(`[server] Health: http://localhost:${env.PORT}/api/health`)
    })
  } catch (error) {
    console.error('[server] Failed to start:', error)
    process.exit(1)
  }
}

start()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[server] SIGTERM received, shutting down...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[server] SIGINT received, shutting down...')
  await prisma.$disconnect()
  process.exit(0)
})
