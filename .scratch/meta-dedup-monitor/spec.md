# Spec — Meta Deduplication Monitor (open-source successor of the 24Bottles collector)

Status: ready-for-agent
Date: 2026-08-26
Vocabulary: see `CONTEXT.md`. Decisions already locked: see `docs/adr/0001` (SQLite + Dedup Ledger), `docs/adr/0002` (TypeScript, same stack).

## Problem Statement

Anyone running Meta campaigns with both a browser Pixel and the Conversion API depends on Meta deduplicating the two copies of each event — and has no reliable way to verify that the preconditions for dedup (same Event ID on both channels, coherent event name) actually hold. Events Manager shows opaque aggregate numbers, and a broken dedup silently inflates or corrupts campaign data.

Tillde proved a measurement method with a one-off collector built for 24Bottles: GTM tags mirror a copy of every Meta event to a passive sink, which reports whether events are dedupable. But that tool is a throwaway: client-branded, Italian-only, no data retention (the DB grows until it becomes a cost problem, as happened on Fly.io), cumulative-only reporting with no history, single 1138-line file, no tests, and it must be torn down after each audit.

## Solution

An open-source, self-hosted **Monitor**: an always-on **Site instance** (one deployment per site/pixel) that receives mirrored events on a **Browser channel** and a **Server channel** via two provided GTM template forks, records the dedup state of every single event in a permanent **Dedup Ledger**, keeps **Raw captures** only for a short configurable window, and serves a historical report (dedup rates over time, per event name) plus threshold **Alerts** via webhook (optionally email via Resend).

Setup is "one container + one volume": Docker Compose as the canonical install, with deployment guides. MIT-licensed, in English, published by Tillde as a showcase and used internally on client projects.

## User Stories

### Install & configure

1. As a tech marketer, I want to start the Monitor with a single `docker compose up`, so that trying the tool costs me minutes, not an afternoon.
2. As a tech marketer, I want all behavior configured via environment variables (ports, tokens, retention window, alert thresholds), so that I never need to edit code to operate my instance.
3. As a tech marketer, I want an `.env.example` documenting every variable with its default, so that I can see the full configuration surface at a glance.
4. As a tech marketer, I want the ingest endpoints protected by a secret path segment and an optional ingest key, so that strangers cannot pollute my data.
5. As a tech marketer, I want the report and export endpoints protected by an admin token, so that my tracking data is not publicly readable.
6. As a tech marketer, I want the server to refuse to start in an obviously unsafe configuration (e.g. no admin token in production mode) unless I explicitly opt in, so that I don't expose data by accident.
7. As an agency partner, I want one Site instance to monitor exactly one site/pixel, so that reports are unambiguous and instances are isolated.

### GTM side

8. As a tech marketer, I want a web GTM template that mirrors each Pixel event to the Browser channel after ad_storage consent, so that browser-side data reaches the Monitor without touching real tracking.
9. As a tech marketer, I want a server GTM template that mirrors each CAPI event (byte-equivalent to what goes to Meta) to the Server channel, so that server-side data reaches the Monitor faithfully.
10. As a tech marketer, I want documentation explaining why stock Meta/Stape tags cannot point at a custom endpoint and how these forks differ, so that I understand what I'm importing into my container.
11. As a tech marketer, I want step-by-step import instructions (including reusing the same Event ID variable that feeds the real Pixel), so that my mirrored events carry the same IDs Meta sees.
12. As a tech marketer, I want the collector to never forward anything to Meta and to sit outside the tracking path, so that if the Monitor dies my real tracking is unaffected.

### Ingest & data

13. As a tech marketer, I want every mirrored request accepted fast and answered correctly per channel (1x1 GIF for browser GETs, JSON for POSTs), so that GTM tags always report success and browsers don't block responses.
14. As a tech marketer, I want events extracted from any payload shape the tags produce (CAPI batches, single objects, form-encoded, query string), so that no event is lost to format quirks.
15. As a tech marketer, I want a storage-failure fallback that still answers 200 and preserves the payload on disk, so that a DB hiccup never loses events.
16. As a data analyst, I want the Dedup Ledger to record, for every Event ID: event name, timestamps, seen-on-browser, seen-on-server, and name coherence — permanently, so that I can answer "was this specific Purchase dedupable?" months later.
17. As a data analyst, I want daily aggregates per event name and channel kept permanently, so that historical trends are queryable even though raw payloads are gone.
18. As a tech marketer, I want Raw captures automatically deleted after a configurable retention window, so that my DB stays small and my hosting bill flat forever.
19. As a tech marketer, I want sensitive headers (authorization, cookies, ingest keys) stripped before storage, so that the Monitor never hoards credentials.

