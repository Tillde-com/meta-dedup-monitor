import { serve } from '@hono/node-server'
import type { ServerType } from '@hono/node-server'
import { configFromEnv } from './config.js'
import { createApp } from './app.js'

// The only file that reads process.env.
const config = configFromEnv(process.env)
const app = createApp(config)
app.ctx.startLoops()

const server: ServerType = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(
    `[${config.monitorName}] listening on :${info.port}  data=${config.dataDir}  adminToken=${config.adminToken ? 'ON' : 'OFF'}`,
  )
})

// Graceful shutdown: stop accepting, let in-flight requests finish, flush the
// sweep, checkpoint the WAL and close the DB — a deploy must not lose events.
let shuttingDown = false
function shutdown(signal: string): void {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`[${config.monitorName}] ${signal} received, shutting down`)
  // Belt and braces: if a keep-alive client never lets go, exit anyway.
  const failsafe = setTimeout(() => process.exit(0), 10_000)
  failsafe.unref()

  server.close(() => {
    void (async () => {
      await app.ctx.sweepTick()
      app.ctx.db.pragma('wal_checkpoint(TRUNCATE)')
      app.ctx.close()
      process.exit(0)
    })()
  })
  // Idle keep-alive sockets would otherwise hold close() open indefinitely.
  if ('closeIdleConnections' in server) {
    (server as unknown as { closeIdleConnections: () => void }).closeIdleConnections()
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
