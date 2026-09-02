import { fetchWithAuthRetry, getAuthApiUrl } from './auth'

export type AdminListingReviewStatus = 'pending' | 'approved' | 'rejected'

export type AdminReviewMedia = {
  id: number
  media_type: 'image' | 'video' | '360' | 'panorama' | string
  url: string
  is_primary: boolean
  sort_order: number
}

export type AdminReviewOffer = {
  offer_type: string
  amount?: number
  price_unit: string
  currency: string
}

export type AdminReviewListing = {
  public_listing_id: string
  slug: string
  title: string
  description: string
  property_type_code: string
  property_type_name_th: string
  property_type_name_en: string
  listing_type: string
  listing_status: string
  moderation_status: AdminListingReviewStatus
  moderation_note: string
  address: string
  price?: number
  price_unit: string
  currency: string
  primary_image_url: string
  image_count: number
  video_count: number
  panorama_count: number
  owner_public_user_id: string
  owner_name: string
  owner_email: string
  contact_name: string
  contact_phone: string
  contact_email: string
  custom_project_name: string
  usable_area_sqm?: number
  land_area_sqm?: number
  bedroom_count?: number
  bathroom_count?: number
  parking_count?: number
  category_details: Record<string, unknown>
  created_at: string
  updated_at: string
  moderation_submitted_at?: string
  moderated_at?: string
  published_at?: string
  media?: AdminReviewMedia[]
  offers?: AdminReviewOffer[]
}

export type AdminReviewCounts = {
  pending: number
  approved: number
  rejected: number
}

type ReviewListingsResponse = {
  listings?: AdminReviewListing[]
  counts?: AdminReviewCounts
  total?: number
  limit?: number
  offset?: number
  error?: string
}

type ReviewListingResponse = {
  listing?: AdminReviewListing
  error?: string
}

type ModerationResponse = {
  success?: boolean
  unchanged?: boolean
  moderation_status?: AdminListingReviewStatus
  error?: string
}

const readResponse = async <T extends { error?: string }>(response: Response) => {
  const data = (await response.json().catch(() => ({}))) as T
  if (!response.ok) throw new Error(data.error || 'Cannot complete this moderation request')
  return data
}

export const getAdminReviewListings = async (
  status: AdminListingReviewStatus,
  query = '',
  offset = 0,
  limit = 30
) => {
  const params = new URLSearchParams({ status, offset: String(offset), limit: String(limit) })
  if (query.trim()) params.set('q', query.trim())
  const response = await fetchWithAuthRetry(getAuthApiUrl(`admin/listings/review?${params.toString()}`), {
    cache: 'no-store',
    credentials: 'include',
  })
  return readResponse<ReviewListingsResponse>(response)
}

export const getAdminReviewListing = async (publicListingId: string) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`admin/listings/${encodeURIComponent(publicListingId)}/review`),
    { cache: 'no-store', credentials: 'include' }
  )
  const data = await readResponse<ReviewListingResponse>(response)
  if (!data.listing) throw new Error('Listing review details were not returned')
  return data.listing
}

export const updateAdminListingModeration = async (
  publicListingId: string,
  action: 'approve' | 'unapprove',
  note = ''
) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`admin/listings/${encodeURIComponent(publicListingId)}/moderation`),
    {
      method: 'PATCH',
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    }
  )
  return readResponse<ModerationResponse>(response)
}
