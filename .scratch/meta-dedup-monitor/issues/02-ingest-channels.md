# 02 — Ingest channels: browser + server, auth, raw storage

**Status:** ready-for-agent
**Blocked by:** 01 (skeleton/seam).
**Model guidance:** suitable for a small model — port work with the reference implementation at hand and fully specified contracts.

Read `../contracts.md` (HTTP surface, schema, safety) and `reference/legacy-server.js` (the `collect()` path) first.

## What to build

A GTM tag can mirror events to the Monitor on both channels and always gets a fast, correct answer, while every request lands in the `requests` table — even when the DB is broken. No event interpretation yet (that's ticket 03): store the raw request only.

Scope, per contracts: base-path resolution from `COLLECT_PATH_SECRET`; browser and server routes (all methods + subpaths); `X-Collector-Key` check on the server channel; OPTIONS/CORS; 1x1 GIF response to GETs vs JSON to POSTs; `MAX_BODY_BYTES` → 413; sensitive-header stripping; client IP precedence; `requests` table (via the migration helper); NDJSON fallback file on DB write failure with a still-200 response.

## Acceptance criteria

- [ ] Test: POST JSON to `/c/<secret>/browser` → 200 `{ok:true}`; one `requests` row with `source='browser'`, stored `ts` from fake clock, body persisted.
- [ ] Test: GET `/c/<secret>/browser?event_name=Purchase` → 200, `content-type: image/gif`, body is the 43-byte transparent GIF; row stored with query string.
- [ ] Test: with `INGEST_KEY` set, POST to server channel without `X-Collector-Key` → 401 and NO row; with correct header → 200 and row with `source='server'`.
- [ ] Test: with `COLLECT_PATH_SECRET=abc`, requests to `/c/browser` → 404; to `/c/abc/browser` → 200.
- [ ] Test: OPTIONS `/c/abc/browser` → 204 with `Access-Control-Allow-Origin: *`.
- [ ] Test: body larger than `MAX_BODY_BYTES` → 413, no row.
- [ ] Test: stored `headers` JSON contains no `authorization`, `cookie`, or `x-collector-key` keys (send all three, mixed case).
- [ ] Test: `ip` column honors precedence `fly-client-ip` > first of `x-forwarded-for` > `x-real-ip`.
- [ ] Test: with the DB handle forcibly closed, POST → still 200 and the payload appears as a line in `fallback.ndjson`.

## Comments
