'use client'

import AvatarDropdown from '@/components/Header/AvatarDropdown'
import LongdoPropertyMap, {
  type PropertyMapAreaSearch,
  type PropertyMapBounds,
} from '@/components/map/LongdoPropertyMap'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { toRealEstateListing } from '@/data/listings'
import { getOfferType, type DiscoveryChannelCode, type OfferTypeCode } from '@/data/propertyTaxonomy'
import {
  fetchCompleteMapSearch,
  hasMapCoordinates,
  initialMapCategories,
  isLandOnlyMapSelection,
  landMapCategoryIds,
  mapCategoryGroups,
  mapListingPrice,
  matchesMapDetails,
} from '@/lib/propertyMapSearch'
import type { PropertySearchListing } from '@/lib/propertySearch'
import Logo from '@/shared/Logo'
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  House,
  KeyRound,
  LandPlot,
  List,
  LoaderCircle,
  MapPin,
  PanelLeftClose,
  RotateCcw,
  SlidersHorizontal,
  Store,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import MapResultCard from './MapResultCard'
import MapSearchDetails from './MapSearchDetails'
import { emptyPropertyMapFilters, type PropertyMapFilterState, type PropertyMapSort } from './PropertyMapFilterBar'
import styles from './PropertyMapSearch.module.css'

