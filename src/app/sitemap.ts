import { fetchPropertySearch, type PropertySearchListing } from '@/lib/propertySearch'
import { absoluteUrl } from '@/lib/seo'
import type { MetadataRoute } from 'next'

const staticPages: Array<{
  path: string
  changeFrequency: 'daily' | 'weekly' | 'monthly'
  priority: number
}> = [
  { path: '/homes', changeFrequency: 'daily', priority: 1 },
  { path: '/rooms', changeFrequency: 'daily', priority: 0.9 },
  { path: '/business', changeFrequency: 'daily', priority: 0.9 },
  { path: '/buy', changeFrequency: 'daily', priority: 0.8 },
  { path: '/rent', changeFrequency: 'daily', priority: 0.8 },
  { path: '/properties/map', changeFrequency: 'daily', priority: 0.8 },
  { path: '/real-estate-categories/all', changeFrequency: 'daily', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.4 },
]

const getPublishedListings = async () => {
  const pageSize = 60
  const listings: PropertySearchListing[] = []

  try {
    for (let offset = 0; offset < 50_000; offset += pageSize) {
      const response = await fetchPropertySearch('', undefined, { limit: pageSize, offset })
      listings.push(...response.listings)
      if (listings.length >= response.total || response.listings.length < pageSize) break
    }
  } catch {
    return []
  }

  return listings
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getPublishedListings()
  const now = new Date()
  const getLastModified = (value?: string) => {
    if (!value) return now
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? now : date
  }

  return [
    ...staticPages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...listings.map((listing) => ({
      url: absoluteUrl(`/real-estate-listings/${encodeURIComponent(listing.slug)}`),
      lastModified: getLastModified(listing.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: [...new Set([listing.primary_image_url, ...(listing.image_urls || [])].filter(Boolean))].map(absoluteUrl),
    })),
  ]
}
