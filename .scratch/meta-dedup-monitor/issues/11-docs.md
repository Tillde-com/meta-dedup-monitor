# 11 — Documentation: README, deployment guides, GTM guide

**Status:** ready-for-agent
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

- [ ] A clean-machine walkthrough of the README quickstart reaches a populated report using only documented commands.
- [ ] Every env var in `../contracts.md` appears in the env reference with default and effect.
- [ ] Fly guide verified against the current fly.toml knowledge (volume, no scale-to-zero); litestream guide includes a tested restore.
- [ ] GTM guide cross-links the QA checklist; Event ID rule stated prominently.
- [ ] No Italian text anywhere in the repo (grep for common Italian words as a smoke check).
- [ ] Roadmap and license sections present as specified.

## Comments
