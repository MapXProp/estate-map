import { matchesPropertyCatalog, propertyCatalogPath, propertyCatalogs } from '@/lib/propertyCatalog'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import { getPublishedProperties } from '@/lib/publishedProperties'
import Link from 'next/link'

export default async function RelatedPropertyLinks({ listing }: { listing: PropertyListingDetail }) {
  const inventory = await getPublishedProperties()
  const related = inventory
    .filter(
      (item) =>
        item.id !== listing.id &&
        (item.province === listing.province || item.property_type_code === listing.property_type_code)
    )
    .map((item) => ({
      item,
      score:
        Number(item.province === listing.province) * 4 +
        Number(item.district === listing.district) * 2 +
        Number(item.property_type_code === listing.property_type_code),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
  const current = inventory.find((item) => item.id === listing.id)
  const catalogs = current
    ? propertyCatalogs
        .filter((catalog) => matchesPropertyCatalog(current, catalog))
        .filter((catalog) => inventory.filter((item) => matchesPropertyCatalog(item, catalog)).length >= 3)
    : []
  if (!related.length && !catalogs.length) return null
  return (
    <section className="mx-auto max-w-screen-xl border-t border-neutral-200 py-8 dark:border-neutral-800">
      <h2 className="mb-5 text-xl font-semibold">ประกาศอื่นในทำเลหรือประเภทเดียวกัน</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {related.map(({ item }) => (
          <li key={item.id}>
            <Link
              href={`/real-estate-listings/${encodeURIComponent(item.slug)}`}
              prefetch={false}
              className="block rounded-xl border border-neutral-200 p-4 hover:border-[#176b50] dark:border-neutral-800"
            >
              <span className="line-clamp-2 text-sm font-semibold">{item.title}</span>
              <span className="mt-2 block text-xs text-neutral-500">
                {[item.district, item.province].filter(Boolean).join(' · ')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#176b50] dark:text-emerald-300">
        {catalogs.map((catalog) => (
          <Link key={catalog.slug} href={propertyCatalogPath(catalog)} prefetch={false} className="hover:underline">
            ดู{catalog.label}ทั้งหมด
          </Link>
        ))}
      </div>
    </section>
  )
}
