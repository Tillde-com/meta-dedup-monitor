import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import type { Database } from 'better-sqlite3'
import type { Config } from './config.js'
import { openDb } from './storage/db.js'
import { registerIngestRoutes } from './ingest/index.js'

export interface Notification {
  type: 'alert.fired' | 'alert.recovered' | 'alert.test'
  monitor: string
  metric: 'server_dedup_rate'
  value: number
  threshold: number
  windowHours: number
  sampleSize: number
  at: string
}

export type Clock = () => number
export type Notifier = (n: Notification) => Promise<void>

export interface Deps {
  clock?: Clock
  notifier?: Notifier
}

export interface AppContext {
  config: Config
  db: Database
  clock: Clock
  notifier: Notifier
  close: () => void
}

export type App = Hono & { ctx: AppContext }

export function adminGuard(adminToken: string): MiddlewareHandler {
  return async (c, next) => {
    if (adminToken === '') return next()
    const bearer = (c.req.header('authorization') ?? '').match(/^Bearer\s+(.+)$/i)?.[1]
    const token = c.req.query('token') ?? c.req.header('x-admin-token') ?? bearer
    if (token !== adminToken) return c.json({ ok: false, error: 'unauthorized' }, 401)
    return next()
  }
}

const noopNotifier: Notifier = async () => {}

export function createApp(config: Config, deps: Deps = {}): App {
  const clock = deps.clock ?? (() => Date.now())
  // Production notification delivery (webhook/email) arrives with the alerts
  // ticket; until then the default is a no-op.
  const notifier = deps.notifier ?? noopNotifier
  const db = openDb(config.dataDir)

  const app = new Hono() as App
  app.ctx = {
    config,
    db,
    clock,
    notifier,
    close: () => {
      if (db.open) db.close()
    },
  }

  app.get('/', (c) =>
    c.json({
      ok: true,
      service: config.monitorName,
      now: new Date(clock()).toISOString(),
    }),
  )

  registerIngestRoutes(app, config, app.ctx)

  const admin = adminGuard(config.adminToken)
  app.get('/api/stats', admin, (c) => c.json({ ok: false, error: 'not implemented' }, 501))

  return app
}
