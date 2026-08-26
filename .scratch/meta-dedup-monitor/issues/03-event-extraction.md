# 03 — Event extraction from every payload shape

**Status:** done
**Blocked by:** 02 (ingest channels).
**Model guidance:** suitable for a small model — table-driven port of `extractEvents()`/`deepFind` from `reference/legacy-server.js`; the fixture table is the safety net. Do not invent new heuristics: port the reference behavior, optimizing implementation only.

Read `../contracts.md` (Event extraction section, `events` DDL) first.

## What to build

Every ingested request fans out into `events` rows in the same transaction, one per Meta event it carries, with the dedup-relevant fields (`event_name`, `event_id`, `fbp`, `fbc`, `event_time`, `external_id`) extracted via the alias deep-search — whatever shape the GTM tags produce.

Scope: `events` table migration; extraction of the six payload forms in contract order (CAPI `{data:[...]}` batch, JSON array, single object, form-urlencoded, query string, fallback row); recursive alias search; `raw` column holding the per-event JSON (or raw body for the fallback). Extend export of extraction as pure functions so tests can also drive them directly through HTTP fixtures.

## Acceptance criteria

Fixture-driven tests through the seam (POST/GET each fixture, then read `events` rows via a direct DB open in the test — reads in tests are acceptable, writes are not):

- [x] CAPI batch `{data:[{event_name:"Purchase",event_id:"e1",...},{event_name:"Lead",event_id:"e2"}]}` → 2 rows, correct names/ids.
- [x] Single object with alias keys (`eventName`, `eventID`) → 1 row with normalized fields.
- [x] JSON array of 3 events → 3 rows.
- [x] Form-urlencoded body `ev=PageView&eid=e9&_fbp=fb.1.x` → 1 row: `event_name='PageView'`, `event_id='e9'`, `fbp='fb.1.x'`.
- [x] Browser GET with query `?event_name=AddToCart&event_id=e5&fbc=fb.1.y&d=<json>` → 1 row, `fbc` captured.
- [x] Nested fields (e.g. `{event:{eventId:"deep1"}}`-style nesting as in reference fixtures) found by deep search.
- [x] Unparseable body (`content-type: text/plain`, body `garbage`) → exactly 1 fallback row, null `event_id`, raw preserved.
- [x] `external_id` and `event_time` extracted when present (CAPI-style payload).
- [x] All rows carry the `request_id` of their `requests` row and `source` of the channel.

## Comments

- 2026-08-26: done. extractEvents/deepFind ported as pure functions in src/ingest/extract.ts; wired into the collect transaction. One deviation from legacy: event_time is coerced to a finite number (the events DDL declares it INTEGER); non-numeric values become NULL.
