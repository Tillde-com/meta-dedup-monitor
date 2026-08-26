import { describe, it, expect, afterEach } from 'vitest'
import { testConfig, makeApp, closeApps } from './helpers.js'
import type { App, Notification } from '../src/app.js'
import type { Config } from '../src/config.js'

afterEach(closeApps)

const T0 = Date.UTC(2026, 7, 10, 12, 0, 0)
const HOUR = 3_600_000

function harness(configOverrides: Partial<Config> = {}): {
  app: App
  sent: Notification[]
  setNow: (ts: number) => void
  config: Config
} {
  let now = T0
  const sent: Notification[] = []
  const config = testConfig({ alertThreshold: 0.8, ...configOverrides })
  const app = makeApp(config, {
    clock: () => now,
    notifier: async (n) => {
      sent.push(n)
    },
  })
  return { app, sent, setNow: (ts) => (now = ts), config }
}

function ids(prefix: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${prefix}-${i}`)
}

async function ingestServerIds(app: App, eventIds: string[]): Promise<void> {
  const res = await app.request('/c/server', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: eventIds.map((id) => ({ event_name: 'Purchase', event_id: id })),
    }),
  })
  expect(res.status).toBe(200)
}

async function ingestBrowserIds(app: App, eventIds: string[]): Promise<void> {
  const res = await app.request('/c/browser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventIds.map((id) => ({ event_name: 'Purchase', event_id: id }))),
  })
  expect(res.status).toBe(200)
}

describe('alerts', () => {
  it('fires exactly once when the rate drops below threshold with enough sample', async () => {
    const { app, sent } = harness()
    await ingestServerIds(app, ids('bad', 50))
    await app.ctx.sweepTick()
    await app.ctx.alertTick()
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({
      type: 'alert.fired',
      monitor: 'meta-dedup-monitor',
      metric: 'server_dedup_rate',
      value: 0,
      threshold: 0.8,
      windowHours: 24,
      sampleSize: 50,
    })
    expect(sent[0]!.at).toBe(new Date(T0).toISOString())

    await app.ctx.alertTick()
    expect(sent).toHaveLength(1) // condition persists, no duplicate
  })

  it('recovers exactly once, then stays silent', async () => {
    const { app, sent } = harness()
    await ingestServerIds(app, ids('r', 50))
    await app.ctx.sweepTick()
    await app.ctx.alertTick()
    expect(sent.map((n) => n.type)).toEqual(['alert.fired'])

    await ingestBrowserIds(app, ids('r', 50)) // now every id is on both channels
    await app.ctx.sweepTick()
    await app.ctx.alertTick()
    expect(sent.map((n) => n.type)).toEqual(['alert.fired', 'alert.recovered'])
    expect(sent[1]).toMatchObject({ value: 1, sampleSize: 50 })

    await app.ctx.alertTick()
    expect(sent).toHaveLength(2)
  })

  it('skips evaluation below the 50-id minimum sample', async () => {
    const { app, sent } = harness()
    await ingestServerIds(app, ids('few', 49))
    await app.ctx.sweepTick()
    await app.ctx.alertTick()
    expect(sent).toHaveLength(0)
  })

  it('excludes ids whose last sighting is outside the window', async () => {
    const { app, sent, setNow } = harness()
    await ingestServerIds(app, ids('old', 50))
    await app.ctx.sweepTick()
    await app.ctx.alertTick()
    expect(sent.map((n) => n.type)).toEqual(['alert.fired'])

    setNow(T0 + 25 * HOUR) // the 50 bad ids fall out of the 24h window
    await ingestServerIds(app, ids('fresh', 50))
    await ingestBrowserIds(app, ids('fresh', 50))
    await app.ctx.sweepTick()
    await app.ctx.alertTick()
    // Only the fresh, fully-dedupable ids are in the window: rate 1 → recovered.
    expect(sent.map((n) => n.type)).toEqual(['alert.fired', 'alert.recovered'])
    expect(sent[1]).toMatchObject({ value: 1, sampleSize: 50 })
  })

  it('is a no-op when ALERT_THRESHOLD is empty', async () => {
    const { app, sent } = harness({ alertThreshold: null })
    await ingestServerIds(app, ids('na', 50))
    await app.ctx.sweepTick()
    await app.ctx.alertTick()
    expect(sent).toHaveLength(0)
  })

  it('POST /api/alerts/test is admin-guarded and bypasses state', async () => {
    const { app, sent } = harness({ adminToken: 's3cret' })
    expect((await app.request('/api/alerts/test', { method: 'POST' })).status).toBe(401)
    const res = await app.request('/api/alerts/test?token=s3cret', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(sent).toHaveLength(1)
    expect(sent[0]!.type).toBe('alert.test')
  })

  it('keeps the state transition when the notifier throws', async () => {
    let now = T0
    const sent: Notification[] = []
    let failDelivery = true
    const app = makeApp(testConfig({ alertThreshold: 0.8 }), {
      clock: () => now,
      notifier: async (n) => {
        if (failDelivery) throw new Error('delivery down')
        sent.push(n)
      },
    })
    void now
    await ingestServerIds(app, ids('t', 50))
    await app.ctx.sweepTick()
    await app.ctx.alertTick() // delivery fails, but the state machine moves to firing
    failDelivery = false
    await app.ctx.alertTick()
    expect(sent).toHaveLength(0) // no duplicate fired on the next tick
  })

  it('alert state survives a restart on the same DATA_DIR', async () => {
    const { app, sent, config } = harness()
    await ingestServerIds(app, ids('p', 50))
    await app.ctx.sweepTick()
    await app.ctx.alertTick()
    expect(sent.map((n) => n.type)).toEqual(['alert.fired'])
    app.ctx.close()

    const sent2: Notification[] = []
    const app2 = makeApp(config, {
      clock: () => T0 + HOUR,
      notifier: async (n) => {
        sent2.push(n)
      },
    })
    await app2.ctx.alertTick()
    expect(sent2).toHaveLength(0) // still firing, no re-fire
  })
})
