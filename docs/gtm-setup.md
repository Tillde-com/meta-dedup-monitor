# GTM setup

The Monitor receives event copies from two GTM template forks shipped in [`gtm-templates/`](../gtm-templates/): one for the web container (browser channel), one for the server container (server channel). Both are collector-only forks of Stape's Facebook templates (attribution in [`NOTICE`](../gtm-templates/NOTICE)).

## Why forks at all

The stock Meta and Stape tags hardcode their destination (`facebook.com/tr`, `graph.facebook.com`) and their GTM permissions only allow those hosts — no configuration can point them at a custom endpoint. The forks keep the event reconstruction identical and change only the destination: your Monitor.

## The Event ID rule (critical)

> **The mirror tag must reuse the SAME GTM variable that feeds the real tag's Event ID.**

Deduplication monitoring works only if the copy carries the `event_id` the real tag sent to Meta. In both containers, whatever variable your Meta Pixel tag / CAPI tag uses for `eventID`/`event_id`, the mirror tag must reference that exact variable, and both tags must fire on the same trigger. Same trigger + same variable = same `event_id` by construction.

## Web container (browser channel)

1. Templates → New → Import `meta-dedup-monitor-web.tpl`.
2. New tag from the template:
   - **Collector URL (browser channel)**: `https://<host>/c/<secret>/browser`
   - Pixel ID(s), Event Name setup, user_data/custom_data mapping: mirror the configuration of your real Pixel tag (same variables).
   - Trigger: the same trigger as the real Pixel tag.
3. The tag sends a GET pixel (`sendPixel`) carrying `event_name`, `event_id`, `event_time`, `fbp`, `fbc`; the Monitor answers with a 1x1 GIF.

**Consent**: the fork inherits the original consent gate — with consent mode enabled it sends only after `ad_storage` is granted (events fired before the grant are queued and sent on grant). It never loads `fbevents.js` and never touches `fbq`.

## Server container (server channel)

1. Templates → New → Import `meta-dedup-monitor-server.tpl`.
2. New tag from the template:
   - **Collector URL (server channel)**: `https://<host>/c/<secret>/server`
   - **X-Collector-Key**: the Monitor's `INGEST_KEY` (if set — recommended).
   - All other fields (event mapping, user data): mirror the real CAPI tag's configuration.
   - Trigger: same trigger as the real CAPI tag.
3. The tag POSTs the exact CAPI body (`{data:[...]}`) it would have sent to Meta — same `event_id`, same hashed `user_data`.

## Verify

Follow the [QA checklist](../gtm-templates/QA-CHECKLIST.md): import checks, one firing per mirrored event type, consent gating, and the confirmation that your real Meta tags are untouched. Then check `/report` — the matched events appear after the next sweep (seconds).
