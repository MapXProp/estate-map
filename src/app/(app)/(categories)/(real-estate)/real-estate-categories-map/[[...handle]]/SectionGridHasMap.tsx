'use client'

import ListingFilterTabs from '@/components/ListingFilterTabs'
import type { PropertyMapAreaSearch } from '@/components/map/LongdoPropertyMap'
import PropertyCard from '@/components/PropertyCard'
import { TRealEstateCategory } from '@/data/categories'
import { TRealEstateListing } from '@/data/listings'
import { TPropertyMapFilterOptions } from '@/data/propertyMapFilters'
import { fetchPropertyMapArea, fetchPropertySearch, PropertySearchListing } from '@/lib/propertySearch'
import Pagination from '@/shared/Pagination'
import clsx from 'clsx'
import { FC, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import MapFixedSection from '../../../MapFixedSection'

const GALLERY_AUTOPLAY_QUERY = '(min-width: 744px) and (min-height: 600px)'
const subscribeGalleryAutoPlay = (callback: () => void) => {
  const mediaQuery = window.matchMedia(GALLERY_AUTOPLAY_QUERY)
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}
const getGalleryAutoPlaySnapshot = () => window.matchMedia(GALLERY_AUTOPLAY_QUERY).matches
const getGalleryAutoPlayServerSnapshot = () => false

interface Props {
  className?: string
  listings: TRealEstateListing[]
  category: TRealEstateCategory
  filterOptions: TPropertyMapFilterOptions
  query?: string
  initialMapCenter?: { lat: number; lon: number }
  initialMapZoom?: number
}

const SectionGridHasMap: FC<Props> = ({
  className,
  listings,
  category,
  filterOptions,
  query = '',
  initialMapCenter,
  initialMapZoom,
}) => {
  const [currentHoverID, setCurrentHoverID] = useState<string>('')
  const enableGalleryAutoPlay = useSyncExternalStore(
    subscribeGalleryAutoPlay,
    getGalleryAutoPlaySnapshot,
    getGalleryAutoPlayServerSnapshot
  )
  const [areaResults, setAreaResults] = useState<{ query: string; listings: TRealEstateListing[] } | null>(null)
  const [areaSearch, setAreaSearch] = useState<PropertyMapAreaSearch | null>(null)
  const hasInitialQuery = Boolean(query.trim())
  const currentQuery = query.trim()
  const hasResultsForCurrentQuery = areaResults?.query === currentQuery
  const visibleListings = useMemo(
    () => (hasResultsForCurrentQuery ? areaResults.listings : hasInitialQuery ? [] : listings),
    [areaResults, hasInitialQuery, hasResultsForCurrentQuery, listings]
  )

  const mapDatabaseListing = useCallback(
    (listing: PropertySearchListing, index: number): TRealEstateListing => {
      const fallback = listings[index % listings.length]
      const amount = listing.rent_price_monthly ?? listing.sale_price
      const eventImage = listing.primary_image_url || ''
      const isEventBooth =
        listing.space_type_code === 'event_booth' || listing.space_type_codes?.includes('event_booth')
      const isLand = listing.property_type_code === 'land'
      const landAreaSquareWah = isLand && listing.land_area_sqm ? Math.round(listing.land_area_sqm / 4) : 0
      return {
        ...fallback,
        id: `property-listing://${listing.id}`,
        title: listing.title,
        handle: listing.slug || listing.public_listing_id,
        description: listing.description,
        date: listing.published_at || new Date().toISOString(),
        listingCategory: isEventBooth ? 'บูธออกงาน' : isLand ? 'ที่ดิน' : listing.property_type_code,
        address: [listing.address, listing.district, listing.province].filter(Boolean).join(', '),
        price: listing.price_on_request
          ? 'สอบถามผู้จัด'
          : amount
          ? `฿${amount.toLocaleString('th-TH')}${listing.rent_price_monthly ? ' / เดือน' : ''}`
          : 'ติดต่อผู้ลงประกาศ',
        featuredImage: eventImage,
        galleryImgs: eventImage ? [eventImage] : [],
        bedrooms: listing.bedroom_count || 0,
        bathrooms: listing.bathroom_count || 0,
        acreage: listing.land_area_sqm || listing.usable_area_sqm || 0,
        map: { lat: listing.latitude!, lng: listing.longitude! },
        reviewStart: 0,
        reviewCount: 0,
        saleOff: null,
        isAds: null,
        listingKind: isEventBooth ? 'event_booth' : 'property',
        isVerified: listing.is_verified,
        isOwnerDirect: listing.source_type === 'owner',
        metadataSummary: isEventBooth
          ? `${listing.event_round_count} รอบ · ${listing.event_floor_label ? `ชั้น ${listing.event_floor_label}` : listing.event_name}`
          : isLand
            ? `${landAreaSquareWah.toLocaleString('th-TH')} ตร.ว. · ที่ดินเปล่า`
            : '',
      }
    },
    [listings]
  )

  useEffect(() => {
    if (!currentQuery) return
    const controller = new AbortController()
    fetchPropertySearch(currentQuery, controller.signal)
      .then((response) => {
        const databaseResults = response.listings
          .filter((listing) => Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude))
          .map(mapDatabaseListing)
        setAreaResults({ query: currentQuery, listings: databaseResults })
      })
      .catch(() => setAreaResults({ query: currentQuery, listings: [] }))
    return () => controller.abort()
  }, [currentQuery, mapDatabaseListing])

  const handleSearchArea = useCallback(
    async (search: PropertyMapAreaSearch, listingIds: string[]) => {
      let nextResults: TRealEstateListing[] = []

      try {
        const response = await fetchPropertyMapArea({
          query: search.filters.q || query,
          minLat: search.bounds.minLat,
          minLon: search.bounds.minLon,
          maxLat: search.bounds.maxLat,
          maxLon: search.bounds.maxLon,
          limit: 40,
        })
        const databaseResults = response.listings
          .filter((listing) => Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude))
          .map(mapDatabaseListing)
        nextResults = databaseResults
      } catch {}

      setAreaResults({ query: currentQuery, listings: nextResults })
      setAreaSearch(search)
      setCurrentHoverID('')
      return nextResults.length
    },
    [currentQuery, mapDatabaseListing, query]
  )

  return (
    <div className={clsx('relative flex min-h-screen gap-4 xl:gap-6', className)}>
      <div
        id="heading"
        className="flex w-full flex-col gap-y-3 pt-3 pb-32 min-[744px]:pt-4 lg:flex-[62_1_0%] lg:pb-20 xl:flex-[68_1_0%]"
      >
        <ListingFilterTabs
          filterOptions={filterOptions}
          variant="property-map"
          visibleFilterCount={4}
          hideInlineControls
        />
        <div className="grid grid-cols-2 gap-x-2 gap-y-6 min-[744px]:grid-cols-3 min-[744px]:gap-x-3 lg:gap-y-8 lg:pe-5 xl:grid-cols-4 xl:gap-x-4 xl:pe-0">
          {visibleListings.map((listing, index) => (
            <div
              key={listing.id}
              onMouseEnter={() => setCurrentHoverID(listing.id)}
              onMouseLeave={() => setCurrentHoverID('')}
            >
              <PropertyCard
                data={listing}
                autoPlayGallery={enableGalleryAutoPlay}
                autoPlayDelay={(index % 4) * 320}
                compactMobile
                openInNewTab
                openInNewTabOnMobile
                showQuickView
              />
            </div>
          ))}
        </div>
        {hasInitialQuery && !hasResultsForCurrentQuery && (
          <div className="rounded-3xl border border-[#dbe7e2] bg-[#f7faf8] px-6 py-10 text-center">
            <h2 className="text-lg font-semibold text-[#173f34]">กำลังค้นหาประกาศในพื้นที่นี้</h2>
          </div>
        )}
        {(areaSearch || (hasInitialQuery && hasResultsForCurrentQuery)) && visibleListings.length === 0 && (
          <div className="rounded-3xl border border-[#dbe7e2] bg-[#f7faf8] px-6 py-10 text-center">
            <h2 className="text-lg font-semibold text-[#173f34]">ยังไม่พบประกาศในบริเวณนี้</h2>
            <p className="mt-1 text-sm text-neutral-500">ลองเลื่อนหรือซูมแผนที่ออก แล้วกดค้นหาในบริเวณนี้อีกครั้ง</p>
          </div>
        )}
        <div className="mt-16 flex items-center">
          <Pagination />
        </div>
      </div>

      <MapFixedSection
        closeButtonHref={`/real-estate-categories/${category.handle}#heading`}
        currentHoverID={currentHoverID}
        listings={visibleListings}
        searchSourceListings={listings}
        onSearchArea={handleSearchArea}
        initialMapCenter={initialMapCenter}
        initialMapZoom={initialMapZoom}
        listingType="RealEstates"
        splitAtLg
        resultCount={category.count}
      />
    </div>
  )
}

export default SectionGridHasMap
