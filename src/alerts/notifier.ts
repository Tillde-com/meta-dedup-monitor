import type { Config } from '../config.js'
import type { Notification, Notifier } from '../app.js'

// Production notification delivery: webhook POST and, when the Resend vars are
// set, an email through the Resend API. Short timeouts; failures are logged by
// the caller and must never crash the alert loop.

const DELIVERY_TIMEOUT_MS = 5_000

export function createProductionNotifier(config: Config): Notifier {
  return async (n: Notification): Promise<void> => {
    const errors: unknown[] = []

    if (config.alertWebhookUrl) {
      try {
        await fetch(config.alertWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n),
          signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
        })
      } catch (err) {
        errors.push(err)
      }
    }

    if (config.resendApiKey && config.alertEmailFrom && config.alertEmailTo) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.resendApiKey}`,
          },
          body: JSON.stringify({
            from: config.alertEmailFrom,
            to: [config.alertEmailTo],
            subject: `[${config.monitorName}] ${n.type}`,
            text: JSON.stringify(n, null, 2),
          }),
          signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
        })
      } catch (err) {
        errors.push(err)
      }
    }

    if (errors.length) {
      throw new AggregateError(errors, 'notification delivery partially failed')
    }
  }
}
