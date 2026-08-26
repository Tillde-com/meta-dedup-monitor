# Frozen contracts — Meta Deduplication Monitor

Read this before working any ticket. These decisions are FINAL for v1: do not redesign them, do not rename them. If a ticket seems to conflict with this file, this file wins; flag the conflict in the ticket's Comments.

Vocabulary: `CONTEXT.md`. Architecture decisions: `docs/adr/0001`, `docs/adr/0002`. Product scope: `spec.md` (same directory).

## Runtime & project

- TypeScript, Node >= 20, ESM. HTTP: Hono. DB: better-sqlite3. Tests: vitest.
- The app is built by the single seam `createApp(config, deps)` → returns a Hono app, never binds a port itself. `src/index.ts` is the only place that reads `process.env`, builds `config`, and calls `serve()`.
- `deps` (all injectable, with production defaults):
  - `clock: () => number` — epoch ms. ALL timestamps, day-bucketing, retention and alert windows go through it. Never call `Date.now()` outside the default clock.
  - `notifier: (n: Notification) => Promise<void>` — outbound alert delivery (see Alerts).
- Timers (sweep loop, retention loop, alert loop) must be startable/steppable from tests: expose a `tick()`-style entry per loop on the app context so tests advance work deterministically without real timers.

## Environment variables (complete v1 surface)

