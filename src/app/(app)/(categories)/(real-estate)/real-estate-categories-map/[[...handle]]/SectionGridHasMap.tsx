'use client'

import type { PropertyMapAreaSearch } from '@/components/map/LongdoPropertyMap'
import PropertyMapFilterBar, {
  emptyPropertyMapFilters,
  type PropertyMapFilterState,
  type PropertyMapSort,
} from '@/components/property-map/PropertyMapFilterBar'
import PropertyCard from '@/components/PropertyCard'
import { TRealEstateCategory } from '@/data/categories'
import { toRealEstateListing, TRealEstateListing } from '@/data/listings'
import { discoveryChannels, normalizeLegacyPropertyType } from '@/data/propertyTaxonomy'
import { fetchPropertyMapArea, fetchPropertySearch, PropertySearchListing } from '@/lib/propertySearch'
import clsx from 'clsx'
import { FC, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import MapFixedSection from '../../../MapFixedSection'

const GALLERY_HOVER_PREVIEW_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 744px) and (min-height: 600px)'
const subscribeGalleryHoverPreview = (callback: () => void) => {
  const mediaQuery = window.matchMedia(GALLERY_HOVER_PREVIEW_QUERY)
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}
const getGalleryHoverPreviewSnapshot = () => window.matchMedia(GALLERY_HOVER_PREVIEW_QUERY).matches
const getGalleryHoverPreviewServerSnapshot = () => false

interface Props {
  className?: string
  listings: TRealEstateListing[]
  category: TRealEstateCategory
  query?: string
  initialMapCenter?: { lat: number; lon: number }
  initialMapZoom?: number
}

