# 07 — Exports: streaming CSV/NDJSON + DB snapshot

**Status:** done
**Blocked by:** 03 (events table populated).
**Model guidance:** suitable for a small model — direct port of the reference streaming/pagination and `VACUUM INTO` snapshot logic.

Read `../contracts.md` (HTTP surface: `/export.*`) and the export/snapshot sections of `reference/legacy-server.js` first.

## What to build

A data analyst pulls data out of the Monitor without OOMing it: `/export.csv` streams `events` (paged reads, 500 rows per page, never a full-table load), `/export.ndjson` streams `requests`, `/export.db` serves a `VACUUM INTO` snapshot built in a child process (serve cached `snapshot.db` if fresher than 10 minutes, 202 `{preparing:true}` while building, `?refresh=1` forces a rebuild). All admin-guarded. Optional gzip when the client accepts it.

## Acceptance criteria

- [x] Test: all three endpoints → 401 without admin token.
- [x] Test: `/export.csv` returns a header row + one line per `events` row, fields correctly quoted/escaped (fixture with commas, quotes, newlines in `raw`).
- [x] Test: `/export.ndjson` returns one JSON object per `requests` row, each line parseable.
- [x] Test: export of >1000 rows arrives complete (pagination works across page boundaries).
- [x] Test: `/export.db` flow — first call 202, snapshot completes, second call 200 with a valid SQLite file (openable, contains the ledger rows); `?refresh=1` regenerates.
- [x] Test: exports work while ingest continues (WAL: writer + reader concurrently, no `SQLITE_BUSY` surfaced to clients).

## Comments

- 2026-08-26: done. Snapshot child process ported as scripts/snapshot.mjs (.tmp + rename, read-only open). Snapshot freshness is tracked via the injected clock (builtAt in memory) rather than file mtime, so time travel in tests stays deterministic; a pre-existing snapshot from a previous process is treated as stale and rebuilt on first request. CSV keeps the reference column set (no raw column); quoting is proven with commas/quotes/newlines flowing from the raw payload into event_name. Gzip enabled when Accept-Encoding allows it.
