import SectionGridHasMap from '@/app/(app)/(categories)/(real-estate)/real-estate-categories-map/[[...handle]]/SectionGridHasMap'
import type { PropertyMapFilterState } from '@/components/property-map/PropertyMapFilterBar'
import { getRealEstateCategoryByHandle } from '@/data/categories'
import { getRealEstateListings } from '@/data/listings'
import {
  businessSpaceTypes,
  offerTypes,
  propertyTypes,
  type BusinessSpaceTypeCode,
  type OfferTypeCode,
  type PropertyTypeCode,
} from '@/data/propertyTaxonomy'
import { getPropertyMapLocationPreset } from '@/lib/propertyMapLocations'
import { createPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

type PageSearchParams = Promise<{
  q?: string | string[]
  location?: string | string[]
  lat?: string | string[]
  lon?: string | string[]
  zoom?: string | string[]
  offer_type?: string | string[]
  property_type?: string | string[]
  space_type?: string | string[]
  price_min?: string | string[]
  price_max?: string | string[]
}>

const getFirstSearchParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)?.trim() || ''
const getSearchParamValues = (value?: string | string[]) =>
  (Array.isArray(value) ? value : value ? [value] : []).map((item) => item.trim()).filter(Boolean)

const propertyTypeCodes = new Set(propertyTypes.map((item) => item.code))
const spaceTypeCodes = new Set(businessSpaceTypes.map((item) => item.code))
const offerTypeCodes = new Set(offerTypes.map((item) => item.code))

const getInitialFilters = (search: Awaited<PageSearchParams>): Partial<PropertyMapFilterState> => ({
  propertyTypes: getSearchParamValues(search.property_type).filter((code): code is PropertyTypeCode =>
    propertyTypeCodes.has(code as PropertyTypeCode)
  ),
  spaceTypes: getSearchParamValues(search.space_type).filter((code): code is BusinessSpaceTypeCode =>
    spaceTypeCodes.has(code as BusinessSpaceTypeCode)
  ),
  offerTypes: getSearchParamValues(search.offer_type).filter((code): code is OfferTypeCode =>
    offerTypeCodes.has(code as OfferTypeCode)
  ),
  minPrice: /^\d+$/.test(getFirstSearchParam(search.price_min)) ? getFirstSearchParam(search.price_min) : '',
  maxPrice: /^\d+$/.test(getFirstSearchParam(search.price_max)) ? getFirstSearchParam(search.price_max) : '',
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
  }
}

export async function generateMetadata({ searchParams }: { searchParams: PageSearchParams }): Promise<Metadata> {
  const { query } = await getMapSearch(searchParams)

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
    index: !query,
  })
}

const Page = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const { query, mapCenter, mapZoom, initialFilters } = await getMapSearch(searchParams)
  const category = await getRealEstateCategoryByHandle('all')
  const listings = await getRealEstateListings()

  if (!category?.id) {
    return redirect('/real-estate-categories/all')
  }

  return (
    <div className="container lg:max-w-none lg:ps-5 lg:pe-0 xl:ps-8 2xl:ps-10">
      <SectionGridHasMap
        listings={listings}
        category={category}
        query={query}
        initialMapCenter={mapCenter}
        initialMapZoom={mapZoom}
        initialFilters={initialFilters}
      />
    </div>
  )
}

export default Page
