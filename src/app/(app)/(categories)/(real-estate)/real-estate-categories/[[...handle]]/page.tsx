import PropertyBrowseResults from '@/components/property-home/PropertyBrowseResults'
import JsonLd from '@/components/seo/JsonLd'
import { browseHref, parseBrowseState } from '@/lib/propertyBrowse'
import { getBrowseResults } from '@/lib/propertyBrowseServer'
import {
  CATALOG_PAGE_SIZE,
  CATALOG_PATH,
  catalogPageNumber,
  catalogPagePath,
  catalogStructuredData,
} from '@/lib/propertyCatalog'
import { createPageMetadata } from '@/lib/seo'
import { notFound, permanentRedirect } from 'next/navigation'

type Props = {
  params: Promise<{ handle?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}
const title = 'รวมประกาศอสังหาริมทรัพย์ ขายและให้เช่า'
const description =
  'ค้นหาประกาศขายและเช่า บ้าน คอนโด ที่ดิน ห้องเช่า และพื้นที่ธุรกิจ ตามทำเล โครงการ หรือรายละเอียด กรองประเภทและราคา พร้อมรูปภาพและแผนที่'
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
  if (!handle || (search.page === '1' && Object.keys(search).length === 1)) permanentRedirect(CATALOG_PATH)
  const values = new URLSearchParams()
  Object.entries(search).forEach(([key, value]) =>
    (Array.isArray(value) ? value : value ? [value] : []).forEach((item) => values.append(key, item))
  )
  const state = parseBrowseState(values)
  const results = await getBrowseResults(values, page)
  if (page > 1 && !results.listings.length) notFound()
  return (
    <>
      <JsonLd
        data={catalogStructuredData(title, browseHref(state, page), results.listings, (page - 1) * CATALOG_PAGE_SIZE)}
      />
      <PropertyBrowseResults key={browseHref(state, page)} state={state} initial={results} />
    </>
  )
}
