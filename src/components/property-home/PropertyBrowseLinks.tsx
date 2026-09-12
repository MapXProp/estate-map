import { matchesPropertyCatalog, propertyCatalogPath, propertyCatalogs } from '@/lib/propertyCatalog'
import { getPublishedProperties } from '@/lib/publishedProperties'
import Link from 'next/link'

export default async function PropertyBrowseLinks() {
  const listings = await getPublishedProperties()
  const groups = [
    { title: 'เลือกตามประเภทอสังหา', catalogs: propertyCatalogs.filter((c) => !c.province) },
    { title: 'เลือกตามจังหวัด', catalogs: propertyCatalogs.filter((c) => c.province) },
  ]
  return (
    <nav
      aria-label="สำรวจประกาศตามประเภทและทำเล"
      className="container grid gap-7 border-t border-neutral-200 py-8 sm:grid-cols-2 dark:border-neutral-800"
    >
      {groups.map((group) => (
        <div key={group.title}>
          <h2 className="mb-3 text-sm font-semibold">{group.title}</h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-neutral-600 dark:text-neutral-400">
            {group.catalogs
              .map((catalog) => ({ catalog, count: listings.filter((l) => matchesPropertyCatalog(l, catalog)).length }))
              .filter(({ count }) => count >= 3)
              .map(({ catalog, count }) => (
                <li key={catalog.slug}>
                  <Link
                    href={propertyCatalogPath(catalog)}
                    prefetch={false}
                    className="hover:text-[#176b50] hover:underline"
                  >
                    {catalog.label} <span className="text-xs text-neutral-400">({count})</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
