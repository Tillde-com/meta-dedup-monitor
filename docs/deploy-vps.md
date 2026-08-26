# Deploy on a VPS

Any small VPS (Hetzner CX22-class or smaller) runs the Monitor. You need Docker with the compose plugin and a domain pointed at the machine.

## 1. Run the Monitor

```bash
git clone <this-repo> && cd meta-dedup-monitor
export ADMIN_TOKEN=$(openssl rand -hex 16)
export INGEST_KEY=$(openssl rand -hex 16)
export COLLECT_PATH_SECRET=$(openssl rand -hex 8)
docker compose up -d --build
```

The compose file persists `/data` on the named volume `monitor-data` and restarts the container on reboot (`restart: unless-stopped`). The container listens on `127.0.0.1:8080` once you restrict the port mapping (recommended when running behind a proxy):

```yaml
    ports:
      - "127.0.0.1:8080:8080"
```

## 2. Reverse proxy with TLS (Caddy)

The browser channel is called from your visitors' browsers, so it must be served over HTTPS on a real domain. Caddy handles certificates automatically:

```bash
apt install caddy
```

`/etc/caddy/Caddyfile`:

```
monitor.yourdomain.com {
    reverse_proxy 127.0.0.1:8080
}
```

```bash
systemctl reload caddy
curl https://monitor.yourdomain.com/    # {"ok":true,...}
```

Any proxy works (nginx + certbot, Traefik); the only requirements are HTTPS and passing the request through unmodified. The Monitor reads the client IP from `x-forwarded-for`/`x-real-ip`, which Caddy and nginx set by default.

## 3. Wire the tags

Point the GTM templates at `https://monitor.yourdomain.com/c/<secret>/browser` and `/c/<secret>/server` — see the [GTM setup guide](gtm-setup.md).

## 4. Updates and backups

```bash
git pull && docker compose up -d --build   # update
```

Data lives in the `monitor-data` volume; it survives rebuilds and `docker compose down`. For off-machine durability add [Litestream](backup-litestream.md).
