import { describe, it, expect, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { testConfig, makeApp, closeApps } from './helpers.js'

afterEach(closeApps)

describe('health endpoint', () => {
  it('GET / returns ok, service name and clock-derived now', async () => {
    const fakeNow = Date.UTC(2026, 7, 26, 12, 0, 0)
    const app = makeApp(testConfig(), { clock: () => fakeNow })
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ok: true,
      service: 'meta-dedup-monitor',
      now: '2026-08-26T12:00:00.000Z',
    })
  })
})

describe('admin guard', () => {
  it('rejects /api/stats without token when adminToken is set', async () => {
    const app = makeApp(testConfig({ adminToken: 's3cret' }))
    const res = await app.request('/api/stats')
    expect(res.status).toBe(401)
  })

  it('accepts ?token= query parameter', async () => {
    const app = makeApp(testConfig({ adminToken: 's3cret' }))
    const res = await app.request('/api/stats?token=s3cret')
    expect(res.status).toBe(501)
  })

  it('accepts X-Admin-Token header', async () => {
    const app = makeApp(testConfig({ adminToken: 's3cret' }))
    const res = await app.request('/api/stats', {
      headers: { 'X-Admin-Token': 's3cret' },
    })
    expect(res.status).toBe(501)
  })

  it('accepts Authorization: Bearer header', async () => {
    const app = makeApp(testConfig({ adminToken: 's3cret' }))
    const res = await app.request('/api/stats', {
      headers: { Authorization: 'Bearer s3cret' },
    })
    expect(res.status).toBe(501)
  })

  it('rejects a wrong token', async () => {
    const app = makeApp(testConfig({ adminToken: 's3cret' }))
    const res = await app.request('/api/stats?token=wrong')
    expect(res.status).toBe(401)
  })

  it('is disabled when adminToken is empty', async () => {
    const app = makeApp(testConfig({ adminToken: '' }))
    const res = await app.request('/api/stats')
    expect(res.status).toBe(501)
  })
})

describe('instance isolation', () => {
  it('two apps on different temp dirs serve independently, each with its own DB file', async () => {
    const configA = testConfig()
    const configB = testConfig()
    const appA = makeApp(configA, { clock: () => 1000 })
    const appB = makeApp(configB, { clock: () => 2000 })

    const [resA, resB] = await Promise.all([appA.request('/'), appB.request('/')])
    expect(resA.status).toBe(200)
    expect(resB.status).toBe(200)
    const bodyA = (await resA.json()) as { now: string }
    const bodyB = (await resB.json()) as { now: string }
    expect(bodyA.now).toBe(new Date(1000).toISOString())
    expect(bodyB.now).toBe(new Date(2000).toISOString())

    expect(configA.dataDir).not.toBe(configB.dataDir)
    expect(existsSync(path.join(configA.dataDir, 'events.db'))).toBe(true)
    expect(existsSync(path.join(configB.dataDir, 'events.db'))).toBe(true)
  })
})
