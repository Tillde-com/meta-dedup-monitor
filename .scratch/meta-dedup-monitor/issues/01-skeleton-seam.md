# 01 — Project skeleton, `createApp` seam, health endpoint

**Status:** done
**Blocked by:** None — can start immediately.
**Model guidance:** use a high-capability model. This ticket fixes the seam every other ticket builds on; errors here are paid eleven times.

Read `../contracts.md`, `CONTEXT.md`, `docs/adr/0001`, `docs/adr/0002` first.

## What to build

A fresh TypeScript project (working directory: `~/Developer/meta-dedup-monitor` — working title, renamed at launch) where a developer can run `npm test` and see green behavioral tests against a real HTTP app, and `npm start` to get a listening server with a health endpoint. This is the foundation slice: the single seam, the test harness, and the config surface — no product features yet beyond health.

Setup steps included in this ticket:
- Scaffold: `package.json` (ESM, Node >= 20), `tsconfig.json` strict, vitest, Hono, better-sqlite3, `@hono/node-server`.
- Copy from the old repo into the new project: `CONTEXT.md`, `docs/adr/`, `AGENTS.md`, `docs/agents/`, `.scratch/meta-dedup-monitor/` (tracker travels with the code), and the old `server.js` as `reference/legacy-server.js` (add `reference/` to `.gitignore` — it never ships).
- `git init` + first commit. MIT `LICENSE` file.
- Module layout: `src/index.ts` (env → config → serve; the only file reading `process.env`), `src/app.ts` (`createApp(config, deps)`), `src/config.ts` (types + env parsing + safety rule), empty module dirs per contracts (storage, ingest, sweep, report, alerts, retention).
- `createApp(config, deps)` per contracts: opens the SQLite DB in `config.dataDir` with the WAL pragmas, applies schema migrations (only `meta` table needed now; each later ticket adds its tables via the same migration mechanism — build a minimal ordered-migrations helper), wires `deps.clock`/`deps.notifier` defaults.
- Health endpoint and admin-guard middleware helper per contracts (guard used by later tickets; prove it works on a placeholder `/api/stats` returning 501).
- Production safety rule per contracts (refuse to start; test via config parsing, not by spawning processes).
- `.env.example` with the full variable table from contracts, all documented.

## Acceptance criteria

- [x] `npm test` green; `npx tsc --noEmit` clean.
- [x] Test: `GET /` → 200 `{ok:true, service:"meta-dedup-monitor", now:<iso>}`, with `now` derived from an injected fake clock.
- [x] Test: with `adminToken: "s3cret"`, `GET /api/stats` → 401 without token; 501 with `?token=s3cret`, with `X-Admin-Token: s3cret`, and with `Authorization: Bearer s3cret` (three variants).
- [x] Test: with empty adminToken, `GET /api/stats` → 501 (guard disabled).
- [x] Test: config parsing throws when `NODE_ENV=production`, `ADMIN_TOKEN` empty, `ALLOW_INSECURE` unset; does not throw with `ALLOW_INSECURE=1`.
- [x] Two `createApp` instances on different temp dirs are fully isolated (parallel tests don't interfere).
- [x] `npm start` boots a real server (manual check).

## Comments

- 2026-08-26: implemented in ~/Developer/meta-dedup-monitor. 13 behavioral tests green, tsc clean, `npm start` boot verified manually (health responds). Migrations helper: ordered list in src/storage/db.ts recorded in schema_migrations by 1-based position.
