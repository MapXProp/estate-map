import 'server-only'
import { getAuthApiUrl } from './auth'
import { parseBrowseState, sortBrowseListings } from './propertyBrowse'
import { CATALOG_PAGE_SIZE } from './propertyCatalog'
import { mapCategoryQueries, matchesMapDetails } from './propertyMapSearch'
import type { PropertySearchListing, PropertySearchResponse } from './propertySearch'

// Reuse the public map/category predicates and short-lived public fetch cache.
// Sort/filter the complete matching set on the server; send only the requested 24 cards.
export async function getBrowseResults(params: URLSearchParams, page = 1) {
  const state = parseBrowseState(params)
  const { filters } = state
  if (filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice))
    return { listings: [] as PropertySearchListing[], total: 0, page }
  const groups = await Promise.all(
    mapCategoryQueries(state.categories).map(async (category) => {
      const search = new URLSearchParams({ view: 'map', limit: '60' })
      if (state.query) search.set('q', state.query)
      if (category.discoveryChannel) search.set('channel', category.discoveryChannel)
      category.propertyTypes?.forEach((value) => search.append('property_type', value))
      category.spaceTypes?.forEach((value) => search.append('space_type', value))
      filters.offerTypes.forEach((value) => search.append('offer_type', value))
      if (filters.minPrice) search.set('price_min', filters.minPrice)
      if (filters.maxPrice) search.set('price_max', filters.maxPrice)
      const found = new Map<number, PropertySearchListing>()
      for (let offset = 0; offset < 50_000; offset += 60) {
        search.set('offset', String(offset))
        const response = await fetch(`${getAuthApiUrl('properties/search')}?${search}`, {
          next: { revalidate: 60, tags: ['published-properties'] },
          signal: AbortSignal.timeout(15000),
        })
        if (!response.ok) throw new Error('Public listing search unavailable')
        const data = (await response.json()) as PropertySearchResponse
        if (!Array.isArray(data.listings) || !Number.isFinite(data.total)) throw new Error('Invalid listing response')
        for (const listing of data.listings) found.set(listing.id, listing)
        if (offset + data.listings.length >= data.total) return [...found.values()]
        if (data.listings.length < 60) throw new Error('Incomplete listing response')
      }
      throw new Error('Listing search exceeds catalogue capacity')
    })
  )
  const unique = new Map(groups.flat().map((row) => [row.id, row]))
  const sorted = sortBrowseListings(
    [...unique.values()].filter((row) => matchesMapDetails(row, filters)),
    state.sort,
    filters.offerTypes
  )
  return {
    listings: sorted.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE),
    total: sorted.length,
    page,
  }
}
export type BrowseResults = Awaited<ReturnType<typeof getBrowseResults>>
