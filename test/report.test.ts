import { describe, it, expect, afterEach } from 'vitest'
import { testConfig, makeApp, closeApps } from './helpers.js'
import type { App } from '../src/app.js'

afterEach(closeApps)

const D1 = Date.UTC(2026, 7, 1, 10, 0, 0)
const D2 = Date.UTC(2026, 7, 2, 10, 0, 0)

async function ingest(app: App, channel: 'browser' | 'server', payload: unknown): Promise<void> {
  const res = await app.request(`/c/${channel}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  expect(res.status).toBe(200)
}

describe('/report', () => {
  it('is admin-guarded', async () => {
    const app = makeApp(testConfig({ adminToken: 's3cret' }))
    expect((await app.request('/report')).status).toBe(401)
    const ok = await app.request('/report?token=s3cret')
    expect(ok.status).toBe(200)
    expect(ok.headers.get('content-type')).toContain('text/html')
  })

  it('renders rates, event names and one time-series row per day', async () => {
    let now = D1
    const app = makeApp(testConfig(), { clock: () => now })
    await ingest(app, 'browser', { event_name: 'Purchase', event_id: 'E1' })
    await ingest(app, 'server', { data: [{ event_name: 'Purchase', event_id: 'E1' }] })
    now = D2
    await ingest(app, 'browser', { event_name: 'Lead', event_id: 'E2' })
    await app.ctx.sweepTick()

    const html = await (await app.request('/report')).text()
    expect(html).toContain('closest to Meta Events Manager')
    expect(html).toContain('Purchase')
    expect(html).toContain('Lead')
    expect(html).toContain('2026-08-01')
    expect(html).toContain('2026-08-02')
    // Purchase is fully deduplicated: server rate 100.0% appears.
    expect(html).toContain('100.0%')
  })

  it('escapes hostile event names', async () => {
    const app = makeApp(testConfig())
    await ingest(app, 'browser', { event_name: '<script>alert(1)</script>', event_id: 'X1' })
    await app.ctx.sweepTick()
    const html = await (await app.request('/report')).text()
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('uses MONITOR_NAME in the title', async () => {
    const app = makeApp(testConfig({ monitorName: 'my-shop-monitor' }))
    const html = await (await app.request('/report')).text()
    expect(html).toMatch(/<title>[^<]*my-shop-monitor[^<]*<\/title>/)
  })

  it('renders from aggregates only', async () => {
    const app = makeApp(testConfig())
    await ingest(app, 'browser', { event_name: 'Purchase', event_id: 'E1' })
    await app.ctx.sweepTick()
    app.ctx.db.exec('DROP TABLE events; DROP TABLE requests;')
    const res = await app.request('/report')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Purchase')
  })
})
