import 'server-only'

import { cache } from 'react'
import { getAuthApiUrl } from './auth'
import type { PropertySearchListing, PropertySearchResponse } from './propertySearch'

export const getPropertyLandingListings = cache(async (channel: string, offerType?: 'sale' | 'rent') => {
  const params = new URLSearchParams({ limit: '48' })
  if (channel) params.set('channel', channel)
  if (offerType) params.set('offer_type', offerType)
  const response = await fetch(`${getAuthApiUrl('properties/search')}?${params}`, {
    next: { revalidate: 300, tags: ['published-properties'] },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('Property listings are temporarily unavailable')
  const data = (await response.json()) as PropertySearchResponse
  return data.listings.map(toPropertyCardRecord)
})

// Share a short-lived public catalogue across server-rendered browse pages and
// sitemap generation. A failed refresh throws, preserving the last good cache
// instead of publishing an empty sitemap or pretending every listing vanished.
export const getPublishedProperties = cache(async (): Promise<PropertySearchListing[]> => {
  const listings = new Map<number, PropertySearchListing>()
  const pageSize = 60
  for (let offset = 0; offset < 50_000; offset += pageSize) {
    const response = await fetch(`${getAuthApiUrl('properties/search')}?limit=${pageSize}&offset=${offset}`, {
      next: { revalidate: 300, tags: ['published-properties'] },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error('Published property catalogue is temporarily unavailable')
    const data = (await response.json()) as PropertySearchResponse
    if (!Array.isArray(data.listings) || !Number.isFinite(data.total)) throw new Error('Invalid property catalogue')
    const previousSize = listings.size
    for (const listing of data.listings) {
      if (!listing.slug || !listing.id) throw new Error('Published property has no canonical identifier')
      listings.set(listing.id, listing)
    }
    if (offset + data.listings.length >= data.total) {
      if (listings.size < data.total) throw new Error('Incomplete property catalogue pagination')
      return [...listings.values()]
    }
    if (data.listings.length < pageSize || listings.size === previousSize)
      throw new Error('Incomplete property catalogue pagination')
  }
  throw new Error('Property catalogue needs sitemap partitioning')
})

// Card surfaces do not use full listing descriptions. Keep them on the detail
// page and avoid serializing long duplicate descriptions into every card.
export const toPropertyCardRecord = (listing: PropertySearchListing): PropertySearchListing => ({
  ...listing,
  description: '',
  description_en: '',
})
