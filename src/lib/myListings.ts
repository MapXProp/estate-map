import { fetchWithAuthRetry, getApiBaseUrl, getAuthApiUrl } from './auth'

export type MyListing = {
  id: number
  public_listing_id: string
  slug: string
  title: string
  property_type_code: string
  accommodation_model: string
  listing_type: string
  listing_status: string
  moderation_status: string
  address: string
  price?: number
  price_unit: string
  currency: string
  primary_image_url: string
  created_at: string
  updated_at: string
  published_at?: string
}

type MyListingsResponse = {
  listings?: MyListing[]
  error?: string
}

type DeleteMyListingResponse = {
  success?: boolean
  already_deleted?: boolean
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

export const deleteMyListing = async (publicListingId: string) => {
  const listingId = publicListingId.trim()
  if (!listingId) {
    throw new Error('Invalid listing ID')
  }

  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`me/listings/${encodeURIComponent(listingId)}`),
    {
      method: 'DELETE',
      cache: 'no-store',
      credentials: 'include',
    }
  )
  const data = (await response.json().catch(() => ({}))) as DeleteMyListingResponse
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Cannot delete this listing right now')
  }
  return data
}

export const getListingMediaUrl = (url: string) => {
  if (!url || /^https?:\/\//i.test(url)) {
    return url
  }
  return `${getApiBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`
}
