# CONTEXT

Glossary for the Meta event deduplication monitor (open-source successor of the 24Bottles collector). Terms are canonical: use them in code, docs, and issues.

## Core concepts

- **Collector**: the passive sink that receives *copies* of Meta events. It never forwards anything to Meta and never sits in the tracking path — if the collector dies, the site's real tracking is unaffected.
- **Browser channel**: the mirror of Pixel events, sent by the web GTM tag from the visitor's browser.
- **Server channel**: the mirror of Conversion API events, sent by the server-side GTM tag.
- **Event ID**: the identifier (`event_id`/`eventID`) Meta uses to deduplicate the same event arriving from both channels. The unit of matching in this whole system.
- **Dedup Ledger**: the permanent per-event record: for each Event ID — event name, timestamp, seen on browser channel (y/n), seen on server channel (y/n), name coherence. Kept forever; it is what "full history" means in this project.
- **Raw capture**: the full request payload (headers, body, all parameters) as received. Kept only for a short, configurable retention window, for recent-period debugging.
- **Dedupable event**: an Event ID seen on both channels with a coherent event name — the condition Meta requires to actually deduplicate.
- **Name incoherence**: same Event ID, different event name across channels. Meta will NOT deduplicate these; they count as tracking defects.

## Metrics

- **Browser dedup rate**: dedupable IDs / IDs seen on the browser channel.
- **Server dedup rate**: dedupable IDs / IDs seen on the server channel. Closest to what Meta Events Manager reports.
- **Union dedup rate**: dedupable IDs / all distinct IDs across both channels.

## Deployment model

- **Site instance**: one deployment of the collector monitors exactly one site/pixel (single-tenant). Monitoring N sites means N instances.
- **Monitor**: the product positioning — an always-on service accumulating the Dedup Ledger over time, with a historical report and threshold alerts. Not a throwaway audit tool.
- **Alert**: a configurable threshold check (e.g. server dedup rate below X% over a time window) notified via webhook, optionally via Resend for email.