### Report & history

20. As a tech marketer, I want a report showing the three dedup rates (browser, server — closest to Events Manager —, union) overall and as a time series, so that I can see when dedup health changed, not just its current state.
21. As a tech marketer, I want per-event-name breakdowns (rates, name incoherence, volumes), so that I can pinpoint which tag is misconfigured.
22. As a tech marketer, I want user_data / advanced-matching field coverage per channel, so that I can assess match quality alongside dedup.
23. As a data analyst, I want the report data available as JSON, so that I can plug it into my own dashboards.
24. As a data analyst, I want streaming CSV/NDJSON exports and a full DB snapshot download, so that I can pull data out for offline analysis without OOMing the instance.
25. As a tech marketer, I want the report to load fast regardless of history size (reading aggregates, never scanning raws), so that the Monitor stays usable at any age.

### Alerts

26. As a tech marketer, I want a configurable threshold alert (e.g. "server dedup rate below X% over the last Y hours") delivered to a webhook URL, so that I learn about breakage without remembering to check a dashboard.
27. As a tech marketer, I want optional Resend configuration to receive the same alerts by email, so that alerts reach me even without a Slack-style endpoint.
28. As a tech marketer, I want alert state to avoid re-firing continuously while a condition persists (fire on enter, notify on recover), so that my channel isn't flooded.
29. As a tech marketer, I want a way to test my alert configuration (trigger a test notification), so that I can verify wiring before trusting it.

### Operations

30. As a tech marketer, I want deployment guides for Docker Compose, Fly.io, and a bare VPS (Hetzner), so that I can run the Monitor on whatever I already use.
31. As a tech marketer, I want documented litestream replication to S3-compatible storage (R2/B2), so that my data survives the death of the machine at ~zero cost.
32. As a tech marketer, I want a health endpoint, so that my uptime monitoring can watch the Monitor itself.
33. As a tech marketer, I want graceful shutdown that flushes in-flight writes, so that restarts and deploys don't lose events.

### Open source

34. As an open-source contributor, I want a modular TypeScript codebase with behavioral tests, so that I can change one area without fear of breaking the rest.
35. As an open-source contributor, I want the repo MIT-licensed with the GTM template forks correctly attributed under Apache-2.0, so that legal reuse is unambiguous.
36. As an agency partner, I want a README in English that pitches the problem, the method, and a quickstart, so that the repo works as a technical showcase.
37. As an agency partner, I want a declared roadmap (GTM Community Gallery publication, cold raw archive, richer alerting), so that visitors see the project is alive.

## Implementation Decisions