| Var | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | listen port (index.ts only) |
| `DATA_DIR` | `./data` | dir for `events.db`, `fallback.ndjson`, `snapshot.db` |
| `MONITOR_NAME` | `meta-dedup-monitor` | instance label used in report title and alert payloads |
| `COLLECT_PATH_SECRET` | empty | if set, ingest base is `/c/<secret>`, else `/c` |
| `INGEST_KEY` | empty | if set, server channel requires header `X-Collector-Key` |
| `ADMIN_TOKEN` | empty | guards /report, /api/*, /export.*; empty = open (see safety) |
| `MAX_BODY_BYTES` | `1000000` | larger bodies → 413 |
| `RAW_RETENTION_DAYS` | `14` | purge raw `requests`/`events` older than this; `0` disables purge |
| `ALERT_THRESHOLD` | empty | e.g. `0.8`; empty = alerting disabled |
| `ALERT_WINDOW_HOURS` | `24` | evaluation window |
| `ALERT_CHECK_MINUTES` | `15` | evaluation cadence |
| `ALERT_WEBHOOK_URL` | empty | webhook target |
| `RESEND_API_KEY`, `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO` | empty | optional email delivery via Resend |
| `ALLOW_INSECURE` | empty | `1` allows production start with empty ADMIN_TOKEN |

Safety rule: when `NODE_ENV=production` and `ADMIN_TOKEN` is empty and `ALLOW_INSECURE` is not `1`, the process refuses to start with a clear error.

## HTTP surface (complete v1)

`base` = `/c/<COLLECT_PATH_SECRET>` or `/c`.

| Method | Path | Auth | Behavior |
|---|---|---|---|
| ALL | `${base}/browser`, `${base}/browser/*` | none (secret path only) | Browser channel ingest. GET → 200 1x1 transparent GIF (`image/gif`); POST → `{ok:true}` |
| ALL | `${base}/server`, `${base}/server/*` | `X-Collector-Key` if `INGEST_KEY` set (else 401 `{ok:false}`) | Server channel ingest, same response rules |
| OPTIONS | `/c/*` | none | 204, CORS headers |
| GET | `/` | none | `{ok:true, service:<MONITOR_NAME>, now:<iso>}` |
| GET | `/api/stats` | admin | stats JSON (shape below) |
| GET | `/report` | admin | HTML dashboard (English), reads aggregates only |
| GET | `/export.csv` | admin | streaming CSV of `events` |
| GET | `/export.ndjson` | admin | streaming NDJSON of `requests` |
| GET | `/export.db` | admin | `VACUUM INTO` snapshot (cached 10 min; 202 `{preparing:true}` while building; `?refresh=1` forces) |
| POST | `/api/alerts/test` | admin | sends a `alert.test` notification through the configured channels |

Admin guard accepts: `?token=`, header `X-Admin-Token`, or `Authorization: Bearer <token>`. Empty `ADMIN_TOKEN` = guard disabled.
CORS on `/c/*`: `Access-Control-Allow-Origin: *`. Ingest always answers 200 fast; on DB failure append the payload to `fallback.ndjson` and still answer 200.
Client IP precedence: `fly-client-ip`, `x-forwarded-for` (first), `x-real-ip`. Headers stored after deleting `authorization`, `cookie`, `x-collector-key` (case-insensitive).

## Schema (SQLite, WAL, `synchronous=NORMAL`, `busy_timeout=5000`)

Raw (retention-bound):

```sql
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL, source TEXT NOT NULL CHECK (source IN ('browser','server')),
  method TEXT NOT NULL, path TEXT NOT NULL,
  ip TEXT, ua TEXT, content_type TEXT, query TEXT, headers TEXT, body TEXT);
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL, ts INTEGER NOT NULL, source TEXT NOT NULL,
  event_name TEXT, event_id TEXT, fbp TEXT, fbc TEXT,
  event_time INTEGER, external_id TEXT, raw TEXT);
CREATE INDEX idx_events_event_id ON events(event_id);
CREATE INDEX idx_events_ts ON events(ts);
```

Permanent (never purged):

```sql
CREATE TABLE ledger (               -- the Dedup Ledger: one row per Event ID
  event_id TEXT PRIMARY KEY,
  first_ts INTEGER NOT NULL, last_ts INTEGER NOT NULL,
  day TEXT NOT NULL,                -- UTC YYYY-MM-DD of FIRST sighting
  browser_n INTEGER NOT NULL DEFAULT 0, server_n INTEGER NOT NULL DEFAULT 0,
  name_browser TEXT, name_server TEXT,
  name_coherent INTEGER,            -- NULL until seen on both channels, then 1/0
  ua_server TEXT);
CREATE INDEX idx_ledger_last_ts ON ledger(last_ts);
CREATE INDEX idx_ledger_day ON ledger(day);

CREATE TABLE agg_daily (            -- per-channel volumes & user_data coverage
  day TEXT NOT NULL, event_name TEXT NOT NULL, source TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0, no_id INTEGER NOT NULL DEFAULT 0,
  ud INTEGER NOT NULL DEFAULT 0, em INTEGER NOT NULL DEFAULT 0,
  ph INTEGER NOT NULL DEFAULT 0, extid INTEGER NOT NULL DEFAULT 0,
  fbp INTEGER NOT NULL DEFAULT 0, fbc INTEGER NOT NULL DEFAULT 0,
  cua INTEGER NOT NULL DEFAULT 0, cip INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event_name, source));

CREATE TABLE agg_daily_dedup (      -- per-day dedup matching
  day TEXT NOT NULL, event_name TEXT NOT NULL,
  ids_browser INTEGER NOT NULL DEFAULT 0, ids_server INTEGER NOT NULL DEFAULT 0,
  ids_both INTEGER NOT NULL DEFAULT 0, name_incoherent INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event_name));

CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT);  -- 'cursor', 'alert_state', 'alert_since'
```

Attribution rule for `agg_daily_dedup`: an Event ID belongs to `ledger.day` (day of first sighting). When the second channel arrives later, increment `ids_both` (and possibly `name_incoherent`) on that SAME day row, and use `name_browser`/`name_server` from the ledger. `event_name` for the dedup row = first non-null name seen.

## Metrics (from CONTEXT.md)

- Browser dedup rate = ids_both / ids_browser
- Server dedup rate = ids_both / ids_server (primary; closest to Events Manager)
- Union dedup rate = ids_both / (ids_browser + ids_server − ids_both)
- Dedupable = ids_both − name_incoherent

## `/api/stats` response shape

```jsonc
{
  "totals": { "requests": {"browser":0,"server":0}, "events": {"browser":0,"server":0},
    "idsBrowser":0, "idsServer":0, "idsBoth":0, "nameIncoherent":0, "dedupable":0,
    "rates": {"browser":0.0,"server":0.0,"union":0.0} },
  "byEventName": [ { "name":"Purchase", "idsBrowser":0,"idsServer":0,"idsBoth":0,
    "nameIncoherent":0, "rates":{"browser":0.0,"server":0.0,"union":0.0} } ],
  "timeseries": [ { "day":"2026-08-01", "idsBrowser":0,"idsServer":0,"idsBoth":0,
    "nameIncoherent":0, "rates":{"browser":0.0,"server":0.0,"union":0.0} } ],
  "userData": [ { "eventName":"Purchase","source":"server","total":0,
    "ud":0,"em":0,"ph":0,"extid":0,"fbp":0,"fbc":0,"cua":0,"cip":0 } ],
  "serverOnlyUserAgents": [ {"ua":"...","count":0} ],
  "sweep": { "cursor":0, "maxId":0, "behind":0 }
}
```

## Event extraction (port from reference, do not reinvent)

Payload forms, in detection order: JSON `{data:[...]}` (CAPI batch → one event per element); JSON array; single JSON object; `application/x-www-form-urlencoded` body; query string (GET); otherwise one fallback row with nulls + raw body.
Field aliases via recursive deep search: `event_name|eventName|ev`; `event_id|eventID|eventId|eid`; `fbp|_fbp`; `fbc|_fbc`; `event_time`; `external_id`. user_data coverage keys: `em`, `ph`, `external_id`, `fbp`, `fbc`, `client_user_agent`, `client_ip_address`.

## Alerts

Metric: server dedup rate computed from `ledger` rows with `last_ts` within the last `ALERT_WINDOW_HOURS` (indexed range scan; do NOT use daily aggregates for the window). Minimum sample: skip evaluation if fewer than 50 ids in window.
State machine in `meta.alert_state`: `ok` → (rate < threshold) → `firing` (send `alert.fired`, once) → (rate >= threshold) → `ok` (send `alert.recovered`, once). `alert.test` bypasses state.
Notification JSON (webhook POST body; also the Resend email content, subject `[<MONITOR_NAME>] <type>`):

```json
{ "type": "alert.fired|alert.recovered|alert.test",
  "monitor": "<MONITOR_NAME>", "metric": "server_dedup_rate",
  "value": 0.72, "threshold": 0.8, "windowHours": 24,
  "sampleSize": 1234, "at": "<ISO from clock>" }
```

## Testing rules (all tickets)

Behavioral only, through `createApp` + `app.request()`; real SQLite on a temp `DATA_DIR` per test; time travel via injected clock + explicit loop `tick()`s; outbound asserted on injected notifier. No mocking of storage, no unit tests of internals. Reference implementation: `reference/legacy-server.js` (production-validated JS — port with review, don't copy blindly).
