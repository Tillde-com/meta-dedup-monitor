# 0001 — SQLite with a permanent Dedup Ledger, not managed Postgres

Date: 2026-08-26
Status: accepted

## Context

The 24Bottles pilot ran on Fly.io with SQLite and hit two pains: the DB grew to hundreds of MB and an OOM in the report path. Both traced back to the same cause: the collector kept the **raw capture of every request forever** (2–4 KB/event) and the legacy report full-scanned it. The OOM was already fixed with incremental aggregate tables; retention never existed.

Going open source, the project repositions as an always-on **monitor** with full history. The instinct was "SQLite is too small, move to Postgres". Facts gathered (Aug 2026):

- The history that matters is the **Dedup Ledger** (~100 bytes/event): millions of events/year fit in tens of MB. Raw captures are only needed for recent debugging.
- Managed Postgres free tiers can't run an always-on ingest workload (Neon autosuspends, Supabase pauses, 500MB caps); the first usable paid tiers are $25/mo (Supabase Pro) or $38/mo (Fly MPG) — 5–10× the cost of the entire current stack, per site instance.
- SQLite handles this write load (one synchronous transaction per request) without strain; total hosting stays at $3–6/mo per instance.
- Off-machine durability is solvable with continuous replication (litestream) to S3-compatible object storage; a few GB fits Cloudflare R2/Backblaze B2 free tiers.

## Decision

Keep **SQLite (better-sqlite3)** as the only supported storage engine. Restructure data as:

1. **Dedup Ledger** — permanent, per Event ID.
2. **Aggregates** — permanent, small (per day / event name).
3. **Raw captures** — automatic, configurable short retention (default in the 14-day range).

Recommend litestream → object storage for backup/durability in deployment docs. Keep the storage layer isolated enough that a second engine could be added later, but do not build the abstraction now.

## Consequences

- Setup stays "one container + one volume, zero external dependencies" — the property that makes the tool easy to try, which is the point of open-sourcing it.
- The Fly-era cost/size problem cannot recur: DB size is bounded by the retention window plus the (tiny) ledger.
- Cross-instance querying or external BI directly on the live DB is not supported; data leaves via the export endpoints or replicated snapshots. If that becomes a real need (or multi-node scaling does), revisit with Postgres — budgeting ~$25–38/mo per instance for managed offerings.
