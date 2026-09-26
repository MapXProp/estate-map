import { clearSearchHistory, getRecentSearchHistory, recordSearchHistory } from './propertySearchHistory'
export type PropertyRecentLocation = {
  query: string
  label?: string
  source?: 'local' | 'longdo' | 'manual'
  searchedAt: number
}
export const getPropertyRecentLocations = (): PropertyRecentLocation[] =>
  getRecentSearchHistory()
    .filter((event) => event.url.startsWith('/properties/map'))
    .map((event) => ({ query: event.query, label: event.label, source: 'local', searchedAt: event.searchedAt }))
export function savePropertyRecentLocation(query: string, label?: string, _source?: PropertyRecentLocation['source']) {
  recordSearchHistory({
    query,
    label: label || query,
    url: '/properties/map?search=location&q=' + encodeURIComponent(query),
    source: 'hero',
  })
  return getPropertyRecentLocations()
}
export const clearPropertyRecentLocations = () => {
  void clearSearchHistory().catch(() => {})
}
