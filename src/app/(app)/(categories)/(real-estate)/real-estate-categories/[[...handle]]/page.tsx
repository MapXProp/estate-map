import PropertyCatalogResults from '@/components/property-home/PropertyCatalogResults'
import PropertySearchResults from '@/components/property-home/PropertySearchResults'
import { CATALOG_PAGE_SIZE, CATALOG_PATH, catalogPageNumber, catalogPagePath } from '@/lib/propertyCatalog'
import { fetchPropertySearch } from '@/lib/propertySearch'
import { getPublishedProperties } from '@/lib/publishedProperties'
import { createPageMetadata } from '@/lib/seo'
import { notFound, permanentRedirect } from 'next/navigation'

type Props = {
  params: Promise<{ handle?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}
const title = 'รวมประกาศอสังหาริมทรัพย์ ขายและให้เช่า'
const description =
  'รวมประกาศบ้าน คอนโด ที่ดิน ห้องเช่า ร้านค้า ออฟฟิศ โกดัง และพื้นที่ธุรกิจ ทั้งขายและให้เช่าทั่วประเทศไทย'
export async function generateMetadata({ searchParams }: Props) {
  const search = await searchParams
  const page = catalogPageNumber(search.page)
  const query = (Array.isArray(search.q) ? search.q[0] : search.q)?.trim()
  const filtered = Object.entries(search).some(([key, value]) => key !== 'page' && Boolean(value))
  return createPageMetadata({
    title: query ? `ผลค้นหา “${query}”` : `${title}${page && page > 1 ? ` — หน้า ${page}` : ''}`,
    description: query
      ? `ดูผลค้นหาประกาศอสังหาริมทรัพย์สำหรับ ${query} พร้อมราคา รูปภาพ ทำเล และข้อมูลติดต่อ`
      : `${description}${page && page > 1 ? ` หน้าที่ ${page}` : ''}`,
    path: catalogPagePath(CATALOG_PATH, filtered ? 1 : page || 1),
    index: Boolean(page) && !filtered,
  })
}
export default async function Page({ params, searchParams }: Props) {
  const [{ handle }, search] = await Promise.all([params, searchParams])
  if (handle && (handle.length !== 1 || handle[0] !== 'all')) notFound()
  const page = catalogPageNumber(search.page)
  if (!page) notFound()
  const query = (Array.isArray(search.q) ? search.q[0] : search.q)?.trim()
  if (!handle || (search.page === '1' && Object.keys(search).length === 1)) permanentRedirect(CATALOG_PATH)
  if (query) {
    const response = await fetchPropertySearch(query, undefined, {
      limit: CATALOG_PAGE_SIZE,
      offset: (page - 1) * CATALOG_PAGE_SIZE,
    })
    if (page > 1 && !response.listings.length) notFound()
    return <PropertySearchResults key={`${query}:${page}`} query={query} initialData={response} page={page} />
  }
  const listings = await getPublishedProperties()
  if (page > Math.max(1, Math.ceil(listings.length / CATALOG_PAGE_SIZE))) notFound()
  return (
    <PropertyCatalogResults
      title={title}
      description={description}
      path={CATALOG_PATH}
      listings={listings}
      page={page}
    />
  )
}
