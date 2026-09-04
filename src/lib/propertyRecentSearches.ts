export type PropertyRecentSearch = {
  query: string
  label: string
  type: string
  description: string
  searchedAt: number
}

const STORAGE_KEY = 'mapxprop_recent_property_searches_v1'
const MAX_RECENT_SEARCHES = 5

const normalizeQuery = (value: string) => value.trim().replace(/\s+/g, ' ')

const isRecentSearch = (value: unknown): value is PropertyRecentSearch => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<PropertyRecentSearch>
  return (
    typeof item.query === 'string' &&
    Boolean(normalizeQuery(item.query)) &&
    typeof item.label === 'string' &&
    typeof item.type === 'string' &&
    typeof item.description === 'string' &&
    typeof item.searchedAt === 'number'
  )
}

export const getPropertyRecentSearches = (): PropertyRecentSearch[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as unknown
    if (!Array.isArray(stored)) return []

    return stored
      .filter(isRecentSearch)
      .map((item) => ({
        ...item,
        query: normalizeQuery(item.query),
        label: normalizeQuery(item.label) || normalizeQuery(item.query),
      }))
      .sort((first, second) => second.searchedAt - first.searchedAt)
      .slice(0, MAX_RECENT_SEARCHES)
  } catch {
    return []
  }
}

export const savePropertyRecentSearch = (
  query: string,
  label = query,
  type = 'search',
  description = ''
): PropertyRecentSearch[] => {
  const normalizedQuery = normalizeQuery(query)
  if (!normalizedQuery || typeof window === 'undefined') return getPropertyRecentSearches()

  const normalizedKey = normalizedQuery.toLocaleLowerCase('th-TH')
  const nextItems = [
    {
      query: normalizedQuery,
      label: normalizeQuery(label) || normalizedQuery,
      type,
      description: normalizeQuery(description),
      searchedAt: Date.now(),
    },
    ...getPropertyRecentSearches().filter(
      (item) => normalizeQuery(item.query).toLocaleLowerCase('th-TH') !== normalizedKey
    ),
  ].slice(0, MAX_RECENT_SEARCHES)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
  } catch {
    // Searching should still work when storage is unavailable or full.
  }

  return nextItems
}
