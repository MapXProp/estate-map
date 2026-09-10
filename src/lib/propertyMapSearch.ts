import type { PropertyMapFilterState } from '@/components/property-map/PropertyMapFilterBar'
import {
  discoveryChannels,
  getBusinessSpaceType,
  getPropertyType,
  primaryBusinessSpaceTypeCodes,
  type DiscoveryChannelCode,
} from '@/data/propertyTaxonomy'
import { fetchPropertySearch, type PropertySearchListing, type PropertySearchOptions } from './propertySearch'

export const mapCategoryGroups = (['homes', 'business', 'rooms'] as const).map((code) => {
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
  return { ...channel, options: [...properties, ...spaces] }
})

export const validMapCategoryIds = new Set(mapCategoryGroups.flatMap((group) => group.options.map((item) => item.id)))

export function initialMapCategories(filters: Partial<PropertyMapFilterState>, categories: string[] = []) {
  if (categories.some((id) => validMapCategoryIds.has(id)))
    return categories.filter((id) => validMapCategoryIds.has(id))
  const { discoveryChannels: channels = [], propertyTypes = [], spaceTypes = [] } = filters
  if (!channels.length && !propertyTypes.length && !spaceTypes.length) return []
  return mapCategoryGroups
    .filter((group) => !channels.length || channels.includes(group.code))
    .flatMap((group) =>
      group.options
        .filter(
          (item) =>
            (!propertyTypes.length && !spaceTypes.length) ||
            propertyTypes.some((type) => type === item.propertyType || (type === 'retail_space' && !!item.spaceType)) ||
            spaceTypes.some((type) => type === item.spaceType)
        )
        .map((item) => item.id)
    )
}

// Each channel keeps its own property/space selection. Combining all channels
// and types into independent arrays would incorrectly broaden a mixed selection.
export function mapCategoryQueries(categories: string[]): PropertySearchOptions[] {
  const selected = new Set(categories.filter((id) => validMapCategoryIds.has(id)))
  if (!selected.size) return [{}]
  return mapCategoryGroups.flatMap((group) => {
    const options = group.options.filter((item) => selected.has(item.id))
    if (!options.length) return []
    const wholeGroup = options.length === group.options.length
    return [
      {
        discoveryChannel: group.code as DiscoveryChannelCode,
        propertyTypes: wholeGroup ? [] : options.map((item) => item.propertyType).filter(Boolean),
        spaceTypes: wholeGroup ? [] : options.map((item) => item.spaceType).filter(Boolean),
      },
    ]
  })
}

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
