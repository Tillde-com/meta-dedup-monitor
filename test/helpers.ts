import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Config } from '../src/config.js'
import { createApp, type App, type Deps } from '../src/app.js'

export function tempDataDir(): string {
  return mkdtempSync(path.join(tmpdir(), 'mdm-test-'))
}

export function testConfig(overrides: Partial<Config> = {}): Config {
  return {
    port: 0,
    dataDir: tempDataDir(),
    monitorName: 'meta-dedup-monitor',
    collectPathSecret: '',
    ingestKey: '',
    adminToken: '',
    maxBodyBytes: 1_000_000,
    rawRetentionDays: 14,
    alertThreshold: null,
    alertWindowHours: 24,
    alertCheckMinutes: 15,
    alertWebhookUrl: '',
    resendApiKey: '',
    alertEmailFrom: '',
    alertEmailTo: '',
    ...overrides,
  }
}

const openApps: App[] = []

export function makeApp(config: Config = testConfig(), deps: Deps = {}): App {
  const app = createApp(config, deps)
  openApps.push(app)
  return app
}

export function closeApps(): void {
  for (const app of openApps.splice(0)) app.ctx.close()
}
