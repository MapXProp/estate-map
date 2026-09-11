import type { PropertyMapFilterState } from '@/components/property-map/PropertyMapFilterBar'
import {
  discoveryChannels,
  getBusinessSpaceType,
  getPropertyType,
  offerTypes,
  primaryBusinessSpaceTypeCodes,
  type DiscoveryChannelCode,
  type OfferTypeCode,
} from '@/data/propertyTaxonomy'
import { fetchPropertySearch, type PropertySearchListing, type PropertySearchOptions } from './propertySearch'

export const mapCategoryGroups = (['homes', 'rooms', 'business'] as const).map((code) => {
  const channel = discoveryChannels.find((item) => item.code === code)!
  const properties = channel.propertyTypeCodes
    .filter((type) => type !== 'retail_space')
    .map((type) => ({
      id: `${code}:${type}`,
      propertyType: type as string,
      spaceType: '',
      nameTh: getPropertyType(type)!.nameTh,
      nameEn: getPropertyType(type)!.nameEn,
    }))
  const spaces =
    code === 'business'
      ? primaryBusinessSpaceTypeCodes.map((type) => ({
          id: `${code}:${type}`,
          propertyType: '',
          spaceType: type as string,
          nameTh: getBusinessSpaceType(type)!.nameTh,
          nameEn: getBusinessSpaceType(type)!.nameEn,
        }))
      : []
  const options = [...properties, ...spaces]
  const sections =
    code === 'business'
      ? [
          {
            id: 'buildings',
            nameTh: 'อาคารและกิจการ',
            nameEn: 'Buildings & businesses',
            options: properties,
          },
          { id: 'retail', nameTh: 'พื้นที่ขายของ', nameEn: 'Retail & selling spaces', options: spaces },
        ]
      : [{ id: code, nameTh: '', nameEn: '', options }]
  return { ...channel, options, sections }
})

export const landMapCategoryIds = mapCategoryGroups.flatMap((group) =>
  group.options.filter((option) => option.propertyType === 'land').map((option) => option.id)
)

export const validMapCategoryIds = new Set(mapCategoryGroups.flatMap((group) => group.options.map((item) => item.id)))
const landCategoryIds = new Set(landMapCategoryIds)
const sharedMapTypes = ['land', 'shophouse', 'home_office']
const sharedCategorySets = sharedMapTypes.map((type) =>
  mapCategoryGroups.flatMap((group) =>
    group.options.filter((option) => option.propertyType === type).map((option) => option.id)
  )
)
const sharedCategoryIds = new Set(sharedCategorySets.flat())
const relatedMapCategories = (id: string) => sharedCategorySets.find((ids) => ids.includes(id)) || [id]
export const isMixedUseMapCategory = (id: string) => sharedCategoryIds.has(id) && !landCategoryIds.has(id)
export const countMapCategories = (categories: string[]) =>
  new Set(categories.map((id) => relatedMapCategories(id)[0])).size

export const hasMapLandSelection = (categories: string[]) => categories.some((id) => landCategoryIds.has(id))

// Shared property types are one filter, including links saved with just one channel's ID.
export function normalizeMapCategories(categories: string[]) {
  const selected = new Set(categories.filter((id) => validMapCategoryIds.has(id)))
  for (const id of selected) relatedMapCategories(id).forEach((related) => selected.add(related))
  return [...selected]
}

export const isLandOnlyMapSelection = (categories: string[]) => {
  const selected = normalizeMapCategories(categories)
  return selected.length === landMapCategoryIds.length && hasMapLandSelection(selected)
}

export function toggleMapCategory(categories: string[], id: string) {
  const selected = normalizeMapCategories(categories)
  if (!validMapCategoryIds.has(id)) return selected
  if (!selected.includes(id)) return normalizeMapCategories([...selected, id])
  const removed = new Set(relatedMapCategories(id))
  return selected.filter((item) => !removed.has(item))
}

export function toggleMapCategoryGroup(categories: string[], code: DiscoveryChannelCode) {
  const selected = normalizeMapCategories(categories)
  const group = mapCategoryGroups.find((item) => item.code === code)
  if (!group) return selected
  const ids = new Set(group.options.map((item) => item.id))
  if (!group.options.every((item) => selected.includes(item.id))) return normalizeMapCategories([...selected, ...ids])
  const removed = new Set([...ids].flatMap(relatedMapCategories))
  return selected.filter((id) => !removed.has(id))
}

export function setMapCategorySection(
  categories: string[],
  code: DiscoveryChannelCode,
  sectionId: string,
  enabled: boolean
) {
  const selected = normalizeMapCategories(categories)
  const section = mapCategoryGroups.find((group) => group.code === code)?.sections.find((item) => item.id === sectionId)
  if (!section) return selected
  const ids = new Set(section.options.map((item) => item.id))
  if (enabled) return normalizeMapCategories([...selected, ...ids])
  const removed = new Set([...ids].flatMap(relatedMapCategories))
  return selected.filter((id) => !removed.has(id))
}

export function initialMapCategories(filters: Partial<PropertyMapFilterState>, categories: string[] = []) {
  if (categories.some((id) => validMapCategoryIds.has(id))) return normalizeMapCategories(categories)
  const { discoveryChannels: channels = [], propertyTypes = [], spaceTypes = [] } = filters
  if (!channels.length && !propertyTypes.length && !spaceTypes.length) return []
  return normalizeMapCategories(
    mapCategoryGroups
      .filter((group) => !channels.length || channels.includes(group.code))
      .flatMap((group) =>
        group.options
          .filter(
            (item) =>
              (!propertyTypes.length && !spaceTypes.length) ||
              propertyTypes.some(
                (type) => type === item.propertyType || (type === 'retail_space' && !!item.spaceType)
              ) ||
              spaceTypes.some((type) => type === item.spaceType)
          )
          .map((item) => item.id)
      )
  )
}

