import { getApiBaseUrl, getAuthApiUrl } from './auth'

export type MyListing = {
  id: number
  public_listing_id: string
  slug: string
  title: string
  property_type_code: string
  listing_type: string
  listing_status: string
  moderation_status: string
  address: string
  price?: number
  price_unit: string
  primary_image_url: string
  created_at: string
  updated_at: string
  published_at?: string
}

type MyListingsResponse = {
  listings?: MyListing[]
  error?: string
}

export const getMyListings = async () => {
  const response = await fetch(getAuthApiUrl('me/listings'), {
    cache: 'no-store',
    credentials: 'include',
  })
  const data = (await response.json().catch(() => ({}))) as MyListingsResponse
  if (!response.ok) {
    throw new Error(data.error || 'Cannot load your listings right now')
  }
  return data.listings || []
}

export const getListingMediaUrl = (url: string) => {
  if (!url || /^https?:\/\//i.test(url)) {
    return url
  }
  return `${getApiBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`
}
