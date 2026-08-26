# 12 — Launch: name, repo on Tillde-com, archive, Fly snapshot

**Status:** ready-for-agent
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

- [ ] Name chosen and applied consistently (grep for the working title finds nothing).
- [ ] Public repo live under Tillde-com with green CI (tests on push), MIT detected by GitHub, description + topics set.
- [ ] History scan (e.g. gitleaks or manual) shows no secrets, no client identifiers.
- [ ] 24Bottles DB snapshot stored safely; Fly machine and volume destroyed; `fly apps list` shows no billable resources for the old collector.
- [ ] Old repo archived with pointer README.
- [ ] Roadmap issues opened on the new repo.

## Comments
