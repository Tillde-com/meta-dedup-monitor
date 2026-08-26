import { describe, it, expect, afterEach } from 'vitest'
import { testConfig, makeApp, closeApps } from './helpers.js'
import type { App } from '../src/app.js'

afterEach(closeApps)

const D1 = Date.UTC(2026, 7, 1, 10, 0, 0) // 2026-08-01
const D2 = Date.UTC(2026, 7, 2, 10, 0, 0) // 2026-08-02

interface Rates {
  browser: number
  server: number
  union: number
}

interface Stats {
  totals: {
    requests: { browser: number; server: number }
    events: { browser: number; server: number }
    idsBrowser: number
    idsServer: number
    idsBoth: number
    nameIncoherent: number
    dedupable: number
    rates: Rates
  }
  byEventName: Array<{
    name: string
    idsBrowser: number
    idsServer: number
    idsBoth: number
    nameIncoherent: number
    rates: Rates
  }>
  timeseries: Array<{
    day: string
    idsBrowser: number
    idsServer: number
    idsBoth: number
    nameIncoherent: number
    rates: Rates
  }>
  userData: Array<{
    eventName: string
    source: string
    total: number
    ud: number
    em: number
    ph: number
    extid: number
    fbp: number
    fbc: number
    cua: number
    cip: number
  }>
  serverOnlyUserAgents: Array<{ ua: string; count: number }>
  sweep: { cursor: number; maxId: number; behind: number }
}

function clockApp(): { app: App; setNow: (ts: number) => void } {
  let now = D1
  const app = makeApp(testConfig(), { clock: () => now })
  return { app, setNow: (ts) => (now = ts) }
}

