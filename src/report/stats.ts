import type { Database } from 'better-sqlite3'

// /api/stats reads aggregates, ledger and meta only — never the raw
// `events`/`requests` tables (those are retention-bound and can be huge).

export interface Rates {
  browser: number
  server: number
  union: number
}

function rates(idsBrowser: number, idsServer: number, idsBoth: number): Rates {
  const union = idsBrowser + idsServer - idsBoth
  return {
    browser: idsBrowser > 0 ? idsBoth / idsBrowser : 0,
    server: idsServer > 0 ? idsBoth / idsServer : 0,
    union: union > 0 ? idsBoth / union : 0,
  }
}

export interface DedupBreakdown {
  idsBrowser: number
  idsServer: number
  idsBoth: number
  nameIncoherent: number
  rates: Rates
}

export interface UserDataRow {
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
}

export interface StatsResponse {
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
  byEventName: Array<DedupBreakdown & { name: string }>
  timeseries: Array<DedupBreakdown & { day: string }>
  userData: UserDataRow[]
  serverOnlyUserAgents: Array<{ ua: string; count: number }>
  sweep: { cursor: number; maxId: number; behind: number }
}

interface DedupSums {
  ids_browser: number | null
  ids_server: number | null
  ids_both: number | null
  name_incoherent: number | null
}

export function getStats(db: Database): StatsResponse {
  const metaNum = (k: string): number => {
    const row = db.prepare('SELECT v FROM meta WHERE k = ?').get(k) as { v: string } | undefined
    return row ? Number(row.v) : 0
  }

  const eventTotals = db
    .prepare('SELECT source, SUM(total) AS n FROM agg_daily GROUP BY source')
    .all() as Array<{ source: string; n: number }>
  const eventsBySource = Object.fromEntries(eventTotals.map((r) => [r.source, r.n]))

  const t = db
    .prepare(
      `SELECT SUM(ids_browser) AS ids_browser, SUM(ids_server) AS ids_server,
              SUM(ids_both) AS ids_both, SUM(name_incoherent) AS name_incoherent
       FROM agg_daily_dedup`,
    )
    .get() as DedupSums
  const idsBrowser = t.ids_browser ?? 0
  const idsServer = t.ids_server ?? 0
  const idsBoth = t.ids_both ?? 0
  const nameIncoherent = t.name_incoherent ?? 0

  const byEventName = (
    db
      .prepare(
        `SELECT event_name, SUM(ids_browser) AS ids_browser, SUM(ids_server) AS ids_server,
                SUM(ids_both) AS ids_both, SUM(name_incoherent) AS name_incoherent
         FROM agg_daily_dedup GROUP BY event_name
         ORDER BY SUM(ids_browser) + SUM(ids_server) DESC, event_name`,
      )
      .all() as Array<DedupSums & { event_name: string }>
  ).map((r) => ({
    name: r.event_name,
    idsBrowser: r.ids_browser ?? 0,
    idsServer: r.ids_server ?? 0,
    idsBoth: r.ids_both ?? 0,
    nameIncoherent: r.name_incoherent ?? 0,
    rates: rates(r.ids_browser ?? 0, r.ids_server ?? 0, r.ids_both ?? 0),
  }))

  const timeseries = (
    db
      .prepare(
        `SELECT day, SUM(ids_browser) AS ids_browser, SUM(ids_server) AS ids_server,
                SUM(ids_both) AS ids_both, SUM(name_incoherent) AS name_incoherent
         FROM agg_daily_dedup GROUP BY day ORDER BY day`,
      )
      .all() as Array<DedupSums & { day: string }>
  ).map((r) => ({
    day: r.day,
    idsBrowser: r.ids_browser ?? 0,
    idsServer: r.ids_server ?? 0,
    idsBoth: r.ids_both ?? 0,
    nameIncoherent: r.name_incoherent ?? 0,
    rates: rates(r.ids_browser ?? 0, r.ids_server ?? 0, r.ids_both ?? 0),
  }))

  const userData = (
    db
      .prepare(
        `SELECT event_name, source, SUM(total) AS total, SUM(ud) AS ud, SUM(em) AS em,
                SUM(ph) AS ph, SUM(extid) AS extid, SUM(fbp) AS fbp, SUM(fbc) AS fbc,
                SUM(cua) AS cua, SUM(cip) AS cip
         FROM agg_daily GROUP BY event_name, source
         ORDER BY total DESC, event_name, source`,
      )
      .all() as Array<UserDataRow & { event_name: string }>
  ).map(({ event_name, ...rest }) => ({ ...rest, eventName: event_name }))

  const serverOnlyUserAgents = db
    .prepare(
      `SELECT ua_server AS ua, COUNT(*) AS count FROM ledger
       WHERE browser_n = 0 AND server_n > 0
       GROUP BY ua_server ORDER BY count DESC LIMIT 10`,
    )
    .all() as Array<{ ua: string; count: number }>

  const cursor = metaNum('cursor')
  // Last assigned events id from sqlite's autoincrement bookkeeping, so the
  // lag indicator needs no scan of the raw table (and survives purges).
  const seqRow = db
    .prepare(`SELECT seq FROM sqlite_sequence WHERE name = 'events'`)
    .get() as { seq: number } | undefined
  const maxId = seqRow?.seq ?? 0

  return {
    totals: {
      requests: { browser: metaNum('req_browser_n'), server: metaNum('req_server_n') },
      events: { browser: eventsBySource['browser'] ?? 0, server: eventsBySource['server'] ?? 0 },
      idsBrowser,
      idsServer,
      idsBoth,
      nameIncoherent,
      dedupable: idsBoth - nameIncoherent,
      rates: rates(idsBrowser, idsServer, idsBoth),
    },
    byEventName,
    timeseries,
    userData,
    serverOnlyUserAgents,
    sweep: { cursor, maxId, behind: Math.max(0, maxId - cursor) },
  }
}
