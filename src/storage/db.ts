import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

// Ordered migrations, applied once each and recorded in schema_migrations by
// their 1-based position. Later tickets append entries; never edit or reorder
// an entry that has shipped.
const MIGRATIONS: string[] = [
  `CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT);`,
  `CREATE TABLE requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL, source TEXT NOT NULL CHECK (source IN ('browser','server')),
    method TEXT NOT NULL, path TEXT NOT NULL,
    ip TEXT, ua TEXT, content_type TEXT, query TEXT, headers TEXT, body TEXT);`,
]

export function openDb(dataDir: string): Database.Database {
  mkdirSync(dataDir, { recursive: true })
  const db = new Database(path.join(dataDir, 'events.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')
  migrate(db)
  return db
}

export function migrate(db: Database.Database): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY);')
  const applied = new Set(
    (db.prepare('SELECT id FROM schema_migrations').all() as Array<{ id: number }>).map(
      (row) => row.id,
    ),
  )
  const record = db.prepare('INSERT INTO schema_migrations (id) VALUES (?)')
  const run = db.transaction(() => {
    MIGRATIONS.forEach((sql, index) => {
      const id = index + 1
      if (applied.has(id)) return
      db.exec(sql)
      record.run(id)
    })
  })
  run()
}
