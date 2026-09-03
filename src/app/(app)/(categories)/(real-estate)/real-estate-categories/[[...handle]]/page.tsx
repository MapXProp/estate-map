import PropertyCardH from '@/components/PropertyCardH'
import PropertyListingResultsHeader from '@/components/property-home/PropertyListingResultsHeader'
import PropertySearchResults from '@/components/property-home/PropertySearchResults'
import { getRealEstateCategoryByHandle } from '@/data/categories'
import { getRealEstateListings } from '@/data/listings'
import { createPageMetadata } from '@/lib/seo'
import { Divider } from '@/shared/divider'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ handle?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const { handle } = await params
  const search = await searchParams
  const query = (Array.isArray(search.q) ? search.q[0] : search.q)?.trim() || ''
  const hasFilters = Object.values(search).some((value) =>
    Array.isArray(value) ? value.some((item) => item.trim()) : Boolean(value?.trim())
  )
  const categoryHandle = handle?.[0]?.toLowerCase() || 'all'
  const category = await getRealEstateCategoryByHandle(handle?.[0])
  if (!category) {
    return createPageMetadata({
      title: 'ไม่พบหมวดอสังหาริมทรัพย์',
      description: 'ไม่พบหมวดอสังหาริมทรัพย์ที่คุณกำลังค้นหา',
      path: `/real-estate-categories/${categoryHandle}`,
      index: false,
    })
  }

  const isMainCategory = categoryHandle === 'all'
  return createPageMetadata({
    title: query ? `ผลค้นหา “${query}”` : isMainCategory ? 'รวมประกาศอสังหาริมทรัพย์ ขายและให้เช่า' : category.name,
    description: query
      ? `ดูผลค้นหาประกาศอสังหาริมทรัพย์สำหรับ ${query} พร้อมราคา รูปภาพ ทำเล และข้อมูลติดต่อ`
      : isMainCategory
        ? 'รวมประกาศบ้าน คอนโด ที่ดิน ห้องเช่า ร้านค้า ออฟฟิศ โกดัง และพื้นที่ธุรกิจ ทั้งขายและให้เช่าทั่วประเทศไทย'
        : category.description,
    path: `/real-estate-categories/${categoryHandle}`,
    keywords: ['ประกาศอสังหาริมทรัพย์', 'บ้านขาย', 'บ้านเช่า', 'ห้องเช่า', 'ที่ดิน', 'พื้นที่ธุรกิจ'],
    index: isMainCategory && !hasFilters,
  })
}

const Page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ handle?: string[] }>
  searchParams: Promise<{ q?: string | string[] }>
}) => {
  const { handle } = await params
  const search = await searchParams
  const q = Array.isArray(search.q) ? search.q[0] : search.q

  if (q?.trim()) {
    return <PropertySearchResults query={q.trim()} />
  }

  const category = await getRealEstateCategoryByHandle(handle?.[0])
  const listings = await getRealEstateListings()

  if (!category?.id) {
    return redirect('/real-estate-categories/all')
  }

  return (
    <div className="pb-28">
      <div className="relative container pt-8 sm:pt-10 lg:pt-14">
        <PropertyListingResultsHeader count={listings.length} categoryHandle={category.handle} />
        <Divider className="my-8 md:mb-12" />

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {listings.map((listing) => (
            <PropertyCardH key={listing.id} data={listing} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Page