- **Stack** (per ADR-0002): TypeScript on Node 20+, Hono for HTTP, better-sqlite3 for storage. Migration from the existing JS is a module-by-module port with review and optimization — the existing production-validated behavior is the reference, not the letter of the code.
- **Modules**: storage (schema, migrations, queries), ingest (channels, auth, payload extraction), sweep (incremental aggregation from events to Ledger/aggregates, cursor-based, non-blocking), retention (periodic purge of raw captures beyond the window), report (aggregate reads + HTML/JSON rendering), alerting (threshold evaluation on a schedule, webhook/Resend delivery, alert state), app factory composing them.
- **Single seam** (per testing decisions): `createApp(config, deps)` returns the Hono app without binding a port. `deps` injects a clock and an outbound notifier/fetch. Everything else is internal.
- **Schema** (per ADR-0001): three data classes — Dedup Ledger keyed by Event ID (permanent, ~100 bytes/event); daily aggregates keyed by (day, event name, channel) (permanent — this is new: the current aggregates are cumulative-only and cannot produce a time series); raw requests/events (retention-bound). The sweep maintains Ledger and aggregates incrementally; reports never scan raws.
- **Retention**: a periodic job deletes raw requests/events older than the configured window (default in the 14-day range). Deleted means deleted — no cold archive in v1. The Ledger and aggregates are never purged.
- **Alerting**: evaluated periodically against the daily/hourly aggregates using the injected clock; conditions are env-configured thresholds on the server dedup rate (primary) with window length; delivery via generic webhook POST (JSON payload), plus optional Resend (API key + from/to via env). Alert state machine: OK → firing (notify once) → recovered (notify once).
- **Proven behaviors carried over intact**: 1x1 GIF response to browser-channel GETs (ORB workaround), NDJSON disk fallback on DB failure, sensitive-header redaction, secret path segment + optional ingest key + admin token guard, open CORS on ingest, body size cap, WAL mode, cursor-based non-blocking sweep, streaming exports, VACUUM INTO snapshot.
- **GTM templates**: the two existing forks (web: Stape's fb-tag lineage; server: Stape's facebook-tag lineage) ship in the repo, cleaned: Apache-2.0 attribution and license files, obsolete descriptions and leftover parameters removed, Tillde branding coherent, docs on importing them and on why stock tags can't target a custom endpoint.
- **Packaging**: multi-stage Dockerfile (slim base, prebuilt better-sqlite3, no build toolchain in the final image, non-root user, target <100MB), `docker-compose.yml` with a named volume, deployment guides for Fly.io and Hetzner, litestream guide for R2/B2.
- **Language & license**: everything in English (code, report UI, docs, comments). MIT for the project; template forks remain Apache-2.0 with NOTICE.
- **New repo**: the project starts as a fresh repo on the Tillde-com GitHub org (name TBD — deferred by decision), seeded with `CONTEXT.md`, `docs/adr/`, and this spec's outcome. The current repo is archived (not deleted) once the new one is live.

## Testing Decisions

- Tests exercise **external behavior only**, through the single seam: build the app with `createApp(test config, {clock, notifier})`, drive it with in-process HTTP requests (`app.request()`), assert on responses, on subsequent report/export reads, and on notifier calls. No unit tests of internal functions; internals stay free to change.
- **Real SQLite** on a temp file per test — the storage layer is never mocked, so observed behavior is production behavior. better-sqlite3 is fast enough for this.
- **Time travel via the injected clock**: retention purges, daily aggregation boundaries, and alert windows are tested by advancing the clock, never by sleeping.
- **Outbound delivery via the injected notifier**: webhook/Resend tests assert the calls and payloads; no network.
- Test runner: vitest. There is no prior art in the codebase (zero tests today); these tests define the house style for the project.
- GTM templates are outside automated testing: a manual QA checklist in the docs covers import, event mirroring on both channels, and consent gating.

## Out of Scope

- Multi-tenant instances (one instance = one site, by decision).
- Postgres or any second storage engine (ADR-0001; the layer stays isolated but no abstraction is built).
- Cold archive of raw captures to object storage (roadmap).
- Publication to the GTM Community Template Gallery (roadmap — first post-launch move).
- Alerting beyond threshold + webhook/Resend: no UI configuration, no native Slack/Telegram integrations, no anomaly detection.
- Dashboards beyond the built-in report; BI integration happens via JSON/exports.
- Forwarding events to Meta, or any interference with real tracking.
- Migration tooling from the 24Bottles instance's data.

## Further Notes

- Cost target achieved by design: hosting $3–6/month per instance (Fly 512MB or Hetzner entry VM), backup ~$0 (R2/B2 free tiers), DB size bounded by retention + tiny permanent Ledger. Managed Postgres was rejected at $25–38/month per instance (see ADR-0001).
- Operational tasks that accompany (but are not part of) the build: pick the project name; create the new repo under Tillde-com; restart the suspended Fly app (`tillde-24bottle-collector`, stopped since 2026-07-27) once to snapshot the 24Bottles DB before destroying the volume; archive the current repo.
- The current report is cumulative-over-whole-DB; the time-series requirement is the main schema/product delta of this spec, alongside retention and alerting.
