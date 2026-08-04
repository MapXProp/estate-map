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
  pet_allowed: boolean
  latitude?: number
  longitude?: number
  published_at?: string
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

export const getPropertyMapSearchUrl = (query: string) =>
  `/properties/map?q=${encodeURIComponent(query.trim())}`

export const fetchPropertySearchSuggestions = async (
  query: string,
  signal?: AbortSignal
): Promise<PropertySearchSuggestion[]> => {
  try {
    const response = await fetch(
      `${getAuthApiUrl('search/suggestions')}?q=${encodeURIComponent(query.trim())}`,
      { signal, cache: 'no-store', credentials: 'include' }
    )
    if (!response.ok) return query.trim() ? [] : fallbackSuggestions
    const data = (await response.json()) as { suggestions?: PropertySearchSuggestion[] }
    return data.suggestions?.length ? data.suggestions : query.trim() ? [] : fallbackSuggestions
  } catch {
    return query.trim() ? [] : fallbackSuggestions
  }
}

export const fetchPropertySearch = async (
  query: string,
  signal?: AbortSignal
): Promise<PropertySearchResponse> => {
  const response = await fetch(
    `${getAuthApiUrl('properties/search')}?q=${encodeURIComponent(query.trim())}`,
    { signal, cache: 'no-store', credentials: 'include' }
  )
  if (!response.ok) throw new Error('property search failed')
  return response.json() as Promise<PropertySearchResponse>
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
