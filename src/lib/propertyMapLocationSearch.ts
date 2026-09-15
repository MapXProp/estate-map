import { getAuthApiUrl } from './auth'
import type { MapProjectDetails, PropertyMapMode } from './propertyMapProjects'

export type MapSearchSuggestion =
  | { kind: 'project'; label: string; project: MapProjectDetails }
  | { kind: 'place'; label: string; direct?: boolean }

export const mapSearchName = (value: string) =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '')

export const projectSearchSuggestion = (project: MapProjectDetails): MapSearchSuggestion => ({
  kind: 'project',
  label: project.name_en || project.name_th,
  project,
})

export function preferredMapProject(query: string, projects: MapProjectDetails[]) {
  const name = mapSearchName(query)
  const exact = projects.filter((project) =>
    [project.name_th, project.name_en, ...(project.aliases || [])].some(
      (alias) => alias && mapSearchName(alias) === name
    )
  )
  return exact.length === 1 ? exact[0] : projects.length === 1 ? projects[0] : undefined
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
  const places = async (): Promise<MapSearchSuggestion[]> => {
    const params = new URLSearchParams({ keyword: query, limit: mode === 'projects' ? '4' : '7', key: apiKey })
    const response = await fetch(`https://search.longdo.com/mapsearch/json/suggest?${params}`, { signal })
    if (!response.ok) throw new Error('Place suggestions unavailable')
    const result = (await response.json()) as { meta?: { keyword?: string }; data?: Array<{ w?: string }> }
    if (result.meta?.keyword && result.meta.keyword !== query) return []
    const seen = new Set<string>()
    return (result.data || [])
      .filter((item) => {
        if (!item.w?.trim() || seen.has(mapSearchName(item.w))) return false
        seen.add(mapSearchName(item.w))
        return true
      })
      .map((item) => ({ kind: 'place', label: item.w!.trim() }))
  }
  const results = await Promise.allSettled([
    mode === 'projects' ? searchMapProjects(query, signal) : Promise.resolve([]),
    places(),
  ])
  signal.throwIfAborted()
  const projects = results[0].status === 'fulfilled' ? results[0].value : []
  const locations = results[1].status === 'fulfilled' ? results[1].value : []
  if (mode === 'projects' && !locations.some((item) => mapSearchName(item.label) === mapSearchName(query)))
    locations.push({ kind: 'place', label: query, direct: true })
  return [...projects.map(projectSearchSuggestion), ...locations]
}

export async function searchMapPlace(query: string, apiKey: string, th: boolean, signal: AbortSignal) {
  const params = new URLSearchParams({ keyword: query, limit: '8', locale: th ? 'th' : 'en', key: apiKey })
  const response = await fetch(`https://search.longdo.com/mapsearch/json/search?${params}`, { signal })
  if (!response.ok) throw new Error('Place search unavailable')
  const result = (await response.json()) as {
    data?: Array<{ name?: string; address?: string; lat?: unknown; lon?: unknown }>
  }
  signal.throwIfAborted()
  const coordinate = (value: unknown) =>
    typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN
  const place = result.data?.find(
    (item) =>
      Number.isFinite(coordinate(item.lat)) &&
      Math.abs(coordinate(item.lat)) <= 90 &&
      Number.isFinite(coordinate(item.lon)) &&
      Math.abs(coordinate(item.lon)) <= 180
  )
  return place
    ? { name: place.name || query, address: place.address || '', lat: Number(place.lat), lon: Number(place.lon) }
    : undefined
}
