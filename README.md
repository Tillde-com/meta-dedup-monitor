# Meta Dedup Monitor

An always-on, self-hosted monitor for **Meta event deduplication**: it verifies, with your own data, whether the events your site sends from the browser (Pixel) and from the server (Conversions API) actually carry matching `event_id`s — the condition Meta requires to deduplicate them.

## The problem

When you run Meta tracking on both channels, every conversion is sent twice: once by the browser Pixel and once by the Conversions API. Meta deduplicates the two copies **only** when they share the same `event_id` **and** the same event name. When they don't, your campaigns are optimized and billed on inflated numbers, and nothing in Events Manager tells you exactly which events, on which days, for what reason.

## The mirror method

The Monitor is a **passive collector**. Two GTM tag forks (included, see [`gtm-templates/`](gtm-templates/)) send a *copy* of every event to the Monitor — the browser copy from the web container, the server copy from the server container — each carrying the same `event_id` the real tags send to Meta. The Monitor matches the copies by Event ID and keeps a permanent **Dedup Ledger**: one row per Event ID, forever.

What the Monitor **never** does:

- it never forwards anything to Meta;
- it never sits in your tracking path — if the Monitor is down, your real tracking is completely unaffected.

## What it tells you

Three dedup rates, overall, per event name, and per day:

| Metric | Formula | Meaning |
|---|---|---|
| Browser dedup rate | ids on both channels / ids seen on browser | how much of the browser traffic is covered |
| **Server dedup rate** | ids on both channels / ids seen on server | **the number closest to Meta Events Manager** — the server usually sends more events, so server-only events are in its denominator |
| Union dedup rate | ids on both channels / all distinct ids | overall coverage |

Plus: name incoherence (same `event_id`, different event name — Meta will NOT deduplicate those), `user_data` coverage per event and channel (advanced matching quality), server-only user agents (who is generating events that never appear in a browser), and threshold **alerts** via webhook or email when the server dedup rate drops.

![Report dashboard](docs/images/report.png)

## Quickstart (Docker Compose)

```bash
git clone <this-repo> && cd meta-dedup-monitor
ADMIN_TOKEN=change-me docker compose up -d
```

Send a test event to each channel:

```bash
curl -X POST http://localhost:8080/c/browser \
  -H 'Content-Type: application/json' \
  -d '{"event_name":"Purchase","event_id":"test-1"}'
curl -X POST http://localhost:8080/c/server \
  -H 'Content-Type: application/json' \
  -d '{"data":[{"event_name":"Purchase","event_id":"test-1"}]}'
```

Within ~15 seconds the sweep matches them; open the report:

```
http://localhost:8080/report?token=change-me
```

Then wire the real tags: [GTM setup guide](docs/gtm-setup.md).

## Deployment & operations

- [Deploy on Fly.io](docs/deploy-fly.md) — one small VM + volume, ~$3–6/month
- [Deploy on a VPS](docs/deploy-vps.md) — compose + reverse proxy/TLS
- [Backups with Litestream](docs/backup-litestream.md) — continuous replication to R2/B2, fits free tiers
- [Privacy & data retention](docs/privacy.md) — what is stored, for how long
- Environment reference: every variable is documented in [`.env.example`](.env.example)

HTTP surface: ingest on `/c/browser` and `/c/server` (or `/c/<secret>/...`), dashboard on `/report`, JSON on `/api/stats`, exports on `/export.csv`, `/export.ndjson`, `/export.db` — everything except ingest guarded by `ADMIN_TOKEN`.

## Roadmap

- GTM Community Gallery submission for the two templates
- Cold archive of raw captures to object storage (beyond the local retention window)
- Richer alerting: per-event-name thresholds, anomaly detection on volume gaps

## License

The Monitor is released under the [MIT License](LICENSE). The GTM templates in [`gtm-templates/`](gtm-templates/) are forks of [Stape](https://github.com/stape-io) templates and remain under [Apache-2.0](gtm-templates/LICENSE) with attribution in [`gtm-templates/NOTICE`](gtm-templates/NOTICE).
