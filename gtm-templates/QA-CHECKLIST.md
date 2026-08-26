# GTM templates — manual QA checklist

Run this end-to-end after any template change, against a local Monitor
(`npm start`, or the docker compose stack from the repo root). Prereqs: a GTM
web container, a GTM server container, and the Monitor reachable from the
browser (for local runs, a tunnel or LAN address works).

## 1. Import

- [ ] Web container → Templates → New → Import `meta-dedup-monitor-web.tpl` — imports with no errors, permissions list shows: access_globals (dataTag256, checkoutConfig), read_data_layer, access_local_storage, access_consent, access_template_storage, get_cookies (_fbp/_fbc), send_pixel (any), get_url.
- [ ] Server container → Templates → New → Import `meta-dedup-monitor-server.tpl` — imports with no errors, send_http permission is `any`.
- [ ] Screenshot of both imported templates for the PR.

## 2. Wire the tags

- [ ] Web tag: create a tag from the template, set **Collector URL (browser channel)** to `<base>/browser` (e.g. `https://HOST/c/<secret>/browser`), same Pixel ID, same `event_id` variable and same trigger as the real Meta Pixel tag.
- [ ] Server tag: create a tag from the template, set **Collector URL (server channel)** to `<base>/server` and **X-Collector-Key** to the Monitor's `INGEST_KEY`, same field mapping and trigger as the real CAPI tag.

## 3. Fire each mirrored event type

For every event you mirror (at minimum PageView and Purchase):

- [ ] Fire the event in GTM preview (web) — browser sends a GET pixel to `<base>/browser` with `event_name`, `event_id`, `event_time`, `fbp`, `fbc` in the query; response is a 200 GIF.
- [ ] Fire the event through the server container — tag log shows a `DedupCollector` request POSTing the CAPI body to `<base>/server`, response 200 `{ok:true}`.
- [ ] On the Monitor: `/api/stats` (admin token) shows the event on both channels; after the sweep, `idsBoth` increments and the event name shows no incoherence in `/report`.

## 4. Consent gating (web)

- [ ] With consent mode enabled and `ad_storage` denied: the web tag sends nothing.
- [ ] Grant `ad_storage`: the queued event is sent to the collector (one request, same event_id).

## 5. Real Meta tags untouched

- [ ] With both check tags firing, the real Meta Pixel and CAPI tags still fire exactly as before (Meta Events Manager receives the events; no duplicate or missing sends).
- [ ] Removing the collector tags changes nothing for the Meta tags.

## 6. Collector-side round trip (scriptable half)

- [ ] `GET <base>/browser?event_name=Purchase&event_id=qa-1&fbp=fb.1.x` → 200 image/gif; row lands with `source='browser'`.
- [ ] `POST <base>/server` with header `X-Collector-Key` and body `{"data":[{"event_name":"Purchase","event_id":"qa-1",...}]}` → 200 `{ok:true}`; row lands with `source='server'`.
- [ ] After sweep: `/api/stats` shows `idsBoth: 1` for `qa-1`.
