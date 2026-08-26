import { describe, it, expect } from 'vitest'
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Database from 'better-sqlite3'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..')

describe('graceful shutdown', () => {
  it('SIGTERM: answered requests are persisted, WAL checkpointed, exit 0', async () => {
    const dataDir = mkdtempSync(path.join(tmpdir(), 'mdm-shutdown-'))
    const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, DATA_DIR: dataDir, PORT: '0', NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'inherit'],
    })

    const port = await new Promise<number>((resolve, reject) => {
      let out = ''
      const timer = setTimeout(() => reject(new Error(`server never listened: ${out}`)), 15_000)
      child.stdout.on('data', (chunk: Buffer) => {
        out += chunk.toString()
        const m = out.match(/listening on :(\d+)/)
        if (m) {
          clearTimeout(timer)
          resolve(Number(m[1]))
        }
      })
      child.on('exit', (code) => reject(new Error(`exited early with ${code}: ${out}`)))
    })

    const res = await fetch(`http://127.0.0.1:${port}/c/browser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'Purchase', event_id: 'shutdown-1' }),
    })
    expect(res.status).toBe(200)
    await res.text()

    const exitCode = await new Promise<number | null>((resolve) => {
      child.on('exit', (code) => resolve(code))
      child.kill('SIGTERM')
    })
    expect(exitCode).toBe(0)

    const db = new Database(path.join(dataDir, 'events.db'), { readonly: true })
    const requests = (db.prepare('SELECT COUNT(*) AS n FROM requests').get() as { n: number }).n
    const events = db.prepare('SELECT event_id FROM events').all() as Array<{ event_id: string }>
    // The final sweep flush ran: the ledger already holds the event.
    const ledger = db.prepare('SELECT event_id FROM ledger').all() as Array<{ event_id: string }>
    db.close()
    expect(requests).toBe(1)
    expect(events).toEqual([{ event_id: 'shutdown-1' }])
    expect(ledger).toEqual([{ event_id: 'shutdown-1' }])
  }, 30_000)
})
