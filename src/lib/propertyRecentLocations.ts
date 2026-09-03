export type PropertyRecentLocation = {
  query: string
  label?: string
  source?: 'local' | 'longdo' | 'manual'
  searchedAt: number
}

const STORAGE_KEY = 'mapxprop_recent_locations_v1'
const MAX_RECENT_LOCATIONS = 5

const normalizeQuery = (value: string) => value.trim().replace(/\s+/g, ' ')

const isRecentLocation = (value: unknown): value is PropertyRecentLocation => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<PropertyRecentLocation>
  return (
    typeof item.query === 'string' &&
    Boolean(normalizeQuery(item.query)) &&
    (item.label === undefined || typeof item.label === 'string') &&
    (item.source === undefined || ['local', 'longdo', 'manual'].includes(item.source)) &&
    typeof item.searchedAt === 'number'
  )
}

export const getPropertyRecentLocations = (): PropertyRecentLocation[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as unknown
    if (!Array.isArray(stored)) return []

    return stored
      .filter(isRecentLocation)
      .map((item) => ({ ...item, query: normalizeQuery(item.query) }))
      .sort((first, second) => second.searchedAt - first.searchedAt)
      .slice(0, MAX_RECENT_LOCATIONS)
  } catch {
    return []
  }
}

export const savePropertyRecentLocation = (
  query: string,
  label?: string,
  source?: PropertyRecentLocation['source']
): PropertyRecentLocation[] => {
  const normalizedQuery = normalizeQuery(query)
  const normalizedLabel = normalizeQuery(label || '') || normalizedQuery
  if (!normalizedQuery || typeof window === 'undefined') return getPropertyRecentLocations()

  const normalizedKey = normalizedQuery.toLocaleLowerCase('th-TH')
  const nextItems = [
    { query: normalizedQuery, label: normalizedLabel, source, searchedAt: Date.now() },
    ...getPropertyRecentLocations().filter(
      (item) => normalizeQuery(item.query).toLocaleLowerCase('th-TH') !== normalizedKey
    ),
  ].slice(0, MAX_RECENT_LOCATIONS)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
  } catch {
    // Searching should still work when storage is unavailable or full.
  }

  return nextItems
}

export const clearPropertyRecentLocations = () => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // The clear action is best-effort when storage is unavailable.
  }
}
