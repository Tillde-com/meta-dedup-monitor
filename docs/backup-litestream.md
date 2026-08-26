# Backups with Litestream

The Monitor's history lives in one SQLite file (`events.db`). [Litestream](https://litestream.io) replicates it continuously to S3-compatible object storage — no cron, no dump windows, restore to the last few seconds.

A site instance's ledger plus a 14-day raw window is typically well under 1GB, which fits the free tiers of **Cloudflare R2** (10GB) and **Backblaze B2** (10GB).

## 1. Create a bucket

On R2 or B2, create a bucket (e.g. `dedup-monitor-backup`) and an access key pair scoped to it.

## 2. Configure Litestream

`/etc/litestream.yml`:

```yaml
dbs:
  - path: /data/events.db     # the DATA_DIR of the Monitor
    replicas:
      - type: s3
        bucket: dedup-monitor-backup
        path: events
        endpoint: https://<accountid>.r2.cloudflarestorage.com   # R2; omit for AWS, set B2's endpoint for B2
        access-key-id: ${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: ${LITESTREAM_SECRET_ACCESS_KEY}
```

Run it next to the Monitor. On a VPS, as a service (`litestream replicate` with the config above; the [install docs](https://litestream.io/install/) ship a systemd unit). With Docker Compose, add a sidecar that shares the volume:

```yaml
  litestream:
    image: litestream/litestream
    command: replicate
    volumes:
      - monitor-data:/data
      - ./litestream.yml:/etc/litestream.yml:ro
    environment:
      LITESTREAM_ACCESS_KEY_ID: ${LITESTREAM_ACCESS_KEY_ID}
      LITESTREAM_SECRET_ACCESS_KEY: ${LITESTREAM_SECRET_ACCESS_KEY}
    restart: unless-stopped
```

Litestream tails the WAL, so it coexists with the running Monitor (which opens the DB in WAL mode) without locks.

## 3. Restore procedure

On the new/repaired machine, **with the Monitor stopped**:

```bash
litestream restore -config /etc/litestream.yml -o /data/events.db /data/events.db
docker compose up -d      # or restart the service
```

The restore reconstructs the database from the latest snapshot plus replicated WAL segments. Verify with:

```bash
sqlite3 /data/events.db 'SELECT COUNT(*) FROM ledger;'
curl "https://<host>/api/stats?token=<ADMIN_TOKEN>"
```

The mechanics were verified with a local file replica (`replicas: [{type: file, path: ...}]` → `litestream restore`), which exercises the same snapshot+WAL restore path as S3.

## Alternative: manual snapshots

Without Litestream, `GET /export.db?token=...` returns a consistent `VACUUM INTO` snapshot you can download on a schedule — coarser (point-in-time) but zero moving parts.
