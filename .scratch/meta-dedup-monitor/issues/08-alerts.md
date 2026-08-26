# 08 — Alerts: threshold, state machine, webhook + Resend

**Status:** done
**Blocked by:** 04 (ledger — the evaluation source).
**Model guidance:** suitable for a small model — the state machine, metric query, payload shape, and minimum-sample rule are all frozen in `../contracts.md` (Alerts section); implementation is assembly.

## What to build

A tech marketer learns about dedup breakage without opening the dashboard: an alert loop (test-steppable `tick()`, cadence `ALERT_CHECK_MINUTES`) evaluates the server dedup rate over the last `ALERT_WINDOW_HOURS` from the `ledger` (indexed `last_ts` range scan, per contracts — not daily aggregates), applies the `ok → firing → ok` state machine persisted in `meta`, and delivers `alert.fired` / `alert.recovered` notifications exactly once per transition through the configured channels: webhook POST (JSON payload per contracts) and, when Resend vars are set, email via the Resend API. `POST /api/alerts/test` (admin) sends an `alert.test` through the same channels, bypassing state. Alerting disabled when `ALERT_THRESHOLD` is empty; evaluation skipped below the 50-id minimum sample. All delivery goes through the injected `notifier`; the production notifier implements webhook + Resend with a short timeout and never lets a delivery failure crash the loop.

## Acceptance criteria

All via fixtures + fake clock + alert `tick()` + assertions on the injected notifier.

- [x] Rate below threshold with ≥50 ids in window → exactly one `alert.fired` with correct `value`, `threshold`, `windowHours`, `sampleSize`, `monitor`.
- [x] Second `tick()` with condition persisting → no new notification.
- [x] Rate recovers → exactly one `alert.recovered`; subsequent healthy `tick()`s silent.
- [x] Fewer than 50 ids in window → no evaluation, state unchanged.
- [x] Ids older than the window are excluded (time-travel fixture).
- [x] `ALERT_THRESHOLD` empty → `tick()` is a no-op.
- [x] `POST /api/alerts/test` → 401 without admin token; with it, one `alert.test` notification even in `ok` state.
- [x] Notifier throwing → loop logs and continues; state still transitions (no duplicate `fired` on next tick).
- [x] Alert state survives app restart (new `createApp` on same DATA_DIR keeps `firing` and does not re-fire).

## Comments

- 2026-08-26: done. State persisted before delivery so a failed notification never re-fires. `meta.alert_since` holds the epoch-ms of the firing transition, cleared on recovery. Production notifier (webhook + Resend, 5s timeout each) is the default `deps.notifier`; tests inject their own. `sampleSize` = ledger rows with `last_ts` in the window; `value` = ids_both/ids_server over those rows (0 when ids_server is 0).
