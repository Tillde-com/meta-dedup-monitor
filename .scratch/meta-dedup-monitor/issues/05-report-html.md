# 05 — Historical report dashboard (HTML)

**Status:** ready-for-agent
**Blocked by:** 04 (sweep/stats).
**Model guidance:** suitable for a small model — renders the already-frozen `/api/stats` data; the reference report (`reference/legacy-server.js`) shows layout, escaping, and the CSS-bar technique. UI copy is English.

## What to build

`GET /report` (admin-guarded) renders the English dashboard a tech marketer checks: the three dedup rates with the server rate flagged as "closest to Meta Events Manager", a per-day time-series section (CSS bars, no JS charting libs), per-event-name table with name-incoherence highlighted, user_data coverage table, top server-only user agents, and sweep lag. Fast at any history size: reads the same aggregate queries as `/api/stats` (share the stats module; render server-side; a 15s in-process cache like the reference is fine).

Title and header use `MONITOR_NAME`. All dynamic values HTML-escaped (the reference had an XSS-hardening pass — keep it).

## Acceptance criteria

- [ ] Test: `/report` → 401 without admin token, 200 HTML with it.
- [ ] Test: after the ticket-04 fixture flow, the HTML contains the three rates, the event names, and one time-series row per day ingested.
- [ ] Test: an `event_name` of `<script>alert(1)</script>` appears escaped in the HTML (no raw `<script>` in output).
- [ ] Test: response contains `MONITOR_NAME` from config in the title.
- [ ] Test: no query touches `events`/`requests` during render.
- [ ] Manual: dashboard is readable and presentable (screenshot in PR) — it is part of the project's showcase.

## Comments
