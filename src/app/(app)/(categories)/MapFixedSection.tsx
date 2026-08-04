import CarCard from '@/components/CarCard'
import ExperiencesCard from '@/components/ExperiencesCard'
import LongdoPropertyMap from '@/components/map/LongdoPropertyMap'
import PropertyCard from '@/components/PropertyCard'
import StayCard from '@/components/StayCard'
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map'
import { TCarListing, TExperienceListing, TRealEstateListing, TStayListing } from '@/data/listings'
import { Button } from '@/shared/Button'
import ButtonClose from '@/shared/ButtonClose'
import { ListingType } from '@/type'
import convertNumbThousand from '@/utils/convertNumbThousand'
import T from '@/utils/getT'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { ChevronUp, List, MapIcon } from 'lucide-react'
import { CSSProperties, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react'

type MobileMapSheetState = 'collapsed' | 'half' | 'expanded'

const MOBILE_SHEET_PEEK_HEIGHT = 88

const getMobileSheetHeights = () => {
  if (typeof window === 'undefined') {
    return { collapsed: MOBILE_SHEET_PEEK_HEIGHT, half: 420, expanded: 620 }
  }

  const fixedUiHeight = 80
  const expanded = Math.max(300, window.innerHeight - fixedUiHeight)
  const half = Math.min(expanded, Math.max(300, Math.round(window.innerHeight * 0.56)))
  return { collapsed: MOBILE_SHEET_PEEK_HEIGHT, half, expanded }
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
}

const MapFixedSection = ({
  closeButtonHref,
  currentHoverID: selectedID,
  listings,
  listingType,
  splitAtLg = false,
  resultCount,
}: Props) => {
  const [currentHoverID, setCurrentHoverID] = useState<string>('')
  const [mobileSheetState, setMobileSheetState] = useState<MobileMapSheetState>('collapsed')
  const [mobileSheetHeight, setMobileSheetHeight] = useState(MOBILE_SHEET_PEEK_HEIGHT)
  const [isDraggingSheet, setIsDraggingSheet] = useState(false)
  const dragStartRef = useRef<{ y: number; height: number; state: MobileMapSheetState } | null>(null)
  const didDragRef = useRef(false)
  const longdoMapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY

  const snapMobileSheet = useCallback((state: MobileMapSheetState) => {
    setMobileSheetState(state)
    setMobileSheetHeight(getMobileSheetHeights()[state])
  }, [])

  useEffect(() => {
    setCurrentHoverID(selectedID)
  }, [selectedID])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileSheetState !== 'collapsed') {
        setMobileSheetState('collapsed')
        setMobileSheetHeight(MOBILE_SHEET_PEEK_HEIGHT)
        return
      }
      setMobileSheetHeight(getMobileSheetHeights()[mobileSheetState])
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileSheetState])

  useEffect(() => {
    if (mobileSheetState === 'collapsed' || window.innerWidth >= 1024) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileSheetState])

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
    setMobileSheetHeight(Math.min(heights.expanded, Math.max(heights.collapsed, dragStart.height - deltaY)))
  }

  const finishSheetDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragStart = dragStartRef.current
    if (!dragStart) return

    const deltaY = event.clientY - dragStart.y
    const states: MobileMapSheetState[] = ['collapsed', 'half', 'expanded']
    const currentIndex = states.indexOf(dragStart.state)
    let nextState = dragStart.state

    if (deltaY < -42) nextState = states[Math.min(currentIndex + 1, states.length - 1)]
    else if (deltaY > 42) nextState = states[Math.max(currentIndex - 1, 0)]
    else {
      const heights = getMobileSheetHeights()
      nextState = states.reduce((nearest, state) =>
        Math.abs(heights[state] - mobileSheetHeight) < Math.abs(heights[nearest] - mobileSheetHeight) ? state : nearest
      )
    }

    dragStartRef.current = null
    setIsDraggingSheet(false)
    snapMobileSheet(nextState)
  }

  const handleSheetClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    snapMobileSheet(mobileSheetState === 'collapsed' ? 'half' : mobileSheetState === 'half' ? 'expanded' : 'half')
  }

  const sheetStyle = { '--mobile-map-sheet-height': `${mobileSheetHeight}px` } as CSSProperties
  const mobileMapControlsVisible = mobileSheetState !== 'collapsed'

  return (
    <div
      className={
        splitAtLg
          ? `fixed inset-x-2 bottom-0 z-20 h-[var(--mobile-map-sheet-height)] lg:static lg:z-0 lg:h-auto lg:flex-[38_1_0%] xl:flex-[32_1_0%] ${
              isDraggingSheet ? '' : 'transition-[height] duration-300 ease-out'
            }`
          : 'fixed inset-0 top-0 z-40 flex-1/2 xl:static xl:z-0'
      }
      style={splitAtLg ? sheetStyle : undefined}
    >
      <div
        className={
          splitAtLg
            ? 'relative size-full overflow-hidden rounded-t-[28px] border border-[#dbe7e2] bg-white shadow-[0_-14px_40px_rgba(18,63,50,0.18)] lg:sticky lg:top-0 lg:h-screen lg:rounded-none lg:border-0 lg:shadow-none'
            : 'fixed start-0 top-0 size-full overflow-hidden xl:sticky xl:top-0 xl:h-screen'
        }
      >
        {splitAtLg && listingType === 'RealEstates' && (
          <button
            type="button"
            className="absolute inset-x-0 top-0 z-30 flex h-12 touch-none select-none flex-col items-center justify-center border-b border-[#dfe9e5] bg-white/95 px-4 backdrop-blur lg:hidden"
            aria-label={mobileSheetState === 'collapsed' ? 'เปิดแผนที่' : 'ปรับขนาดแผนที่'}
            aria-expanded={mobileSheetState !== 'collapsed'}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={finishSheetDrag}
            onPointerCancel={finishSheetDrag}
            onClick={handleSheetClick}
          >
            <span className="absolute top-1.5 h-1.5 w-11 rounded-full bg-neutral-300" aria-hidden="true" />
            <span className="mt-2 flex w-full items-center justify-between gap-3 text-sm font-semibold text-[#173f34]">
              <span className="flex items-center gap-2">
                <MapIcon className="size-4.5" aria-hidden="true" />
                แผนที่
              </span>
              <span className="flex items-center gap-1 text-xs font-normal text-neutral-500">
                {mobileSheetState === 'collapsed' ? 'ลากขึ้นเพื่อสำรวจทำเล' : 'ลากเพื่อปรับขนาด'}
                <ChevronUp
                  className={`size-4 transition-transform ${mobileSheetState === 'expanded' ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </span>
            </span>
          </button>
        )}

        <div className={splitAtLg && listingType === 'RealEstates' ? 'absolute inset-x-0 bottom-0 top-12 lg:inset-0' : 'size-full'}>
          {listingType === 'RealEstates' && longdoMapKey ? (
            <LongdoPropertyMap
              apiKey={longdoMapKey}
              currentHoverID={currentHoverID}
              listings={listings as TRealEstateListing[]}
              mobileControlsVisible={mobileMapControlsVisible}
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

        {splitAtLg && listingType === 'RealEstates' && mobileSheetState !== 'collapsed' && (
          <button
            type="button"
            onClick={() => snapMobileSheet('collapsed')}
            className="absolute bottom-3 left-1/2 z-30 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-[#123f32] px-5 text-sm font-semibold whitespace-nowrap text-white shadow-[0_10px_26px_rgba(18,63,50,0.3)] transition active:scale-[0.98] lg:hidden"
          >
            <List className="size-4.5" aria-hidden="true" />
            ดูประกาศ {convertNumbThousand(resultCount ?? listings.length)} รายการ
          </button>
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
