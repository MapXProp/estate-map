import { getAuthApiUrl } from './auth'

export type ListingViewSource = 'listing_page' | 'map_preview' | 'map_modal'
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const counts = new Map<string, number>()
const listeners = new Set<() => void>()
const pending = new Map<string, Promise<void>>()

export const subscribeListingViews = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const getListingViewCount = (id: string, initialCount = 0) =>
  Math.max(Number.isSafeInteger(initialCount) && initialCount > 0 ? initialCount : 0, counts.get(id) || 0)

export function createListingViewEventID() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function recordListingOpening(listingId: string, source: ListingViewSource, eventId: string): Promise<void> {
  if (!uuidPattern.test(listingId) || !uuidPattern.test(eventId)) return Promise.resolve()
  const key = `${listingId}:${eventId}`
  const existing = pending.get(key)
  if (existing) return existing
  const request = (async () => {
    try {
      const response = await fetch(getAuthApiUrl(`listings/${listingId}/views`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, source }),
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok || response.status === 204) return
      const payload = await response.json()
      if (!Number.isSafeInteger(payload.view_count) || payload.view_count < 0) return
      counts.set(listingId, Math.max(counts.get(listingId) || 0, payload.view_count))
      listeners.forEach((listener) => listener())
    } catch {
      /* A counter must never interrupt browsing or invent a successful view. */
    }
  })().finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}

// Only mounted, successfully loaded previews/pages call this. Server rendering,
// link prefetch and cards never record openings. Hidden tabs reset the timer.
export function scheduleListingOpening(doc: Document, record: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let completed = false
  const update = () => {
    clearTimeout(timer)
    if (completed || doc.visibilityState !== 'visible') return
    timer = setTimeout(() => {
      completed = true
      record()
    }, 1000)
  }
  doc.addEventListener('visibilitychange', update)
  update()
  return () => {
    clearTimeout(timer)
    doc.removeEventListener('visibilitychange', update)
  }
}