const SectionGridHasMap: FC<Props> = ({
  className,
  listings,
  category,
  query = '',
  initialMapCenter,
  initialMapZoom,
}) => {
  const [currentHoverID, setCurrentHoverID] = useState<string>('')
  const [filters, setFilters] = useState<PropertyMapFilterState>(emptyPropertyMapFilters)
  const [sort, setSort] = useState<PropertyMapSort>('recommended')
  const [isQueryLoading, setIsQueryLoading] = useState(Boolean(query.trim()))
  const enableGalleryHoverPreview = useSyncExternalStore(
    subscribeGalleryHoverPreview,
    getGalleryHoverPreviewSnapshot,
    getGalleryHoverPreviewServerSnapshot
  )
  const [areaResults, setAreaResults] = useState<{ query: string; listings: TRealEstateListing[] } | null>(null)
  const [areaSearch, setAreaSearch] = useState<PropertyMapAreaSearch | null>(null)
  const hasInitialQuery = Boolean(query.trim())
  const currentQuery = query.trim()
  const hasResultsForCurrentQuery = areaResults?.query === currentQuery
  const resultSourceListings = useMemo(
    () => (hasResultsForCurrentQuery ? areaResults.listings : hasInitialQuery ? [] : listings),
    [areaResults, hasInitialQuery, hasResultsForCurrentQuery, listings]
  )

  const filteredListings = useMemo(() => {
    const selectedChannelPropertyTypes = new Set(
      filters.discoveryChannels.flatMap(
        (channelCode) => discoveryChannels.find((channel) => channel.code === channelCode)?.propertyTypeCodes || []
      )
    )

    const getListingPrices = (listing: TRealEstateListing) => {
      const prices: number[] = []
      const selectedOffers = filters.offerTypes.length ? filters.offerTypes : listing.offerTypes || []
      if ((!selectedOffers.length || selectedOffers.includes('sale')) && listing.salePrice)
        prices.push(listing.salePrice)
      if ((!selectedOffers.length || selectedOffers.includes('rent')) && listing.rentPriceMonthly)
        prices.push(listing.rentPriceMonthly)
      if (selectedOffers.some((offer) => ['business_transfer', 'sublease'].includes(offer)) && listing.salePrice)
        prices.push(listing.salePrice)
      return prices
    }

    const filtered = resultSourceListings.filter((listing) => {
      const normalizedType = normalizeLegacyPropertyType(listing.propertyTypeCode || listing.listingCategory)
      const listingOffers = listing.offerTypes || []
      const listingPrices = getListingPrices(listing)
      const minPrice = Number(filters.minPrice) || 0
      const maxPrice = Number(filters.maxPrice) || Number.POSITIVE_INFINITY
      const area = listing.usableAreaSqm || listing.landAreaSqm || listing.acreage || 0

      if (selectedChannelPropertyTypes.size && !selectedChannelPropertyTypes.has(normalizedType)) return false
      if (filters.propertyTypes.length && !filters.propertyTypes.includes(normalizedType)) return false
      if (filters.offerTypes.length && !filters.offerTypes.some((offer) => listingOffers.includes(offer))) return false
      if (
        (filters.minPrice || filters.maxPrice) &&
        !listingPrices.some((price) => price >= minPrice && price <= maxPrice)
      )
        return false
      if (filters.bedrooms && listing.bedrooms < filters.bedrooms) return false
      if (filters.bathrooms && listing.bathrooms < filters.bathrooms) return false
      if (filters.minArea && area < Number(filters.minArea)) return false
      if (filters.features.includes('owner_direct') && !listing.isOwnerDirect) return false
      if (filters.features.includes('verified') && !listing.isVerified) return false
      if (filters.features.includes('pets_allowed') && !listing.petAllowed) return false
      return true
    })

    const getSortPrice = (listing: TRealEstateListing) =>
      listing.rentPriceMonthly || listing.salePrice || Number.POSITIVE_INFINITY
    const getArea = (listing: TRealEstateListing) =>
      listing.usableAreaSqm || listing.landAreaSqm || listing.acreage || 0

    return [...filtered].sort((first, second) => {
      if (sort === 'newest') return new Date(second.date).getTime() - new Date(first.date).getTime()
      if (sort === 'price_low') return getSortPrice(first) - getSortPrice(second)
      if (sort === 'price_high') return getSortPrice(second) - getSortPrice(first)
      if (sort === 'area_large') return getArea(second) - getArea(first)
      return Number(second.isVerified) - Number(first.isVerified)
    })
  }, [filters, resultSourceListings, sort])

  const mapDatabaseListing = useCallback(
    (listing: PropertySearchListing, index: number): TRealEstateListing => {
      const fallback = listings[index % listings.length]
      const mapped = toRealEstateListing(listing)
      const isEventBooth =
        listing.space_type_code === 'event_booth' || listing.space_type_codes?.includes('event_booth')
      const isLand = listing.property_type_code === 'land'
      const landAreaSquareWah = isLand && listing.land_area_sqm ? Math.round(listing.land_area_sqm / 4) : 0
      return {
        ...fallback,
        ...mapped,
        map: { lat: listing.latitude!, lng: listing.longitude! },
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
    setIsQueryLoading(true)
    fetchPropertySearch(currentQuery, controller.signal)
      .then((response) => {
        const databaseResults = response.listings
          .filter((listing) => Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude))
          .map(mapDatabaseListing)
        setAreaResults({ query: currentQuery, listings: databaseResults })
        setIsQueryLoading(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setAreaResults({ query: currentQuery, listings: [] })
        setIsQueryLoading(false)
      })
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
    <div
      className={clsx(
        'relative flex min-h-[calc(100dvh-3.5rem)] gap-4 min-[744px]:min-h-[calc(100dvh-4rem)] xl:gap-6',
        className
      )}
    >
      <div id="heading" className="flex w-full flex-col gap-y-4 pb-32 lg:flex-[58_1_0%] lg:pb-10 xl:flex-[60_1_0%]">
        <PropertyMapFilterBar
          value={filters}
          onChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          resultCount={filteredListings.length}
          totalCount={resultSourceListings.length}
          query={query}
          loading={isQueryLoading}
        />
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 min-[744px]:grid-cols-3 min-[744px]:gap-x-3 lg:grid-cols-2 lg:gap-x-4 lg:gap-y-7 lg:pe-5 xl:grid-cols-3 xl:pe-0">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              onMouseEnter={() => setCurrentHoverID(listing.id)}
              onMouseLeave={() => setCurrentHoverID('')}
            >
              <PropertyCard
                data={listing}
                hoverPreviewGallery={enableGalleryHoverPreview}
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
        {!isQueryLoading && filteredListings.length === 0 && (
          <div className="rounded-3xl border border-[#dbe7e2] bg-[#f7faf8] px-6 py-10 text-center">
            <h2 className="text-lg font-semibold text-[#173f34]">ยังไม่พบประกาศที่ตรงกับเงื่อนไข</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {areaSearch || hasInitialQuery
                ? 'ลองขยายพื้นที่ค้นหาหรือลดตัวกรองบางข้อ'
                : 'ลองลดตัวกรองบางข้อเพื่อดูประกาศเพิ่มเติม'}
            </p>
            <button
              type="button"
              onClick={() => setFilters(emptyPropertyMapFilters)}
              className="mt-4 rounded-full border border-[#b9d4c8] bg-white px-4 py-2 text-sm font-semibold text-[#176b50] transition hover:bg-[#edf6f1]"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      <MapFixedSection
        closeButtonHref={`/real-estate-categories/${category.handle}#heading`}
        currentHoverID={currentHoverID}
        listings={filteredListings}
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
