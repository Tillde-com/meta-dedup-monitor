# 10 — GTM templates: cleanup, attribution, QA checklist

**Status:** ready-for-agent
**Blocked by:** None — can start immediately (ingest path contract is frozen in `../contracts.md`).
**Model guidance:** suitable for a small model, but it MUST limit itself to the changes listed — GTM sandboxed-JS templates break silently; no refactoring of working tag logic.

Source material: `gtm-tag/` in the old repo — `Tillde Facebook Check.tpl` (web, fork of Stape's fb-tag lineage), `Tillde Facebook Check (server).tpl` (fork of Stape's facebook-tag lineage), `MODIFICATIONS*.md` (line-mapped change specs), `reference/` (pristine Stape originals). Stape licenses templates under Apache-2.0 (verified on the stape-io GitHub org).

## What to build

The two template forks become shippable open-source artifacts in the new repo under `gtm-templates/`: correct Apache-2.0 attribution (per-template `LICENSE` + `NOTICE` naming Stape as origin, per Apache-2.0 §4), English-only INFO blocks with the **obsolete REV1 description removed** from the web template (it still describes removed mirror/check-only modes), leftover unused parameters and permissions pruned where safely removable (e.g. residual `fbq` string in web permissions — verify against `MODIFICATIONS.md` before touching), neutral naming (no "Tillde Check" client-era branding — align names with the project working title), and a `QA-CHECKLIST.md` covering manual verification: import both templates, wire `collectorUrl` (browser: `<base>/browser`; server: `<base>/server` + `X-Collector-Key`), fire each mirrored event type, confirm rows on both channels, confirm consent gating (web tag sends only after `ad_storage` granted), confirm the real Meta tags are untouched.

The tag *logic* does not change: this is packaging, attribution, and copy.

## Acceptance criteria

- [ ] Both `.tpl` files import cleanly into a GTM web/server container (manual, screenshot).
- [ ] `NOTICE`/`LICENSE` files present; INFO blocks in English, no obsolete mode description, no client branding.
- [ ] Diff against the current forks shows no changes to `sendToCollector`/`mapEvent` logic paths.
- [ ] `QA-CHECKLIST.md` executed once end-to-end against a local Monitor instance (or the ticket-09 compose stack), all boxes ticked.
- [ ] The removed-parameter pruning is cross-checked against `MODIFICATIONS.md`/`MODIFICATIONS-server.md` (no load-bearing permission removed).

## Comments
