import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import type { Database } from 'better-sqlite3'
import type { Config } from './config.js'
import { openDb } from './storage/db.js'
import { registerIngestRoutes } from './ingest/index.js'
import { createSweep } from './sweep/index.js'
import { createRetention } from './retention/index.js'
import { createAlerts } from './alerts/index.js'
import { createProductionNotifier } from './alerts/notifier.js'
import { getStats } from './report/stats.js'
import { renderReport } from './report/html.js'
import { registerExportRoutes } from './report/exports.js'

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
  retentionTick: () => Promise<number>
  alertTick: () => Promise<void>
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

export function createApp(config: Config, deps: Deps = {}): App {
  const clock = deps.clock ?? (() => Date.now())
  const notifier = deps.notifier ?? createProductionNotifier(config)
  const db = openDb(config.dataDir)

  const sweep = createSweep(db)
  const retention = createRetention(db, config, clock)
  const alerts = createAlerts(db, config, clock, notifier)

  const app = new Hono() as App
  app.ctx = {
    config,
    db,
    clock,
    notifier,
    sweepTick: sweep.tick,
    retentionTick: retention.tick,
    alertTick: alerts.tick,
    startLoops: () => {
      sweep.start()
      retention.start()
      alerts.start()
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

  registerExportRoutes(app, config, app.ctx, admin)

  app.post('/api/alerts/test', admin, async (c) => {
    await alerts.sendTest()
    return c.json({ ok: true })
  })

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
