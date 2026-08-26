import { appendFileSync } from 'node:fs'
import path from 'node:path'
import type { Context, Hono } from 'hono'
import type { Config } from '../config.js'
import type { AppContext } from '../app.js'

// 1x1 transparent pixel: GET ingest (sendPixel = <img>) must answer with a real
// image or the browser blocks the response with ERR_BLOCKED_BY_ORB and GTM
// marks the tag as failed.
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64',
)

function clientIp(c: Context): string | null {
  return (
    c.req.header('fly-client-ip') ||
    (c.req.header('x-forwarded-for') || '').split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    null
  )
}

function collectResponse(c: Context, method: string): Response {
  if (method === 'GET') {
    c.header('Content-Type', 'image/gif')
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
    return c.body(new Uint8Array(TRANSPARENT_GIF), 200)
  }
  return c.json({ ok: true }, 200)
}

export function registerIngestRoutes(app: Hono, config: Config, ctx: AppContext): void {
  const insertRequest = ctx.db.prepare(
    `INSERT INTO requests (ts, source, method, path, ip, ua, content_type, query, headers, body)
     VALUES (@ts, @source, @method, @path, @ip, @ua, @content_type, @query, @headers, @body)`,
  )

  async function collect(c: Context, source: 'browser' | 'server'): Promise<Response> {
    const method = c.req.method
    const contentLength = Number(c.req.header('content-length') || 0)
    if (contentLength > config.maxBodyBytes) {
      return c.json({ ok: false, error: 'payload too large' }, 413)
    }

    let bodyText = ''
    try {
      bodyText = await c.req.text()
    } catch {
      /* no body */
    }
    if (Buffer.byteLength(bodyText) > config.maxBodyBytes) {
      return c.json({ ok: false, error: 'payload too large' }, 413)
    }

    const headersObj = Object.fromEntries(c.req.raw.headers.entries())
    for (const key of Object.keys(headersObj)) {
      const lower = key.toLowerCase()
      if (lower === 'authorization' || lower === 'cookie' || lower === 'x-collector-key') {
        delete headersObj[key]
      }
    }

    const row = {
      ts: ctx.clock(),
      source,
      method,
      path: new URL(c.req.url).pathname,
      ip: clientIp(c),
      ua: c.req.header('user-agent') ?? null,
      content_type: c.req.header('content-type') ?? null,
      query: JSON.stringify(c.req.query()),
      headers: JSON.stringify(headersObj),
      body: bodyText,
    }

    try {
      insertRequest.run(row)
    } catch (e) {
      // Ingest must never lose data or slow the tag down: on any DB failure
      // park the payload in fallback.ndjson and still answer 200.
      try {
        appendFileSync(
          path.join(config.dataDir, 'fallback.ndjson'),
          JSON.stringify({ ...row, _error: String(e) }) + '\n',
        )
      } catch {
        /* nothing left to do */
      }
      console.error('[collect] DB error, payload saved to fallback.ndjson:', e)
    }
    return collectResponse(c, method)
  }

  // Open CORS: the browser Pixel mirrors cross-origin; without this events are lost.
  app.use('/c/*', async (c, next) => {
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    c.header('Access-Control-Allow-Headers', '*')
    if (c.req.method === 'OPTIONS') return c.body(null, 204)
    await next()
  })

  const base = config.collectPathSecret ? `/c/${config.collectPathSecret}` : '/c'

  // The browser channel cannot send custom headers (sendBeacon), so it is
  // protected only by the secret path; the server channel checks INGEST_KEY.
  const serverHandler = (c: Context): Promise<Response> | Response => {
    if (config.ingestKey && c.req.header('x-collector-key') !== config.ingestKey) {
      return c.json({ ok: false, error: 'unauthorized' }, 401)
    }
    return collect(c, 'server')
  }
  app.all(`${base}/browser`, (c) => collect(c, 'browser'))
  app.all(`${base}/browser/*`, (c) => collect(c, 'browser'))
  app.all(`${base}/server`, serverHandler)
  app.all(`${base}/server/*`, serverHandler)
}
