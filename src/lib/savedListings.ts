import { fetchWithAuthRetry, getAuthApiUrl } from '@/lib/auth'
import type { PropertySearchListing } from '@/lib/propertySearch'

export const GUEST_SAVED_LISTINGS_KEY = 'mapxprop_guest_saved_listings_v1'
export const MAX_GUEST_SAVED_LISTINGS = 100

export type SavedListingReference = {
  public_listing_id: string
  slug: string
}

export type SavedListingsResponse = {
  listings: PropertySearchListing[]
  references: SavedListingReference[]
  total: number
  merged?: number
}

const cleanIdentifier = (value: unknown) => {
  if (typeof value !== 'string') return ''
  const identifier = value.trim()
  if (!identifier || identifier.length > 160 || identifier.includes('/')) return ''
  return identifier
}

export const cleanSavedListingIdentifiers = (values: unknown) => {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values.map(cleanIdentifier).filter(Boolean))).slice(0, MAX_GUEST_SAVED_LISTINGS)
}

export const readGuestSavedListings = () => {
  if (typeof window === 'undefined') return []
  try {
    return cleanSavedListingIdentifiers(JSON.parse(localStorage.getItem(GUEST_SAVED_LISTINGS_KEY) || '[]'))
  } catch {
    localStorage.removeItem(GUEST_SAVED_LISTINGS_KEY)
    return []
  }
}

export const writeGuestSavedListings = (identifiers: string[]) => {
  if (typeof window === 'undefined') return
  const cleaned = cleanSavedListingIdentifiers(identifiers)
  if (cleaned.length) localStorage.setItem(GUEST_SAVED_LISTINGS_KEY, JSON.stringify(cleaned))
  else localStorage.removeItem(GUEST_SAVED_LISTINGS_KEY)
}

const parseSavedListingsResponse = async (response: Response) => {
  if (!response.ok) throw new Error('saved listings request failed')
  const data = (await response.json()) as Partial<SavedListingsResponse>
  return {
    listings: Array.isArray(data.listings) ? data.listings : [],
    references: Array.isArray(data.references) ? data.references : [],
    total: typeof data.total === 'number' ? data.total : 0,
    merged: data.merged,
  } satisfies SavedListingsResponse
}

export const fetchMySavedListings = async () => {
  const response = await fetchWithAuthRetry(getAuthApiUrl('me/saved-listings'), {
    cache: 'no-store',
    credentials: 'include',
  })
  return parseSavedListingsResponse(response)
}

export const mergeMySavedListings = async (listingIdentifiers: string[]) => {
  const response = await fetchWithAuthRetry(getAuthApiUrl('me/saved-listings/merge'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_identifiers: cleanSavedListingIdentifiers(listingIdentifiers) }),
  })
  return parseSavedListingsResponse(response)
}

export const saveMyListing = async (identifier: string) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`me/saved-listings/${encodeURIComponent(cleanIdentifier(identifier))}`),
    { method: 'PUT', credentials: 'include' }
  )
  if (!response.ok) throw new Error('cannot save listing')
}

export const unsaveMyListing = async (identifier: string) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`me/saved-listings/${encodeURIComponent(cleanIdentifier(identifier))}`),
    { method: 'DELETE', credentials: 'include' }
  )
  if (!response.ok) throw new Error('cannot remove saved listing')
}
