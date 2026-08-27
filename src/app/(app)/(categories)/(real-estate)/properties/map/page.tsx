import SectionGridHasMap from '@/app/(app)/(categories)/(real-estate)/real-estate-categories-map/[[...handle]]/SectionGridHasMap'
import { getRealEstateCategoryByHandle } from '@/data/categories'
import { getRealEstateListings } from '@/data/listings'
import { getPropertyMapFilterOptions } from '@/data/propertyMapFilters'
import { getPropertyMapLocationPreset } from '@/lib/propertyMapLocations'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

type PageSearchParams = Promise<{ q?: string | string[]; location?: string | string[] }>

const getFirstSearchParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)?.trim() || ''

const getMapSearch = async (searchParams: PageSearchParams) => {
  const search = await searchParams
  const location = getPropertyMapLocationPreset(getFirstSearchParam(search.location))
  const query = getFirstSearchParam(search.q) || location?.nameTh || ''
  return { location, query }
}

export async function generateMetadata({ searchParams }: { searchParams: PageSearchParams }): Promise<Metadata> {
  const { query } = await getMapSearch(searchParams)

  return {
    title: query ? `ค้นหา ${query} บนแผนที่` : 'ค้นหาอสังหาริมทรัพย์บนแผนที่',
    description: query
      ? `ดูประกาศ ${query} พร้อมตำแหน่งบนแผนที่ ราคา และตัวกรองอสังหาริมทรัพย์`
      : 'ค้นหาบ้าน คอนโด ที่ดิน และพื้นที่ธุรกิจทั่วประเทศไทยด้วยแผนที่และตัวกรองที่ใช้งานง่าย',
    alternates: { canonical: '/properties/map' },
    robots: query ? { index: false, follow: true } : { index: true, follow: true },
  }
}

const Page = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const { location, query } = await getMapSearch(searchParams)
  const category = await getRealEstateCategoryByHandle('all')
  const listings = await getRealEstateListings()
  const filterOptions = await getPropertyMapFilterOptions()

  if (!category?.id) {
    return redirect('/real-estate-categories/all')
  }

  return (
    <div className="container lg:max-w-none lg:pe-0 lg:ps-5 xl:ps-8 2xl:ps-10">
      <SectionGridHasMap
        listings={listings}
        category={category}
        filterOptions={filterOptions}
        query={query}
        initialMapCenter={location ? { lat: location.latitude, lon: location.longitude } : undefined}
        initialMapZoom={location?.zoom}
      />
    </div>
  )
}

export default Page
