export interface Config {
  port: number
  dataDir: string
  monitorName: string
  collectPathSecret: string
  ingestKey: string
  adminToken: string
  maxBodyBytes: number
  rawRetentionDays: number
  alertThreshold: number | null
  alertWindowHours: number
  alertCheckMinutes: number
  alertWebhookUrl: string
  resendApiKey: string
  alertEmailFrom: string
  alertEmailTo: string
}

type Env = Record<string, string | undefined>

function str(env: Env, key: string, fallback: string): string {
  const value = env[key]
  return value === undefined || value === '' ? fallback : value
}

function int(env: Env, key: string, fallback: number): number {
  const value = env[key]
  if (value === undefined || value === '') return fallback
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) throw new Error(`${key} must be an integer, got "${value}"`)
  return parsed
}

function floatOrNull(env: Env, key: string): number | null {
  const value = env[key]
  if (value === undefined || value === '') return null
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) throw new Error(`${key} must be a number, got "${value}"`)
  return parsed
}

export function configFromEnv(env: Env): Config {
  const adminToken = str(env, 'ADMIN_TOKEN', '')

  if (env.NODE_ENV === 'production' && adminToken === '' && env.ALLOW_INSECURE !== '1') {
    throw new Error(
      'Refusing to start: NODE_ENV=production with an empty ADMIN_TOKEN leaves /report, /api/* and /export.* open. Set ADMIN_TOKEN, or set ALLOW_INSECURE=1 to accept that.',
    )
  }

  return {
    port: int(env, 'PORT', 8080),
    dataDir: str(env, 'DATA_DIR', './data'),
    monitorName: str(env, 'MONITOR_NAME', 'meta-dedup-monitor'),
    collectPathSecret: str(env, 'COLLECT_PATH_SECRET', ''),
    ingestKey: str(env, 'INGEST_KEY', ''),
    adminToken,
    maxBodyBytes: int(env, 'MAX_BODY_BYTES', 1_000_000),
    rawRetentionDays: int(env, 'RAW_RETENTION_DAYS', 14),
    alertThreshold: floatOrNull(env, 'ALERT_THRESHOLD'),
    alertWindowHours: int(env, 'ALERT_WINDOW_HOURS', 24),
    alertCheckMinutes: int(env, 'ALERT_CHECK_MINUTES', 15),
    alertWebhookUrl: str(env, 'ALERT_WEBHOOK_URL', ''),
    resendApiKey: str(env, 'RESEND_API_KEY', ''),
    alertEmailFrom: str(env, 'ALERT_EMAIL_FROM', ''),
    alertEmailTo: str(env, 'ALERT_EMAIL_TO', ''),
  }
}
