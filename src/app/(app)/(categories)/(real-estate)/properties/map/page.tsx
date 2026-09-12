import type { PropertyMapFeature, PropertyMapFilterState } from '@/components/property-map/PropertyMapFilterBar'
import PropertyMapSearch from '@/components/property-map/PropertyMapSearch'
import {
  businessSpaceTypes,
  discoveryChannels,
  propertyTypes,
  type BusinessSpaceTypeCode,
  type DiscoveryChannelCode,
  type PropertyTypeCode,
} from '@/data/propertyTaxonomy'
import { getPropertyMapLocationPreset } from '@/lib/propertyMapLocations'
import { initialMapOfferTypes } from '@/lib/propertyMapSearch'
import { createPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

type PageSearchParams = Promise<{
  q?: string | string[]
  location?: string | string[]
  lat?: string | string[]
  lon?: string | string[]
  zoom?: string | string[]
  channel?: string | string[]
  offer_type?: string | string[]
  offer_ui?: string | string[]
  property_type?: string | string[]
  space_type?: string | string[]
  price_min?: string | string[]
  price_max?: string | string[]
  category?: string | string[]
  bedrooms?: string | string[]
  bathrooms?: string | string[]
  area_min?: string | string[]
  feature?: string | string[]
}>

const getFirstSearchParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)?.trim() || ''
const getSearchParamValues = (value?: string | string[]) =>
  (Array.isArray(value) ? value : value ? [value] : []).map((item) => item.trim()).filter(Boolean)

const propertyTypeCodes = new Set(propertyTypes.map((item) => item.code))
const spaceTypeCodes = new Set(businessSpaceTypes.map((item) => item.code))
const discoveryChannelCodes = new Set(discoveryChannels.map((item) => item.code))

const getInitialFilters = (search: Awaited<PageSearchParams>): Partial<PropertyMapFilterState> => ({
  discoveryChannels: getSearchParamValues(search.channel).filter((code): code is DiscoveryChannelCode =>
    discoveryChannelCodes.has(code as DiscoveryChannelCode)
  ),
  propertyTypes: getSearchParamValues(search.property_type).filter((code): code is PropertyTypeCode =>
    propertyTypeCodes.has(code as PropertyTypeCode)
  ),
  spaceTypes: getSearchParamValues(search.space_type).filter((code): code is BusinessSpaceTypeCode =>
    spaceTypeCodes.has(code as BusinessSpaceTypeCode)
  ),
  offerTypes: initialMapOfferTypes(search.offer_type),
  minPrice: /^\d+$/.test(getFirstSearchParam(search.price_min)) ? getFirstSearchParam(search.price_min) : '',
  maxPrice: /^\d+$/.test(getFirstSearchParam(search.price_max)) ? getFirstSearchParam(search.price_max) : '',
  bedrooms: Math.min(4, Math.max(0, parseInt(getFirstSearchParam(search.bedrooms), 10) || 0)),
  bathrooms: Math.min(4, Math.max(0, parseInt(getFirstSearchParam(search.bathrooms), 10) || 0)),
  minArea: /^\d+$/.test(getFirstSearchParam(search.area_min)) ? getFirstSearchParam(search.area_min) : '',
  features: getSearchParamValues(search.feature).filter((code): code is PropertyMapFeature =>
    ['owner_direct', 'verified', 'pets_allowed'].includes(code)
  ),
})

const getMapCoordinates = (search: Awaited<PageSearchParams>) => {
  const lat = Number(getFirstSearchParam(search.lat))
  const lon = Number(getFirstSearchParam(search.lon))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 5 || lat > 21 || lon < 97 || lon > 106) return null
  return { lat, lon }
}

const getMapSearch = async (searchParams: PageSearchParams) => {
  const search = await searchParams
  const location = getPropertyMapLocationPreset(getFirstSearchParam(search.location))
  const coordinates = getMapCoordinates(search)
  const requestedZoom = Number(getFirstSearchParam(search.zoom))
  const zoom = Number.isFinite(requestedZoom) && requestedZoom >= 5 && requestedZoom <= 19 ? requestedZoom : undefined
  const query = getFirstSearchParam(search.q) || location?.nameTh || ''
  return {
    query,
    mapCenter: coordinates || (location ? { lat: location.latitude, lon: location.longitude } : undefined),
    mapZoom: zoom || location?.zoom,
    initialFilters: getInitialFilters(search),
    initialCategories: getSearchParamValues(search.category),
    offerLayout: getFirstSearchParam(search.offer_ui) === 'classic' ? ('classic' as const) : ('compact' as const),
  }
}

export async function generateMetadata({ searchParams }: { searchParams: PageSearchParams }): Promise<Metadata> {
  const { query } = await getMapSearch(searchParams)
  const hasFilters = Object.values(await searchParams).some((value) =>
    Array.isArray(value) ? value.some(Boolean) : Boolean(value)
  )

  return createPageMetadata({
    title: query ? `ค้นหา ${query} บนแผนที่` : 'ค้นหาอสังหาริมทรัพย์บนแผนที่',
    description: query
      ? `ดูประกาศ ${query} พร้อมตำแหน่งบนแผนที่ ราคา และตัวกรองอสังหาริมทรัพย์`
      : 'ค้นหาบ้าน คอนโด ที่ดิน และพื้นที่ธุรกิจทั่วประเทศไทยด้วยแผนที่และตัวกรองที่ใช้งานง่าย',
    path: '/properties/map',
    keywords: [
      'ค้นหาอสังหาริมทรัพย์บนแผนที่',
      'แผนที่บ้านขาย',
      'แผนที่ห้องเช่า',
      'แผนที่ที่ดิน',
      'แผนที่พื้นที่ธุรกิจ',
    ],
    index: !hasFilters,
  })
}

const Page = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const { query, mapCenter, mapZoom, initialFilters, initialCategories, offerLayout } = await getMapSearch(searchParams)

  return (
    <PropertyMapSearch
      key={JSON.stringify({ query, mapCenter, mapZoom, initialFilters, initialCategories, offerLayout })}
      query={query}
      initialMapCenter={mapCenter}
      initialMapZoom={mapZoom}
      initialFilters={initialFilters}
      initialCategories={initialCategories}
      offerLayout={offerLayout}
    />
  )
}

export default Page
