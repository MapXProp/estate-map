import { normalizeLegacyPropertyType } from '@/data/propertyTaxonomy'
import { getAuthApiUrl } from './auth'
import { parseBrowseState, type BrowseState } from './propertyBrowse'
import type { PropertyLandingMode } from './propertyLandingRows'
import { mapCategoryGroups, mapCategoryQueries, matchesMapDetails } from './propertyMapSearch'
import { getPropertyPrices } from './propertyPrices'
import type { PropertySearchListing, PropertySearchResponse } from './propertySearch'
import type { SearchHistoryEvent } from './propertySearchHistory'
import { getTransitStation } from './transitStations'

export type PropertyInterest = {
  id: string
  event: SearchHistoryEvent
  state: BrowseState
  weight: number
  count: number
  center?: { lat: number; lon: number }
  radiusKm: number
  project: string
}
export type PropertyRecommendation = {
  listing: PropertySearchListing
  interest: PropertyInterest
  score: number
  distanceKm?: number
  offers: string[]
}
const day = 86400000
const validCenter = (lat: number, lon: number) =>
  Number.isFinite(lat) && Number.isFinite(lon) && lat >= 5 && lat <= 21 && lon >= 97 && lon <= 107

// Keep each search's constraints together. A rental budget in one neighborhood
// must never become a purchase budget for a different search.
export function buildPropertyInterests(events: SearchHistoryEvent[], now = Date.now()): PropertyInterest[] {
  const interests = new Map<string, PropertyInterest>()
  const dailyCounts = new Map<string, number>()
  for (const event of [...events].sort((a, b) => b.searchedAt - a.searchedAt).slice(0, 100)) {
    const age = now - event.searchedAt
    if (!Number.isFinite(age) || age < -60000 || age > 90 * day) continue
    const url = new URL(event.url, 'https://mapxprop.com')
    if (
      url.origin !== 'https://mapxprop.com' ||
      !['/properties/map', '/real-estate-categories/all'].includes(url.pathname)
    )
      continue
    const params = url.searchParams,
      state = parseBrowseState(params)
    const station = getTransitStation(params.get('station') || '')
    const lat = station?.latitude ?? Number(params.get('lat') ?? NaN)
    const lon = station?.longitude ?? Number(params.get('lon') ?? NaN)
    const center = validCenter(lat, lon) ? { lat, lon } : undefined
    const zoom = Number(params.get('zoom')) || 13
    const radiusKm = station ? 2 : zoom >= 15 ? 3 : zoom >= 13 ? 10 : zoom >= 11 ? 25 : 60
    const project = params.get('project') || ''
    const f = state.filters
    if (f.minPrice && f.maxPrice && Number(f.minPrice) > Number(f.maxPrice)) continue
    const narrowTypes = new Set(state.categories.map((id) => id.split(':')[1])).size
    // A plain "all homes" visit is not evidence of a personal preference.
    if (
      !center &&
      !project &&
      !state.query &&
      !(narrowTypes > 0 && narrowTypes <= 4) &&
      f.offerTypes.length !== 1 &&
      !f.minPrice &&
      !f.maxPrice &&
      !f.bedrooms &&
      !f.bathrooms &&
      !f.minArea &&
      !f.features.length
    )
      continue
    const id = JSON.stringify({
      location: project || (center ? [lat.toFixed(3), lon.toFixed(3), radiusKm] : state.query.toLowerCase()),
      categories: [...state.categories].sort(),
      offers: [...f.offerTypes].sort(),
      min: f.minPrice,
      max: f.maxPrice,
      beds: f.bedrooms,
      baths: f.bathrooms,
      area: f.minArea,
      features: [...f.features].sort(),
    })
    const dailyKey = id + ':' + Math.floor(event.searchedAt / day)
    const dailyCount = dailyCounts.get(dailyKey) || 0
    dailyCounts.set(dailyKey, dailyCount + 1)
    const contribution = dailyCount < 3 ? Math.pow(0.5, Math.max(0, age) / (14 * day)) : 0
    const existing = interests.get(id)
    if (existing) {
      existing.weight += contribution
      existing.count++
      continue
    }
    interests.set(id, { id, event, state, center, radiusKm, project, weight: contribution, count: 1 })
  }
  return [...interests.values()]
    .sort((a, b) => b.weight - a.weight || b.event.searchedAt - a.event.searchedAt)
    .slice(0, 3)
}

export function preferenceDistanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180
  const dlat = (b.lat - a.lat) * rad,
    dlon = (b.lon - a.lon) * rad
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)))
}

export function preferenceCandidateRequests(
  interest: PropertyInterest,
  mode: PropertyLandingMode,
  offer?: 'sale' | 'rent'
) {
  const f = interest.state.filters
  if (offer && f.offerTypes.length === 1 && !f.offerTypes.includes(offer)) return []
  return mapCategoryQueries(interest.state.categories).flatMap((category) => {
    if (mode !== 'all' && category.discoveryChannel && category.discoveryChannel !== mode) return []
    const params = new URLSearchParams({ limit: '40' })
    const channel = mode === 'all' ? category.discoveryChannel : mode
    if (channel) params.set('channel', channel)
    category.propertyTypes?.forEach((type) => params.append('property_type', type))
    category.spaceTypes?.forEach((type) => params.append('space_type', type))
    ;(offer ? [offer] : f.offerTypes).forEach((type) => params.append('offer_type', type))
    if (f.minPrice) params.set('price_min', f.minPrice)
    if (f.maxPrice) params.set('price_max', f.maxPrice)
    if (interest.project) params.set('project', interest.project)
    else if (interest.center) {
      const { lat, lon } = interest.center
      const deltaLat = interest.radiusKm / 110.5
      const deltaLon = interest.radiusKm / (111 * Math.cos((lat * Math.PI) / 180))
      params.set('min_lat', String(lat - deltaLat))
      params.set('max_lat', String(lat + deltaLat))
      params.set('min_lon', String(lon - deltaLon))
      params.set('max_lon', String(lon + deltaLon))
    } else if (interest.state.query) params.set('q', interest.state.query)
    return [params.toString()]
  })
}

