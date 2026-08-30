import { getAuthApiUrl } from './auth'

export type PropertySearchSuggestion = {
  type: string
  label: string
  description: string
  query: string
}

export type PropertySearchChip = {
  type: string
  value: string
  label: string
}

export type PropertySearchIntent = {
  query: string
  normalized_query: string
  locale: 'th' | 'en'
  property_types?: string[]
  property_groups?: string[]
  discovery_channels?: Array<'homes' | 'rooms' | 'business'>
  use_cases?: string[]
  offer_types?: string[]
  space_types?: string[]
  features?: string[]
  locations?: Array<{
    id: number
    code: string
    name_th: string
    name_en: string
    type: string
  }>
  min_price?: number
  max_price?: number
  bedrooms?: number
  free_text?: string
  confidence: number
  chips: PropertySearchChip[]
}

export type PropertySearchListing = {
  id: number
  public_listing_id: string
  slug: string
  title: string
  description: string
  property_type_code: string
  accommodation_model: string
  listing_type: string
  project_name: string
  address: string
  province: string
  district: string
  sale_price?: number
  rent_price_monthly?: number
  bedroom_count?: number
  bathroom_count?: number
  usable_area_sqm?: number
  land_area_sqm?: number
  pet_allowed: boolean
  latitude?: number
  longitude?: number
  published_at?: string
  space_type_code: string
  space_type_codes?: string[]
  primary_image_url: string
  event_name: string
  event_floor_label: string
  event_round_count: number
  event_starts_on?: string
  event_ends_on?: string
  price_on_request: boolean
  is_verified: boolean
  source_type: string
}

export type PropertyListingMedia = {
  id: number
  media_type: string
  role_code: string
  title: string
  alt_text: string
  url: string
  thumbnail_url?: string
  width?: number
  height?: number
  is_primary: boolean
}

export type PropertyListingContentBlock = {
  code: string
  type: 'rich_text' | 'feature_cards' | 'bullet_list' | 'notice' | 'faq' | string
  heading_th: string
  heading_en: string
  body_th: string
  body_en: string
  content: unknown
  sort_order: number
}

export type PropertyListingNearbyPlace = {
  name_th: string
  name_en: string
  place_type_code: string
  distance_meters?: number
  travel_time_minutes?: number
  sort_order: number
}

export type PropertyListingTransactionTerm = {
  code: string
  label_th: string
  label_en: string
  value_th: string
  value_en: string
  payer_code: string
  numeric_value?: number
  unit_code: string
  sort_order: number
}

export type PropertyEventRound = {
  id: number
  label: string
  starts_on: string
  ends_on: string
  availability_status: 'open' | 'limited' | 'waitlist' | 'closed' | 'unknown'
  spaces_remaining?: number
  price_amount?: number
  price_unit: string
  notes: string
}

export type PropertyListingDetail = {
  id: number
  public_listing_id: string
  slug: string
  title: string
  description: string
  property_type_code: string
  accommodation_model: string
  usage_type: string
  listing_type: string
  listing_scope: string
  space_type_code: string
  space_type_codes?: string[]
  project_name: string
  building_name: string
  address: string
  province: string
  district: string
  subdistrict: string
  postal_code: string
  road: string
  usable_area_sqm?: number
  land_area_sqm?: number
  bedroom_count?: number
  bathroom_count?: number
  parking_count?: number
  floor_no?: number
  total_floors?: number
  furnishing_status: string
  property_condition: string
  occupancy_status: string
  latitude?: number
  longitude?: number
  contact_name: string
  contact_phone: string
  contact_phone_secondary: string
  contact_email: string
  line_id: string
  instagram_handle: string
  offer_type: string
  offer_amount?: number
  price_unit: string
  currency: string
  amenities: string[]
  published_at?: string
  expires_at?: string
  is_verified: boolean
  category_details: Record<string, unknown>
  media: PropertyListingMedia[]
  content_blocks: PropertyListingContentBlock[]
  nearby_places: PropertyListingNearbyPlace[]
  transaction_terms: PropertyListingTransactionTerm[]
  event?: {
    name: string
    organizer_name: string
    organizer_website_url: string
    organizer_verification_status: 'unverified' | 'contact_checked' | 'verified' | ''
    venue_name: string
    venue_floor_label: string
    audience_segments: string[]
    accepted_product_categories: string[]
    application_instructions: string
    floor_plan_url: string
    price_on_request: boolean
    booth_size_on_request: boolean
    source_published_at?: string
    rounds: PropertyEventRound[]
  }
}

