import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import type { Database } from 'better-sqlite3'
import type { Config } from './config.js'
import { openDb } from './storage/db.js'
import { registerIngestRoutes } from './ingest/index.js'
import { createSweep } from './sweep/index.js'
import { getStats } from './report/stats.js'
import { renderReport } from './report/html.js'

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
  sweepTick: () => Promise<number>
  startLoops: () => void
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

  const sweep = createSweep(db)

  const app = new Hono() as App
  app.ctx = {
    config,
    db,
    clock,
    notifier,
    sweepTick: sweep.tick,
    startLoops: () => {
      sweep.start()
    },
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
  app.get('/api/stats', admin, (c) => c.json(getStats(db)))

  // The report is costly to render (multiple aggregate queries + big tables):
  // a short per-instance cache absorbs dashboard refreshes.
  const REPORT_CACHE_TTL_MS = 15_000
  let reportCache: { html: string; ts: number } | null = null
  app.get('/report', admin, (c) => {
    const now = clock()
    if (reportCache && now - reportCache.ts < REPORT_CACHE_TTL_MS) {
      return c.html(reportCache.html)
    }
    const html = renderReport(getStats(db), config.monitorName, new Date(now).toISOString())
    reportCache = { html, ts: now }
    return c.html(html)
  })

  return app
}
