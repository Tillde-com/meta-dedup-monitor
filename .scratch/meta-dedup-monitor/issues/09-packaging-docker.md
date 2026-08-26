# 09 — Packaging: multi-stage Docker, compose, graceful shutdown

**Status:** ready-for-agent
**Blocked by:** 02 (a real ingest path to smoke-test).
**Model guidance:** suitable for a small model — well-trodden Docker territory with explicit targets.

## What to build

`docker compose up` gives a working Monitor: multi-stage `Dockerfile` (build stage with toolchain for better-sqlite3 → runtime stage on `node:20-bookworm-slim` with only production artifacts, non-root user, target < 100MB — glibc base is required by better-sqlite3 prebuilds, see reference Dockerfile comments), `docker-compose.yml` with a named volume on `/data` and the env surface documented inline, `.dockerignore`. Graceful shutdown in `src/index.ts`: SIGTERM/SIGINT → stop accepting, let in-flight requests finish, run a final sweep flush, close the DB cleanly (WAL checkpoint), exit 0 — deploys must not lose events. The production safety rule (ticket 01) must trip when composing with defaults minus `ADMIN_TOKEN`, and the compose file must show the safe configuration.

## Acceptance criteria

- [ ] `docker build` succeeds; final image < 100MB (`docker images` evidence in PR); `whoami` in container is non-root; no `python3`/`make`/`g++` in the final image.
- [ ] `docker compose up` + POST fixture to the browser channel + `GET /api/stats` (with token) round-trips on a clean machine.
- [ ] Data survives `docker compose down` + `up` (volume persistence).
- [ ] Test (non-Docker): SIGTERM handling — server closes listeners, checkpoints WAL, exits 0 with no rows lost for requests answered before the signal.
- [ ] Compose file sets `ADMIN_TOKEN` via env and boots; removing it makes the container exit with the safety error.

## Comments
