# 04 — Sweep: Dedup Ledger, daily aggregates, `/api/stats`

**Status:** ready-for-agent
**Blocked by:** 03 (event extraction).
**Model guidance:** use a high-capability model. This is the one ticket with genuinely new design (day-keyed time series, day-attribution rule); everything else in the project reads what this writes.

Read `../contracts.md` (Schema: ledger/agg tables, attribution rule; Metrics; `/api/stats` shape) and the sweep section of `reference/legacy-server.js` first.

## What to build

The Monitor turns raw events into permanent history: a cursor-based sweep consumes `events` in batches and maintains the **Dedup Ledger** (one row per Event ID, forever) and the **daily aggregates** (volumes, user_data coverage, per-day dedup matching). `/api/stats` then answers, from aggregates only, the three dedup rates overall, per event name, and as a per-day time series.

Scope: ledger/agg/meta migrations per contracts DDL; sweep loop ported from the reference (batches of 500, one transaction per batch, cursor in `meta`, yields between batches, error-tolerant, exposed as a test-steppable `tick()`); the day-attribution rule from contracts (Event ID belongs to `ledger.day` = day of first sighting; late second-channel arrivals update that same day's dedup row); name-coherence tracking; user_data coverage counters from raw event JSON; top server-only user agents; `/api/stats` per the frozen response shape, replacing the 501 placeholder.

## Acceptance criteria

All through the seam: ingest fixtures → advance fake clock → run sweep `tick()` → assert on `GET /api/stats`.

- [ ] Same `event_id` + same name on both channels → `idsBoth` 1, `dedupable` 1, all three rates computed per the contract formulas.
- [ ] Same `event_id`, different names → `nameIncoherent` 1, `dedupable` 0.
- [ ] Browser-only and server-only ids → counted in `idsBrowser`/`idsServer`, not in `idsBoth`.
- [ ] Events with null `event_id` → counted in totals (`no_id`), excluded from id matching.
- [ ] Time series: ids ingested on day 1 (clock at D1) and day 2 → two `timeseries` entries with per-day rates; an id first seen D1 whose server copy arrives D2 → attributed to D1's row.
- [ ] Per-event-name breakdown matches per-name fixtures.
- [ ] user_data coverage: a server event carrying `em`, `ph`, `client_user_agent` increments those counters for its (day, name, source) row.
- [ ] Sweep is incremental: after a first `tick()` and stats read, ingesting more and `tick()`ing again updates counts without reprocessing (cursor advanced; `sweep.behind` reaches 0).
- [ ] Sweep survives a poison row (malformed `raw`): logs, skips or fallback-counts it, cursor still advances past it.
- [ ] `/api/stats` performs no query on `events`/`requests` (aggregates + ledger only).

## Comments
