# 0002 — TypeScript on the existing Node stack, not a Go rewrite

Date: 2026-08-26
Status: accepted

## Context

Going open source, the stack was re-examined: keep Node 20 + Hono + better-sqlite3 (currently plain JS, one 1138-line file), or rewrite in Go for single-binary distribution and a smaller footprint.

Go's real advantages here: static binary, ~15MB Docker image, no native-module build toolchain, lower RAM. TypeScript's advantages for this specific project: the JS code is production-validated (120k+ real events, with edge cases already paid for — ORB workaround, sendBeacon limits, NDJSON fallback, incremental sweep); the core problem is dynamic JSON wrangling (`deepFind` over arbitrary payload shapes), which Go handles verbosely; the audience and maintainers are the GTM/martech world, i.e. JavaScript people; and distribution is via Docker anyway, which neutralizes the single-binary argument.

## Decision

**TypeScript**, same runtime stack (Node + Hono + better-sqlite3). The single file is restructured into modules (storage, ingest, report, alerting). The migration is NOT a blind port: each module gets reviewed and optimized as it is converted — the original code was written in a day for a throwaway test.

Docker image kept lean with a multi-stage build (slim base, prebuilt better-sqlite3 binaries), targeting <100MB.

## Consequences

- Incremental migration with working code as the reference; no re-validation of already-solved edge cases from scratch.
- Contributor barrier stays low for the project's actual audience.
- We give up the single static binary; acceptable because Docker is the supported install path.
- A build step is introduced (tsc/tsx); CI must build before deploy.
