// Best-effort extraction of the dedup-relevant fields from whatever payload
// shape the GTM tags produce. Ported from reference/legacy-server.js: the raw
// payload is always preserved; extraction only feeds the analysis queries.

export interface ExtractedEvent {
  event_name: string | null
  event_id: string | null
  fbp: string | null
  fbc: string | null
  event_time: number | null
  external_id: string | null
  raw: string
}

const EVENT_NAME_KEYS = ['event_name', 'eventName', 'ev']
const EVENT_ID_KEYS = ['event_id', 'eventID', 'eventId', 'eid']
const FBP_KEYS = ['fbp', '_fbp']
const FBC_KEYS = ['fbc', '_fbc']
const EVENT_TIME_KEYS = ['event_time']
const EXTERNAL_ID_KEYS = ['external_id']

type Json = Record<string, unknown>

function pick(obj: Json, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key]
    if (value != null && value !== '') return String(value)
  }
  return null
}

export function deepFind(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null
  const direct = pick(obj as Json, keys)
  if (direct) return direct
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const found = deepFind(value, keys)
      if (found) return found
    }
  }
  return null
}

function toEventRecord(evObj: unknown): ExtractedEvent {
  const eventTime = deepFind(evObj, EVENT_TIME_KEYS)
  const eventTimeNum = eventTime === null ? null : Number(eventTime)
  return {
    event_name: deepFind(evObj, EVENT_NAME_KEYS),
    event_id: deepFind(evObj, EVENT_ID_KEYS),
    fbp: deepFind(evObj, FBP_KEYS),
    fbc: deepFind(evObj, FBC_KEYS),
    event_time: eventTimeNum !== null && Number.isFinite(eventTimeNum) ? eventTimeNum : null,
    external_id: deepFind(evObj, EXTERNAL_ID_KEYS),
    raw: JSON.stringify(evObj),
  }
}

export function extractEvents(
  queryObj: Record<string, string>,
  bodyText: string,
  contentType: string,
): ExtractedEvent[] {
  const events: ExtractedEvent[] = []

  // 1) JSON body: CAPI batch {data:[...]}, plain array, or single object.
  let parsed: unknown = null
  if (bodyText) {
    try {
      parsed = JSON.parse(bodyText)
    } catch {
      /* not JSON */
    }
  }

  if (parsed && typeof parsed === 'object') {
    const data = (parsed as Json).data
    if (Array.isArray(data)) {
      for (const ev of data) events.push(toEventRecord(ev))
    } else if (Array.isArray(parsed)) {
      for (const ev of parsed) events.push(toEventRecord(ev))
    } else {
      events.push(toEventRecord(parsed))
    }
  }

  // 2) form-urlencoded body.
  if (!events.length && bodyText && contentType.includes('application/x-www-form-urlencoded')) {
    const form = Object.fromEntries(new URLSearchParams(bodyText))
    events.push(toEventRecord(form))
  }

  // 3) browser pixel with data in the query string (facebook.com/tr style).
  if (!events.length && Object.keys(queryObj).length) {
    events.push(toEventRecord(queryObj))
  }

  // 4) fallback: always at least one row, so no request goes untraced.
  if (!events.length) {
    events.push({
      event_name: null,
      event_id: null,
      fbp: null,
      fbc: null,
      event_time: null,
      external_id: null,
      raw: bodyText || '',
    })
  }

  return events
}
