import type { PropertySearchSuggestion } from './propertySearch'
import { getTransitStation, transitStationPlace } from './transitStations'

export type ListingPoint = { lng: number; lat: number }
export type ListingPlace = { id: string; label: string; address: string; point: ListingPoint; zoom: number }
export const isListingPoint = (p: ListingPoint) =>
  Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat >= 5 && p.lat <= 21 && p.lng >= 97 && p.lng <= 106
export const sameListingPoint = (a: ListingPoint, b: ListingPoint) =>
  Math.abs(a.lat - b.lat) < 0.00000001 && Math.abs(a.lng - b.lng) < 0.00000001

export function listingPlaces(suggestions: PropertySearchSuggestion[]): ListingPlace[] {
  const seen = new Set<string>()
  const visibleRoads = new Set<string>()
  return suggestions
    .flatMap((s) => {
      const station = getTransitStation(s.stationId)
      const place = s.place || (station ? transitStationPlace(station) : undefined)
      const lat = place?.lat ?? s.project?.latitude,
        lng = place?.lon ?? s.project?.longitude
      if (lat == null || lng == null || !isListingPoint({ lat, lng })) return []
      const id = `${s.label}:${lat.toFixed(6)},${lng.toFixed(6)}`
      if (seen.has(id)) return []
      seen.add(id)
      const address =
        place?.address ||
        (s.project ? [s.project.district, s.project.province].filter(Boolean).join(' · ') : s.detail || '')
      const road = /^(?:ถนน|ซอย|ทางหลวง)/.test(s.label)
      // Multiple geometry points on one road can have identical visible labels.
      // Keep a single starting point when no address distinguishes the segments.
      if (road) {
        const visible = `${s.label.trim()}:${address.trim()}`
        if (visibleRoads.has(visible)) return []
        visibleRoads.add(visible)
      }
      return [
        {
          id,
          label: s.label,
          address,
          point: { lat, lng },
          // A road/area is a starting point, not a confirmed building location.
          zoom: place?.zoom && place.zoom < 15 ? place.zoom : road ? 16 : 18,
        },
      ]
    })
    .slice(0, 6)
}

export function parseListingCoordinates(value: string): ListingPoint | null {
  const match = value.trim().match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))\s*(?:[,，]\s*|\s+)(-?(?:\d+(?:\.\d+)?|\.\d+))$/)
  if (!match) return null
  const point = { lat: Number(match[1]), lng: Number(match[2]) }
  return isListingPoint(point) ? point : null
}