async function ingestBrowser(app: App, payload: unknown): Promise<void> {
  const res = await app.request('/c/browser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  expect(res.status).toBe(200)
}

async function ingestServer(app: App, payload: unknown): Promise<void> {
  const res = await app.request('/c/server', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  expect(res.status).toBe(200)
}

async function stats(app: App): Promise<Stats> {
  const res = await app.request('/api/stats')
  expect(res.status).toBe(200)
  return (await res.json()) as Stats
}

describe('sweep, ledger and /api/stats', () => {
  it('same event_id and name on both channels counts as dedupable', async () => {
    const { app } = clockApp()
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'E1' })
    await ingestServer(app, { data: [{ event_name: 'Purchase', event_id: 'E1' }] })
    await app.ctx.sweepTick()
    const s = await stats(app)
    expect(s.totals.idsBrowser).toBe(1)
    expect(s.totals.idsServer).toBe(1)
    expect(s.totals.idsBoth).toBe(1)
    expect(s.totals.nameIncoherent).toBe(0)
    expect(s.totals.dedupable).toBe(1)
    expect(s.totals.rates).toEqual({ browser: 1, server: 1, union: 1 })
  })

  it('same event_id with different names is name-incoherent, not dedupable', async () => {
    const { app } = clockApp()
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'E1' })
    await ingestServer(app, { data: [{ event_name: 'Lead', event_id: 'E1' }] })
    await app.ctx.sweepTick()
    const s = await stats(app)
    expect(s.totals.idsBoth).toBe(1)
    expect(s.totals.nameIncoherent).toBe(1)
    expect(s.totals.dedupable).toBe(0)
  })

  it('browser-only and server-only ids never enter idsBoth', async () => {
    const { app } = clockApp()
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'B-only' })
    await ingestServer(app, { data: [{ event_name: 'Purchase', event_id: 'S-only' }] })
    await app.ctx.sweepTick()
    const s = await stats(app)
    expect(s.totals.idsBrowser).toBe(1)
    expect(s.totals.idsServer).toBe(1)
    expect(s.totals.idsBoth).toBe(0)
    expect(s.totals.rates).toEqual({ browser: 0, server: 0, union: 0 })
  })

  it('events without event_id count in totals but not in id matching', async () => {
    const { app } = clockApp()
    await ingestBrowser(app, { event_name: 'PageView' })
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'E1' })
    await app.ctx.sweepTick()
    const s = await stats(app)
    expect(s.totals.events.browser).toBe(2)
    expect(s.totals.idsBrowser).toBe(1)
  })

  it('time series is day-keyed and late second-channel arrivals attribute to the first-seen day', async () => {
    const { app, setNow } = clockApp()
    setNow(D1)
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'LATE' })
    await ingestBrowser(app, { event_name: 'Lead', event_id: 'D1-only' })
    await app.ctx.sweepTick()
    setNow(D2)
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'D2-b' })
    await ingestServer(app, { data: [{ event_name: 'Purchase', event_id: 'LATE' }] })
    await app.ctx.sweepTick()

    const s = await stats(app)
    expect(s.timeseries).toHaveLength(2)
    const day1 = s.timeseries.find((t) => t.day === '2026-08-01')!
    const day2 = s.timeseries.find((t) => t.day === '2026-08-02')!
    // LATE was first seen on D1: its server copy on D2 lands on D1's row.
    expect(day1.idsBrowser).toBe(2)
    expect(day1.idsServer).toBe(1)
    expect(day1.idsBoth).toBe(1)
    expect(day2.idsBrowser).toBe(1)
    expect(day2.idsServer).toBe(0)
    expect(day2.idsBoth).toBe(0)
  })

  it('breaks down by event name', async () => {
    const { app } = clockApp()
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'P1' })
    await ingestServer(app, { data: [{ event_name: 'Purchase', event_id: 'P1' }] })
    await ingestBrowser(app, { event_name: 'Lead', event_id: 'L1' })
    await app.ctx.sweepTick()
    const s = await stats(app)
    const purchase = s.byEventName.find((e) => e.name === 'Purchase')!
    const lead = s.byEventName.find((e) => e.name === 'Lead')!
    expect(purchase).toMatchObject({ idsBrowser: 1, idsServer: 1, idsBoth: 1 })
    expect(purchase.rates.server).toBe(1)
    expect(lead).toMatchObject({ idsBrowser: 1, idsServer: 0, idsBoth: 0 })
  })

  it('tracks user_data coverage per (day, name, source)', async () => {
    const { app } = clockApp()
    await ingestServer(app, {
      data: [
        {
          event_name: 'Purchase',
          event_id: 'U1',
          user_data: { em: 'hash', ph: 'hash', client_user_agent: 'UA-1' },
        },
      ],
    })
    await app.ctx.sweepTick()
    const s = await stats(app)
    const row = s.userData.find((u) => u.eventName === 'Purchase' && u.source === 'server')!
    expect(row).toMatchObject({ total: 1, ud: 1, em: 1, ph: 1, cua: 1, extid: 0, fbp: 0, fbc: 0, cip: 0 })
  })

  it('sweeps incrementally without reprocessing', async () => {
    const { app } = clockApp()
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'I1' })
    await app.ctx.sweepTick()
    let s = await stats(app)
    expect(s.totals.idsBrowser).toBe(1)
    expect(s.sweep.behind).toBe(0)
    const cursorAfterFirst = s.sweep.cursor

    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'I2' })
    await app.ctx.sweepTick()
    s = await stats(app)
    expect(s.totals.idsBrowser).toBe(2)
    expect(s.sweep.cursor).toBeGreaterThan(cursorAfterFirst)
    expect(s.sweep.behind).toBe(0)
  })

  it('survives a poison row and advances the cursor past it', async () => {
    const { app } = clockApp()
    await app.request('/c/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'garbage',
    })
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'OK1' })
    await app.ctx.sweepTick()
    const s = await stats(app)
    expect(s.sweep.behind).toBe(0)
    expect(s.totals.idsBrowser).toBe(1)
    expect(s.totals.events.browser).toBe(2)
  })

  it('serves /api/stats from aggregates and ledger only', async () => {
    const { app } = clockApp()
    await ingestBrowser(app, { event_name: 'Purchase', event_id: 'A1' })
    await ingestServer(app, {
      data: [{ event_name: 'Purchase', event_id: 'S1', user_data: { client_user_agent: 'Server UA' } }],
    })
    await app.ctx.sweepTick()
    // Prove the endpoint never touches the raw tables: drop them and read stats.
    app.ctx.db.exec('DROP TABLE events; DROP TABLE requests;')
    const s = await stats(app)
    expect(s.totals.idsBrowser).toBe(1)
    expect(s.totals.idsServer).toBe(1)
    expect(s.totals.requests).toEqual({ browser: 1, server: 1 })
    expect(s.serverOnlyUserAgents).toEqual([{ ua: 'Server UA', count: 1 }])
  })
})
