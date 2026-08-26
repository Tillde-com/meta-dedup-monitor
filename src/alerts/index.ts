import type { Database } from 'better-sqlite3'
import type { Config } from '../config.js'
import type { Clock, Notification, Notifier } from '../app.js'

// Alert loop: evaluates the server dedup rate over the last ALERT_WINDOW_HOURS
// from the ledger (indexed last_ts range scan — NOT the daily aggregates) and
// runs the ok → firing → ok state machine persisted in `meta`. Notifications
// go out exactly once per transition; a delivery failure never blocks the
// transition nor crashes the loop.

const MIN_SAMPLE = 50
const HOUR_MS = 3_600_000

export interface Alerts {
  tick: () => Promise<void>
  sendTest: () => Promise<void>
  start: () => void
}

interface WindowMetric {
  sampleSize: number
  idsServer: number
  idsBoth: number
  value: number
}

export function createAlerts(
  db: Database,
  config: Config,
  clock: Clock,
  notifier: Notifier,
): Alerts {
  const windowQuery = db.prepare(
    `SELECT COUNT(*) AS sample,
            SUM(CASE WHEN server_n > 0 THEN 1 ELSE 0 END) AS ids_server,
            SUM(CASE WHEN browser_n > 0 AND server_n > 0 THEN 1 ELSE 0 END) AS ids_both
     FROM ledger WHERE last_ts >= ?`,
  )
  const getState = db.prepare(`SELECT v FROM meta WHERE k = 'alert_state'`)
  const setMeta = db.prepare(
    `INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v`,
  )
  const delMeta = db.prepare(`DELETE FROM meta WHERE k = ?`)

  function metric(): WindowMetric {
    const since = clock() - config.alertWindowHours * HOUR_MS
    const row = windowQuery.get(since) as {
      sample: number
      ids_server: number | null
      ids_both: number | null
    }
    const idsServer = row.ids_server ?? 0
    const idsBoth = row.ids_both ?? 0
    return {
      sampleSize: row.sample,
      idsServer,
      idsBoth,
      value: idsServer > 0 ? idsBoth / idsServer : 0,
    }
  }

  function notification(type: Notification['type'], m: WindowMetric): Notification {
    return {
      type,
      monitor: config.monitorName,
      metric: 'server_dedup_rate',
      value: m.value,
      threshold: config.alertThreshold ?? 0,
      windowHours: config.alertWindowHours,
      sampleSize: m.sampleSize,
      at: new Date(clock()).toISOString(),
    }
  }

  async function deliver(n: Notification): Promise<void> {
    try {
      await notifier(n)
    } catch (err) {
      console.error(`[alerts] delivery of ${n.type} failed:`, err)
    }
  }

  async function tick(): Promise<void> {
    if (config.alertThreshold == null) return
    const m = metric()
    if (m.sampleSize < MIN_SAMPLE) return

    const state = (getState.get() as { v: string } | undefined)?.v ?? 'ok'
    if (m.value < config.alertThreshold) {
      if (state !== 'firing') {
        // Persist the transition BEFORE delivering: a failed delivery must not
        // cause a duplicate `fired` on the next tick.
        setMeta.run('alert_state', 'firing')
        setMeta.run('alert_since', String(clock()))
        await deliver(notification('alert.fired', m))
      }
    } else if (state === 'firing') {
      setMeta.run('alert_state', 'ok')
      delMeta.run('alert_since')
      await deliver(notification('alert.recovered', m))
    }
  }

  async function sendTest(): Promise<void> {
    await deliver(notification('alert.test', metric()))
  }

  function start(): void {
    if (config.alertThreshold == null) return
    const loop = (): void => {
      void tick().finally(() => {
        setTimeout(loop, config.alertCheckMinutes * 60_000).unref()
      })
    }
    loop()
  }

  return { tick, sendTest, start }
}
