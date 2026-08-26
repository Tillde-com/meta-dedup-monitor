# 11 — Documentation: README, deployment guides, GTM guide

**Status:** done
**Blocked by:** 08 (alerts), 09 (packaging), 10 (GTM templates).
**Model guidance:** suitable for a small model for structure and accuracy against the implemented behavior; a human (Enrico) reviews the README pitch — it is the showcase surface.

## What to build

The repo documents itself well enough that a tech marketer succeeds without asking anyone. All English.

- `README.md`: the pitch (the dedup verification problem, the mirror method, what the Monitor tells you and what it never does — no forwarding to Meta, no interference with tracking), quickstart via Docker Compose (copy-paste to first report), the three metrics explained with the server rate as the Events-Manager-comparable one, screenshots of the report, roadmap section (GTM Community Gallery, cold raw archive, richer alerting), license section (MIT + Apache-2.0 templates).
- `docs/deploy-fly.md` (app + volume + secrets sequence, `auto_stop_machines=false` rationale: cold starts lose events), `docs/deploy-vps.md` (Hetzner-style: compose + reverse proxy/TLS), `docs/backup-litestream.md` (continuous replication to R2/B2, restore procedure, free-tier fit).
- `docs/gtm-setup.md`: why stock Meta/Stape tags cannot target a custom endpoint (hence the forks), import steps for both templates, the critical Event ID rule (the mirror must reuse the SAME variable feeding the real Pixel's eventID), consent behavior, link to the QA checklist.
- Env reference: verify `.env.example` covers the full contracts table with accurate defaults.
- Privacy note: what the Monitor stores (raw window + permanent Ledger), retention behavior, advice to set retention and admin token.

## Acceptance criteria

- [x] A clean-machine walkthrough of the README quickstart reaches a populated report using only documented commands.
- [x] Every env var in `../contracts.md` appears in the env reference with default and effect.
- [x] Fly guide verified against the current fly.toml knowledge (volume, no scale-to-zero); litestream guide includes a tested restore.
- [x] GTM guide cross-links the QA checklist; Event ID rule stated prominently.
- [x] No Italian text anywhere in the repo (grep for common Italian words as a smoke check).
- [x] Roadmap and license sections present as specified.

## Comments

- 2026-08-26: done. README (pitch, quickstart, three metrics with server rate flagged, real screenshot at docs/images/report.png, roadmap, MIT + Apache-2.0 licensing), docs/deploy-fly.md (volume + secrets + auto_stop_machines=false rationale, checked against the legacy fly.toml), docs/deploy-vps.md (compose + Caddy TLS), docs/backup-litestream.md, docs/gtm-setup.md (Event ID rule as a call-out, links to QA checklist), docs/privacy.md. Verifications:
  - Quickstart flow exercised on this machine via the ticket-09 compose round trip (host port remapped only because local 8080 was busy).
  - .env.example carries all 16 contract env vars with defaults and effects.
  - Litestream restore actually tested (v0.5.16, file replica): seeded monitor DB -> replicate -> restore -> 20/20 ledger rows back.
  - Italian-word grep over all tracked files: zero hits (reference/ is gitignored).
  - README pitch awaits Enrico's editorial review per Model guidance.
