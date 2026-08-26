# 06 — Raw-capture retention purge

**Status:** ready-for-agent
**Blocked by:** 04 (sweep — purge must never outrun the cursor).
**Model guidance:** suitable for a small model — small, sharply specified job with time-travel tests.

Read `../contracts.md` (`RAW_RETENTION_DAYS`, schema) first.

## What to build

The DB stays small forever without operator action: a periodic retention job (test-steppable `tick()`, like the sweep) deletes `requests` and `events` rows older than `RAW_RETENTION_DAYS` (clock-based), with two hard safety rules: never delete rows the sweep has not consumed yet (`events.id > cursor` is untouchable, and their parent `requests` rows too), and never touch `ledger`, `agg_*`, or `meta`. `RAW_RETENTION_DAYS=0` disables the job. Run `PRAGMA incremental_vacuum`-friendly settings or periodic space reclaim so the file actually shrinks over time (decide based on better-sqlite3 support; document the choice in code).

## Acceptance criteria

- [ ] Test: ingest on D0, sweep `tick()`, travel to D15 (default 14-day retention), purge `tick()` → `requests`/`events` empty, `/api/stats` unchanged (ledger/aggregates intact).
- [ ] Test: rows within the window survive; rows beyond it are gone (mixed-age fixture).
- [ ] Test: unswept rows beyond the window (sweep never ticked) are NOT deleted; after sweep `tick()` + purge `tick()`, they are.
- [ ] Test: `RAW_RETENTION_DAYS=0` → purge `tick()` deletes nothing.
- [ ] Test: purge of a large batch (e.g. 5k rows) completes without blocking ingest (batched deletes, same yielding pattern as sweep).

## Comments
