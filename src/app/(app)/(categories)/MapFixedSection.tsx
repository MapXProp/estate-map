import CarCard from '@/components/CarCard'
import ExperiencesCard from '@/components/ExperiencesCard'
import LongdoPropertyMap, { PropertyMapAreaSearch } from '@/components/map/LongdoPropertyMap'
import PropertyCard from '@/components/PropertyCard'
import StayCard from '@/components/StayCard'
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map'
import { TCarListing, TExperienceListing, TRealEstateListing, TStayListing } from '@/data/listings'
import { Button } from '@/shared/Button'
import ButtonClose from '@/shared/ButtonClose'
import { ListingType } from '@/type'
import T from '@/utils/getT'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { ChevronUp, LoaderCircle, MapIcon, Search } from 'lucide-react'
import { CSSProperties, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react'

type MobileMapSheetState = 'collapsed' | 'open'

// Keep the first view light: only show a low sheet handle at the bottom.
// The map SDK is requested only when the user expands the sheet.
const MOBILE_SHEET_PEEK_HEIGHT = 62

const getMobileSheetHeights = () => {
  if (typeof window === 'undefined') {
    return { collapsed: MOBILE_SHEET_PEEK_HEIGHT, open: 720 }
  }

  return { collapsed: MOBILE_SHEET_PEEK_HEIGHT, open: window.innerHeight }
}

interface Props {
  currentHoverID: string
  listings: TStayListing[] | TExperienceListing[] | TRealEstateListing[] | TCarListing[]
  // The type of listing being displayed on the map.
  // This is used to determine the type of markers and interactions on the map.
  listingType: ListingType
  // The href for the close button, which will redirect to the category page.
  // This is used to close the map and return to the category listings.
  closeButtonHref: string
  splitAtLg?: boolean
  resultCount?: number
  searchSourceListings?: TRealEstateListing[]
  onSearchArea?: (search: PropertyMapAreaSearch, listingIds: string[]) => number | void | Promise<number | void>
}

const MapFixedSection = ({
  closeButtonHref,
  currentHoverID: selectedID,
  listings,
  listingType,
  splitAtLg = false,
  searchSourceListings,
  onSearchArea,
}: Props) => {
  const [currentHoverID, setCurrentHoverID] = useState<string>('')
  const [mobileSheetState, setMobileSheetState] = useState<MobileMapSheetState>('collapsed')
  const [mobileSheetHeight, setMobileSheetHeight] = useState(MOBILE_SHEET_PEEK_HEIGHT)
  const [hasRequestedMap, setHasRequestedMap] = useState(false)
  const [isDraggingSheet, setIsDraggingSheet] = useState(false)
  const [areaSearchRequestId, setAreaSearchRequestId] = useState(0)
  const [isAreaSearching, setIsAreaSearching] = useState(false)
  const [hasPendingAreaChange, setHasPendingAreaChange] = useState(false)
  const [areaResultCount, setAreaResultCount] = useState<number | null>(null)
  const [mapResizeRequestId, setMapResizeRequestId] = useState(0)
  const dragStartRef = useRef<{ y: number; height: number; state: MobileMapSheetState } | null>(null)
  const didDragRef = useRef(false)
  const longdoMapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY

  const snapMobileSheet = useCallback((state: MobileMapSheetState) => {
    if (state === 'open') {
      setHasRequestedMap(true)
      setMapResizeRequestId((requestId) => requestId + 1)
    }
    setMobileSheetState(state)
    setMobileSheetHeight(getMobileSheetHeights()[state])
  }, [])

  useEffect(() => {
    setCurrentHoverID(selectedID)
  }, [selectedID])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setHasRequestedMap(true)
        if (mobileSheetState !== 'collapsed') {
          setMobileSheetState('collapsed')
          setMobileSheetHeight(MOBILE_SHEET_PEEK_HEIGHT)
        }
        return
      }
      setMobileSheetHeight(getMobileSheetHeights()[mobileSheetState])
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileSheetState])

  useEffect(() => {
    if (!splitAtLg || mobileSheetState !== 'open' || window.innerWidth >= 1024) return

    const previousBodyOverflow = document.body.style.overflow
    const previousBodyOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.overscrollBehavior = previousBodyOverscroll
    }
  }, [mobileSheetState, splitAtLg])

  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (window.innerWidth >= 1024) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartRef.current = { y: event.clientY, height: mobileSheetHeight, state: mobileSheetState }
    didDragRef.current = false
    setIsDraggingSheet(true)
  }

  const handleSheetPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragStart = dragStartRef.current
    if (!dragStart) return

    const deltaY = event.clientY - dragStart.y
    if (Math.abs(deltaY) > 5) didDragRef.current = true
    const heights = getMobileSheetHeights()
    setMobileSheetHeight(Math.min(heights.open, Math.max(heights.collapsed, dragStart.height - deltaY)))
  }

  const finishSheetDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragStart = dragStartRef.current
    if (!dragStart) return

    const deltaY = event.clientY - dragStart.y
    const states: MobileMapSheetState[] = ['collapsed', 'open']
    let nextState = dragStart.state

    if (deltaY < -42) nextState = 'open'
    else if (deltaY > 42) nextState = 'collapsed'
    else {
      const heights = getMobileSheetHeights()
      nextState = states.reduce((nearest, state) =>
        Math.abs(heights[state] - mobileSheetHeight) < Math.abs(heights[nearest] - mobileSheetHeight) ? state : nearest
      )
    }

    dragStartRef.current = null
    setIsDraggingSheet(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    snapMobileSheet(nextState)
  }

  const handleSheetClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    snapMobileSheet(mobileSheetState === 'collapsed' ? 'open' : 'collapsed')
  }

  const sheetStyle = {
    '--mobile-map-sheet-height': `${mobileSheetHeight}px`,
    '--mobile-map-preload-height': `${Math.max(252, getMobileSheetHeights().open - 48)}px`,
  } as CSSProperties
  const mobileMapControlsVisible = mobileSheetState === 'open'
  const shouldRenderMap = !splitAtLg || listingType !== 'RealEstates' || hasRequestedMap

  const handleMapViewportChange = useCallback(() => {
    setHasPendingAreaChange(true)
  }, [])

  const handleAreaSearchResult = useCallback(
    async (search: PropertyMapAreaSearch, listingIds: string[]) => {
      try {
        const resultCount = await onSearchArea?.(search, listingIds)
        setAreaResultCount(resultCount ?? listingIds.length)
      } finally {
        setIsAreaSearching(false)
        setHasPendingAreaChange(false)
      }
    },
    [onSearchArea]
  )

  const requestAreaSearch = () => {
    if (isAreaSearching) return
    setIsAreaSearching(true)
    setAreaResultCount(null)
    setAreaSearchRequestId((requestId) => requestId + 1)
  }

  return (
    <div
      className={
        splitAtLg
          ? `fixed inset-x-0 bottom-0 h-[var(--mobile-map-sheet-height)] lg:static lg:z-0 lg:h-auto lg:flex-[38_1_0%] xl:flex-[32_1_0%] ${
              mobileSheetState === 'open' ? 'z-50' : 'z-20'
            } ${
              isDraggingSheet ? '' : 'transition-[height] duration-300 ease-out'
            }`
          : 'fixed inset-0 top-0 z-40 flex-1/2 xl:static xl:z-0'
      }
      style={splitAtLg ? sheetStyle : undefined}
    >
      <div
        className={
          splitAtLg
            ? `relative size-full overflow-hidden bg-white lg:sticky lg:top-0 lg:h-[calc(100dvh-5rem)] lg:rounded-none lg:border-0 lg:shadow-none ${
                mobileSheetState === 'open'
                  ? 'rounded-none border-0 shadow-none'
                  : 'rounded-t-[24px] border border-x-0 border-b-0 border-[#dbe7e2] shadow-[0_-10px_30px_rgba(18,63,50,0.14)]'
              }`
            : 'fixed start-0 top-0 size-full overflow-hidden xl:sticky xl:top-0 xl:h-screen'
        }
      >
        {splitAtLg && listingType === 'RealEstates' && (
          <button
            type="button"
            className="absolute inset-x-0 top-0 z-30 flex h-11 touch-none select-none flex-col items-center justify-center border-b border-[#dfe9e5] bg-white/95 px-4 backdrop-blur lg:hidden"
            aria-label={mobileSheetState === 'collapsed' ? 'เปิดแผนที่' : 'ปิดแผนที่'}
            aria-expanded={mobileSheetState === 'open'}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={finishSheetDrag}
            onPointerCancel={finishSheetDrag}
            onClick={handleSheetClick}
          >
            <span className="absolute top-1.5 h-1 w-10 rounded-full bg-neutral-300" aria-hidden="true" />
            <span className="mt-1.5 flex w-full items-center justify-between gap-3 text-sm font-semibold text-[#173f34]">
              <span className="flex items-center gap-2">
                <MapIcon className="size-4.5" aria-hidden="true" />
                แผนที่
              </span>
              <span className="flex items-center gap-1 text-xs font-normal text-neutral-500">
                {mobileSheetState === 'collapsed' ? 'ลากขึ้นเพื่อดูเต็มจอ' : 'ลากลงเพื่อย่อแผนที่'}
                <ChevronUp
                  className={`size-4 transition-transform ${mobileSheetState === 'open' ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </span>
            </span>
          </button>
        )}

        <div
          className={
            splitAtLg && listingType === 'RealEstates'
              ? `absolute inset-x-0 top-11 lg:inset-0 lg:h-auto ${
                  mobileSheetState === 'collapsed' ? 'h-[var(--mobile-map-preload-height)]' : 'bottom-0'
                }`
              : 'size-full'
          }
        >
          {!shouldRenderMap ? (
            <div className="size-full bg-[#eef3f0]" aria-hidden="true" />
          ) : listingType === 'RealEstates' && longdoMapKey ? (
            <LongdoPropertyMap
              apiKey={longdoMapKey}
              currentHoverID={currentHoverID}
              listings={listings as TRealEstateListing[]}
              searchSourceListings={searchSourceListings}
              areaSearchRequestId={areaSearchRequestId}
              onSearchArea={handleAreaSearchResult}
              onViewportChange={handleMapViewportChange}
              mobileControlsVisible={mobileMapControlsVisible}
              resizeRequestId={mapResizeRequestId}
            />
          ) : (
            <Map center={listings[0].map} zoom={11}>
              <MapControls position="bottom-right" showZoom showFullscreen />
              {listings.map((listing) => (
                <MapMarker key={listing.id} longitude={listing.map.lng} latitude={listing.map.lat}>
                  <MarkerContent>
                    <p
                      className={`flex min-w-max items-center justify-center rounded-lg px-3.5 py-1.5 text-sm font-medium shadow-lg transition-all ${
                        currentHoverID === listing.id
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'bg-white text-neutral-900 hover:scale-110 dark:bg-neutral-600 dark:text-white'
                      }`}
                    >
                      {listing.price}
                    </p>
                  </MarkerContent>
                  <MarkerPopup className="rounded-2xl! p-0!">
                    <div className="w-60 focus:outline-none sm:w-80">
                      {listingType === 'Stays' && <StayCard size="small" data={listing as TStayListing} />}
                      {listingType === 'Experiences' && (
                        <ExperiencesCard
                          size="small"
                          data={listing as TExperienceListing}
                          ratioClass="aspect-w-12 aspect-h-10"
                          className="rounded-3xl bg-white dark:bg-neutral-900"
                        />
                      )}
                      {listingType === 'Cars' && (
                        <CarCard className="border-0!" size="small" data={listing as TCarListing} />
                      )}
                      {listingType === 'RealEstates' && <PropertyCard data={listing as TRealEstateListing} />}
                    </div>
                  </MarkerPopup>
                </MapMarker>
              ))}
            </Map>
          )}
        </div>

        {listingType === 'RealEstates' && (
          <div
            className={`absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1.5 lg:bottom-6 ${
              splitAtLg && mobileSheetState === 'collapsed' ? 'max-lg:hidden' : ''
            }`}
          >
            {areaResultCount !== null && (
              <span className="rounded-full border border-[#dbe8e2] bg-white/95 px-3 py-1 text-xs font-medium whitespace-nowrap text-[#31594e] shadow-sm backdrop-blur">
                พบ {areaResultCount.toLocaleString('th-TH')} รายการในพื้นที่นี้
              </span>
            )}
            <button
              type="button"
              onClick={requestAreaSearch}
              disabled={isAreaSearching}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold whitespace-nowrap backdrop-blur transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 ${
                isAreaSearching
                  ? 'border-[#a9c9ba] bg-white text-[#176b50] shadow-sm'
                  : hasPendingAreaChange
                    ? 'border-[#9fc4b2] bg-white text-[#174d3e] shadow-[0_6px_16px_rgba(18,63,50,0.12)] hover:border-[#7eae97]'
                    : 'border-[#c9ddd4] bg-white/92 text-[#31594e] shadow-sm hover:border-[#a9c9ba] hover:bg-white hover:text-[#174d3e]'
              }`}
            >
              {isAreaSearching ? (
                <LoaderCircle className="size-4.5 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-4.5" aria-hidden="true" />
              )}
              {isAreaSearching ? 'กำลังค้นหา...' : 'ค้นหาอสังหาในบริเวณนี้'}
            </button>
          </div>
        )}

        {listingType !== 'RealEstates' && (
          <div className="absolute top-3 left-3">
            <ButtonClose color="white" href={closeButtonHref} />
          </div>
        )}
        {listingType !== 'RealEstates' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 shadow-2xl">
            <Button color="white" href={closeButtonHref}>
              <XMarkIcon className="size-6" />
              <span>{T['common']['Hide map']}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapFixedSection
