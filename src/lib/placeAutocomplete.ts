import type { PropertySearchSuggestion } from './propertySearch'

export const PLACE_AUTOCOMPLETE_MIN_LENGTH = 3
export const PLACE_AUTOCOMPLETE_DELAY = 300

export const placeSearchLocale = (query: string, fallback: 'th' | 'en' = 'th'): 'th' | 'en' =>
  /[\u0e01-\u0e5b]/.test(query) ? 'th' : /[a-z]/i.test(query) ? 'en' : fallback

export const placeSearchName = (value: string) =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '')

export const isPlaceRoad = (name: string) => /^(?:ถนน|ซอย|ทางหลวง|soi\b)|\b(?:road|rd\.?|alley|highway)\b/i.test(name)

export const placeSearchZoom = (name: string) =>
  /^(?:จ\.|จังหวัด)|\bprovince\b/i.test(name)
    ? 10
    : /^(?:เขต|อ\.|อำเภอ)|\bdistrict\b/i.test(name)
      ? 13
      : isPlaceRoad(name)
        ? 14
        : 15

// Suggest returns words, not coordinates. Never turn a completion into a pin
// until Search has returned the actual place(s) for the user's selection.
export function longdoWordSuggestions(data: unknown, locale: 'th' | 'en'): PropertySearchSuggestion[] {
  if (!Array.isArray(data)) return []
  const seen = new Set<string>()
  return data
    .flatMap((item) => {
      const label = typeof item?.w === 'string' ? item.w.trim().replace(/\s+/g, ' ') : ''
      const key = placeSearchName(label)
      if (!key || label.length > 120 || seen.has(key)) return []
      seen.add(key)
      const road = item.s === 'poi_r' || isPlaceRoad(label)
      const area = item.s === 'poi_a'
      const detail =
        locale === 'en'
          ? road
            ? 'Road / soi'
            : area
              ? 'Area'
              : 'Place'
          : road
            ? 'ถนน / ซอย'
            : area
              ? 'ทำเล'
              : 'สถานที่'
      return [{ type: 'longdo', label, query: label, description: 'location', detail }]
    })
    .slice(0, 8)
}

export async function fetchPlaceAutocomplete(query: string, signal: AbortSignal, locale: 'th' | 'en' = 'th') {
  const value = query.trim().replace(/\s+/g, ' ')
  if (Array.from(value).length < PLACE_AUTOCOMPLETE_MIN_LENGTH || value.length > 120) return []
  signal.throwIfAborted()
  const params = new URLSearchParams({ q: value, locale: placeSearchLocale(value, locale) })
  const response = await fetch('/api/location-autocomplete?' + params, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Place suggestions unavailable')
  const data = (await response.json()) as { suggestions?: PropertySearchSuggestion[] }
  signal.throwIfAborted()
  return data.suggestions || []
}

export async function resolvePlaceAutocomplete(query: string, signal: AbortSignal, locale: 'th' | 'en' = 'th') {
  const params = new URLSearchParams({ q: query, locale: placeSearchLocale(query, locale), source: 'longdo' })
  const response = await fetch('/api/location-suggestions?' + params, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Place search unavailable')
  const data = (await response.json()) as { suggestions?: PropertySearchSuggestion[] }
  signal.throwIfAborted()
  const rows = data.suggestions || []
  const exact = rows.filter((row) => placeSearchName(row.label) === placeSearchName(query))
  return exact.length ? exact : rows
}
