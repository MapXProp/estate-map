'use client'

import {
  isListingPoint,
  listingPlaces,
  sameListingPoint,
  type ListingPlace,
  type ListingPoint,
} from '@/lib/listingLocation'
import { fetchLocationSearchSuggestions } from '@/lib/locationSearch'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import Script from 'next/script'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

export type LongdoPickerLocation = ListingPoint
type MapLocation = { lon: number; lat: number }
type PickerMap = {
  Ui: {
    Crosshair: { visible: (state: boolean) => void }
    Keyboard: { enable: (state: boolean) => void }
    Mouse: { enableInertia: (state: boolean) => void }
  }
  Event: { bind: (event: string, callback: () => void) => void }
  location: (value?: MapLocation | unknown, animate?: boolean) => MapLocation
  zoom: (level?: number, animate?: boolean) => number
  move: (offset: { x: number; y: number }, animate?: boolean) => void
  resize: () => void
  repaint: () => void
  pause: (state: boolean) => void
}
type Longdo = {
  UiComponent: { None: unknown }
  LocationMode: { Pointer: unknown }
  Map: new (options: Record<string, unknown>) => PickerMap
}
const sdk = () => (window as unknown as { longdo?: Longdo }).longdo
interface Props {
  apiKey?: string
  value: ListingPoint
  locale: 'th' | 'en'
  hasMarker?: boolean
  confirmed: boolean
  initialZoom?: number
  initialSearch?: string
  locating?: boolean
  onUseCurrentLocation: () => void
  onChange: (location: ListingPoint) => void
  onInteractionStart: () => void
  onConfirm: () => void
}

