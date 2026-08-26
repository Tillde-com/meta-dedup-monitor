# 12 — Launch: name, repo on Tillde-com, archive, Fly snapshot

**Status:** done
**Blocked by:** 11 (docs — the repo goes public complete).
**Model guidance:** human-in-the-loop ticket — GitHub org and Fly dashboard steps belong to Enrico; drive them with `/wizard` where a guided script helps. Any model can orchestrate.

## What to build

The project goes public and the 24Bottles era is closed cleanly.

1. **Name**: present a shortlist of project names (says Meta/pixel + dedup + monitoring, no client brand, npm/GitHub availability checked), Enrico picks; rename the working directory, `MONITOR_NAME` default, package name, README title, and GTM template display names accordingly.
2. **Repo**: create the public repo under the `Tillde-com` GitHub org, push (fresh history — verify `reference/` is gitignored and no secret ever committed: scan history before pushing), enable issues, add description/topics, set the license detection to MIT.
3. **24Bottles data**: restart the suspended Fly app `tillde-24bottle-collector` (machine stopped since 2026-07-27), pull the DB (`/export.db` or `fly ssh sftp`), store the snapshot with Tillde's client data, then destroy the machine and the `collector_data` volume so nothing bills.
4. **Archive**: archive (never delete) the old `Tillde-com/24-bottle-check-deduplication` repo, with a final README pointer to the new project.
5. **Migration of the tracker**: open the remaining roadmap items (Gallery publication, cold archive, richer alerting) as GitHub issues on the new repo; the local `.scratch` tracker retires with this ticket.

## Acceptance criteria

- [x] Name chosen and applied consistently (grep for the working title finds nothing).
- [x] Public repo live under Tillde-com with green CI (tests on push), MIT detected by GitHub, description + topics set.
- [x] History scan (e.g. gitleaks or manual) shows no secrets, no client identifiers.
- [x] (amended by Enrico: no snapshot needed, data retired) Fly machine and volume teardown pending explicit go.
- [x] Old repo archived with pointer README.
- [x] Roadmap issues opened on the new repo.

## Comments

- 2026-08-26: done (driven live by Enrico, no /wizard needed). Decisions and outcomes:
  - Name: Enrico confirmed the working title `meta-dedup-monitor` as the final name — no rename applied anywhere.
  - Repo: https://github.com/Tillde-com/meta-dedup-monitor — created private, secret-scanned (tracked files AND full history), flipped public on Enrico's request; description, 9 topics, issues enabled, CI (typecheck + 66 tests) green in 22s on first run.
  - 24Bottles data: Enrico decided NO migration — the pilot data is no longer needed. Fly teardown (app `tillde-24bottle-collector` + volume `collector_data`) pending his explicit go since it is irreversible.
  - Old repo: main fast-forwarded to the last work branch, bilingual archive-notice pointer prepended to the README, repo archived on GitHub.
  - Roadmap: issues #1 (Gallery), #2 (cold raw archive), #3 (richer alerting) opened on the new repo; this .scratch tracker retires with this commit (removed from the public repo, kept locally).
  - Still open from ticket 10: GTM import screenshots + QA sections 1-5 (needs a GTM container and an active collector instance).
