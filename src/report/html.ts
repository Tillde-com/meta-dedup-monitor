import type { StatsResponse } from './stats.js'

// Server-rendered dashboard: no client JS, CSS bars only. Every dynamic value
// goes through esc() — event names and user agents are attacker-controlled.

const esc = (s: unknown): string =>
  String(s == null ? '' : s).replace(
    /[&<>"']/g,
    (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string,
  )

const pct = (r: number): string => `${(r * 100).toFixed(1)}%`

const num = (n: number): string => n.toLocaleString('en-US')

function bar(value: number, max: number, color: string): string {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return `<span class="btrack"><span class="bfill" style="width:${w.toFixed(1)}%;background:${color}"></span></span>`
}

export function renderReport(s: StatsResponse, monitorName: string, nowIso: string): string {
  const nameRows = s.byEventName
    .map(
      (r) => `<tr${r.nameIncoherent > 0 ? ' class="incoherent"' : ''}>
        <td>${esc(r.name)}</td>
        <td class="num">${num(r.idsBrowser)}</td>
        <td class="num">${num(r.idsServer)}</td>
        <td class="num">${num(r.idsBoth)}</td>
        <td class="num">${num(r.nameIncoherent)}</td>
        <td class="num">${pct(r.rates.browser)}</td>
        <td class="num">${pct(r.rates.server)}</td>
        <td class="num">${pct(r.rates.union)}</td>
      </tr>`,
    )
    .join('')

  const maxDayIds = Math.max(1, ...s.timeseries.map((t) => Math.max(t.idsBrowser, t.idsServer)))
  const dayRows = s.timeseries
    .map(
      (t) => `<tr>
        <td>${esc(t.day)}</td>
        <td class="num">${num(t.idsBrowser)}</td>
        <td class="num">${num(t.idsServer)}</td>
        <td class="num">${num(t.idsBoth)}</td>
        <td class="num">${num(t.nameIncoherent)}</td>
        <td class="num">${pct(t.rates.server)}</td>
        <td class="chart">${bar(t.idsBrowser, maxDayIds, 'var(--c-browser)')}${bar(t.idsServer, maxDayIds, 'var(--c-server)')}${bar(t.idsBoth, maxDayIds, 'var(--c-ok)')}</td>
      </tr>`,
    )
    .join('')

  const udRows = s.userData
    .map((u) => {
      const cell = (n: number): string => `<td class="num">${u.total ? pct(n / u.total) : '0.0%'}</td>`
      return `<tr>
        <td>${esc(u.eventName)}</td>
        <td>${esc(u.source)}</td>
        <td class="num">${num(u.total)}</td>
        ${cell(u.ud)}${cell(u.em)}${cell(u.ph)}${cell(u.extid)}${cell(u.fbp)}${cell(u.fbc)}${cell(u.cua)}${cell(u.cip)}
      </tr>`
    })
    .join('')

  const uaTotal = s.serverOnlyUserAgents.reduce((acc, r) => acc + r.count, 0)
  const uaRows = s.serverOnlyUserAgents
    .map(
      (r) => `<tr><td class="ua">${esc(r.ua)}</td><td class="num">${num(r.count)}</td>
        <td class="num">${uaTotal ? pct(r.count / uaTotal) : '0.0%'}</td></tr>`,
    )
    .join('')

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(monitorName)} — Meta dedup report</title>
<style>
  :root{color-scheme:light dark;--c-browser:#4c8bf5;--c-server:#f5a04c;--c-ok:#3ec46d;--c-bad:#e04b6a}
  body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:2rem;max-width:1080px;margin-inline:auto}
  h1{font-size:1.4rem} h2{font-size:1.05rem;margin-top:2rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin:1rem 0}
  .card{border:1px solid #8883;border-radius:10px;padding:1rem}
  .card .v{font-size:1.8rem;font-weight:700}
  .card .l{opacity:.7;font-size:.8rem;text-transform:uppercase;letter-spacing:.03em}
  .big{grid-column:1/-1}
  .dedup3{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:.6rem;text-align:center}
  .dedup3 .v{font-size:2rem;font-weight:700}
  .dedup3 .l{opacity:.7;font-size:.75rem;text-transform:uppercase}
  .dedup3 code{font-size:.75rem;opacity:.7}
  .dedup3 .primary .v{color:var(--c-ok)}
  table{border-collapse:collapse;width:100%;margin-top:.5rem}
  th,td{border-bottom:1px solid #8883;padding:.5rem;text-align:left;white-space:nowrap}
  td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
  td.ua{font-family:ui-monospace,monospace;font-size:.78rem;white-space:normal;max-width:560px;overflow-wrap:anywhere}
  tr.incoherent td{color:var(--c-bad)}
  .muted{opacity:.6;font-size:.85rem}
  .tablewrap{overflow-x:auto}
  td.chart{min-width:180px}
  .btrack{display:block;background:#8882;border-radius:4px;height:8px;overflow:hidden;margin:2px 0}
  .bfill{display:block;height:100%;border-radius:4px}
  a{color:inherit}
  @media(max-width:560px){.dedup3{grid-template-columns:1fr}}
</style></head><body>
<h1>${esc(monitorName)} — Meta event deduplication</h1>
<p class="muted">Event IDs seen on both channels are the events Meta can deduplicate. Updated: ${esc(nowIso)}</p>
${s.sweep.behind > 0 ? `<p class="muted">Aggregates catching up: event ${num(s.sweep.cursor)} of ${num(s.sweep.maxId)}.</p>` : ''}

<div class="grid">
  <div class="card big"><div class="l">Dedup rate — three denominators</div>
    <div class="dedup3">
      <div><div class="v">${pct(s.totals.rates.browser)}</div><div class="l">browser dedup rate</div><code>both / ids_browser<br>${num(s.totals.idsBoth)} / ${num(s.totals.idsBrowser)}</code></div>
      <div class="primary"><div class="v">${pct(s.totals.rates.server)}</div><div class="l">server dedup rate</div><code>both / ids_server<br>${num(s.totals.idsBoth)} / ${num(s.totals.idsServer)}</code></div>
      <div><div class="v">${pct(s.totals.rates.union)}</div><div class="l">union dedup rate</div><code>both / distinct ids<br>${num(s.totals.idsBoth)} / ${num(s.totals.idsBrowser + s.totals.idsServer - s.totals.idsBoth)}</code></div>
    </div>
    <p class="muted" style="margin-top:.6rem">Same numerator (IDs seen on both channels), different denominator. The <b>server dedup rate</b> is the closest to Meta Events Manager: the server usually sends more events than the browser, so server-only events are part of its denominator.</p>
  </div>
  <div class="card"><div class="l">Browser events</div><div class="v">${num(s.totals.events.browser)}</div></div>
  <div class="card"><div class="l">Server events</div><div class="v">${num(s.totals.events.server)}</div></div>
  <div class="card"><div class="l">IDs on both channels</div><div class="v">${num(s.totals.idsBoth)}</div></div>
  <div class="card"><div class="l">Name-incoherent IDs</div><div class="v">${num(s.totals.nameIncoherent)}</div></div>
  <div class="card"><div class="l">Dedupable IDs</div><div class="v">${num(s.totals.dedupable)}</div></div>
</div>

<h2>By day</h2>
<p class="muted">IDs attributed to the day they were first seen; a late copy on the second channel counts on that same day. Bars: <span style="color:var(--c-browser)">browser</span> / <span style="color:var(--c-server)">server</span> / <span style="color:var(--c-ok)">both</span>.</p>
<div class="tablewrap"><table>
  <thead><tr><th>day</th><th class="num">ids browser</th><th class="num">ids server</th><th class="num">both</th><th class="num">incoherent</th><th class="num">server rate</th><th>volume</th></tr></thead>
  <tbody>${dayRows || '<tr><td colspan="7" class="muted">No events yet.</td></tr>'}</tbody>
</table></div>

<h2>By event name</h2>
<p class="muted">Rows in red carry name-incoherent IDs: same event_id, different event_name across channels — Meta will NOT deduplicate those.</p>
<div class="tablewrap"><table>
  <thead><tr><th>event_name</th><th class="num">ids browser</th><th class="num">ids server</th><th class="num">both</th><th class="num">incoherent</th><th class="num">browser rate</th><th class="num">server rate</th><th class="num">union rate</th></tr></thead>
  <tbody>${nameRows || '<tr><td colspan="8" class="muted">No events yet.</td></tr>'}</tbody>
</table></div>

<h2>user_data coverage</h2>
<p class="muted">Share of events carrying each advanced-matching field. em/ph are hashed email/phone.</p>
<div class="tablewrap"><table>
  <thead><tr><th>event_name</th><th>source</th><th class="num">events</th><th class="num">user_data</th><th class="num">em</th><th class="num">ph</th><th class="num">external_id</th><th class="num">fbp</th><th class="num">fbc</th><th class="num">client_ua</th><th class="num">client_ip</th></tr></thead>
  <tbody>${udRows || '<tr><td colspan="11" class="muted">No data.</td></tr>'}</tbody>
</table></div>

<h2>Server-only user agents</h2>
<p class="muted">Event IDs seen only on the server channel, grouped by <code>user_data.client_user_agent</code> — useful to spot a common origin (platform checkout, in-app browser, bot). Top 10.</p>
<div class="tablewrap"><table>
  <thead><tr><th>client_user_agent</th><th class="num">ids</th><th class="num">share</th></tr></thead>
  <tbody>${uaRows || '<tr><td colspan="3" class="muted">No server-only IDs.</td></tr>'}</tbody>
</table></div>

<h2>Export</h2>
<p><a href="/export.csv">Events CSV</a> · <a href="/export.ndjson">Raw requests NDJSON</a> · <a href="/export.db">DB snapshot</a> · <a href="/api/stats">Stats JSON</a></p>
</body></html>`
}
