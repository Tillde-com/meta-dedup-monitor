import type { Database } from 'better-sqlite3'
import type { Config } from '../config.js'
import type { Clock } from '../app.js'

// Retention purge: deletes raw `requests`/`events` rows older than
// RAW_RETENTION_DAYS. Two hard safety rules:
//   1. never delete events the sweep has not consumed yet (id > cursor), nor
//      their parent request rows;
//   2. never touch `ledger`, `agg_*` or `meta` — history is permanent.
// Deletes run in small batches with event-loop yields, same pattern as the
// sweep, so ingest never queues behind a purge.

const BATCH_SIZE = 500
const DAY_MS = 86_400_000

export interface Retention {
  tick: () => Promise<number>
  start: () => void
}

export function createRetention(db: Database, config: Config, clock: Clock): Retention {
  const getCursor = db.prepare(`SELECT v FROM meta WHERE k = 'cursor'`)
  const deleteEventsBatch = db.prepare(
    `DELETE FROM events WHERE id IN
       (SELECT id FROM events WHERE ts < ? AND id <= ? LIMIT ?)`,
  )
  // A request row goes only when none of its events rows are left (which also
  // protects requests whose events are still unswept).
  const deleteRequestsBatch = db.prepare(
    `DELETE FROM requests WHERE id IN
       (SELECT r.id FROM requests r
        WHERE r.ts < ? AND NOT EXISTS (SELECT 1 FROM events e WHERE e.request_id = r.id)
        LIMIT ?)`,
  )

  let purging = false

  async function tick(): Promise<number> {
    if (config.rawRetentionDays <= 0 || purging) return 0
    purging = true
    let deletedEvents = 0
    try {
      const cutoff = clock() - config.rawRetentionDays * DAY_MS
      const cursorRow = getCursor.get() as { v: string } | undefined
      const cursor = cursorRow ? Number(cursorRow.v) : 0

      for (;;) {
        const n = deleteEventsBatch.run(cutoff, cursor, BATCH_SIZE).changes
        deletedEvents += n
        if (n < BATCH_SIZE) break
        await new Promise((resolve) => setImmediate(resolve))
      }
      for (;;) {
        const n = deleteRequestsBatch.run(cutoff, BATCH_SIZE).changes
        if (n < BATCH_SIZE) break
        await new Promise((resolve) => setImmediate(resolve))
      }

      // Space reclaim: the DB is opened with auto_vacuum=INCREMENTAL (set at
      // creation in storage/db.ts), so freed pages are returned to the OS
      // here without the full-table lock a VACUUM would take. On a database
      // created without auto_vacuum this is a harmless no-op.
      db.pragma('incremental_vacuum')
    } catch (err) {
      // Like the sweep: an error must never kill the process or stop later rounds.
      console.error('[retention] error, will retry next round:', err)
    } finally {
      purging = false
    }
    return deletedEvents
  }

  function start(): void {
    if (config.rawRetentionDays <= 0) return
    const loop = (): void => {
      void tick().finally(() => {
        setTimeout(loop, 60 * 60 * 1000).unref() // hourly is plenty for a daily-grain window
      })
    }
    loop()
  }

  return { tick, start }
}
