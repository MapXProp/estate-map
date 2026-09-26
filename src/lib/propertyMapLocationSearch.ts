import { getAuthApiUrl } from './auth'
import { explicitTransitQuery, fetchLocationSearchSuggestions } from './locationSearch'
import { getPropertyMapLocationPreset } from './propertyMapLocations'
import type { MapProjectDetails, PropertyMapMode } from './propertyMapProjects'
import type { PropertySearchSuggestion } from './propertySearch'
import { findTransitStation, transitStationPlace } from './transitStations'

export type MapSearchSuggestion =
  | { kind: 'project'; label: string; project: MapProjectDetails }
  | {
      kind: 'place'
      label: string
      query?: string
      detail?: string
      place?: PropertySearchSuggestion['place']
      direct?: boolean
    }
  | { kind: 'station'; label: string; stationId: string; detail: string }

export const mapSearchName = (value: string) =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '')

export const projectSearchSuggestion = (project: MapProjectDetails): MapSearchSuggestion => ({
  kind: 'project',
  label: project.display_name || project.name_en || project.name_th,
  project,
})

export function preferredMapProject(query: string, projects: MapProjectDetails[]) {
  const name = mapSearchName(query)
  const exact = projects.filter((project) =>
    [project.name_th, project.name_en, ...(project.aliases || [])].some(
      (alias) => alias && mapSearchName(alias) === name
    )
  )
  return exact.length === 1 ? exact[0] : undefined
}

export async function searchMapProjects(query: string, signal: AbortSignal): Promise<MapProjectDetails[]> {
  const params = new URLSearchParams({ q: query.trim(), limit: '6' })
  const response = await fetch(getAuthApiUrl(`projects?${params}`), { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Project search unavailable')
  const result = (await response.json()) as { projects?: MapProjectDetails[] }
  signal.throwIfAborted()
  const seen = new Set<string>()
  return (result.projects || []).filter((project) => {
    if (!project.public_project_id || !(project.name_th || project.name_en) || seen.has(project.public_project_id))
      return false
    seen.add(project.public_project_id)
    return true
  })
}

export async function fetchMapSearchSuggestions(
  query: string,
  mode: PropertyMapMode,
  apiKey: string,
  signal: AbortSignal
): Promise<MapSearchSuggestion[]> {
  // All entry points use the same sources, ranking, labels and place identity.
  const items = await fetchLocationSearchSuggestions(query, signal)
  return items.map(
    (item): MapSearchSuggestion =>
      item.project
        ? { kind: 'project', label: item.label, project: item.project }
        : item.stationId
          ? { kind: 'station', label: item.label, stationId: item.stationId, detail: item.detail || '' }
          : {
              kind: 'place',
              label: item.label,
              query: item.label.replace(/\s*·\s*/g, ' '),
              detail: item.detail || item.description,
              place: item.place,
            }
  )
}

export async function searchMapPlace(query: string, apiKey: string, th: boolean, signal: AbortSignal) {
  const params = new URLSearchParams({ q: query, locale: th ? 'th' : 'en' })
  const response = await fetch('/api/location-search?' + params, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Place search unavailable')
  const result = (await response.json()) as {
    place?: { name: string; address: string; lat: number; lon: number; zoom?: number }
  }
  signal.throwIfAborted()
  const place = result.place
  return place &&
    Number.isFinite(place.lat) &&
    place.lat >= 5 &&
    place.lat <= 21 &&
    Number.isFinite(place.lon) &&
    place.lon >= 97 &&
    place.lon <= 106
    ? place
    : undefined
}

// A province needs an area-level view, while a named project needs its own
// registered coordinates (which may not exist in the external place index).
export async function resolveMapSearchPlace(
  query: string,
  apiKey: string,
  th: boolean,
  signal: AbortSignal,
  includeProjects = true
) {
  signal.throwIfAborted()
  const preset = getPropertyMapLocationPreset(query)
  if (preset)
    return {
      name: th ? preset.nameTh : preset.nameEn,
      address: '',
      lat: preset.latitude,
      lon: preset.longitude,
      zoom: preset.zoom,
    }

  const station = explicitTransitQuery(query) ? findTransitStation(query) : undefined
  if (station) return transitStationPlace(station, th)

  if (includeProjects) {
    const projects = await searchMapProjects(query, signal).catch((error) => {
      if (signal.aborted) throw error
      return []
    })
    signal.throwIfAborted()
    const name = mapSearchName(query)
    const exact = projects.filter((project) =>
      [project.display_name, project.name_th, project.name_en, ...(project.aliases || [])].some(
        (alias) => alias && mapSearchName(alias) === name
      )
    )
    const project = exact.length === 1 ? exact[0] : undefined
    if (
      project &&
      typeof project.latitude === 'number' &&
      Number.isFinite(project.latitude) &&
      Math.abs(project.latitude) <= 90 &&
      typeof project.longitude === 'number' &&
      Number.isFinite(project.longitude) &&
      Math.abs(project.longitude) <= 180
    )
      return {
        name: project.display_name || project.name_en || project.name_th,
        address: [project.district, project.province].filter(Boolean).join(' '),
        lat: project.latitude,
        lon: project.longitude,
        zoom: 16,
      }
  }

  const place = await searchMapPlace(query, apiKey, th, signal)
  if (!place) return undefined
  const zoom = /^(?:จ\.|จังหวัด)/.test(place.name) ? 10 : /^(?:เขต|อ\.|อำเภอ)/.test(place.name) ? 13 : 15
  return { ...place, zoom: place.zoom || zoom }
}
