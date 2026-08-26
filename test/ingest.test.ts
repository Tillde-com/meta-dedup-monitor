import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { testConfig, makeApp, closeApps } from './helpers.js'
import type { App } from '../src/app.js'

afterEach(closeApps)

interface RequestRow {
  id: number
  ts: number
  source: string
  method: string
  path: string
  ip: string | null
  ua: string | null
  content_type: string | null
  query: string | null
  headers: string | null
  body: string | null
}

function allRequests(app: App): RequestRow[] {
  return app.ctx.db.prepare('SELECT * FROM requests ORDER BY id').all() as RequestRow[]
}

describe('ingest channels', () => {
  it('POST JSON to browser channel stores a raw request row', async () => {
    const fakeNow = 1_750_000_000_000
    const app = makeApp(testConfig({ collectPathSecret: 'abc' }), { clock: () => fakeNow })
    const res = await app.request('/c/abc/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'Purchase', event_id: 'E1' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    const rows = allRequests(app)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.source).toBe('browser')
    expect(rows[0]!.ts).toBe(fakeNow)
    expect(rows[0]!.body).toBe(JSON.stringify({ event_name: 'Purchase', event_id: 'E1' }))
  })

  it('GET to browser channel answers with the 43-byte transparent GIF and stores the query', async () => {
    const app = makeApp(testConfig({ collectPathSecret: 'abc' }))
    const res = await app.request('/c/abc/browser?event_name=Purchase')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/gif')
    const body = Buffer.from(await res.arrayBuffer())
    expect(body.length).toBe(43)
    expect(body.subarray(0, 6).toString('ascii')).toBe('GIF89a')
    const rows = allRequests(app)
    expect(rows).toHaveLength(1)
    expect(JSON.parse(rows[0]!.query!)).toMatchObject({ event_name: 'Purchase' })
  })

  it('server channel requires X-Collector-Key when INGEST_KEY is set', async () => {
    const app = makeApp(testConfig({ ingestKey: 'k123' }))
    const denied = await app.request('/c/server', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(denied.status).toBe(401)
    expect((await denied.json()) as { ok: boolean }).toMatchObject({ ok: false })
    expect(allRequests(app)).toHaveLength(0)

    const allowed = await app.request('/c/server', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Collector-Key': 'k123' },
      body: '{}',
    })
    expect(allowed.status).toBe(200)
    const rows = allRequests(app)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.source).toBe('server')
  })

  it('secret path is enforced: /c/browser is 404 when COLLECT_PATH_SECRET=abc', async () => {
    const app = makeApp(testConfig({ collectPathSecret: 'abc' }))
    const wrong = await app.request('/c/browser', { method: 'POST', body: '{}' })
    expect(wrong.status).toBe(404)
    const right = await app.request('/c/abc/browser', { method: 'POST', body: '{}' })
    expect(right.status).toBe(200)
  })

  it('OPTIONS answers 204 with open CORS', async () => {
    const app = makeApp(testConfig({ collectPathSecret: 'abc' }))
    const res = await app.request('/c/abc/browser', { method: 'OPTIONS' })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('rejects bodies over MAX_BODY_BYTES with 413 and stores nothing', async () => {
    const app = makeApp(testConfig({ maxBodyBytes: 100 }))
    const res = await app.request('/c/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': '101' },
      body: JSON.stringify({ pad: 'x'.repeat(120) }),
    })
    expect(res.status).toBe(413)
    expect(allRequests(app)).toHaveLength(0)
  })

  it('strips authorization, cookie and x-collector-key from stored headers', async () => {
    const app = makeApp(testConfig())
    await app.request('/c/browser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret',
        Cookie: 'sid=1',
        'X-Collector-Key': 'leak',
        'X-Custom': 'keep-me',
      },
      body: '{}',
    })
    const rows = allRequests(app)
    const headers = JSON.parse(rows[0]!.headers!) as Record<string, string>
    const keys = Object.keys(headers).map((k) => k.toLowerCase())
    expect(keys).not.toContain('authorization')
    expect(keys).not.toContain('cookie')
    expect(keys).not.toContain('x-collector-key')
    expect(headers['x-custom']).toBe('keep-me')
  })

  it('client IP precedence: fly-client-ip > first x-forwarded-for > x-real-ip', async () => {
    const app = makeApp(testConfig())
    await app.request('/c/browser', {
      method: 'POST',
      headers: { 'fly-client-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2, 9.9.9.9', 'x-real-ip': '3.3.3.3' },
      body: '{}',
    })
    await app.request('/c/browser', {
      method: 'POST',
      headers: { 'x-forwarded-for': '2.2.2.2, 9.9.9.9', 'x-real-ip': '3.3.3.3' },
      body: '{}',
    })
    await app.request('/c/browser', {
      method: 'POST',
      headers: { 'x-real-ip': '3.3.3.3' },
      body: '{}',
    })
    const rows = allRequests(app)
    expect(rows.map((r) => r.ip)).toEqual(['1.1.1.1', '2.2.2.2', '3.3.3.3'])
  })

  it('falls back to fallback.ndjson and still answers 200 when the DB is broken', async () => {
    const config = testConfig()
    const app = makeApp(config)
    app.ctx.db.close()
    const res = await app.request('/c/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: 'E-fallback' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    const fallbackPath = path.join(config.dataDir, 'fallback.ndjson')
    expect(existsSync(fallbackPath)).toBe(true)
    const lines = readFileSync(fallbackPath, 'utf8').trim().split('\n')
    expect(lines).toHaveLength(1)
    const entry = JSON.parse(lines[0]!) as { body: string; source: string }
    expect(entry.source).toBe('browser')
    expect(entry.body).toBe(JSON.stringify({ event_id: 'E-fallback' }))
  })
})
