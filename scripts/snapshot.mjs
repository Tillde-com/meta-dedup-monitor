#!/usr/bin/env node
// Child process invoked by the server for /export.db: opens the DB read-only
// and runs VACUUM INTO <dest> to produce a consistent snapshot. A separate
// process on purpose: a VACUUM of a large DB can take tens of seconds and must
// never block the server's event loop (i.e. ingest).
//
// Usage: node scripts/snapshot.mjs <dbPath> <destPath>
// Exit 0 = ok, 1 = error (details on stderr).
//
// Note: while VACUUM INTO runs, the main DB's WAL may grow because the
// checkpoint is deferred — temporary disk space, acceptable.

import Database from 'better-sqlite3'
import { unlinkSync, renameSync } from 'node:fs'

const [, , dbPath, destPath] = process.argv

if (!dbPath || !destPath) {
  console.error('Usage: node scripts/snapshot.mjs <dbPath> <destPath>')
  process.exit(1)
}

// Write to a .tmp file and rename only once the VACUUM completed: <destPath>
// exists only if it is a complete snapshot (no partial files ever served, even
// if the server restarts mid-snapshot).
const tmpPath = destPath + '.tmp'

let db
try {
  db = new Database(dbPath, { readonly: true })
  try {
    unlinkSync(tmpPath)
  } catch {
    /* no previous tmp */
  }
  db.prepare('VACUUM INTO ?').run(tmpPath)
  renameSync(tmpPath, destPath)
  process.exit(0)
} catch (err) {
  console.error('[snapshot] error:', err)
  process.exit(1)
} finally {
  try {
    if (db) db.close()
  } catch {
    /* nothing to close */
  }
}
