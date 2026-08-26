import { describe, it, expect } from 'vitest'
import { configFromEnv } from '../src/config.js'

describe('config parsing', () => {
  it('applies documented defaults when env is empty', () => {
    const config = configFromEnv({})
    expect(config.port).toBe(8080)
    expect(config.dataDir).toBe('./data')
    expect(config.monitorName).toBe('meta-dedup-monitor')
    expect(config.collectPathSecret).toBe('')
    expect(config.ingestKey).toBe('')
    expect(config.adminToken).toBe('')
    expect(config.maxBodyBytes).toBe(1_000_000)
    expect(config.rawRetentionDays).toBe(14)
    expect(config.alertThreshold).toBeNull()
    expect(config.alertWindowHours).toBe(24)
    expect(config.alertCheckMinutes).toBe(15)
  })

  it('reads values from env', () => {
    const config = configFromEnv({
      PORT: '9090',
      MONITOR_NAME: 'my-site',
      ADMIN_TOKEN: 'tok',
      ALERT_THRESHOLD: '0.8',
    })
    expect(config.port).toBe(9090)
    expect(config.monitorName).toBe('my-site')
    expect(config.adminToken).toBe('tok')
    expect(config.alertThreshold).toBe(0.8)
  })

  it('throws in production with empty ADMIN_TOKEN and no ALLOW_INSECURE', () => {
    expect(() => configFromEnv({ NODE_ENV: 'production' })).toThrow(/ADMIN_TOKEN/)
  })

  it('does not throw in production when ALLOW_INSECURE=1', () => {
    expect(() =>
      configFromEnv({ NODE_ENV: 'production', ALLOW_INSECURE: '1' }),
    ).not.toThrow()
  })

  it('does not throw in production when ADMIN_TOKEN is set', () => {
    expect(() =>
      configFromEnv({ NODE_ENV: 'production', ADMIN_TOKEN: 'tok' }),
    ).not.toThrow()
  })
})
