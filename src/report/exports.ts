import { Readable } from 'node:stream'
import zlib from 'node:zlib'
import { spawn } from 'node:child_process'
import { existsSync, createReadStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Context, Hono, MiddlewareHandler } from 'hono'
import type { Config } from '../config.js'
import type { AppContext } from '../app.js'

// Streaming exports, paged by id in blocks of 500 rows: NEVER an iterator held
// open across an await. Between pages control returns to the event loop (the
// stream consumer's await), so ingest never blocks and no query stays open for
// the duration of a download.

const PAGE_SIZE = 500
const SNAPSHOT_TTL_MS = 10 * 60 * 1000

interface StreamSpec {
  pageFn: (lastId: number) => Array<{ id: number }>
  rowToLine: (row: never) => string
  header: string | null
  contentType: string
  filename: string
}

function streamQuery(c: Context, spec: StreamSpec): Response {
  async function* generate(): AsyncGenerator<Buffer> {
    try {
      if (spec.header != null) yield Buffer.from(spec.header + '\n')
      let lastId = 0
      for (;;) {
        const rows = spec.pageFn(lastId)
        if (!rows.length) break
        let chunk = ''
        for (const row of rows) chunk += spec.rowToLine(row as never) + '\n'
        yield Buffer.from(chunk)
        lastId = rows[rows.length - 1]!.id
      }
    } catch (err) {
      // Error mid-stream: the download ends up truncated. Acceptable — status
      // and headers are already gone at this point.
      console.error('[export]', err)
    }
  }

  const acceptsGzip = (c.req.header('accept-encoding') || '').includes('gzip')
  c.header('Content-Type', spec.contentType)
  c.header('Content-Disposition', `attachment; filename="${spec.filename}"`)
  c.header('Vary', 'Accept-Encoding')

  let nodeStream: Readable = Readable.from(generate())
  if (acceptsGzip) {
    c.header('Content-Encoding', 'gzip')
    nodeStream = nodeStream.pipe(zlib.createGzip())
  }
  return c.body(Readable.toWeb(nodeStream) as unknown as ReadableStream)
}

const csvEsc = (v: unknown): string => (v == null ? '' : `"${String(v).replace(/"/g, '""')}"`)

export function registerExportRoutes(
  app: Hono,
  config: Config,
  ctx: AppContext,
  admin: MiddlewareHandler,
): void {
  const csvPage = ctx.db.prepare(
    `SELECT id, ts, source, event_name, event_id, event_time, external_id, fbp, fbc
     FROM events WHERE id > ? ORDER BY id LIMIT ?`,
  )
  const ndjsonPage = ctx.db.prepare(`SELECT * FROM requests WHERE id > ? ORDER BY id LIMIT ?`)

  app.get('/export.csv', admin, (c) =>
    streamQuery(c, {
      pageFn: (lastId) => csvPage.all(lastId, PAGE_SIZE) as Array<{ id: number }>,
      rowToLine: (r: Record<string, unknown>) =>
        [r.id, r.ts, r.source, r.event_name, r.event_id, r.event_time, r.external_id, r.fbp, r.fbc]
          .map(csvEsc)
          .join(','),
      header: 'id,ts,source,event_name,event_id,event_time,external_id,fbp,fbc',
      contentType: 'text/csv; charset=utf-8',
      filename: 'events.csv',
    }),
  )

  app.get('/export.ndjson', admin, (c) =>
    streamQuery(c, {
      pageFn: (lastId) => ndjsonPage.all(lastId, PAGE_SIZE) as Array<{ id: number }>,
      rowToLine: (r: Record<string, unknown>) => JSON.stringify(r),
      header: null,
      contentType: 'application/x-ndjson; charset=utf-8',
      filename: 'requests.ndjson',
    }),
  )

  // /export.db: whole-DB snapshot via VACUUM INTO in a separate child process
  // (a VACUUM of a large DB can take tens of seconds; doing it in the server
  // process would block the event loop and therefore ingest).
  const dbPath = path.join(config.dataDir, 'events.db')
  const snapshotPath = path.join(config.dataDir, 'snapshot.db')
  const scriptPath = fileURLToPath(new URL('../../scripts/snapshot.mjs', import.meta.url))
  const snapshotState: { running: boolean; builtAt: number | null } = {
    running: false,
    builtAt: null,
  }

  app.get('/export.db', admin, (c) => {
    const forceRefresh = c.req.query('refresh') === '1'

    // The in-progress guard comes BEFORE the freshness check: the snapshot is
    // written to .tmp and renamed only when the VACUUM completed, so
    // snapshotPath, if it exists, is always a complete file.
    if (snapshotState.running) return c.json({ preparing: true }, 202)

    const fresh =
      snapshotState.builtAt != null &&
      ctx.clock() - snapshotState.builtAt < SNAPSHOT_TTL_MS &&
      existsSync(snapshotPath)
    if (!forceRefresh && fresh) {
      c.header('Content-Type', 'application/octet-stream')
      c.header('Content-Disposition', 'attachment; filename="snapshot.db"')
      return c.body(Readable.toWeb(createReadStream(snapshotPath)) as unknown as ReadableStream)
    }

    snapshotState.running = true
    const child = spawn(process.execPath, [scriptPath, dbPath, snapshotPath])
    child.on('exit', (code) => {
      snapshotState.running = false
      if (code === 0) snapshotState.builtAt = ctx.clock()
      else console.error(`[snapshot] child exited with code ${code}`)
    })
    child.on('error', (err) => {
      snapshotState.running = false
      console.error('[snapshot] failed to start:', err)
    })

    return c.json({ preparing: true }, 202)
  })
}
