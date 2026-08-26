# Deploy on Fly.io

One shared-CPU machine with a small volume runs a site instance comfortably (the 24Bottles pilot handled 120k+ events on 512MB RAM). Cost: roughly $3–6/month.

## 1. App and volume

```bash
fly launch --no-deploy          # generates fly.toml from the Dockerfile; pick a region near your users
fly volumes create monitor_data --size 1 --region <region>
```

Edit the generated `fly.toml` so it contains:

```toml
[env]
  DATA_DIR = "/data"
  PORT = "8080"

[[mounts]]
  source = "monitor_data"
  destination = "/data"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false   # CRITICAL — see below
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"
```

**Why `auto_stop_machines = false`:** the Monitor is a passive collector — nothing retries a mirrored event. If Fly scales the machine to zero, every event arriving during the cold start is lost, and the loss is invisible (the tags fire-and-forget). An always-on machine is the whole point of a monitor.

## 2. Secrets

```bash
fly secrets set \
  ADMIN_TOKEN=$(openssl rand -hex 16) \
  INGEST_KEY=$(openssl rand -hex 16) \
  COLLECT_PATH_SECRET=$(openssl rand -hex 8)
```

`NODE_ENV=production` is set by the image: the app refuses to boot with an empty `ADMIN_TOKEN` (override only with `ALLOW_INSECURE=1`, not recommended).

Optional alerting:

```bash
fly secrets set ALERT_THRESHOLD=0.8 ALERT_WEBHOOK_URL=https://... \
  RESEND_API_KEY=re_... ALERT_EMAIL_FROM=monitor@yourdomain ALERT_EMAIL_TO=you@yourdomain
```

## 3. Deploy and verify

```bash
fly deploy
curl https://<app>.fly.dev/            # {"ok":true,...}
curl "https://<app>.fly.dev/api/stats?token=<ADMIN_TOKEN>"
```

Point the GTM tags at `https://<app>.fly.dev/c/<secret>/browser` and `/c/<secret>/server` ([GTM setup](gtm-setup.md)).

## Notes

- One instance monitors one site/pixel. N sites = N apps (they are cheap).
- The volume only holds the retention window plus the (tiny) permanent ledger; 1GB lasts years at default settings.
- Add [Litestream](backup-litestream.md) for off-machine durability — Fly volumes are single-host.
