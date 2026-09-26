import { getAuthApiUrl } from './auth'
import { fetchPlaceAutocomplete, PLACE_AUTOCOMPLETE_MIN_LENGTH, placeSearchLocale } from './placeAutocomplete'
import type { MapProjectDetails } from './propertyMapProjects'
import type { PropertySearchSuggestion } from './propertySearch'
import { getTransitStationMapUrl } from './transitStations'

export const LOCATION_SEARCH_PLACEHOLDER_TH = 'ค้นหาย่าน ถนน หรือสถานที่'
export const LOCATION_SEARCH_PLACEHOLDER_EN = 'Search area, road or place'
export const locationSearchKey = (value: string) =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('th-TH')
    .replace(/[๐-๙]/g, (digit) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(digit)))
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '')
export const explicitTransitQuery = (query: string) =>
  /(?:\b(?:bts|mrt|arl|srt|brt)\b|สถานี|รถไฟฟ้า|\([A-Z]{1,2}\d{1,2}\)|^[A-Z]{1,3}\d{1,2}$)/i.test(query)
export const validSearchPlace = (place: PropertySearchSuggestion['place']) =>
  Boolean(
    place &&
    Number.isFinite(place.lat) &&
    place.lat >= 5 &&
    place.lat <= 21 &&
    Number.isFinite(place.lon) &&
    place.lon >= 97 &&
    place.lon <= 106
  )
export const locationSearchZoom = (name: string) =>
  /^(?:จ\.|จังหวัด)/.test(name) ? 10 : /^(?:เขต|อ\.|อำเภอ)/.test(name) ? 13 : /^(?:ถนน|ทางหลวง)/.test(name) ? 14 : 15

export function mergeLocationSuggestions(
  query: string,
  _local: PropertySearchSuggestion[],
  external: PropertySearchSuggestion[],
  projects: MapProjectDetails[] = []
) {
  const key = locationSearchKey(query)
  const english = placeSearchLocale(query) === 'en'
  const projectRows: PropertySearchSuggestion[] = projects
    .filter((project) => project.public_project_id && (project.display_name || project.name_th || project.name_en))
    .map((project) => {
      const label =
        (english ? project.name_en : project.name_th) || project.display_name || project.name_th || project.name_en
      return {
        type: 'project',
        label,
        query: label,
        description: 'project',
        detail: [english ? 'Project' : 'โครงการ', project.district, project.province].filter(Boolean).join(' · '),
        project,
      }
    })
  // Only Longdo places and registered projects belong in autocomplete. Listing
  // titles and the database's administrative address groups stay out of it.
  const items = [
    ...projectRows,
    ...external.filter(
      (item) =>
        !projectRows.some((project) =>
          [project.project?.name_th, project.project?.name_en, project.label].some(
            (name) => name && locationSearchKey(name) === locationSearchKey(item.label)
          )
        )
    ),
  ]
  const seen = new Set<string>()
  const score = (item: PropertySearchSuggestion) => {
    const label = locationSearchKey(item.label)
    return label === key ? 0 : label.startsWith(key) ? 10 : label.includes(key) ? 20 : 30
  }
  let projectCount = 0
  return items
    .sort((a, b) => score(a) - score(b))
    .filter((item) => {
      const id = item.stationId
        ? `station:${item.stationId}`
        : item.project
          ? `project:${item.project.public_project_id}`
          : `${locationSearchKey(item.label)}:${item.place ? `${item.place.lat.toFixed(4)},${item.place.lon.toFixed(4)}` : ''}`
      if (!item.label.trim() || seen.has(id)) return false
      seen.add(id)
      if (item.project && ++projectCount > 2) return false
      return true
    })
    .slice(0, 8)
}

const cache = new Map<string, { at: number; items: PropertySearchSuggestion[] }>()
export async function fetchLocationSearchSuggestions(
  query: string,
  signal: AbortSignal,
  locale: 'th' | 'en' = 'th'
): Promise<PropertySearchSuggestion[]> {
  const value = query.trim().replace(/\s+/g, ' ')
  if (Array.from(value).length < PLACE_AUTOCOMPLETE_MIN_LENGTH || value.length > 120) return []
  signal.throwIfAborted()
  const key = placeSearchLocale(value, locale) + ':' + value.toLocaleLowerCase('th-TH')
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < 300000) return cached.items
  const projectLookup = async () => {
    const response = await fetch(getAuthApiUrl(`projects?${new URLSearchParams({ q: value, limit: '6' })}`), {
      signal,
      cache: 'no-store',
    })
    if (!response.ok) return []
    return ((await response.json()) as { projects?: MapProjectDetails[] }).projects || []
  }
  const results = await Promise.allSettled([fetchPlaceAutocomplete(value, signal, locale), projectLookup()])
  signal.throwIfAborted()
  const items = mergeLocationSuggestions(
    value,
    [],
    results[0].status === 'fulfilled' ? results[0].value : [],
    results[1].status === 'fulfilled' ? results[1].value : []
  )
  if (items.length && results.every((result) => result.status === 'fulfilled')) {
    cache.set(key, { at: Date.now(), items })
    if (cache.size > 40) cache.delete(cache.keys().next().value!)
  }
  return items
}

export function locationSearchDestination(base: string, suggestion?: PropertySearchSuggestion) {
  const url = new URL(base, 'https://mapxprop.com')
  if (url.pathname !== '/properties/map') return getTransitStationMapUrl(base, suggestion?.stationId)
  // Preserve transaction, category and budget while replacing only the destination.
  for (const key of ['station', 'project', 'lat', 'lon', 'zoom', 'location', 'place']) url.searchParams.delete(key)
  url.searchParams.set('search', 'location')
  if (suggestion?.project) {
    url.searchParams.set('q', suggestion.label)
    url.searchParams.set('map_mode', 'projects')
    url.searchParams.set('project', suggestion.project.slug || suggestion.project.public_project_id)
    url.searchParams.set('place', suggestion.label)
    const projectPlace = {
      name: suggestion.label,
      address: '',
      lat: suggestion.project.latitude ?? NaN,
      lon: suggestion.project.longitude ?? NaN,
    }
    if (validSearchPlace(projectPlace)) {
      url.searchParams.set('lat', String(projectPlace.lat))
      url.searchParams.set('lon', String(projectPlace.lon))
      url.searchParams.set('zoom', '16')
    }
  } else if (suggestion?.stationId) {
    url.searchParams.set('station', suggestion.stationId)
  } else if (validSearchPlace(suggestion?.place)) {
    const place = suggestion!.place!
    url.searchParams.set('place', place.name || suggestion!.label)
    url.searchParams.set('lat', String(place.lat))
    url.searchParams.set('lon', String(place.lon))
    url.searchParams.set('zoom', String(place.zoom || locationSearchZoom(place.name)))
  } else if (suggestion) {
    // Administrative labels include district/province, unlike ambiguous bare names.
    url.searchParams.set('q', suggestion.label.replace(/\s*·\s*/g, ' '))
  }
  return url.pathname + '?' + url.searchParams
}
