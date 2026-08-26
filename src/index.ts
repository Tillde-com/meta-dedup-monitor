import { serve } from '@hono/node-server'
import { configFromEnv } from './config.js'
import { createApp } from './app.js'

// The only file that reads process.env.
const config = configFromEnv(process.env)
const app = createApp(config)
app.ctx.startLoops()

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(
    `[${config.monitorName}] listening on :${info.port}  data=${config.dataDir}  adminToken=${config.adminToken ? 'ON' : 'OFF'}`,
  )
})
