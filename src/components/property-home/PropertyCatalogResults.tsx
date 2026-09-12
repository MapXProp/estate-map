import PropertyCardH from '@/components/PropertyCardH'
import JsonLd from '@/components/seo/JsonLd'
import { toRealEstateListing } from '@/data/listings'
import { CATALOG_PAGE_SIZE, catalogPagePath, catalogStructuredData } from '@/lib/propertyCatalog'
import type { PropertySearchListing } from '@/lib/propertySearch'
import { toPropertyCardRecord } from '@/lib/publishedProperties'
import Link from 'next/link'
import PropertyBrowseLinks from './PropertyBrowseLinks'
import PropertyPagination from './PropertyPagination'

export default function PropertyCatalogResults({
  title,
  description,
  path,
  listings,
  page,
  mapHref = '/properties/map',
}: {
  title: string
  description: string
  path: string
  listings: PropertySearchListing[]
  page: number
  mapHref?: string
}) {
  const offset = (page - 1) * CATALOG_PAGE_SIZE
  const visible = listings.slice(offset, offset + CATALOG_PAGE_SIZE)
  return (
    <main className="pb-16">
      <JsonLd data={catalogStructuredData(title, catalogPagePath(path, page), visible, offset)} />
      <div className="container py-8 sm:py-12">
        <nav aria-label="เส้นทางหน้าเว็บ" className="mb-5 text-sm text-neutral-500">
          <Link href="/homes" className="hover:underline">
            หน้าหลัก
          </Link>{' '}
          /{' '}
          <Link href="/real-estate-categories/all" className="hover:underline">
            ประกาศทั้งหมด
          </Link>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              {title}
              {page > 1 ? ` — หน้า ${page}` : ''}
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">{description}</p>
            <p className="mt-3 text-sm text-[#176b50] dark:text-emerald-300">
              ทั้งหมด {listings.length} ประกาศ ·{' '}
              {visible.length ? `แสดง ${offset + 1}–${offset + visible.length}` : 'ยังไม่มีประกาศที่เผยแพร่'}
            </p>
          </div>
          <Link
            href={mapHref}
            className="inline-flex min-h-11 items-center rounded-full border border-neutral-200 px-5 text-sm font-semibold dark:border-neutral-700"
          >
            ดูบนแผนที่
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {visible.map((listing) => (
            <PropertyCardH key={listing.id} data={toRealEstateListing(toPropertyCardRecord(listing))} />
          ))}
        </div>
        <PropertyPagination page={page} pages={Math.ceil(listings.length / CATALOG_PAGE_SIZE)} basePath={path} />
      </div>
      <PropertyBrowseLinks />
    </main>
  )
}
