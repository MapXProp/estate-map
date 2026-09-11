import type { PropertyMapFilterState } from '@/components/property-map/PropertyMapFilterBar'
import {
  discoveryChannels,
  getBusinessSpaceType,
  getPropertyType,
  primaryBusinessSpaceTypeCodes,
  type DiscoveryChannelCode,
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
            nameTh: 'อาคาร ที่ดิน และกิจการ',
            nameEn: 'Buildings, land & businesses',
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

export const hasMapLandSelection = (categories: string[]) => categories.some((id) => landCategoryIds.has(id))

// Both land buttons represent the same filter, including links saved with just one ID.
export function normalizeMapCategories(categories: string[]) {
  const selected = new Set(categories.filter((id) => validMapCategoryIds.has(id)))
  if (hasMapLandSelection([...selected])) landMapCategoryIds.forEach((id) => selected.add(id))
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
  return selected.filter((item) => (landCategoryIds.has(id) ? !landCategoryIds.has(item) : item !== id))
}

export function toggleMapCategoryGroup(categories: string[], code: DiscoveryChannelCode) {
  const selected = normalizeMapCategories(categories)
  const group = mapCategoryGroups.find((item) => item.code === code)
  if (!group) return selected
  const ids = new Set(group.options.map((item) => item.id))
  if (!group.options.every((item) => selected.includes(item.id))) return normalizeMapCategories([...selected, ...ids])
  const clearsLand = hasMapLandSelection([...ids])
  return selected.filter((id) => !ids.has(id) && !(clearsLand && landCategoryIds.has(id)))
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
  const clearsLand = hasMapLandSelection([...ids])
  return selected.filter((id) => !ids.has(id) && !(clearsLand && landCategoryIds.has(id)))
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

// Keep other types tied to their channel; land is one shared filter across channels.
export function mapCategoryQueries(categories: string[]): PropertySearchOptions[] {
  const selected = new Set(normalizeMapCategories(categories))
  if (!selected.size) return [{}]
  const landSelected = hasMapLandSelection([...selected])
  const queries: PropertySearchOptions[] = mapCategoryGroups.flatMap((group) => {
    const options = group.options.filter((item) => selected.has(item.id) && !landCategoryIds.has(item.id))
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
  // Include unassigned land too, without fetching it separately for each button.
  if (landSelected) queries.push({ propertyTypes: ['land'] })
  return queries
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
