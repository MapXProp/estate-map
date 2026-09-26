import { getBusinessSpaceType, getPropertyType } from '@/data/propertyTaxonomy'
import { fetchWithAuthRetry, getAuthApiUrl } from './auth'

export type SearchHistoryEvent = {
  id: string
  query: string
  label: string
  url: string
  source: 'hero' | 'header' | 'sheet' | 'map' | 'catalogue'
  searchedAt: number
}
type HistoryState = { revision: number; events: SearchHistoryEvent[]; pending: SearchHistoryEvent[] }
export const SEARCH_HISTORY_EVENT = 'mapxprop:search-history'
const keyPrefix = 'mapxprop_search_history_v2:'
const allowedKeys = new Set(
  'q search place lat lon zoom station project map_mode project_category channel category property_type space_type offer_type price_min price_max bedrooms bathrooms area_min feature sort'.split(
    ' '
  )
)
let account: string | null | undefined
let generation = 0
let current: HistoryState = { revision: 0, events: [], pending: [] }
let waiting: SearchHistoryEvent[] = []
let running: Promise<void> | undefined
let clearing = false

export function cleanHistoryURL(value: string) {
  try {
    if (!value.startsWith('/') || value.startsWith('//') || value.length > 4000) return ''
    const url = new URL(value, 'https://mapxprop.com')
    if (
      url.origin !== 'https://mapxprop.com' ||
      url.hash ||
      !['/properties/map', '/real-estate-categories/all'].includes(url.pathname)
    )
      return ''
    const params = new URLSearchParams()
    for (const key of [...allowedKeys].sort()) {
      const values = [...new Set(url.searchParams.getAll(key))].sort()
      if (values.length > 40 || values.some((value) => [...value].length > 200)) return ''
      values.forEach((value) => params.append(key, value))
    }
    return url.pathname + (params.size ? '?' + params : '')
  } catch {
    return ''
  }
}
const text = (value: unknown) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 200) : '')
function cleanEvent(value: unknown): SearchHistoryEvent | null {
  if (!value || typeof value !== 'object') return null
  const event = value as SearchHistoryEvent
  const url = typeof event.url === 'string' ? cleanHistoryURL(event.url) : ''
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.id) ||
    typeof event.query !== 'string' ||
    !text(event.label) ||
    !url ||
    !Number.isFinite(event.searchedAt) ||
    !['hero', 'header', 'sheet', 'map', 'catalogue'].includes(event.source)
  )
    return null
  return {
    id: event.id,
    query: text(event.query),
    label: text(event.label),
    url,
    source: event.source,
    searchedAt: event.searchedAt,
  }
}
const mergeEvents = (...groups: SearchHistoryEvent[][]) => {
  const seen = new Set<string>()
  return groups
    .flat()
    .map(cleanEvent)
    .filter((event): event is SearchHistoryEvent => Boolean(event))
    .sort((a, b) => b.searchedAt - a.searchedAt)
    .filter((event) => {
      if (seen.has(event.id)) return false
      seen.add(event.id)
      return true
    })
    .slice(0, 100)
}
const storageKey = () => keyPrefix + (account || 'guest')
function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SEARCH_HISTORY_EVENT))
}
function persist() {
  if (typeof window === 'undefined' || account === undefined) return
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(current))
  } catch {
    /* Keep the current session usable. */
  }
  emit()
}
function readState(fallback: HistoryState = { revision: 0, events: [], pending: [] }): HistoryState {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey()) || '{}')
    return {
      revision: Number.isSafeInteger(stored.revision) && stored.revision >= 0 ? stored.revision : 0,
      events: mergeEvents(Array.isArray(stored.events) ? stored.events : []),
      pending: mergeEvents(Array.isArray(stored.pending) ? stored.pending : []),
    }
  } catch {
    return fallback
  }
}
function migrateGuest() {
  // Old browser-wide searches have no verified owner. Never attach them to an account.
  for (const key of ['mapxprop_recent_property_searches_v1', 'mapxprop_recent_locations_v1']) {
    try {
      const old = JSON.parse(window.localStorage.getItem(key) || '[]')
      if (Array.isArray(old))
        current.events = mergeEvents(
          current.events,
          old.flatMap((item) => {
            const query = text(item.query)
            if (!query) return []
            return [
              {
                id: crypto.randomUUID(),
                query,
                label: text(item.label) || query,
                url: '/properties/map?search=location&q=' + encodeURIComponent(query),
                source: 'header' as const,
                searchedAt: Number(item.searchedAt) || Date.now(),
              },
            ]
          })
        )
      window.localStorage.removeItem(key)
    } catch {
      /* A malformed old cache must not block search. */
    }
  }
}
export function setSearchHistoryAccount(owner: string | null) {
  if (account === owner) return
  generation++
  running = undefined
  clearing = false
  account = owner
  current = readState()
  if (!owner) migrateGuest()
  const queued = waiting
  waiting = []
  for (const event of queued) appendEvent(event)
  persist()
  void syncSearchHistory()
}
export function searchHistoryScope() {
  return account ? 'account' : 'device'
}
export function suspendSearchHistoryAccount() {
  generation++
  account = undefined
  current = { revision: 0, events: [], pending: [] }
  running = undefined
  clearing = false
  emit()
}
export function getSearchHistoryEvents() {
  return account === undefined ? [] : mergeEvents(current.events, current.pending)
}
export function historyIdentity(event: SearchHistoryEvent) {
  // The same area with a different budget/category is a different reusable search.
  return event.query.toLocaleLowerCase('th-TH') + '|' + event.url
}
export function getRecentSearchHistory() {
  const seen = new Set<string>()
  return getSearchHistoryEvents()
    .filter((event) => {
      const key = historyIdentity(event)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 8)
}
function appendEvent(event: SearchHistoryEvent) {
  if (clearing) return
  const latest = getSearchHistoryEvents()[0]
  if (latest && historyIdentity(latest) === historyIdentity(event) && event.searchedAt - latest.searchedAt < 10000)
    return
  current.events = mergeEvents([event], current.events)
  if (account) current.pending = mergeEvents([event], current.pending)
}
export function recordSearchHistory(input: Omit<SearchHistoryEvent, 'id' | 'searchedAt'>) {
  if (typeof window === 'undefined') return
  const event = cleanEvent({ ...input, id: crypto.randomUUID(), searchedAt: Date.now() })
  if (!event) return
  if (account === undefined) {
    waiting = mergeEvents([event], waiting)
    return
  }
  const stored = readState(current)
  if (stored.revision > current.revision) current = stored
  else if (stored.revision === current.revision)
    current = {
      revision: stored.revision,
      events: mergeEvents(current.events, stored.events),
      pending: mergeEvents(current.pending, stored.pending),
    }
  appendEvent(event)
  persist()
  void syncSearchHistory()
}
async function request(owner: string, method = 'GET', body?: unknown) {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl('me/search-history') + (method === 'GET' ? '?owner=' + encodeURIComponent(owner) : ''),
    {
      method,
      credentials: 'include',
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }
  )
  if (!response.ok) throw Object.assign(new Error('History unavailable'), { status: response.status })
  return (await response.json()) as { events: SearchHistoryEvent[]; revision: number }
}
export function syncSearchHistory(): Promise<void> {
  if (!account || clearing) return Promise.resolve()
  if (running) return running
  const owner = account,
    version = generation
  const valid = () => version === generation && account === owner
  const job = (async () => {
    try {
      const remote = await request(owner)
      if (!valid()) return
      if (remote.revision !== current.revision) current.pending = []
      current = {
        revision: remote.revision,
        events: mergeEvents(remote.events, current.pending),
        pending: current.pending,
      }
      persist()
      while (current.pending.length && valid()) {
        // Batch size bounds request bytes even for long category URLs.
        const batch = current.pending.filter((event) => event.searchedAt >= Date.now() - 30 * 86400000).slice(0, 20)
        if (!batch.length) {
          current.pending = []
          persist()
          break
        }
        const result = await request(owner, 'POST', { owner, revision: current.revision, events: batch })
        if (!valid()) return
        const sent = new Set(batch.map((event) => event.id))
        current.pending = current.pending.filter((event) => !sent.has(event.id))
        current.events = mergeEvents(result.events, current.pending)
        current.revision = result.revision
        persist()
      }
    } catch (error) {
      if (valid() && (error as { status?: number }).status === 409) {
        // A deletion on another device wins over queued, older history.
        try {
          const remote = await request(owner)
          if (valid()) {
            current = { revision: remote.revision, events: mergeEvents(remote.events), pending: [] }
            persist()
          }
        } catch {
          /* Retry on the next visit. */
        }
      }
    }
  })()
  running = job
  void job.finally(() => {
    if (valid()) running = undefined
  })
  return job
}
export async function clearSearchHistory() {
  if (account === undefined) return
  if (!account) {
    current = { revision: current.revision + 1, events: [], pending: [] }
    waiting = []
    persist()
    return
  }
  const owner = account,
    version = generation
  await syncSearchHistory()
  // A clear belongs to the account where the user pressed it, even if auth
  // changes while its preceding synchronization is still in flight.
  if (version !== generation || owner !== account) return
  clearing = true
  try {
    const response = await request(owner, 'DELETE', { owner, revision: current.revision })
    if (version === generation && owner === account) {
      current = { revision: response.revision, events: [], pending: [] }
      persist()
    }
  } finally {
    if (version === generation) clearing = false
  }
}
export function subscribeSearchHistory(listener: () => void) {
  window.addEventListener(SEARCH_HISTORY_EVENT, listener)
  return () => window.removeEventListener(SEARCH_HISTORY_EVENT, listener)
}
export function refreshHistoryFromStorage() {
  if (account === undefined) return
  const stored = readState(current)
  if (stored.revision > current.revision) current = stored
  else if (stored.revision === current.revision)
    current = {
      revision: stored.revision,
      events: mergeEvents(stored.events, current.events),
      pending: mergeEvents(stored.pending, current.pending),
    }
  emit()
  void syncSearchHistory()
}
export function historyFilterSummary(event: SearchHistoryEvent) {
  const params = new URL(event.url, 'https://mapxprop.com').searchParams
  const offers = params.getAll('offer_type')
  const min = Number(params.get('price_min')),
    max = Number(params.get('price_max'))
  const category = params.getAll('category').length === 1 ? params.get('category')?.split(':')[1] || '' : ''
  return [
    offers.length === 1
      ? ({ sale: 'ซื้อ', rent: 'เช่า', business_transfer: 'เซ้ง' } as Record<string, string>)[offers[0]]
      : '',
    min || max
      ? `${min ? min.toLocaleString('th-TH') : '0'}–${max ? max.toLocaleString('th-TH') : 'ไม่จำกัด'} บาท`
      : '',
    getPropertyType(category)?.nameTh || getBusinessSpaceType(category)?.nameTh || '',
  ]
    .filter(Boolean)
    .join(' · ')
}
