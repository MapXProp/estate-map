import type { PropertyMapFilterState } from '@/components/property-map/PropertyMapFilterBar'
import { discoveryChannels, primaryBusinessSpaceTypeCodes, propertyTypes } from '@/data/propertyTaxonomy'
import { CATALOG_PATH } from './propertyCatalog'
import {
  initialMapCategories,
  initialMapOfferTypes,
  isDefaultMapOffers,
  mapCategoryGroups,
  normalizeMapCategories,
} from './propertyMapSearch'
import { filterPropertyPrices, getPropertyPrices } from './propertyPrices'
import type { PropertySearchListing } from './propertySearch'
import { getTransitStation, transitStationLabel } from './transitStations'

export type BrowseSort = 'newest' | 'price_low' | 'price_high'
export type BrowseState = {
  query: string
  station: string
  categories: string[]
  filters: PropertyMapFilterState
  sort: BrowseSort
}
export const browseSorts: BrowseSort[] = ['newest', 'price_low', 'price_high']
export const browseDefaults: PropertyMapFilterState = {
  discoveryChannels: [],
  offerTypes: ['sale', 'rent'],
  propertyTypes: [],
  spaceTypes: [],
  minPrice: '',
  maxPrice: '',
  bedrooms: 0,
  bathrooms: 0,
  minArea: '',
  features: [],
}
const numeric = (value: string | null) =>
  value && /^\d{1,12}$/.test(value) && Number(value) > 0 ? String(Number(value)) : ''
export function parseBrowseState(params: URLSearchParams): BrowseState {
  const filters: PropertyMapFilterState = {
    ...browseDefaults,
    discoveryChannels: discoveryChannels.filter((x) => params.getAll('channel').includes(x.code)).map((x) => x.code),
    propertyTypes: propertyTypes.filter((x) => params.getAll('property_type').includes(x.code)).map((x) => x.code),
    spaceTypes: primaryBusinessSpaceTypeCodes.filter((x) => params.getAll('space_type').includes(x)),
    offerTypes: initialMapOfferTypes(params.getAll('offer_type')),
    minPrice: numeric(params.get('price_min')),
    maxPrice: numeric(params.get('price_max')),
    bedrooms: Math.min(4, Number(numeric(params.get('bedrooms')))),
    bathrooms: Math.min(4, Number(numeric(params.get('bathrooms')))),
    minArea: numeric(params.get('area_min')),
    features: ['owner_direct', 'verified', 'pets_allowed'].filter((x) =>
      params.getAll('feature').includes(x)
    ) as PropertyMapFilterState['features'],
  }
  const station = getTransitStation(params.get('station') || '')
  return {
    query: (station ? transitStationLabel(station) : params.get('q') || params.get('location') || '')
      .trim()
      .slice(0, 300),
    station: station?.id || '',
    categories: initialMapCategories(filters, params.getAll('category')),
    filters,
    sort: browseSorts.includes(params.get('sort') as BrowseSort) ? (params.get('sort') as BrowseSort) : 'newest',
  }
}
export function browseParams(state: BrowseState, page = 1) {
  const params = new URLSearchParams()
  if (state.query.trim()) params.set('q', state.query.trim())
  if (state.station) params.set('station', state.station)
  normalizeMapCategories(state.categories).forEach((value) => params.append('category', value))
  if (!isDefaultMapOffers(state.filters.offerTypes))
    state.filters.offerTypes.forEach((value) => params.append('offer_type', value))
  if (state.filters.minPrice) params.set('price_min', state.filters.minPrice)
  if (state.filters.maxPrice) params.set('price_max', state.filters.maxPrice)
  if (state.filters.bedrooms) params.set('bedrooms', String(state.filters.bedrooms))
  if (state.filters.bathrooms) params.set('bathrooms', String(state.filters.bathrooms))
  if (state.filters.minArea) params.set('area_min', state.filters.minArea)
  state.filters.features.forEach((value) => params.append('feature', value))
  if (state.sort !== 'newest') params.set('sort', state.sort)
  if (page > 1) params.set('page', String(page))
  return params
}
export function browseHref(state: BrowseState, page = 1, map = false) {
  const params = browseParams(state, map ? 1 : page)
  if (map) params.set('sort', state.sort)
  return `${map ? '/properties/map' : CATALOG_PATH}${params.size ? `?${params}` : ''}`
}
export const asBrowseHref = (mapHref: string) => mapHref.replace(/^\/properties\/map(?=\?|$)/, CATALOG_PATH)
export function browseCategoryLabels(categories: string[], th = true) {
  const selected = new Set(categories),
    labels = new Map<string, string>()
  mapCategoryGroups.forEach((group) =>
    group.options.forEach((option) => {
      if (selected.has(option.id))
        labels.set(option.propertyType || option.spaceType, th ? option.nameTh : option.nameEn)
    })
  )
  return [...labels.values()]
}
export function browsePrice(listing: PropertySearchListing, offers: string[]) {
  return (
    filterPropertyPrices(getPropertyPrices(listing), offers).find((price) => price.amount && price.amount > 0)
      ?.amount ?? null
  )
}
export function sortBrowseListings(rows: PropertySearchListing[], sort: BrowseSort, offers: string[]) {
  return [...rows].sort((a, b) => {
    if (sort !== 'newest') {
      const x = browsePrice(a, offers),
        y = browsePrice(b, offers)
      if (x === null && y !== null) return 1
      if (x !== null && y === null) return -1
      if (x !== null && y !== null && x !== y) return sort === 'price_low' ? x - y : y - x
    }
    return (Date.parse(b.published_at || '') || 0) - (Date.parse(a.published_at || '') || 0) || b.id - a.id
  })
}
