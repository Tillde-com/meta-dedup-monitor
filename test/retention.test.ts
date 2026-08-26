import { describe, it, expect, afterEach } from 'vitest'
import { testConfig, makeApp, closeApps } from './helpers.js'
import type { App } from '../src/app.js'

afterEach(closeApps)

const DAY = 86_400_000
const D0 = Date.UTC(2026, 7, 1, 12, 0, 0)

function counts(app: App): { requests: number; events: number } {
  return {
    requests: (app.ctx.db.prepare('SELECT COUNT(*) AS n FROM requests').get() as { n: number }).n,
    events: (app.ctx.db.prepare('SELECT COUNT(*) AS n FROM events').get() as { n: number }).n,
  }
}

async function ingest(app: App, payload: unknown): Promise<void> {
  const res = await app.request('/c/browser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  expect(res.status).toBe(200)
}

describe('retention purge', () => {
  it('purges swept raw rows after the window, stats stay intact', async () => {
    let now = D0
    const app = makeApp(testConfig(), { clock: () => now })
    await ingest(app, { event_name: 'Purchase', event_id: 'E1' })
    await app.ctx.sweepTick()
    const before = await (await app.request('/api/stats')).json()

    now = D0 + 15 * DAY
    const purged = await app.ctx.retentionTick()
    expect(purged).toBeGreaterThan(0)
    expect(counts(app)).toEqual({ requests: 0, events: 0 })
    const after = await (await app.request('/api/stats')).json()
    expect(after).toEqual(before)
  })

  it('keeps rows inside the window, deletes older ones', async () => {
    let now = D0
    const app = makeApp(testConfig(), { clock: () => now })
    await ingest(app, { event_name: 'Old', event_id: 'OLD' })
    now = D0 + 10 * DAY
    await ingest(app, { event_name: 'Fresh', event_id: 'FRESH' })
    await app.ctx.sweepTick()

    now = D0 + 15 * DAY // Old is 15 days old, Fresh is 5 days old
    await app.ctx.retentionTick()
    expect(counts(app)).toEqual({ requests: 1, events: 1 })
    const left = app.ctx.db.prepare('SELECT event_id FROM events').all() as Array<{ event_id: string }>
    expect(left).toEqual([{ event_id: 'FRESH' }])
  })

  it('never deletes rows the sweep has not consumed', async () => {
    let now = D0
    const app = makeApp(testConfig(), { clock: () => now })
    await ingest(app, { event_name: 'Unswept', event_id: 'U1' })

    now = D0 + 15 * DAY
    await app.ctx.retentionTick()
    expect(counts(app)).toEqual({ requests: 1, events: 1 })

    await app.ctx.sweepTick()
    await app.ctx.retentionTick()
    expect(counts(app)).toEqual({ requests: 0, events: 0 })
  })

  it('RAW_RETENTION_DAYS=0 disables the purge', async () => {
    let now = D0
    const app = makeApp(testConfig({ rawRetentionDays: 0 }), { clock: () => now })
    await ingest(app, { event_name: 'Kept', event_id: 'K1' })
    await app.ctx.sweepTick()
    now = D0 + 400 * DAY
    const purged = await app.ctx.retentionTick()
    expect(purged).toBe(0)
    expect(counts(app)).toEqual({ requests: 1, events: 1 })
  })

  it('purges a large batch while ingest keeps working', async () => {
    let now = D0
    const app = makeApp(testConfig(), { clock: () => now })
    const batch = Array.from({ length: 5000 }, (_, i) => ({
      event_name: 'Bulk',
      event_id: `bulk-${i}`,
    }))
    await ingest(app, { data: batch })
    await app.ctx.sweepTick()
    expect(counts(app).events).toBe(5000)

    now = D0 + 15 * DAY
    const [purged, ingestRes] = await Promise.all([
      app.ctx.retentionTick(),
      app.request('/c/browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name: 'During', event_id: 'during-1' }),
      }),
    ])
    expect(purged).toBe(5000)
    expect(ingestRes.status).toBe(200)
    // Only the row ingested during the purge survives.
    expect(counts(app)).toEqual({ requests: 1, events: 1 })
  })
})