// Keep other types tied to their channel; shared property types search across channels.
export function mapCategoryQueries(categories: string[]): PropertySearchOptions[] {
  const selected = new Set(normalizeMapCategories(categories))
  if (!selected.size) return [{}]
  const sharedTypes = sharedMapTypes.filter((_, index) => sharedCategorySets[index].some((id) => selected.has(id)))
  const queries: PropertySearchOptions[] = mapCategoryGroups.flatMap((group) => {
    const options = group.options.filter((item) => selected.has(item.id) && !sharedCategoryIds.has(item.id))
    if (!options.length) return []
    const wholeGroup = group.options.every((item) => selected.has(item.id))
    const allRetail =
      group.code === 'business' && primaryBusinessSpaceTypeCodes.every((type) => selected.has(`business:${type}`))
    return [
      {
        discoveryChannel: group.code as DiscoveryChannelCode,
        propertyTypes: wholeGroup
          ? []
          : [...options.map((item) => item.propertyType).filter(Boolean), ...(allRetail ? ['retail_space'] : [])],
        // Selecting the entire retail section includes older listings without a subtype.
        spaceTypes: wholeGroup || allRetail ? [] : options.map((item) => item.spaceType).filter(Boolean),
      },
    ]
  })
  // Include listings without a channel, without fetching each shared button separately.
  if (sharedTypes.length) queries.push({ propertyTypes: sharedTypes })
  return queries
}

export const defaultMapOfferTypes: OfferTypeCode[] = ['sale', 'rent']
export function initialMapOfferTypes(value?: string | string[]): OfferTypeCode[] {
  const values = (Array.isArray(value) ? value : value ? [value] : []).map((item) => item.trim())
  if (values.includes('all')) return []
  const selected = [...new Set(values)].filter((code): code is OfferTypeCode =>
    offerTypes.some((offer) => offer.code === code)
  )
  return selected.length ? selected : [...defaultMapOfferTypes]
}
export const mapOfferSearchValues = (offers: OfferTypeCode[]) => (offers.length ? offers : ['all'])
export const isDefaultMapOffers = (offers: OfferTypeCode[]) =>
  offers.length === 2 && defaultMapOfferTypes.every((offer) => offers.includes(offer))
export const toggleMapOffer = (offers: OfferTypeCode[], value: OfferTypeCode) =>
  offers.includes(value) ? offers.filter((offer) => offer !== value) : [...offers, value]

export async function fetchCompleteMapSearch(
  query: string,
  categories: string[],
  options: PropertySearchOptions,
  signal: AbortSignal,
  onProgress?: (listings: PropertySearchListing[]) => void
) {
  const combined = new Map<string, PropertySearchListing>()
  await Promise.all(
    mapCategoryQueries(categories).map(async (category) => {
      let offset = 0
      const seen = new Set<string>()
      while (true) {
        signal.throwIfAborted()
        const page = await fetchPropertySearch(query, signal, {
          ...options,
          ...category,
          view: 'map',
          limit: 60,
          offset,
        })
        signal.throwIfAborted()
        if (!page.listings.length) {
          if (offset === 0 && page.total === 0) break
          throw new Error('Incomplete map results')
        }
        const previousCount = seen.size
        for (const listing of page.listings) {
          const key = listing.public_listing_id
          seen.add(key)
          combined.set(key, listing)
        }
        if (seen.size === previousCount) throw new Error('Map pagination did not advance')
        onProgress?.([...combined.values()])
        offset += page.listings.length
        if (offset >= page.total) break
      }
    })
  )
  return [...combined.values()]
}

export function hasMapCoordinates(listing: PropertySearchListing) {
  return (
    typeof listing.latitude === 'number' &&
    Number.isFinite(listing.latitude) &&
    typeof listing.longitude === 'number' &&
    Number.isFinite(listing.longitude) &&
    listing.latitude >= -90 &&
    listing.latitude <= 90 &&
    listing.longitude >= -180 &&
    listing.longitude <= 180
  )
}

export function matchesMapDetails(listing: PropertySearchListing, filters: PropertyMapFilterState) {
  return (
    (listing.bedroom_count || 0) >= filters.bedrooms &&
    (listing.bathroom_count || 0) >= filters.bathrooms &&
    (listing.usable_area_sqm || listing.land_area_sqm || 0) >= Number(filters.minArea || 0) &&
    (!filters.features.includes('owner_direct') || listing.source_type === 'owner') &&
    (!filters.features.includes('verified') || listing.is_verified) &&
    (!filters.features.includes('pets_allowed') || listing.pet_allowed)
  )
}

export function mapListingPrice(listing: PropertySearchListing, offers: string[]) {
  if (offers.length === 1 && offers[0] === 'rent') return listing.rent_price_monthly || listing.offer_amount || 0
  if (offers.length === 1 && offers[0] === 'sale') return listing.sale_price || listing.offer_amount || 0
  return listing.property_type_code === 'retail_space'
    ? listing.offer_amount || 0
    : listing.sale_price || listing.rent_price_monthly || listing.offer_amount || 0
}
