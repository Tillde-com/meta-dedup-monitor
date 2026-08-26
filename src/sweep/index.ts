import type { Database } from 'better-sqlite3'

// Incremental sweep: consumes `events` in id order from the cursor saved in
// `meta`, maintaining the permanent Dedup Ledger and the daily aggregates.
// Each batch runs in one synchronous transaction (no await inside), yielding
// to the event loop between batches so ingest is never blocked, even during a
// backfill. Ported from reference/legacy-server.js and re-keyed by day.

const BATCH_SIZE = 500
const UNKNOWN_NAME = '(unknown)'
const NO_UA = '(no user agent)'

const hasVal = (v: unknown): boolean =>
  v != null && v !== '' && !(Array.isArray(v) && v.length === 0)

function normUA(v: unknown): string {
  if (!hasVal(v)) return NO_UA
  const t = Array.isArray(v) ? String(v[0]) : String(v)
  return t.length > 90 ? t.slice(0, 90) + '…' : t
}

export function utcDay(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

interface EventRow {
  id: number
  request_id: number
  ts: number
  source: 'browser' | 'server'
  event_name: string | null
  event_id: string | null
  raw: string | null
}

interface LedgerRow {
  event_id: string
  first_ts: number
  last_ts: number
  day: string
  browser_n: number
  server_n: number
  name_browser: string | null
  name_server: string | null
  name_coherent: number | null
  ua_server: string | null
}

interface DedupContrib {
  b: number
  s: number
  both: number
  incoh: number
}

function contrib(state: LedgerRow): DedupContrib {
  const b = state.browser_n > 0 ? 1 : 0
  const s = state.server_n > 0 ? 1 : 0
  return { b, s, both: b && s ? 1 : 0, incoh: state.name_coherent === 0 ? 1 : 0 }
}

// The dedup row an id contributes to is keyed by the FIRST non-null name seen
// for that id; until a name shows up the id sits under '(unknown)'. Once a
// name is recorded the key never changes again (setting the second channel's
// name cannot produce further deltas, see below), so deriving it from the
// stored names is unambiguous at every point a delta is applied.
function dedupKey(state: LedgerRow): string {
  return state.name_browser ?? state.name_server ?? UNKNOWN_NAME
}

export interface Sweep {
  tick: () => Promise<number>
  start: () => void
}

export function createSweep(db: Database): Sweep {
  const selectBatch = db.prepare(
    `SELECT id, request_id, ts, source, event_name, event_id, raw
     FROM events WHERE id > ? ORDER BY id LIMIT ?`,
  )
  const getMeta = db.prepare(`SELECT v FROM meta WHERE k = ?`)
  const setMeta = db.prepare(
    `INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v`,
  )
  const getLedger = db.prepare(`SELECT * FROM ledger WHERE event_id = ?`)
  const upsertLedger = db.prepare(
    `INSERT OR REPLACE INTO ledger
       (event_id, first_ts, last_ts, day, browser_n, server_n, name_browser, name_server, name_coherent, ua_server)
     VALUES (@event_id, @first_ts, @last_ts, @day, @browser_n, @server_n, @name_browser, @name_server, @name_coherent, @ua_server)`,
  )
  const upsertDaily = db.prepare(
    `INSERT INTO agg_daily (day, event_name, source, total, no_id, ud, em, ph, extid, fbp, fbc, cua, cip)
     VALUES (@day, @event_name, @source, 1, @no_id, @ud, @em, @ph, @extid, @fbp, @fbc, @cua, @cip)
     ON CONFLICT(day, event_name, source) DO UPDATE SET
       total = total + 1,
       no_id = no_id + excluded.no_id,
       ud    = ud    + excluded.ud,
       em    = em    + excluded.em,
       ph    = ph    + excluded.ph,
       extid = extid + excluded.extid,
       fbp   = fbp   + excluded.fbp,
       fbc   = fbc   + excluded.fbc,
       cua   = cua   + excluded.cua,
       cip   = cip   + excluded.cip`,
  )
  const addDedup = db.prepare(
    `INSERT INTO agg_daily_dedup (day, event_name, ids_browser, ids_server, ids_both, name_incoherent)
     VALUES (@day, @name, @b, @s, @both, @incoh)
     ON CONFLICT(day, event_name) DO UPDATE SET
       ids_browser     = ids_browser     + excluded.ids_browser,
       ids_server      = ids_server      + excluded.ids_server,
       ids_both        = ids_both        + excluded.ids_both,
       name_incoherent = name_incoherent + excluded.name_incoherent`,
  )
  const dropZeroDedup = db.prepare(
    `DELETE FROM agg_daily_dedup
     WHERE day = ? AND event_name = ?
       AND ids_browser = 0 AND ids_server = 0 AND ids_both = 0 AND name_incoherent = 0`,
  )

  const metaNum = (k: string): number => {
    const row = getMeta.get(k) as { v: string } | undefined
    return row ? Number(row.v) : 0
  }

  function sweepEvent(row: EventRow): void {
    let parsed: unknown = null
    if (row.raw) {
      try {
        parsed = JSON.parse(row.raw)
      } catch {
        /* raw is not JSON: no user_data to read */
      }
    }
    const ud =
      parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).user_data as Record<string, unknown> | undefined)
        : undefined

    // Daily volumes & user_data coverage, keyed by the event's own day.
    const flags = {
      day: utcDay(row.ts),
      event_name: row.event_name ?? UNKNOWN_NAME,
      source: row.source,
      no_id: row.event_id == null ? 1 : 0,
      ud: 0, em: 0, ph: 0, extid: 0, fbp: 0, fbc: 0, cua: 0, cip: 0,
    }
    if (ud && typeof ud === 'object') {
      if (Object.keys(ud).some((k) => hasVal(ud[k]))) flags.ud = 1
      if (hasVal(ud.em)) flags.em = 1
      if (hasVal(ud.ph)) flags.ph = 1
      if (hasVal(ud.external_id)) flags.extid = 1
      if (hasVal(ud.fbp)) flags.fbp = 1
      if (hasVal(ud.fbc)) flags.fbc = 1
      if (hasVal(ud.client_user_agent)) flags.cua = 1
      if (hasVal(ud.client_ip_address)) flags.cip = 1
    }
    upsertDaily.run(flags)

    if (row.event_id == null) return

    // Dedup Ledger + per-day dedup aggregates, attributed to the day of FIRST
    // sighting of the Event ID (contracts attribution rule): late arrivals on
    // the second channel land on that same day's row as a delta.
    const existing = getLedger.get(row.event_id) as LedgerRow | undefined
    const oldC = existing ? contrib(existing) : null
    const oldKey = existing ? dedupKey(existing) : null

    const state: LedgerRow = existing
      ? { ...existing }
      : {
          event_id: row.event_id,
          first_ts: row.ts,
          last_ts: row.ts,
          day: utcDay(row.ts),
          browser_n: 0,
          server_n: 0,
          name_browser: null,
          name_server: null,
          name_coherent: null,
          ua_server: null,
        }

    if (row.source === 'browser') state.browser_n++
    else state.server_n++
    if (row.event_name != null) {
      if (row.source === 'browser' && state.name_browser == null) state.name_browser = row.event_name
      if (row.source === 'server' && state.name_server == null) state.name_server = row.event_name
    }
    if (row.source === 'server') state.ua_server = normUA(ud?.client_user_agent)
    state.last_ts = Math.max(state.last_ts, row.ts)
    if (state.browser_n > 0 && state.server_n > 0) {
      state.name_coherent =
        state.name_browser != null &&
        state.name_server != null &&
        state.name_browser !== state.name_server
          ? 0
          : 1
    }

    const newC = contrib(state)
    const newKey = oldKey != null && oldKey !== UNKNOWN_NAME ? oldKey : dedupKey(state)

    if (oldC == null) {
      addDedup.run({ day: state.day, name: newKey, ...newC })
    } else if (oldKey !== newKey) {
      // The id gained its first name: move its contributions off '(unknown)'.
      addDedup.run({ day: state.day, name: oldKey, b: -oldC.b, s: -oldC.s, both: -oldC.both, incoh: -oldC.incoh })
      dropZeroDedup.run(state.day, oldKey)
      addDedup.run({ day: state.day, name: newKey, ...newC })
    } else {
      const delta = {
        b: newC.b - oldC.b,
        s: newC.s - oldC.s,
        both: newC.both - oldC.both,
        incoh: newC.incoh - oldC.incoh,
      }
      if (delta.b || delta.s || delta.both || delta.incoh) {
        addDedup.run({ day: state.day, name: newKey, ...delta })
      }
    }

    upsertLedger.run(state)
  }

  // Processes one batch inside a single synchronous transaction; returns the
  // number of event rows consumed (0 = caught up).
  const sweepBatch = db.transaction((): number => {
    const cursor = metaNum('cursor')
    const rows = selectBatch.all(cursor, BATCH_SIZE) as EventRow[]
    let lastReqId = metaNum('last_request_id')
    let reqBrowser = metaNum('req_browser_n')
    let reqServer = metaNum('req_server_n')

    for (const row of rows) {
      // Every request stores at least one event and event ids are assigned in
      // request order, so counting request_id transitions counts requests
      // without ever touching the `requests` table.
      if (row.request_id > lastReqId) {
        lastReqId = row.request_id
        if (row.source === 'browser') reqBrowser++
        else reqServer++
      }
      try {
        sweepEvent(row)
      } catch (err) {
        // A poison row must never wedge the sweep: log and move on, the
        // cursor still advances past it.
        console.error(`[sweep] failed on event ${row.id}, skipping:`, err)
      }
    }

    if (rows.length) {
      setMeta.run('cursor', String(rows[rows.length - 1]!.id))
      setMeta.run('last_request_id', String(lastReqId))
      setMeta.run('req_browser_n', String(reqBrowser))
      setMeta.run('req_server_n', String(reqServer))
    }
    return rows.length
  })

  let sweeping = false

  async function tick(): Promise<number> {
    if (sweeping) return 0
    sweeping = true
    let processed = 0
    try {
      for (;;) {
        const n = sweepBatch()
        if (n === 0) break
        processed += n
        // Yield between batches so ingest never queues behind a backfill.
        await new Promise((resolve) => setImmediate(resolve))
      }
    } catch (err) {
      // A sweep error must never kill the process or stop future rounds.
      console.error('[sweep] error, will retry next round:', err)
    } finally {
      sweeping = false
    }
    return processed
  }

  function start(): void {
    const loop = (): void => {
      void tick().finally(() => {
        setTimeout(loop, 15_000).unref()
      })
    }
    loop()
  }

  return { tick, start }
}
