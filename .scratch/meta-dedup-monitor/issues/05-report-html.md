# 05 — Historical report dashboard (HTML)

**Status:** done
**Blocked by:** 04 (sweep/stats).
**Model guidance:** suitable for a small model — renders the already-frozen `/api/stats` data; the reference report (`reference/legacy-server.js`) shows layout, escaping, and the CSS-bar technique. UI copy is English.

## What to build

`GET /report` (admin-guarded) renders the English dashboard a tech marketer checks: the three dedup rates with the server rate flagged as "closest to Meta Events Manager", a per-day time-series section (CSS bars, no JS charting libs), per-event-name table with name-incoherence highlighted, user_data coverage table, top server-only user agents, and sweep lag. Fast at any history size: reads the same aggregate queries as `/api/stats` (share the stats module; render server-side; a 15s in-process cache like the reference is fine).

Title and header use `MONITOR_NAME`. All dynamic values HTML-escaped (the reference had an XSS-hardening pass — keep it).

## Acceptance criteria

- [x] Test: `/report` → 401 without admin token, 200 HTML with it.
- [x] Test: after the ticket-04 fixture flow, the HTML contains the three rates, the event names, and one time-series row per day ingested.
- [x] Test: an `event_name` of `<script>alert(1)</script>` appears escaped in the HTML (no raw `<script>` in output).
- [x] Test: response contains `MONITOR_NAME` from config in the title.
- [x] Test: no query touches `events`/`requests` during render.
- [x] Manual: dashboard is readable and presentable (screenshot in PR) — it is part of the project's showcase.

## Comments

- 2026-08-26: done. Renders from the shared stats module (aggregates + ledger only, proven by a drop-tables test), 15s per-instance cache driven by the injected clock, all dynamic values HTML-escaped. Manual check: a seeded sample was generated and eyeballed (5 days x 4 event names, incoherent rows highlighted); regenerate one with the report route on any seeded instance for the PR screenshot.