export default function LongdoLocationPicker({
  apiKey,
  value,
  locale,
  hasMarker = false,
  confirmed,
  initialZoom = 6,
  initialSearch = '',
  locating = false,
  onUseCurrentLocation,
  onChange,
  onInteractionStart,
  onConfirm,
}: Props) {
  const th = locale === 'th'
  const [query, setQuery] = useState(initialSearch)
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<ListingPlace[]>([])
  const [active, setActive] = useState(-1)
  const [searching, setSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const [expanded, setExpanded] = useState(hasMarker)
  const [sdkReady, setSdkReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [moving, setMoving] = useState(false)
  const [outsideThailand, setOutsideThailand] = useState(false)
  const [zoom, setZoom] = useState(initialZoom)
  const searchRef = useRef<HTMLInputElement>(null)
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<PickerMap | null>(null)
  const callbacks = useRef({ onChange, onInteractionStart })
  const latest = useRef({ value, hasMarker, initialZoom })
  const syncing = useRef(false)
  const settledTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingZoom = useRef<number | null>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const showMap = expanded || hasMarker
  useEffect(() => {
    const surface = mapElement.current
    if (!surface || !showMap) return
    const preventPagePinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault()
    }
    const preventSafariGesture = (event: Event) => event.preventDefault()
    surface.addEventListener('touchmove', preventPagePinch, { passive: false })
    surface.addEventListener('gesturestart', preventSafariGesture)
    surface.addEventListener('gesturechange', preventSafariGesture)
    return () => {
      surface.removeEventListener('touchmove', preventPagePinch)
      surface.removeEventListener('gesturestart', preventSafariGesture)
      surface.removeEventListener('gesturechange', preventSafariGesture)
    }
  }, [showMap])
  useEffect(() => {
    callbacks.current = { onChange, onInteractionStart }
  }, [onChange, onInteractionStart])
  useEffect(() => {
    latest.current = { value, hasMarker, initialZoom }
  }, [value, hasMarker, initialZoom])
  useEffect(() => () => clearTimeout(blurTimer.current), [])

  useEffect(() => {
    const keyword = query.trim()
    setResults([])
    setActive(-1)
    setSearchMessage('')
    if (!focused || Array.from(keyword).length < 2) {
      setSearching(false)
      return
    }
    const controller = new AbortController()
    setSearching(true)
    const timer = window.setTimeout(async () => {
      try {
        const rows = listingPlaces(await fetchLocationSearchSuggestions(keyword, controller.signal))
        if (controller.signal.aborted) return
        setResults(rows)
        if (!rows.length)
          setSearchMessage(
            th
              ? 'ลองเพิ่มเขตหรือจังหวัด หรือค้นหาชื่อถนนใกล้เคียง'
              : 'Try adding a district or province, or search a nearby road.'
          )
      } catch {
        if (!controller.signal.aborted)
          setSearchMessage(
            th ? 'ค้นหาไม่สำเร็จ ลองอีกครั้งหรือเลือกบนแผนที่' : 'Search unavailable. Retry or choose on the map.'
          )
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 350)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [focused, query, retry, th])

  const choosePlace = (place: ListingPlace) => {
    setQuery(place.label)
    setResults([])
    setFocused(false)
    setExpanded(true)
    pendingZoom.current = place.zoom
    onInteractionStart()
    onChange(place.point)
    searchRef.current?.blur()
  }
  const searchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && results.length) {
      event.preventDefault()
      setActive((index) =>
        event.key === 'ArrowDown' ? (index + 1) % results.length : index <= 0 ? results.length - 1 : index - 1
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      // Enter must not silently pick the first result.
      if (active >= 0 && results[active]) choosePlace(results[active])
      else {
        setFocused(true)
        setRetry((n) => n + 1)
      }
    } else if (event.key === 'Escape') {
      setFocused(false)
      searchRef.current?.blur()
    }
  }
  useEffect(() => {
    if (!showMap || !apiKey || mapReady) return
    const timer = window.setTimeout(() => setMapError(true), 15000)
    return () => window.clearTimeout(timer)
  }, [apiKey, showMap, mapReady])

  useEffect(() => {
    const longdo = sdk()
    if (!showMap || !sdkReady || !apiKey || !longdo || !mapElement.current || mapRef.current) return
    let alive = true,
      ready = false
    const initial = latest.current
    const map = new longdo.Map({
      placeholder: mapElement.current,
      language: locale,
      location: { lon: initial.value.lng, lat: initial.value.lat },
      zoom: pendingZoom.current ?? initial.initialZoom,
      lastView: false,
      autoResize: true,
      ui: longdo.UiComponent.None,
    })
    mapRef.current = map
    map.Event.bind('ready', () => {
      if (!alive) return
      ready = true
      map.Ui.Crosshair.visible(false)
      map.Ui.Keyboard.enable(false)
      map.Ui.Mouse.enableInertia(false)
      setMapReady(true)
      setMapError(false)
      setZoom(map.zoom())
      map.resize()
      map.repaint()
    })
    map.Event.bind('location', () => {
      if (!alive || !ready || syncing.current) return
      const location = map.location(),
        point = { lng: location.lon, lat: location.lat }
      setOutsideThailand(!isListingPoint(point))
      if (sameListingPoint(point, latest.current.value) && latest.current.hasMarker) return
      callbacks.current.onInteractionStart()
      setMoving(true)
      clearTimeout(settledTimer.current)
      settledTimer.current = setTimeout(() => {
        if (!alive) return
        const center = map.location(),
          next = { lng: center.lon, lat: center.lat }
        if (isListingPoint(next)) callbacks.current.onChange(next)
        setMoving(false)
      }, 180)
    })
    map.Event.bind('zoom', () => {
      if (alive) setZoom(map.zoom())
    })
    map.Event.bind('click', () => {
      if (!alive || !ready) return
      const location = map.location(longdo.LocationMode.Pointer)
      if (location) map.location(location, false)
    })
    return () => {
      alive = false
      clearTimeout(settledTimer.current)
      map.pause(true)
      mapRef.current = null
    }
  }, [apiKey, locale, sdkReady, showMap])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !hasMarker) return
    const current = map.location()
    if (!sameListingPoint(value, { lng: current.lon, lat: current.lat }) || pendingZoom.current !== null) {
      syncing.current = true
      clearTimeout(settledTimer.current)
      map.location({ lon: value.lng, lat: value.lat }, false)
      map.zoom(pendingZoom.current ?? initialZoom, false)
      setZoom(map.zoom())
      setOutsideThailand(!isListingPoint(value))
      pendingZoom.current = null
      syncing.current = false
      setMoving(false)
    }
  }, [value, hasMarker, initialZoom, mapReady])
  const zoomBy = (amount: number) => {
    const map = mapRef.current
    if (map) map.zoom(Math.min(20, Math.max(6, map.zoom() + amount)), false)
  }

  return (
    <div data-listing-location-picker className="space-y-3">
      <div
        onBlur={(event) => {
          const container = event.currentTarget
          if (container.contains(event.relatedTarget as Node | null)) return
          // iOS may not focus a tapped result button; let its click finish first.
          clearTimeout(blurTimer.current)
          blurTimer.current = setTimeout(() => {
            if (!container.contains(document.activeElement)) setFocused(false)
          }, 150)
        }}
      >
        <label
          htmlFor="listing-address-search"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          {th ? 'พิมพ์ที่อยู่หรือชื่อสถานที่' : 'Enter an address or place name'}
        </label>
        <div className="flex min-h-14 items-center rounded-2xl border border-[#cbded5] bg-white pr-1.5 pl-3 focus-within:ring-2 focus-within:ring-[#176b50]/20 dark:bg-neutral-950">
          <Search className="mr-2 size-5 shrink-0 text-[#176b50]" aria-hidden="true" />
          <input
            id="listing-address-search"
            ref={searchRef}
            value={query}
            maxLength={120}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={focused && !!(results.length || searchMessage)}
            aria-controls="listing-address-results"
            aria-activedescendant={active >= 0 ? `listing-address-result-${active}` : undefined}
            placeholder={th ? 'ที่อยู่ ถนน ซอย หรือโครงการ' : 'Address, road, soi or project'}
            className="min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-base shadow-none outline-none placeholder:text-neutral-400 focus:ring-0"
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(-1)
              setResults([])
              setFocused(true)
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={searchKeyDown}
          />
          {query && (
            <button
              type="button"
              aria-label={th ? 'ล้างคำค้น' : 'Clear search'}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-neutral-500"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            aria-label={th ? 'ค้นหาที่อยู่' : 'Find address'}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#176b50] text-white"
            onClick={() => {
              searchRef.current?.focus()
              setFocused(true)
              setRetry((n) => n + 1)
            }}
          >
            {searching ? <LoaderCircle className="size-5 animate-spin" /> : <Search className="size-5" />}
          </button>
        </div>
        {focused && !!(results.length || searchMessage) && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
            <div
              id="listing-address-results"
              role="listbox"
              aria-label={th ? 'เลือกสถานที่ที่ตรงกับที่อยู่' : 'Choose the matching place'}
              className="max-h-80 overflow-y-auto overscroll-contain p-1"
            >
              {results.map((place, index) => (
                <button
                  key={place.id}
                  id={`listing-address-result-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-xl p-3 text-left ${index === active ? 'bg-emerald-50 dark:bg-emerald-950' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choosePlace(place)}
                >
                  <MapPin className="size-5 shrink-0 text-[#176b50]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{place.label}</span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-neutral-500">{place.address}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-neutral-400" />
                </button>
              ))}
            </div>
            {searchMessage && (
              <p role="status" className="px-4 pb-4 text-sm text-neutral-500">
                {searchMessage}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <button
          type="button"
          disabled={locating}
          onClick={() => {
            pendingZoom.current = 18
            onUseCurrentLocation()
          }}
          className="inline-flex min-h-11 items-center gap-2 font-medium text-[#176b50] disabled:opacity-60 dark:text-emerald-300"
        >
          {locating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
          {locating ? (th ? 'กำลังหาตำแหน่ง…' : 'Locating…') : th ? 'อยู่ที่ทรัพย์ตอนนี้' : 'I’m at the property'}
        </button>
        {!showMap && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-h-11 text-neutral-500 underline underline-offset-4"
          >
            {th ? 'เลือกบนแผนที่' : 'Choose on map'}
          </button>
        )}
      </div>
      {showMap && (
        <div className="overflow-hidden rounded-2xl border border-[#dbe8e2] dark:border-neutral-700">
          <div className="relative h-[300px] bg-[#eef3f0] sm:h-[360px]">
            {apiKey && (
              <Script
                id="longdo-map-sdk"
                src={`https://api.longdo.com/map/?key=${encodeURIComponent(apiKey)}`}
                strategy="afterInteractive"
                onReady={() => setSdkReady(true)}
                onError={() => setMapError(true)}
              />
            )}
            <div
              ref={mapElement}
              data-listing-pin-map
              tabIndex={0}
              aria-label={
                th
                  ? 'เลื่อนแผนที่ให้ปลายหมุดตรงตัวทรัพย์ ใช้ปุ่มลูกศรเพื่อขยับได้'
                  : 'Move the map to place the pin on the property. Arrow keys move the map.'
              }
              className="size-full touch-none overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-[#176b50] focus-visible:ring-inset"
              onKeyDown={(event) => {
                const offsets: Record<string, { x: number; y: number }> = {
                  ArrowLeft: { x: -12, y: 0 },
                  ArrowRight: { x: 12, y: 0 },
                  ArrowUp: { x: 0, y: -12 },
                  ArrowDown: { x: 0, y: 12 },
                }
                if (offsets[event.key]) {
                  event.preventDefault()
                  mapRef.current?.move(offsets[event.key], false)
                }
                if (event.key === '+' || event.key === '-') {
                  event.preventDefault()
                  zoomBy(event.key === '+' ? 1 : -1)
                }
              }}
            />
            {mapReady && (
              <>
                <p className="pointer-events-none absolute inset-x-3 top-3 mx-auto w-fit max-w-[90%] rounded-full bg-white/95 px-3 py-2 text-center text-xs font-medium text-[#123f32] shadow-sm">
                  {th ? 'เลื่อนแผนที่ให้ปลายหมุดตรงตัวทรัพย์' : 'Move the map to put the pin on your property'}
                </p>
                <div
                  data-location-pin
                  className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full"
                  aria-hidden="true"
                >
                  <svg width="38" height="46" viewBox="0 0 38 46" className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.28)]">
                    <path
                      d="M19 44C15 38 2 25 2 18a17 17 0 1 1 34 0c0 7-13 20-17 26Z"
                      fill="#176b50"
                      stroke="white"
                      strokeWidth="2.5"
                    />
                    <circle cx="19" cy="18" r="6" fill="white" />
                  </svg>
                  <span className="absolute bottom-[-3px] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#123f32] ring-2 ring-white" />
                </div>
                <div className="absolute right-3 bottom-7 overflow-hidden rounded-xl border border-neutral-200 bg-white text-[#123f32] shadow-sm">
                  <button
                    type="button"
                    aria-label={th ? 'ขยายแผนที่' : 'Zoom in'}
                    onClick={() => zoomBy(1)}
                    className="grid size-11 place-items-center border-b border-neutral-100"
                  >
                    <ZoomIn className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={th ? 'ย่อแผนที่' : 'Zoom out'}
                    onClick={() => zoomBy(-1)}
                    className="grid size-11 place-items-center"
                  >
                    <ZoomOut className="size-5" />
                  </button>
                </div>
              </>
            )}
            {!mapReady && (
              <div
                role="status"
                className="absolute inset-0 flex items-center justify-center gap-2 px-5 text-center text-sm text-[#31594e]"
              >
                {mapError || !apiKey ? (
                  th ? (
                    'แผนที่ยังไม่พร้อม ลองเปิดหน้านี้ใหม่อีกครั้ง'
                  ) : (
                    'Map unavailable. Please reload this page.'
                  )
                ) : (
                  <>
                    <LoaderCircle className="size-5 animate-spin" />
                    {th ? 'กำลังเปิดแผนที่…' : 'Loading map…'}
                  </>
                )}
              </div>
            )}
          </div>
          <div
            className={`flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 ${confirmed ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-[#f6f9f7] dark:bg-neutral-950'}`}
          >
            <span role="status" className="flex items-center gap-2 text-sm text-[#31594e] dark:text-emerald-200">
              {confirmed ? <CheckCircle2 className="size-4" /> : <MapPin className="size-4" />}
              {confirmed
                ? th
                  ? 'ยืนยันตำแหน่งแล้ว'
                  : 'Location confirmed'
                : outsideThailand
                  ? th
                    ? 'เลือกตำแหน่งในประเทศไทย'
                    : 'Choose a location in Thailand'
                  : th
                    ? 'ตรวจจุดนี้ก่อนยืนยัน'
                    : 'Check this point before confirming'}
            </span>
            <button
              type="button"
              data-confirm-listing-location
              disabled={!mapReady || moving || confirmed || outsideThailand}
              onClick={() => {
                const map = mapRef.current
                if (!map || moving) return
                const center = map.location(),
                  point = { lng: center.lon, lat: center.lat }
                if (!isListingPoint(point)) return
                if (zoom < 17) {
                  map.zoom(18, false)
                  return
                }
                if (!hasMarker) onChange(point)
                onConfirm()
              }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#176b50] px-4 text-sm font-semibold text-white disabled:bg-[#176b50]/50 sm:flex-none"
            >
              <Check className="size-4" />
              {confirmed
                ? th
                  ? 'ยืนยันแล้ว'
                  : 'Confirmed'
                : zoom < 17
                  ? th
                    ? 'ซูมใกล้เพื่อปักให้ตรง'
                    : 'Zoom in to place the pin'
                  : th
                    ? 'ใช้ตำแหน่งนี้'
                    : 'Use this location'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
