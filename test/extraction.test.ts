import { describe, it, expect, afterEach } from 'vitest'
import { testConfig, makeApp, closeApps } from './helpers.js'
import type { App } from '../src/app.js'

afterEach(closeApps)

interface EventRow {
  id: number
  request_id: number
  ts: number
  source: string
  event_name: string | null
  event_id: string | null
  fbp: string | null
  fbc: string | null
  event_time: number | null
  external_id: string | null
  raw: string | null
}

function allEvents(app: App): EventRow[] {
  return app.ctx.db.prepare('SELECT * FROM events ORDER BY id').all() as EventRow[]
}

async function postJson(app: App, body: unknown): Promise<Response> {
  return app.request('/c/browser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('event extraction', () => {
  it('CAPI batch {data:[...]} produces one row per event', async () => {
    const app = makeApp(testConfig())
    const res = await postJson(app, {
      data: [
        { event_name: 'Purchase', event_id: 'e1', event_time: 1723000000 },
        { event_name: 'Lead', event_id: 'e2' },
      ],
    })
    expect(res.status).toBe(200)
    const rows = allEvents(app)
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => [r.event_name, r.event_id])).toEqual([
      ['Purchase', 'e1'],
      ['Lead', 'e2'],
    ])
  })

  it('single object with alias keys eventName/eventID is normalized', async () => {
    const app = makeApp(testConfig())
    await postJson(app, { eventName: 'ViewContent', eventID: 'alias-1' })
    const rows = allEvents(app)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.event_name).toBe('ViewContent')
    expect(rows[0]!.event_id).toBe('alias-1')
  })

  it('JSON array of 3 events produces 3 rows', async () => {
    const app = makeApp(testConfig())
    await postJson(app, [
      { event_name: 'A', event_id: 'a1' },
      { event_name: 'B', event_id: 'b1' },
      { event_name: 'C', event_id: 'c1' },
    ])
    expect(allEvents(app)).toHaveLength(3)
  })

  it('form-urlencoded body with short aliases ev/eid/_fbp', async () => {
    const app = makeApp(testConfig())
    await app.request('/c/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'ev=PageView&eid=e9&_fbp=fb.1.x',
    })
    const rows = allEvents(app)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.event_name).toBe('PageView')
    expect(rows[0]!.event_id).toBe('e9')
    expect(rows[0]!.fbp).toBe('fb.1.x')
  })

  it('browser GET with data in the query string', async () => {
    const app = makeApp(testConfig())
    const d = encodeURIComponent(JSON.stringify({ foo: 'bar' }))
    await app.request(`/c/browser?event_name=AddToCart&event_id=e5&fbc=fb.1.y&d=${d}`)
    const rows = allEvents(app)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.event_name).toBe('AddToCart')
    expect(rows[0]!.event_id).toBe('e5')
    expect(rows[0]!.fbc).toBe('fb.1.y')
  })

  it('nested fields are found by deep search', async () => {
    const app = makeApp(testConfig())
    await postJson(app, {
      event: { eventId: 'deep1', properties: { user_data: { fbp: 'fb.1.deep' } } },
    })
    const rows = allEvents(app)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.event_id).toBe('deep1')
    expect(rows[0]!.fbp).toBe('fb.1.deep')
  })

  it('unparseable body produces exactly one fallback row with raw preserved', async () => {
    const app = makeApp(testConfig())
    await app.request('/c/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'garbage',
    })
    const rows = allEvents(app)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.event_id).toBeNull()
    expect(rows[0]!.event_name).toBeNull()
    expect(rows[0]!.raw).toBe('garbage')
  })

  it('extracts external_id and event_time from a CAPI-style payload', async () => {
    const app = makeApp(testConfig())
    await postJson(app, {
      data: [
        {
          event_name: 'Purchase',
          event_id: 'cap-1',
          event_time: 1723456789,
          user_data: { external_id: 'u-42', fbp: 'fb.1.z' },
        },
      ],
    })
    const rows = allEvents(app)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.external_id).toBe('u-42')
    expect(rows[0]!.event_time).toBe(1723456789)
    expect(rows[0]!.fbp).toBe('fb.1.z')
  })

  it('rows carry the request_id of their requests row and the channel source', async () => {
    const fakeNow = 1_760_000_000_000
    const app = makeApp(testConfig({ ingestKey: 'k' }), { clock: () => fakeNow })
    await postJson(app, { event_name: 'One', event_id: 'r1' })
    await app.request('/c/server', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Collector-Key': 'k' },
      body: JSON.stringify({ data: [{ event_name: 'Two', event_id: 'r2' }] }),
    })
    const requests = app.ctx.db
      .prepare('SELECT id, source FROM requests ORDER BY id')
      .all() as Array<{ id: number; source: string }>
    const rows = allEvents(app)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.request_id).toBe(requests[0]!.id)
    expect(rows[0]!.source).toBe('browser')
    expect(rows[0]!.ts).toBe(fakeNow)
    expect(rows[1]!.request_id).toBe(requests[1]!.id)
    expect(rows[1]!.source).toBe('server')
  })
})