export type PropertySearchResponse = {
  query: string
  bounds?: {
    min_lat: number
    min_lon: number
    max_lat: number
    max_lon: number
  }
  intent: PropertySearchIntent
  listings: PropertySearchListing[]
  total: number
  limit: number
  offset: number
}

export type PropertyDiscoveryChannel = 'homes' | 'rooms' | 'business'

export type PropertySearchOptions = {
  discoveryChannel?: PropertyDiscoveryChannel
  limit?: number
}

export type PropertyMapAreaSearchRequest = {
  query?: string
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
  limit?: number
  offset?: number
  signal?: AbortSignal
}

const fallbackSuggestions: PropertySearchSuggestion[] = [
  { type: 'popular', label: 'คอนโดอารีย์', description: 'คอนโด · อารีย์', query: 'คอนโดอารีย์' },
  { type: 'popular', label: 'โกดังบางนา', description: 'โกดัง · บางนา', query: 'โกดังบางนา' },
  { type: 'popular', label: 'ที่ดินเชียงใหม่', description: 'ที่ดิน · เชียงใหม่', query: 'ที่ดินเชียงใหม่' },
  {
    type: 'popular',
    label: 'ร้านให้เช่าสยามไม่เกิน 50,000',
    description: 'ร้านค้า · เช่า · สยาม',
    query: 'ร้านให้เช่าสยามไม่เกิน 50000',
  },
]

export const getPropertySearchUrl = (query: string) =>
  `/real-estate-categories/all?q=${encodeURIComponent(query.trim())}`

export const getPropertyMapSearchUrl = (query: string) => `/properties/map?q=${encodeURIComponent(query.trim())}`

export const fetchPropertySearchSuggestions = async (
  query: string,
  signal?: AbortSignal
): Promise<PropertySearchSuggestion[]> => {
  try {
    const response = await fetch(`${getAuthApiUrl('search/suggestions')}?q=${encodeURIComponent(query.trim())}`, {
      signal,
      cache: 'no-store',
      credentials: 'include',
    })
    if (!response.ok) return query.trim() ? [] : fallbackSuggestions
    const data = (await response.json()) as { suggestions?: PropertySearchSuggestion[] }
    return data.suggestions?.length ? data.suggestions : query.trim() ? [] : fallbackSuggestions
  } catch {
    return query.trim() ? [] : fallbackSuggestions
  }
}

export const fetchPropertySearch = async (
  query: string,
  signal?: AbortSignal,
  options: PropertySearchOptions = {}
): Promise<PropertySearchResponse> => {
  const params = new URLSearchParams({ q: query.trim() })
  if (options.discoveryChannel) params.set('channel', options.discoveryChannel)
  if (options.limit) params.set('limit', String(options.limit))
  const response = await fetch(`${getAuthApiUrl('properties/search')}?${params.toString()}`, {
    signal,
    cache: 'no-store',
    credentials: 'include',
  })
  if (!response.ok) throw new Error('property search failed')
  return response.json() as Promise<PropertySearchResponse>
}

export const fetchPropertyListingDetail = async (slug: string): Promise<PropertyListingDetail | null> => {
  try {
    const response = await fetch(`${getAuthApiUrl('listings')}/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })
    if (response.status === 404) return null
    if (!response.ok) throw new Error('property listing detail failed')
    return response.json() as Promise<PropertyListingDetail>
  } catch {
    return null
  }
}

export const fetchPropertyMapArea = async ({
  query = '',
  minLat,
  minLon,
  maxLat,
  maxLon,
  limit = 24,
  offset = 0,
  signal,
}: PropertyMapAreaSearchRequest): Promise<PropertySearchResponse> => {
  const params = new URLSearchParams({
    min_lat: String(minLat),
    min_lon: String(minLon),
    max_lat: String(maxLat),
    max_lon: String(maxLon),
    limit: String(limit),
    offset: String(offset),
  })
  if (query.trim()) params.set('q', query.trim())

  const response = await fetch(`${getAuthApiUrl('properties/search')}?${params}`, {
    signal,
    cache: 'no-store',
    credentials: 'include',
  })
  if (!response.ok) throw new Error('property map area search failed')
  return response.json() as Promise<PropertySearchResponse>
}