// Recheck numeric constraints after fetching. Unknown prices, mixed periods and
// points outside the actual radius cannot be described as matching a budget/area.
export function matchPropertyInterest(
  listing: PropertySearchListing,
  interest: PropertyInterest,
  offer?: 'sale' | 'rent'
): PropertyRecommendation | null {
  const f = interest.state.filters
  if (!matchesMapDetails(listing, f)) return null
  if (interest.state.categories.length) {
    const selected = new Set(interest.state.categories)
    const type = normalizeLegacyPropertyType(listing.property_type_code)
    const spaces = [listing.space_type_code, ...(listing.space_type_codes || [])]
    if (
      !mapCategoryGroups.some((group) =>
        group.options.some(
          (option) =>
            selected.has(option.id) &&
            ((option.propertyType && option.propertyType === type) ||
              (option.spaceType && spaces.includes(option.spaceType)))
        )
      )
    )
      return null
  }
  if (interest.project && ![listing.project_slug, listing.project_public_id].includes(interest.project)) return null
  let distanceKm: number | undefined
  if (interest.center && !interest.project) {
    if (!validCenter(listing.latitude ?? NaN, listing.longitude ?? NaN)) return null
    distanceKm = preferenceDistanceKm(interest.center, { lat: listing.latitude!, lon: listing.longitude! })
    if (distanceKm > interest.radiusKm) return null
  }
  const offers = offer ? [offer] : f.offerTypes
  const prices = getPropertyPrices(listing).filter(
    (price) =>
      offers.includes(price.offerType as (typeof offers)[number]) ||
      (offers.includes('rent') && ['sublease', 'event_booking', 'contact_organizer'].includes(price.offerType))
  )
  const hasBudget = Boolean(f.minPrice || f.maxPrice)
  const matchingPrices = prices.filter(
    (price) =>
      !hasBudget ||
      (price.currency === 'THB' &&
        price.amount &&
        (['sale', 'business_transfer'].includes(price.offerType)
          ? !price.unit || price.unit === 'total'
          : price.unit === 'month') &&
        (!f.minPrice || price.amount >= Number(f.minPrice)) &&
        (!f.maxPrice || price.amount <= Number(f.maxPrice)))
  )
  if (!matchingPrices.length) return null
  return {
    listing,
    interest,
    distanceKm,
    offers: [...new Set(matchingPrices.map((price) => price.offerType))],
    score: interest.weight * (2 + (distanceKm === undefined ? 0 : 1 - distanceKm / interest.radiusKm)),
  }
}

export async function fetchPropertyRecommendations(
  interests: PropertyInterest[],
  mode: PropertyLandingMode,
  offer: 'sale' | 'rent' | undefined,
  signal: AbortSignal
) {
  const requests = new Map<string, Promise<PropertySearchListing[]>>()
  let failures = 0
  const load = (query: string) => {
    if (!requests.has(query))
      requests.set(
        query,
        (async () => {
          const response = await fetch(getAuthApiUrl('properties/search') + '?' + query, { signal, cache: 'no-store' })
          if (!response.ok) throw new Error('Recommendations unavailable')
          const data = (await response.json()) as PropertySearchResponse
          if (!Array.isArray(data.listings)) throw new Error('Invalid property results')
          return data.listings
        })()
      )
    return requests.get(query)!
  }
  const matches = await Promise.all(
    interests.map(async (interest) => {
      const responses = await Promise.allSettled(preferenceCandidateRequests(interest, mode, offer).map(load))
      signal.throwIfAborted()
      const listings = new Map<number, PropertySearchListing>()
      for (const response of responses) {
        if (response.status === 'rejected') {
          failures++
          continue
        }
        for (const listing of response.value) if (listing.slug) listings.set(listing.id, listing)
      }
      return [...listings.values()].flatMap((listing) => {
        const match = matchPropertyInterest(listing, interest, offer)
        return match ? [match] : []
      })
    })
  )
  const best = new Map<number, PropertyRecommendation>()
  for (const match of matches.flat()) {
    const previous = best.get(match.listing.id)
    if (!previous || match.score > previous.score) best.set(match.listing.id, match)
  }
  return {
    recommendations: [...best.values()].sort((a, b) => b.score - a.score || b.listing.id - a.listing.id).slice(0, 4),
    failed: failures > 0,
  }
}

export function propertyRecommendationReason(item: PropertyRecommendation, th: boolean) {
  if (item.distanceKm !== undefined)
    return th
      ? `ห่างจุดที่ค้นหา ${item.distanceKm.toFixed(1)} กม.`
      : `${item.distanceKm.toFixed(1)} km from your search point`
  if (item.interest.project) return th ? 'ในโครงการที่คุณค้นหา' : 'In a project you searched for'
  return th ? 'ตรงกับตัวเลือกที่คุณค้นหา' : 'Matches your search choices'
}
