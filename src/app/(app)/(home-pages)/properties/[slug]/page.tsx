import PropertyCatalogResults from '@/components/property-home/PropertyCatalogResults'
import {
  CATALOG_PAGE_SIZE,
  catalogPageNumber,
  catalogPagePath,
  getPropertyCatalog,
  matchesPropertyCatalog,
  propertyCatalogPath,
} from '@/lib/propertyCatalog'
import { getPublishedProperties } from '@/lib/publishedProperties'
import { createPageMetadata } from '@/lib/seo'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
const resolveCatalog = cache(async (slug: string) => {
  const catalog = getPropertyCatalog(slug)
  if (!catalog) notFound()
  const listings = (await getPublishedProperties()).filter((listing) => matchesPropertyCatalog(listing, catalog))
  if (!listings.length) notFound()
  return { catalog, listings }
})
export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug }, search] = await Promise.all([params, searchParams])
  const { catalog, listings } = await resolveCatalog(slug)
  const page = catalogPageNumber(search.page)
  const filtered = Object.entries(search).some(([key, value]) => key !== 'page' && Boolean(value))
  return createPageMetadata({
    title: `${catalog.title}${page && page > 1 ? ` — หน้า ${page}` : ''}`,
    description: `${catalog.description}${page && page > 1 ? ` หน้าที่ ${page}` : ''}`,
    path: catalogPagePath(propertyCatalogPath(catalog), page || 1),
    index: !filtered && Boolean(page) && listings.length >= 3,
  })
}
export default async function Page({ params, searchParams }: Props) {
  const [{ slug }, search] = await Promise.all([params, searchParams])
  const { catalog, listings } = await resolveCatalog(slug)
  const page = catalogPageNumber(search.page)
  if (!page || page > Math.ceil(listings.length / CATALOG_PAGE_SIZE)) notFound()
  const path = propertyCatalogPath(catalog)
  const mapParams = new URLSearchParams()
  if (catalog.province) mapParams.set('q', catalog.province)
  if (catalog.offerType) mapParams.set('offer_type', catalog.offerType)
  catalog.propertyTypes?.forEach((type) => mapParams.append('property_type', type))
  if (search.page === '1' && Object.keys(search).length === 1) permanentRedirect(path)
  return (
    <PropertyCatalogResults
      title={catalog.title}
      description={catalog.description}
      path={path}
      listings={listings}
      page={page}
      mapHref={`/properties/map?${mapParams}`}
    />
  )
}
