import type { TRealEstateListing } from '@/data/listings'
import { getAuthApiUrl } from './auth'
import { fetchPropertySearch, type PropertySearchListing } from './propertySearch'

export type PropertyMapMode = 'listings' | 'projects'
export const normalizeMapMode = (value: string, hasProject = false): PropertyMapMode =>
  value === 'projects' || (!value && hasProject) ? 'projects' : 'listings'

export const projectCategoryLabel = (category: string, th: boolean) => {
  const labels: Record<string, [string, string]> = {
    housing_estate: ['โครงการบ้าน', 'Housing project'],
    condominium: ['โครงการคอนโด', 'Condominium'],
    commercial_complex: ['ห้าง / โครงการพาณิชย์', 'Mall / commercial project'],
    mixed_use: ['โครงการมิกซ์ยูส', 'Mixed-use project'],
    office_campus: ['กลุ่มอาคารสำนักงาน', 'Office campus'],
    industrial_estate: ['นิคมอุตสาหกรรม', 'Industrial estate'],
  }
  return labels[category]?.[th ? 0 : 1] || (th ? 'โครงการอสังหาฯ' : 'Property project')
}

export type MapProject = {
  id: string
  slug: string
  name: string
  nameEn: string
  category: string
  location: { lat: number; lon: number }
  listingIds: string[]
  listingCount?: number
}

export type MapProjectDetails = {
  public_project_id: string
  slug: string
  name_th: string
  name_en: string
  project_category: string
  district: string
  province: string
  latitude?: number
  longitude?: number
  aliases?: string[]
  listing_count?: number
}

export function mapProjectSearchSeed(project: MapProjectDetails, fallback?: MapProject): MapProject | undefined {
  const location = validProjectLocation(project.latitude, project.longitude)
    ? { lat: project.latitude!, lon: project.longitude! }
    : fallback?.id === project.public_project_id
      ? fallback.location
      : undefined
  if (!location) return undefined
  return {
    id: project.public_project_id,
    slug: project.slug,
    name: project.name_th,
    nameEn: project.name_en,
    category: project.project_category,
    location,
    listingIds: fallback?.id === project.public_project_id ? fallback.listingIds : [],
    listingCount: project.listing_count,
  }
}

export const validProjectLocation = (lat: unknown, lon: unknown): boolean =>
  typeof lat === 'number' &&
  Number.isFinite(lat) &&
  Math.abs(lat) <= 90 &&
  typeof lon === 'number' &&
  Number.isFinite(lon) &&
  Math.abs(lon) <= 180

// Registered projects only. A matching name or coordinate alone is not membership.
// Without a project coordinate, group only coincident units at their stored point.
export function groupMapProjects(listings: TRealEstateListing[]): MapProject[] {
  const groups = new Map<string, MapProject>()
  for (const listing of [...listings].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!listing.projectPublicId || !listing.projectName) continue
    const knownCenter = validProjectLocation(listing.projectLatitude, listing.projectLongitude)
    if (!knownCenter && !validProjectLocation(listing.map.lat, listing.map.lng)) continue
    const location = knownCenter
      ? { lat: listing.projectLatitude!, lon: listing.projectLongitude! }
      : { lat: listing.map.lat, lon: listing.map.lng }
    const key = `${listing.projectPublicId}:${location.lat.toFixed(7)}:${location.lon.toFixed(7)}`
    const group = groups.get(key)
    if (group) group.listingIds.push(listing.id)
    else
      groups.set(key, {
        id: listing.projectPublicId,
        slug: listing.projectSlug,
        name: listing.projectName,
        nameEn: listing.projectNameEn,
        category: listing.projectCategory,
        location,
        listingIds: [listing.id],
        listingCount: listing.projectListingCount,
      })
  }
  return [...groups.values()]
}

export async function fetchMapProject(identifier: string, signal: AbortSignal): Promise<MapProjectDetails> {
  const response = await fetch(getAuthApiUrl(`projects/${encodeURIComponent(identifier)}`), {
    signal,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Project unavailable')
  const { project } = (await response.json()) as { project: MapProjectDetails }
  if (!project || (project.public_project_id !== identifier && project.slug !== identifier))
    throw new Error('Project identity mismatch')
  return project
}

// This is a fresh project query, independent of map/category/price filters.
// Fetch every page, including units without coordinates, and fail closed if an
// older API ignores the exact project filter.
export async function fetchMapProjectListings(
  identifier: string,
  signal: AbortSignal
): Promise<PropertySearchListing[]> {
  if (!identifier.trim()) throw new Error('Missing project')
  const combined = new Map<string, PropertySearchListing>()
  let offset = 0
  while (true) {
    signal.throwIfAborted()
    const page = await fetchPropertySearch('', signal, { project: identifier, limit: 60, offset })
    signal.throwIfAborted()
    if (!page.listings.length) {
      if (offset === 0 && page.total === 0) return []
      throw new Error('Incomplete project results')
    }
    const previousSize = combined.size
    for (const listing of page.listings) {
      if (listing.project_public_id !== identifier && listing.project_slug !== identifier)
        throw new Error('Project membership mismatch')
      combined.set(listing.public_listing_id, listing)
    }
    if (combined.size === previousSize) throw new Error('Project pagination did not advance')
    offset += page.listings.length
    if (offset >= page.total) return [...combined.values()]
  }
}

export const hasProjectOffer = (listing: PropertySearchListing, offer: 'sale' | 'rent') =>
  offer === 'sale'
    ? Boolean(
        listing.sale_price ||
        listing.offer_type === 'sale' ||
        listing.listing_type === 'sale' ||
        listing.listing_type === 'sale_rent'
      )
    : Boolean(
        listing.rent_price_monthly ||
        listing.offer_type === 'rent' ||
        listing.listing_type === 'rent' ||
        listing.listing_type === 'sale_rent'
      )
