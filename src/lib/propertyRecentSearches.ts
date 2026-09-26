import { locationSearchDestination } from './locationSearch'
import type { PropertySearchSuggestion } from './propertySearch'
import {
  getRecentSearchHistory,
  historyFilterSummary,
  recordSearchHistory,
  type SearchHistoryEvent,
} from './propertySearchHistory'

export const getPropertyRecentSearches = () =>
  getRecentSearchHistory().map((event) => ({
    query: event.query,
    label: event.label,
    type: 'recent',
    description: historyFilterSummary(event),
    searchedAt: event.searchedAt,
    destination: event.url,
  }))
export function savePropertyRecentSearch(
  query: string,
  label = query,
  _type = 'search',
  _description = '',
  selection?: Pick<PropertySearchSuggestion, 'place' | 'stationId' | 'project'>,
  context?: { url: string; source: SearchHistoryEvent['source'] }
) {
  recordSearchHistory({
    query,
    label,
    url:
      context?.url ||
      locationSearchDestination(
        '/properties/map?q=' + encodeURIComponent(query),
        selection ? { type: 'location', query, label, description: 'location', ...selection } : undefined
      ),
    source: context?.source || 'header',
  })
  return getPropertyRecentSearches()
}
