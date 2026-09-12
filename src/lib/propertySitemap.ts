import type { MetadataRoute } from 'next'
import type { Organization } from './organizations'
import {
  CATALOG_PAGE_SIZE,
  CATALOG_PATH,
  catalogPagePath,
  matchesPropertyCatalog,
  propertyCatalogPath,
  propertyCatalogs,
  validModifiedDate,
} from './propertyCatalog'
import type { PropertySearchListing } from './propertySearch'
import { absoluteUrl } from './seo'

export function buildPropertySitemap(
  listings: PropertySearchListing[],
  organizations: Organization[]
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    '/homes',
    '/rooms',
    '/business',
    '/buy',
    '/rent',
    '/properties/map',
    '/organizations',
    '/about',
    '/contact',
  ].map((path) => ({ url: absoluteUrl(path) }))
  const collections = [
    { path: CATALOG_PATH, count: listings.length },
    ...propertyCatalogs
      .map((catalog) => ({
        path: propertyCatalogPath(catalog),
        count: listings.filter((listing) => matchesPropertyCatalog(listing, catalog)).length,
      }))
      .filter((catalog) => catalog.count >= 3),
  ]
  for (const collection of collections) {
    for (let page = 1; page <= Math.max(1, Math.ceil(collection.count / CATALOG_PAGE_SIZE)); page++)
      entries.push({ url: absoluteUrl(catalogPagePath(collection.path, page)) })
  }
  for (const listing of listings)
    entries.push({
      url: absoluteUrl(`/real-estate-listings/${encodeURIComponent(listing.slug)}`),
      lastModified: validModifiedDate(listing),
      images: [...new Set([listing.primary_image_url, ...(listing.image_urls || [])].filter(Boolean))].map(absoluteUrl),
    })
  for (const organization of organizations)
    entries.push({
      url: absoluteUrl(
        `/organizations/${encodeURIComponent(organization.slug || organization.public_organization_id)}`
      ),
    })
  // Only canonical, public URLs. Never use today's date as a made-up lastmod.
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()]
}
