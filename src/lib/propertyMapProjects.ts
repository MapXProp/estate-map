import type { TRealEstateListing } from '@/data/listings'
import { getAuthApiUrl } from './auth'
import { fetchPropertySearch, type PropertySearchListing } from './propertySearch'

export type PropertyMapMode = 'listings' | 'projects'
export const normalizeMapMode = (value: string, hasProject = false): PropertyMapMode =>
  value === 'projects' || (!value && hasProject) ? 'projects' : 'listings'

export const projectCategoryFilters = [
  { value: 'all', th: 'ทุกประเภท', en: 'All types' },
  { value: 'commercial_complex', th: 'ห้าง / พาณิชย์', en: 'Malls / retail' },
  { value: 'office_campus', th: 'อาคารสำนักงาน', en: 'Office buildings' },
  { value: 'housing_estate', th: 'หมู่บ้าน', en: 'Housing estates' },
  { value: 'condominium', th: 'คอนโด', en: 'Condominiums' },
  { value: 'mixed_use', th: 'มิกซ์ยูส', en: 'Mixed use' },
  { value: 'industrial_estate', th: 'นิคมอุตสาหกรรม', en: 'Industrial estates' },
  { value: 'other', th: 'โครงการอื่น ๆ', en: 'Other projects' },
] as const
export type ProjectCategoryFilter = (typeof projectCategoryFilters)[number]['value']
export const normalizeProjectCategoryFilter = (value: string): ProjectCategoryFilter =>
  projectCategoryFilters.find((option) => option.value === value)?.value || 'all'
export const matchesProjectCategory = (category: string, filter: ProjectCategoryFilter) =>
  filter === 'all' ||
  (filter === 'other'
    ? !projectCategoryFilters.some(
        (option) => option.value !== 'all' && option.value !== 'other' && option.value === category
      )
    : category === filter)

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
  displayName?: string
  category: string
  location: { lat: number; lon: number }
  listingIds: string[]
  listingCount?: number
  mapPromotionTier?: 'premium' | 'boosted' | 'free'
  mapPriorityWeight?: number
  latestListingAt?: string
}

const promotionRank = (tier: MapProject['mapPromotionTier']) => (tier === 'premium' ? 2 : tier === 'boosted' ? 1 : 0)
const publishedTime = (value?: string) => {
  const time = Date.parse(value || '')
  return Number.isFinite(time) ? time : 0
}

const projectCategoryPriority = (category: string) =>
  category === 'commercial_complex' ? 2 : category === 'office_campus' ? 1 : 0

// Malls and office buildings lead discovery; within each group use current
// promotions, the newest matching listing and the known listing count.
// These are discovery signals, not claims about a project's construction date or physical size.
export function compareMapProjectPriority(first: MapProject, second: MapProject) {
  return (
    projectCategoryPriority(second.category) - projectCategoryPriority(first.category) ||
    promotionRank(second.mapPromotionTier) - promotionRank(first.mapPromotionTier) ||
    (second.mapPriorityWeight || 0) - (first.mapPriorityWeight || 0) ||
    publishedTime(second.latestListingAt) - publishedTime(first.latestListingAt) ||
    (second.listingCount ?? second.listingIds.length) - (first.listingCount ?? first.listingIds.length) ||
    first.id.localeCompare(second.id)
  )
}

export type MapProjectDetails = {
  public_project_id: string
  slug: string
  name_th: string
  name_en: string
  display_name?: string
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
    displayName: project.display_name,
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
    let group = groups.get(key)
    if (group) group.listingIds.push(listing.id)
    else {
      group = {
        id: listing.projectPublicId,
        slug: listing.projectSlug,
        name: listing.projectName,
        nameEn: listing.projectNameEn,
        displayName: listing.projectDisplayName,
        category: listing.projectCategory,
        location,
        listingIds: [listing.id],
        listingCount: listing.projectListingCount,
      }
      groups.set(key, group)
    }
    if (publishedTime(listing.date) > publishedTime(group.latestListingAt)) group.latestListingAt = listing.date
    if (listing.projectListingCount !== undefined)
      group.listingCount = Math.max(group.listingCount || 0, listing.projectListingCount)
    const tier = listing.isMapPromoted ? listing.mapPromotionTier || 'free' : 'free'
    const weight = tier === 'free' ? 0 : Math.max(0, listing.mapPriorityWeight || 0)
    if (
      promotionRank(tier) > promotionRank(group.mapPromotionTier) ||
      (promotionRank(tier) === promotionRank(group.mapPromotionTier) && weight > (group.mapPriorityWeight || 0))
    ) {
      group.mapPromotionTier = tier
      group.mapPriorityWeight = weight
    }
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
