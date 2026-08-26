# Privacy & data retention

The Monitor stores copies of tracking events, which can include personal data (hashed emails/phones, IPs, user agents, cookie IDs). Treat an instance like any other analytics backend: it belongs to the site owner, one instance per site, protected by its tokens.

## What is stored

| Data | Content | Lifetime |
|---|---|---|
| **Raw captures** (`requests`, `events`) | full request payloads as received: headers (minus `authorization`, `cookie`, `x-collector-key`, always stripped), body, query, IP, user agent | `RAW_RETENTION_DAYS` (default **14**), then purged automatically; `0` disables the purge |
| **Dedup Ledger** (`ledger`) | per Event ID: first/last seen, per-channel counts, event names, name coherence, server user agent | permanent |
| **Daily aggregates** (`agg_*`) | per day/event name/channel: volumes and user_data coverage **counters** (never the values) | permanent |

The permanent history contains no user_data values — only whether fields were present. The privacy-sensitive material lives in the raw captures, which exist for debugging the recent period and expire on their own.

## Recommendations

- Set `ADMIN_TOKEN` (mandatory in production: the app refuses to boot without it) — the report, stats and exports expose raw payloads within the retention window.
- Keep `RAW_RETENTION_DAYS` at the shortest window you actually use for debugging.
- Set `COLLECT_PATH_SECRET` and `INGEST_KEY` so third parties cannot inject events.
- Exports (`/export.csv`, `/export.ndjson`, `/export.db`) and Litestream replicas contain whatever the database contains — protect the destinations accordingly.
- If a data subject deletion request must cover the raw window, delete the instance's rows via the DB (the ledger stores no personal fields beyond the server user agent string).
