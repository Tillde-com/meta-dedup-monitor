import { describe, it, expect, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { testConfig, makeApp, closeApps } from './helpers.js'
import type { App } from '../src/app.js'

afterEach(closeApps)

async function ingest(app: App, payload: unknown): Promise<void> {
  const res = await app.request('/c/browser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  expect(res.status).toBe(200)
}

// Naive CSV line parser good enough for asserting quoting in tests.
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      field = ''
      row = []
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

describe('exports', () => {
  it('all three endpoints are admin-guarded', async () => {
    const app = makeApp(testConfig({ adminToken: 's3cret' }))
    for (const p of ['/export.csv', '/export.ndjson', '/export.db']) {
      expect((await app.request(p)).status).toBe(401)
    }
  })

  it('export.csv quotes commas, quotes and newlines coming from the raw payload', async () => {
    const app = makeApp(testConfig())
    await ingest(app, { event_name: 'Weird, "name"\nwith newline', event_id: 'csv-1' })
    const res = await app.request('/export.csv')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    const rows = parseCsv(await res.text())
    expect(rows[0]).toEqual([
      'id', 'ts', 'source', 'event_name', 'event_id', 'event_time', 'external_id', 'fbp', 'fbc',
    ])
    expect(rows).toHaveLength(2)
    expect(rows[1]![3]).toBe('Weird, "name"\nwith newline')
    expect(rows[1]![4]).toBe('csv-1')
  })

  it('export.ndjson emits one parseable JSON object per requests row', async () => {
    const app = makeApp(testConfig())
    await ingest(app, { event_name: 'One', event_id: 'n1' })
    await ingest(app, { event_name: 'Two', event_id: 'n2' })
    const res = await app.request('/export.ndjson')
    expect(res.status).toBe(200)
    const lines = (await res.text()).trim().split('\n')
    expect(lines).toHaveLength(2)
    for (const line of lines) {
      const obj = JSON.parse(line) as { source: string; body: string }
      expect(obj.source).toBe('browser')
    }
  })

  it('exports more than 1000 rows completely across page boundaries', async () => {
    const app = makeApp(testConfig())
    const batch = Array.from({ length: 1200 }, (_, i) => ({ event_name: 'Bulk', event_id: `b-${i}` }))
    await ingest(app, { data: batch })
    const res = await app.request('/export.csv')
    const lines = (await res.text()).trim().split('\n')
    expect(lines).toHaveLength(1201) // header + 1200 rows
    expect(lines[1200]).toContain('b-1199')
  })

  it('export.db: 202 while building, then a valid SQLite snapshot; refresh regenerates', async () => {
    const app = makeApp(testConfig())
    await ingest(app, { event_name: 'Purchase', event_id: 'snap-1' })
    await app.ctx.sweepTick()

    const first = await app.request('/export.db')
    expect(first.status).toBe(202)
    expect(await first.json()).toMatchObject({ preparing: true })

    let res = await app.request('/export.db')
    for (let i = 0; i < 200 && res.status === 202; i++) {
      await new Promise((r) => setTimeout(r, 50))
      res = await app.request('/export.db')
    }
    expect(res.status).toBe(200)
    const bytes = Buffer.from(await res.arrayBuffer())

    const snapPath = path.join(mkdtempSync(path.join(tmpdir(), 'mdm-snap-')), 'snap.db')
    writeFileSync(snapPath, bytes)
    const snap = new Database(snapPath, { readonly: true })
    const ledger = snap.prepare('SELECT event_id FROM ledger').all() as Array<{ event_id: string }>
    snap.close()
    expect(ledger).toEqual([{ event_id: 'snap-1' }])

    // A new ledger row only shows up after a forced refresh.
    await ingest(app, { event_name: 'Purchase', event_id: 'snap-2' })
    await app.ctx.sweepTick()
    const cached = await app.request('/export.db')
    expect(cached.status).toBe(200) // still the cached snapshot

    const refresh = await app.request('/export.db?refresh=1')
    expect(refresh.status).toBe(202)
    res = await app.request('/export.db')
    for (let i = 0; i < 200 && res.status === 202; i++) {
      await new Promise((r) => setTimeout(r, 50))
      res = await app.request('/export.db')
    }
    expect(res.status).toBe(200)
    const bytes2 = Buffer.from(await res.arrayBuffer())
    writeFileSync(snapPath, bytes2)
    const snap2 = new Database(snapPath, { readonly: true })
    const n = (snap2.prepare('SELECT COUNT(*) AS n FROM ledger').get() as { n: number }).n
    snap2.close()
    expect(n).toBe(2)
  })

  it('exports complete while ingest continues', async () => {
    const app = makeApp(testConfig())
    const batch = Array.from({ length: 600 }, (_, i) => ({ event_name: 'Load', event_id: `l-${i}` }))
    await ingest(app, { data: batch })
    const [exportRes, ...ingests] = await Promise.all([
      (async () => (await app.request('/export.csv')).text())(),
      ingest(app, { event_name: 'During', event_id: 'd-1' }),
      ingest(app, { event_name: 'During', event_id: 'd-2' }),
    ])
    void ingests
    expect(exportRes.trim().split('\n').length).toBeGreaterThanOrEqual(601)
  })
})