const emptyRows: PropertySearchListing[] = []
const subscribeShortViewport = (onChange: () => void) => {
  const media = window.matchMedia('(max-height: 500px)')
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
const getShortViewport = () => window.matchMedia('(max-height: 500px)').matches
const getServerShortViewport = () => false
const groupIcons = { homes: House, business: Building2, rooms: KeyRound }
const groupNames = {
  homes: ['ที่อยู่อาศัย', 'Homes'],
  business: ['พื้นที่ธุรกิจ', 'Business'],
  rooms: ['ห้องเช่ารายเดือน', 'Monthly stays'],
}
const offerOptions: Array<{ value: OfferTypeCode; th: string; en: string }> = [
  { value: 'sale', th: 'ซื้อ', en: 'Buy' },
  { value: 'rent', th: 'เช่า', en: 'Rent' },
  { value: 'business_transfer', th: 'เซ้งกิจการ', en: 'Business transfer' },
  { value: 'sublease', th: 'เช่าช่วง', en: 'Sublease' },
]

export default function PropertyMapSearch({
  query = '',
  initialMapCenter,
  initialMapZoom,
  initialFilters = {},
  initialCategories = [],
}: {
  query?: string
  initialMapCenter?: { lat: number; lon: number }
  initialMapZoom?: number
  initialFilters?: Partial<PropertyMapFilterState>
  initialCategories?: string[]
}) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const [categories, setCategories] = useState(() => initialMapCategories(initialFilters, initialCategories))
  const [filters, setFilters] = useState<PropertyMapFilterState>(() => ({
    ...emptyPropertyMapFilters,
    ...initialFilters,
  }))
  const [keyword, setKeyword] = useState(query)
  const [mobileGroup, setMobileGroup] = useState<DiscoveryChannelCode>(
    () => initialFilters.discoveryChannels?.[0] || 'homes'
  )
  const shortViewport = useSyncExternalStore(subscribeShortViewport, getShortViewport, getServerShortViewport)
  const [categoriesOverride, setCategoriesOpen] = useState<boolean>()
  const categoriesOpen = categoriesOverride ?? !shortViewport
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState('')
  const [sort, setSort] = useState<PropertyMapSort>('recommended')
  const [pagination, setPagination] = useState({ key: '', count: 20 })
  const [area, setArea] = useState<PropertyMapBounds | null>(null)
  const [viewportDirty, setViewportDirty] = useState(false)
  const [areaRequestId, setAreaRequestId] = useState(0)
  const [retry, setRetry] = useState(0)
  const [center, setCenter] = useState(initialMapCenter)
  const [zoom, setZoom] = useState(initialMapZoom || 12)
  const [resizeId, setResizeId] = useState(0)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [load, setLoad] = useState<{
    key: string
    rows: PropertySearchListing[]
    status: 'loading' | 'ready' | 'error'
  }>({ key: '', rows: [], status: 'loading' })
  const requestKey = JSON.stringify({
    keyword,
    categories: [...categories].sort(),
    offers: [...filters.offerTypes].sort(),
    min: filters.minPrice,
    max: filters.maxPrice,
    retry,
  })
  const rows = load.key === requestKey ? load.rows : emptyRows
  const loading = load.key !== requestKey || load.status === 'loading'
  const failed = load.key === requestKey && load.status === 'error'
  const invalidPrice = Boolean(
    filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice)
  )
  const resultsKey = JSON.stringify({
    requestKey,
    area,
    sort,
    beds: filters.bedrooms,
    baths: filters.bathrooms,
    minArea: filters.minArea,
    features: filters.features,
  })
  const visibleCount = pagination.key === resultsKey ? pagination.count : 20

  useEffect(() => {
    const controller = new AbortController()
    const request = JSON.parse(requestKey) as {
      keyword: string
      categories: string[]
      offers: OfferTypeCode[]
      min: string
      max: string
    }
    const timer = setTimeout(async () => {
      if (request.min && request.max && Number(request.min) > Number(request.max)) {
        setLoad({ key: requestKey, rows: [], status: 'ready' })
        return
      }
      setLoad({ key: requestKey, rows: [], status: 'loading' })
      try {
        const complete = await fetchCompleteMapSearch(
          request.keyword,
          request.categories,
          {
            offerTypes: request.offers,
            minPrice: request.min,
            maxPrice: request.max,
          },
          controller.signal,
          (progress) => setLoad({ key: requestKey, rows: progress, status: 'loading' })
        )
        if (!controller.signal.aborted) setLoad({ key: requestKey, rows: complete, status: 'ready' })
      } catch {
        if (!controller.signal.aborted) {
          controller.abort()
          setLoad((previous) => ({
            key: requestKey,
            rows: previous.key === requestKey ? previous.rows : [],
            status: 'error',
          }))
        }
      }
    }, 180)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [requestKey])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    ;[
      'q',
      'channel',
      'property_type',
      'space_type',
      'category',
      'offer_type',
      'price_min',
      'price_max',
      'bedrooms',
      'bathrooms',
      'area_min',
      'feature',
    ].forEach((key) => params.delete(key))
    if (keyword) params.set('q', keyword)
    categories.forEach((id) => params.append('category', id))
    filters.offerTypes.forEach((offer) => params.append('offer_type', offer))
    if (filters.minPrice) params.set('price_min', filters.minPrice)
    if (filters.maxPrice) params.set('price_max', filters.maxPrice)
    if (filters.bedrooms) params.set('bedrooms', String(filters.bedrooms))
    if (filters.bathrooms) params.set('bathrooms', String(filters.bathrooms))
    if (filters.minArea) params.set('area_min', filters.minArea)
    filters.features.forEach((feature) => params.append('feature', feature))
    if (center) {
      params.set('lat', String(center.lat))
      params.set('lon', String(center.lon))
      params.set('zoom', String(zoom))
      params.delete('location')
    }
    if (window.location.pathname === '/properties/map')
      window.history.replaceState(window.history.state, '', `/properties/map${params.size ? `?${params}` : ''}`)
  }, [categories, center, filters, keyword, zoom])

  useEffect(() => {
    const container = resultsRef.current
    if (container) container.scrollTop = 0
  }, [resultsKey])

  const matchingRows = useMemo(() => rows.filter((listing) => matchesMapDetails(listing, filters)), [rows, filters])
  const mapRows = useMemo(() => matchingRows.filter(hasMapCoordinates), [matchingRows])
  const mapListings = useMemo(
    () =>
      mapRows.map((listing) => {
        const result = { ...toRealEstateListing(listing), map: { lat: listing.latitude!, lng: listing.longitude! } }
        const amount = mapListingPrice(listing, filters.offerTypes)
        if (filters.offerTypes.length === 1) {
          const offer = filters.offerTypes[0]
          return {
            ...result,
            priceAmount: amount || undefined,
            priceUnit:
              offer === 'sale'
                ? ''
                : offer === 'rent' && listing.rent_price_monthly
                  ? 'month'
                  : listing.offer_price_unit,
            offer: getOfferType(offer)?.nameTh || result.offer,
          }
        }
        return result
      }),
    [mapRows, filters.offerTypes]
  )
  const displayed = useMemo(() => {
    const selected = mapListings.filter(
      ({ map }) =>
        !area || (map.lat >= area.minLat && map.lat <= area.maxLat && map.lng >= area.minLon && map.lng <= area.maxLon)
    )
    return selected.sort((a, b) => {
      if (sort === 'price_low' || sort === 'price_high') {
        if (!a.priceAmount || !b.priceAmount) return Number(!a.priceAmount) - Number(!b.priceAmount)
        return sort === 'price_low' ? a.priceAmount - b.priceAmount : b.priceAmount - a.priceAmount
      }
      if (sort === 'area_large') return b.acreage - a.acreage
      if (sort === 'recommended') {
        const tier = { premium: 2, boosted: 1, free: 0 }
        const promotion =
          tier[b.mapPromotionTier] - tier[a.mapPromotionTier] || b.mapPriorityWeight - a.mapPriorityWeight
        if (promotion) return promotion
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime() || a.id.localeCompare(b.id)
    })
  }, [mapListings, area, sort])
  const detailsCount =
    Number(Boolean(filters.minPrice || filters.maxPrice)) +
    Number(filters.bedrooms > 0) +
    Number(filters.bathrooms > 0) +
    Number(Boolean(filters.minArea)) +
    filters.features.length
  const hasFilters = categories.length > 0 || filters.offerTypes.length > 0 || detailsCount > 0 || !!keyword || !!area

  const searchArea = useCallback((search: PropertyMapAreaSearch) => {
    setArea(search.bounds)
    setViewportDirty(false)
    return 0
  }, [])
  const reset = () => {
    setCategories([])
    setFilters(emptyPropertyMapFilters)
    setKeyword('')
    setArea(null)
  }
  const toggleCategory = (id: string) =>
    setCategories((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]))
  const togglePanel = () => {
    setPanelOpen((previous) => !previous)
    setResizeId((previous) => previous + 1)
  }

  return (
    <main className={styles.search} aria-label={th ? 'ค้นหาอสังหาบนแผนที่' : 'Find properties on the map'}>
      <section className={styles.categories} aria-label={th ? 'หมวดอสังหาริมทรัพย์' : 'Property categories'}>
        <header className={styles.categoryHeading} data-map-topbar>
          <div className={styles.brand} data-map-brand>
            <Logo className={styles.logo} />
            <h1 className="sr-only">{th ? 'ค้นหาอสังหาบนแผนที่' : 'Find properties on the map'}</h1>
            {categories.length > 0 && (
              <span className={styles.selectionSummary}>
                {isLandOnlyMapSelection(categories)
                  ? th
                    ? 'เฉพาะที่ดิน'
                    : 'Land only'
                  : th
                    ? `เลือก ${categories.length} หมวด`
                    : `${categories.length} selected`}
              </span>
            )}
          </div>
          <div className={styles.toolbar} data-map-search-controls>
            <div className={styles.offers} role="group" aria-label={th ? 'ซื้อหรือเช่า' : 'Buy or rent'}>
              <button
                type="button"
                aria-pressed={!filters.offerTypes.length}
                onClick={() => setFilters({ ...filters, offerTypes: [] })}
                className={!filters.offerTypes.length ? styles.selectedOffer : ''}
              >
                {th ? 'ทุกแบบ' : 'Any offer'}
              </button>
              {offerOptions.map((offer) => (
                <button
                  type="button"
                  key={offer.value}
                  data-map-offer={offer.value}
                  aria-pressed={filters.offerTypes.includes(offer.value)}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      offerTypes: filters.offerTypes.includes(offer.value)
                        ? filters.offerTypes.filter((value) => value !== offer.value)
                        : [...filters.offerTypes, offer.value],
                    })
                  }
                  className={filters.offerTypes.includes(offer.value) ? styles.selectedOffer : ''}
                >
                  {th ? offer.th : offer.en}
                </button>
              ))}
            </div>
            <button
              type="button"
              data-map-details-toggle
              onClick={() => setDetailsOpen(true)}
              className={`${styles.detailsButton} ${detailsCount > 0 ? styles.activeDetailsButton : ''}`}
            >
              <SlidersHorizontal className="size-4" />
              <span>{th ? 'ตัวกรอง' : 'Filters'}</span>
              {detailsCount > 0 && (
                <span className="rounded-full bg-[#176b50] px-1.5 text-[10px] text-white">{detailsCount}</span>
              )}
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={reset}
                className={styles.resetButton}
                aria-label={th ? 'ล้างตัวกรองทั้งหมด' : 'Reset all filters'}
                title={th ? 'ล้างตัวกรองทั้งหมด' : 'Reset all filters'}
              >
                <RotateCcw className="size-4" />
              </button>
            )}
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              data-map-land-shortcut
              aria-pressed={isLandOnlyMapSelection(categories)}
              onClick={() => {
                setCategories(isLandOnlyMapSelection(categories) ? [] : [...landMapCategoryIds])
                setMobileGroup('homes')
              }}
              className={`${styles.landShortcut} ${isLandOnlyMapSelection(categories) ? styles.activeLandShortcut : ''}`}
            >
              <LandPlot className="size-4" />
              {th ? 'ที่ดิน' : 'Land'}
            </button>
            <button
              type="button"
              aria-pressed={!categories.length}
              onClick={() => setCategories([])}
              className={`${styles.allCategoriesButton} ${!categories.length ? 'bg-[#176b50] text-white' : 'text-[#176b50] hover:bg-[#edf6f1] dark:text-emerald-400'}`}
            >
              {th ? 'ทุกหมวด' : 'All types'}
            </button>
            <button
              type="button"
              aria-expanded={categoriesOpen}
              aria-controls="map-category-options"
              onClick={() => {
                setCategoriesOpen(!categoriesOpen)
                setResizeId(resizeId + 1)
              }}
              className={styles.collapseCategoriesButton}
              aria-label={
                categoriesOpen
                  ? th
                    ? 'ย่อหมวดหมู่'
                    : 'Collapse categories'
                  : th
                    ? 'แสดงหมวดหมู่'
                    : 'Expand categories'
              }
            >
              {categoriesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            <AvatarDropdown avatarClassName="size-8" buttonClassName={styles.accountButton} />
          </div>
        </header>
        {categoriesOpen && (
          <div id="map-category-options">
            <div className={styles.mobileTabs} aria-label={th ? 'กลุ่มหมวด' : 'Category groups'}>
              {mapCategoryGroups.map((group) => {
                const Icon = groupIcons[group.code]
                const count = categories.filter((id) => id.startsWith(`${group.code}:`)).length
                return (
                  <button
                    type="button"
                    key={group.code}
                    data-map-group={group.code}
                    aria-pressed={mobileGroup === group.code}
                    onClick={() => {
                      setMobileGroup(group.code)
                      setResizeId(resizeId + 1)
                    }}
                    className={`${styles[group.code]} ${mobileGroup === group.code ? styles.activeTab : ''}`}
                  >
                    <Icon className="size-4" />
                    <span>{groupNames[group.code][th ? 0 : 1]}</span>
                    {count > 0 && <span className={styles.groupCount}>{count}</span>}
                  </button>
                )
              })}
            </div>
            <div className={styles.groups}>
              {mapCategoryGroups.map((group) => {
                const Icon = groupIcons[group.code]
                const allSelected = group.options.every((item) => categories.includes(item.id))
                return (
                  <fieldset
                    key={group.code}
                    data-map-category-group={group.code}
                    className={`${styles.group} ${styles[group.code]} ${mobileGroup === group.code ? styles.mobileActive : ''}`}
                  >
                    <legend className="sr-only">{groupNames[group.code][th ? 0 : 1]}</legend>
                    <div className={styles.groupHeading}>
                      <span className="flex items-center gap-2 font-semibold">
                        <Icon className="size-4" />
                        {groupNames[group.code][th ? 0 : 1]}
                        <span className="text-[10px] font-normal text-neutral-400">{group.options.length}</span>
                      </span>
                      <button
                        type="button"
                        aria-pressed={allSelected}
                        onClick={() =>
                          setCategories((previous) => [
                            ...previous.filter((id) => !id.startsWith(`${group.code}:`)),
                            ...(allSelected ? [] : group.options.map((item) => item.id)),
                          ])
                        }
                        className={styles.selectGroup}
                      >
                        {allSelected ? (th ? 'ล้างกลุ่มนี้' : 'Clear group') : th ? 'เลือกทั้งกลุ่ม' : 'Select group'}
                      </button>
                    </div>
                    <div
                      className={`${styles.categorySections} ${group.code === 'business' ? styles.businessSections : ''}`}
                    >
                      {group.sections.map((section) => (
                        <section
                          key={section.id}
                          className={section.id === 'land' ? styles.landSection : ''}
                          aria-label={section.nameTh ? (th ? section.nameTh : section.nameEn) : undefined}
                        >
                          {section.nameTh && (
                            <h2 className={styles.subgroupHeading}>
                              {section.id === 'retail' ? (
                                <Store className="size-3.5" />
                              ) : (
                                <Building2 className="size-3.5" />
                              )}
                              {th ? section.nameTh : section.nameEn}
                              <span>{section.options.length}</span>
                            </h2>
                          )}
                          <div className={styles.chips}>
                            {section.options.map((option) => {
                              const selected = categories.includes(option.id)
                              const label = th ? option.nameTh : option.nameEn
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  data-map-category={option.id}
                                  aria-pressed={selected}
                                  onClick={() => toggleCategory(option.id)}
                                  className={`${styles.chip} ${option.propertyType === 'land' ? styles.land : ''} ${selected ? styles.selectedChip : ''}`}
                                >
                                  <span className={styles.checkbox}>
                                    {selected && <Check className="size-3" strokeWidth={3} />}
                                  </span>
                                  {label}
                                </button>
                              )
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </fieldset>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <div
        className={`${styles.canvas} ${panelOpen ? styles.panelVisible : ''} ${mobilePanelOpen ? styles.mobilePanelVisible : ''}`}
      >
        <div className={styles.map}>
          {process.env.NEXT_PUBLIC_LONGDO_MAP_KEY ? (
            <LongdoPropertyMap
              apiKey={process.env.NEXT_PUBLIC_LONGDO_MAP_KEY}
              listings={mapListings}
              currentHoverID={hoveredId}
              initialCenter={center}
              initialZoom={zoom}
              exactCoordinates
              searchContainerClassName={styles.locationSearch}
              zoomControlsClassName={styles.zoomControls}
              onViewportChange={() => setViewportDirty(true)}
              areaSearchRequestId={areaRequestId}
              onSearchArea={searchArea}
              onLocationSearch={(location) => {
                setCenter(location)
                setZoom(15)
                setKeyword('')
                setArea(null)
                setViewportDirty(true)
                setAreaRequestId((value) => value + 1)
              }}
              resizeRequestId={resizeId}
            />
          ) : (
            <div className="flex size-full items-center justify-center p-10 text-center text-neutral-500">
              {th ? 'แผนที่ยังไม่พร้อมใช้งาน ดูประกาศจากรายการได้' : 'Map unavailable. Browse the listings instead.'}
            </div>
          )}
        </div>
        <div className={styles.areaControl}>
          <button
            type="button"
            onClick={() => setAreaRequestId((value) => value + 1)}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-xs font-semibold shadow-md ${viewportDirty ? 'border-[#176b50] bg-[#176b50] text-white' : 'border-[#dbe7df] bg-white text-[#176b50]'}`}
          >
            <MapPin className="size-4" />
            {th ? 'ค้นหาบริเวณนี้' : 'Search this area'}
          </button>
        </div>
        {!panelOpen && (
          <button type="button" onClick={togglePanel} className={styles.openPanel}>
            <List className="size-4" />
            {th ? `ดูประกาศ (${displayed.length})` : `Listings (${displayed.length})`}
          </button>
        )}

        <aside className={styles.results} aria-label={th ? 'ประกาศที่ค้นพบ' : 'Property results'}>
          <button
            type="button"
            className={styles.mobilePanelToggle}
            aria-expanded={mobilePanelOpen}
            aria-controls="map-results-content"
            onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
          >
            <span className="mx-auto mb-2 block h-1 w-9 rounded-full bg-neutral-300" />
            <span className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2">
                <List className="size-4 text-[#176b50]" />
                {th ? `ดู ${displayed.length} ประกาศ` : `${displayed.length} listings`}
                {loading && <LoaderCircle className="size-3.5 animate-spin" />}
              </span>
              {mobilePanelOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </span>
          </button>
          <div id="map-results-content" className={styles.resultsContent}>
            <div className="shrink-0 border-b border-neutral-100 p-4 dark:border-neutral-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">
                    {area ? (th ? 'ประกาศในบริเวณนี้' : 'In this area') : th ? 'ประกาศที่ค้นพบ' : 'Your search results'}
                  </h2>
                  <p aria-live="polite" className="mt-1 text-xs text-neutral-500">
                    {loading
                      ? th
                        ? `กำลังโหลด · พบแล้ว ${mapListings.length} รายการ`
                        : `Loading · ${mapListings.length} found`
                      : failed
                        ? th
                          ? 'โหลดข้อมูลยังไม่ครบ'
                          : 'Results are incomplete'
                        : th
                          ? `${displayed.length} รายการ${area ? ` · ทั้งหมด ${mapListings.length} บนแผนที่` : ''}`
                          : `${displayed.length} listings${area ? ` · ${mapListings.length} on map` : ''}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={togglePanel}
                  aria-label={th ? 'ย่อแผงประกาศ' : 'Collapse listings'}
                  className="hidden size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 lg:grid dark:hover:bg-neutral-800"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              </div>
              {(keyword || area) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {keyword && (
                    <button
                      type="button"
                      onClick={() => setKeyword('')}
                      className="flex max-w-full items-center gap-1 rounded-lg bg-[#edf6f1] px-2 py-1 text-xs text-[#176b50]"
                    >
                      <span className="truncate">{keyword}</span>
                      <X className="size-3 shrink-0" />
                    </button>
                  )}
                  {area && (
                    <button
                      type="button"
                      onClick={() => setArea(null)}
                      className="flex items-center gap-1 rounded-lg bg-[#edf6f1] px-2 py-1 text-xs text-[#176b50]"
                    >
                      {th ? 'จำกัดบริเวณ' : 'Area filter'}
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              )}
              <label className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
                <span>{th ? 'เรียงตาม' : 'Sort by'}</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as PropertyMapSort)}
                  className="h-9 max-w-[70%] rounded-lg border-neutral-200 bg-transparent py-0 text-xs font-medium text-neutral-700 focus:border-[#176b50] focus:ring-[#176b50] dark:border-neutral-700 dark:text-neutral-200"
                >
                  <option value="recommended">{th ? 'แนะนำ' : 'Recommended'}</option>
                  <option value="newest">{th ? 'ใหม่ล่าสุด' : 'Newest'}</option>
                  <option value="price_low">{th ? 'ราคาต่ำก่อน' : 'Lowest price'}</option>
                  <option value="price_high">{th ? 'ราคาสูงก่อน' : 'Highest price'}</option>
                  <option value="area_large">{th ? 'พื้นที่มากก่อน' : 'Largest area'}</option>
                </select>
              </label>
            </div>
            <div
              ref={resultsRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
              aria-busy={loading}
            >
              {failed && (
                <div role="alert" className="m-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  <p>{th ? 'โหลดประกาศไม่ครบ กรุณาลองอีกครั้ง' : 'Some listings could not load. Please retry.'}</p>
                  <button
                    type="button"
                    onClick={() => setRetry(retry + 1)}
                    className="mt-2 min-h-9 font-semibold underline"
                  >
                    {th ? 'ลองอีกครั้ง' : 'Retry'}
                  </button>
                </div>
              )}
              {invalidPrice && (
                <p role="alert" className="p-5 text-sm text-red-600">
                  {th ? 'กรุณาปรับราคาต่ำสุดให้ไม่เกินราคาสูงสุด' : 'Minimum price must not exceed maximum price.'}
                </p>
              )}
              {loading && !displayed.length && (
                <div className="space-y-4 p-3" role="status">
                  <span className="sr-only">{th ? 'กำลังโหลดประกาศ' : 'Loading listings'}</span>
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="flex animate-pulse gap-3">
                      <div className="h-28 w-28 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                      <div className="flex-1 space-y-3 py-2">
                        <div className="h-3 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800" />
                        <div className="h-4 rounded bg-neutral-100 dark:bg-neutral-800" />
                        <div className="h-3 rounded bg-neutral-100 dark:bg-neutral-800" />
                        <div className="h-5 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {displayed.slice(0, visibleCount).map((listing) => (
                <MapResultCard
                  key={listing.id}
                  listing={listing}
                  onHover={setHoveredId}
                  onLocate={() => {
                    setCenter({ lat: listing.map.lat, lon: listing.map.lng })
                    setZoom(17)
                    setHoveredId(listing.id)
                    setMobilePanelOpen(false)
                  }}
                />
              ))}
              {!loading && !failed && !invalidPrice && !displayed.length && (
                <div className="px-5 py-10 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#edf6f1] text-[#176b50]">
                    <MapPin className="size-6" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">
                    {th ? 'ยังไม่พบประกาศที่ตรงกัน' : 'No matching listings yet'}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {th
                      ? 'ลองขยายบริเวณค้นหา หรือเลือกหมวดและช่วงราคาเพิ่มเติม'
                      : 'Try a wider area, more categories or a different budget.'}
                  </p>
                  <button
                    type="button"
                    onClick={area ? () => setArea(null) : reset}
                    className="mt-5 min-h-11 rounded-xl bg-[#176b50] px-5 text-sm font-semibold text-white"
                  >
                    {area ? (th ? 'ดูทุกบริเวณ' : 'Show all areas') : th ? 'ล้างตัวกรอง' : 'Clear filters'}
                  </button>
                </div>
              )}
              {matchingRows.length > mapRows.length && (
                <p className="px-4 py-3 text-xs text-neutral-500">
                  {th
                    ? `${matchingRows.length - mapRows.length} ประกาศยังไม่มีพิกัด`
                    : `${matchingRows.length - mapRows.length} listings have no coordinates`}
                </p>
              )}
              {displayed.length > visibleCount && (
                <button
                  type="button"
                  onClick={() => setPagination({ key: resultsKey, count: visibleCount + 20 })}
                  className="my-3 min-h-11 w-full rounded-xl border border-[#d4e7dd] text-sm font-semibold text-[#176b50] hover:bg-[#edf6f1]"
                >
                  {th
                    ? `ดูประกาศเพิ่มเติม (${displayed.length - visibleCount})`
                    : `Show more (${displayed.length - visibleCount})`}
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
      <MapSearchDetails
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        value={filters}
        onChange={setFilters}
      />
    </main>
  )
}
