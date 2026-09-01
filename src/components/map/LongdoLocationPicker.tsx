'use client'

import { LoaderCircle, MapPin, Search, X, ZoomIn, ZoomOut } from 'lucide-react'
import Script from 'next/script'
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

export type LongdoPickerLocation = { lng: number; lat: number }

type LongdoLocation = { lon: number; lat: number }
type LongdoOverlay = {
  location: () => LongdoLocation
}
type LongdoMapInstance = {
  Event: {
    bind: (event: string, callback: (value?: LongdoOverlay) => void) => void
  }
  Overlays: {
    add: (overlay: LongdoOverlay) => void
    clear: () => void
    remove: (overlay: LongdoOverlay) => void
  }
  location: (location?: LongdoLocation | unknown, animate?: boolean) => LongdoLocation
  zoom: (level?: number, animate?: boolean) => number
  resize: () => LongdoMapInstance
  repaint: () => LongdoMapInstance
}
type LongdoNamespace = {
  UiComponent: { None: unknown }
  LocationMode: { Pointer: unknown }
  Map: new (options: {
    placeholder: HTMLElement
    language?: string
    location?: LongdoLocation
    zoom?: number
    lastView?: boolean
    autoResize?: boolean
    ui?: unknown
  }) => LongdoMapInstance
  Marker: new (
    location: LongdoLocation,
    options?: {
      title?: string
      detail?: string
      icon?: { html: string; offset: { x: number; y: number } }
      clickable?: boolean
      draggable?: boolean
    }
  ) => LongdoOverlay
}

type LongdoSuggestion = { w: string }
type LongdoSearchResult = {
  name: string
  address?: string
  lat: number
  lon: number
}

interface Props {
  apiKey?: string
  value: LongdoPickerLocation
  locale: 'th' | 'en'
  hasMarker?: boolean
  initialZoom?: number
  onChange: (location: LongdoPickerLocation) => void
}

const getLongdo = () => (window as unknown as { longdo?: LongdoNamespace }).longdo

const markerHtml = `
  <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:#123f32;color:#fff;border:4px solid rgba(255,255,255,.96);box-shadow:0 8px 22px rgba(18,63,50,.3);cursor:grab;box-sizing:border-box;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path>
      <circle cx="12" cy="10" r="2.5"></circle>
    </svg>
  </div>`

const copy = {
  th: {
    ariaMap: 'แผนที่สำหรับปักหมุดตำแหน่งประกาศ',
    ariaSearch: 'ค้นหาสถานที่บนแผนที่',
    placeholder: 'ค้นหาโครงการ ถนน ซอย หรือสถานที่',
    suggestionSource: 'สถานที่จาก Longdo Map',
    noSuggestion: 'ไม่พบคำแนะนำ ลองระบุเขต จังหวัด หรือชื่อสถานที่',
    suggestError: 'ค้นหาคำแนะนำไม่สำเร็จ กรุณาลองอีกครั้ง',
    noPlace: 'ไม่พบสถานที่นี้ ลองเพิ่มชื่อเขตหรือจังหวัด',
    searchError: 'ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง',
    markerTitle: 'ตำแหน่งประกาศ',
    markerDetail: 'ลากหมุดหรือแตะแผนที่เพื่อปรับตำแหน่ง',
    loading: 'กำลังโหลดแผนที่ Longdo',
    missingKey: 'ยังไม่ได้ตั้งค่า Longdo Map API Key',
    clear: 'ล้างคำค้น',
    searching: 'กำลังค้นหา',
    zoomIn: 'ขยายแผนที่',
    zoomOut: 'ย่อแผนที่',
    zoomControls: 'ควบคุมระดับการซูมแผนที่',
  },
  en: {
    ariaMap: 'Map for placing the listing location pin',
    ariaSearch: 'Search for a place on the map',
    placeholder: 'Search project, road, soi or place',
    suggestionSource: 'Place from Longdo Map',
    noSuggestion: 'No suggestions. Try adding a district, province or place name.',
    suggestError: 'Unable to load suggestions. Please try again.',
    noPlace: 'Place not found. Try adding a district or province.',
    searchError: 'Unable to search for this place. Please try again.',
    markerTitle: 'Listing location',
    markerDetail: 'Drag the pin or tap the map to adjust the location',
    loading: 'Loading Longdo Map',
    missingKey: 'Longdo Map API Key has not been configured',
    clear: 'Clear search',
    searching: 'Searching',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomControls: 'Map zoom controls',
  },
} as const

const LongdoLocationPicker = ({ apiKey, value, locale, hasMarker = false, initialZoom = 6, onChange }: Props) => {
  const text = copy[locale]
  const placeholderRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<LongdoMapInstance | null>(null)
  const markerRef = useRef<LongdoOverlay | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  const hasMarkerRef = useRef(hasMarker)
  const initialZoomRef = useRef(initialZoom)
  const skipNextValueSyncRef = useRef(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<LongdoSuggestion[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    hasMarkerRef.current = hasMarker
  }, [hasMarker])

  useEffect(() => {
    initialZoomRef.current = initialZoom
  }, [initialZoom])

  useEffect(() => {
    const touchSurface = placeholderRef.current
    if (!touchSurface) return

    const preventPagePinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault()
    }
    const preventSafariGesture = (event: Event) => event.preventDefault()

    touchSurface.addEventListener('touchmove', preventPagePinch, { passive: false })
    touchSurface.addEventListener('gesturestart', preventSafariGesture, { passive: false })
    touchSurface.addEventListener('gesturechange', preventSafariGesture, { passive: false })

    return () => {
      touchSurface.removeEventListener('touchmove', preventPagePinch)
      touchSurface.removeEventListener('gesturestart', preventSafariGesture)
      touchSurface.removeEventListener('gesturechange', preventSafariGesture)
    }
  }, [])

  const notifyLocation = useCallback((location: LongdoLocation) => {
    if (!Number.isFinite(location.lon) || !Number.isFinite(location.lat)) return
    const nextValue = { lng: location.lon, lat: location.lat }
    valueRef.current = nextValue
    skipNextValueSyncRef.current = true
    onChangeRef.current(nextValue)
  }, [])

  const createMarker = useCallback(
    (location: LongdoLocation) => {
      const map = mapRef.current
      const longdo = getLongdo()
      if (!map || !longdo) return null

      if (markerRef.current) map.Overlays.remove(markerRef.current)
      const marker = new longdo.Marker(location, {
        title: text.markerTitle,
        detail: text.markerDetail,
        clickable: true,
        draggable: true,
        icon: { html: markerHtml, offset: { x: 22, y: 42 } },
      })
      markerRef.current = marker
      map.Overlays.add(marker)
      return marker
    },
    [text.markerDetail, text.markerTitle]
  )

  useEffect(() => {
    const keyword = searchText.trim()
    if (!apiKey || !isSearchFocused || keyword.length < 3) {
      // Reset asynchronous suggestions when the field is no longer eligible for lookup.
      setSuggestions([])
      setActiveSuggestionIndex(-1)
      setIsSuggesting(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSuggesting(true)
      setSearchMessage('')
      try {
        const params = new URLSearchParams({ keyword, limit: '7', key: apiKey })
        const response = await fetch(`https://search.longdo.com/mapsearch/json/suggest?${params}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Longdo suggest request failed')
        const result = (await response.json()) as { meta?: { keyword?: string }; data?: LongdoSuggestion[] }
        if (result.meta?.keyword && result.meta.keyword !== keyword) return
        setSuggestions(result.data || [])
        setActiveSuggestionIndex(-1)
        if (!result.data?.length) setSearchMessage(text.noSuggestion)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setSearchMessage(text.suggestError)
      } finally {
        if (!controller.signal.aborted) setIsSuggesting(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [apiKey, isSearchFocused, searchText, text.noSuggestion, text.suggestError])

  const searchLocation = useCallback(
    async (rawKeyword: string) => {
      const keyword = rawKeyword.trim()
      const map = mapRef.current
      if (!apiKey || !keyword || !map || !getLongdo()) return

      setSearchText(keyword)
      setSuggestions([])
      setIsSearching(true)
      setSearchMessage('')
      try {
        const params = new URLSearchParams({ keyword, limit: '8', locale, key: apiKey })
        const response = await fetch(`https://search.longdo.com/mapsearch/json/search?${params}`)
        if (!response.ok) throw new Error('Longdo search request failed')
        const result = (await response.json()) as { data?: LongdoSearchResult[] }
        const place = result.data?.find(
          (item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon))
        )
        if (!place) {
          setSearchMessage(text.noPlace)
          setIsSearchFocused(true)
          return
        }

        const location = { lon: Number(place.lon), lat: Number(place.lat) }
        createMarker(location)
        notifyLocation(location)
        map.location(location, true)
        map.zoom(16, true)
        setSearchText(place.name || keyword)
        setIsSearchFocused(false)
        searchInputRef.current?.blur()
      } catch {
        setSearchMessage(text.searchError)
        setIsSearchFocused(true)
      } finally {
        setIsSearching(false)
      }
    },
    [apiKey, createMarker, locale, notifyLocation, text.noPlace, text.searchError]
  )

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length)
      return
    }
    if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const suggestion = suggestions[activeSuggestionIndex]
      void searchLocation(suggestion?.w || searchText)
      return
    }
    if (event.key === 'Escape') {
      setSuggestions([])
      setIsSearchFocused(false)
      searchInputRef.current?.blur()
    }
  }

  useEffect(() => {
    const longdo = getLongdo()
    if (!sdkReady || !apiKey || !placeholderRef.current || !longdo || mapRef.current) return

    const initialLocation = { lon: valueRef.current.lng, lat: valueRef.current.lat }
    const map = new longdo.Map({
      placeholder: placeholderRef.current,
      language: locale,
      location: initialLocation,
      zoom: initialZoomRef.current,
      lastView: false,
      autoResize: true,
      ui: longdo.UiComponent.None,
    })
    mapRef.current = map

    map.Event.bind('ready', () => {
      if (hasMarkerRef.current) createMarker(initialLocation)
      setMapReady(true)
      window.requestAnimationFrame(() => {
        map.resize()
        map.repaint()
      })
    })
    map.Event.bind('overlayDrop', (overlay) => {
      if (!overlay || overlay !== markerRef.current) return
      notifyLocation(overlay.location())
    })
    map.Event.bind('click', () => {
      const pointerLocation = map.location(longdo.LocationMode.Pointer)
      if (!pointerLocation) return
      createMarker(pointerLocation)
      notifyLocation(pointerLocation)
    })

    return () => {
      map.Overlays.clear()
      markerRef.current = null
      mapRef.current = null
    }
  }, [apiKey, createMarker, locale, notifyLocation, sdkReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    if (!hasMarker) {
      if (markerRef.current) map.Overlays.remove(markerRef.current)
      markerRef.current = null
      map.location({ lon: value.lng, lat: value.lat }, true)
      map.zoom(initialZoom, true)
      return
    }
    if (skipNextValueSyncRef.current) {
      skipNextValueSyncRef.current = false
      return
    }

    const location = { lon: value.lng, lat: value.lat }
    createMarker(location)
    map.location(location, true)
    map.zoom(initialZoom, true)
  }, [createMarker, hasMarker, initialZoom, mapReady, value.lat, value.lng])

  if (!apiKey) {
    return (
      <div className="flex size-full items-center justify-center bg-[#eef3f0] px-6 text-center text-sm font-medium text-[#31594e]">
        {text.missingKey}
      </div>
    )
  }

  return (
    <div className="relative size-full overflow-hidden bg-[#eef3f0]">
      <link rel="preconnect" href="https://api.longdo.com" />
      <link rel="preconnect" href="https://search.longdo.com" />
      <Script
        id="longdo-map-sdk"
        src={`https://api.longdo.com/map/?key=${encodeURIComponent(apiKey)}`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onReady={() => setSdkReady(true)}
      />
      <div
        ref={placeholderRef}
        tabIndex={-1}
        className="size-full touch-none overscroll-contain"
        aria-label={text.ariaMap}
      />

      {mapReady && (
        <>
          <div
            ref={searchContainerRef}
            className="absolute top-3 left-1/2 z-20 w-[min(92%,30rem)] -translate-x-1/2"
            onBlur={(event) => {
              const nextTarget = event.relatedTarget
              if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return
              window.setTimeout(() => {
                const container = searchContainerRef.current
                if (container && !container.contains(document.activeElement)) setIsSearchFocused(false)
              }, 150)
            }}
          >
            <div className="flex h-12 items-center rounded-2xl border border-white/80 bg-white px-3 shadow-[0_8px_28px_rgba(18,63,50,0.18)] ring-1 ring-[#dbe8e2] transition focus-within:ring-2 focus-within:ring-[#176b50]/35">
              <Search className="me-2.5 size-5 shrink-0 text-[#176b50]" aria-hidden="true" />
              <input
                ref={searchInputRef}
                value={searchText}
                type="text"
                inputMode="search"
                enterKeyHint="search"
                role="combobox"
                aria-label={text.ariaSearch}
                aria-autocomplete="list"
                aria-expanded={isSearchFocused && (suggestions.length > 0 || !!searchMessage)}
                aria-controls="longdo-listing-location-suggestions"
                aria-activedescendant={
                  activeSuggestionIndex >= 0
                    ? `longdo-listing-location-suggestion-${activeSuggestionIndex}`
                    : undefined
                }
                placeholder={text.placeholder}
                className="min-w-0 flex-1 rounded-[10px] bg-transparent font-sarabun text-base text-neutral-900 outline-none placeholder:text-neutral-400"
                onChange={(event) => {
                  setSearchText(event.target.value)
                  setSearchMessage('')
                }}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
              />
              {(isSuggesting || isSearching) && (
                <LoaderCircle
                  className="ms-2 size-4 shrink-0 animate-spin text-[#176b50]"
                  aria-label={text.searching}
                />
              )}
              {searchText && !isSuggesting && !isSearching && (
                <button
                  type="button"
                  aria-label={text.clear}
                  className="ms-2 flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                  onClick={() => {
                    setSearchText('')
                    setSuggestions([])
                    setSearchMessage('')
                    searchInputRef.current?.focus()
                  }}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {isSearchFocused && (suggestions.length > 0 || searchMessage) && (
              <div
                id="longdo-listing-location-suggestions"
                role="listbox"
                className="mt-2 overflow-hidden rounded-2xl border border-[#dfe9e5] bg-white p-1.5 shadow-[0_16px_40px_rgba(18,63,50,0.2)]"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    id={`longdo-listing-location-suggestion-${index}`}
                    key={`${suggestion.w}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    className={`flex w-full touch-manipulation items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
                      index === activeSuggestionIndex
                        ? 'bg-[#edf6f1] text-[#124d3c]'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={() => void searchLocation(suggestion.w)}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#edf6f1] text-[#176b50]">
                      <MapPin className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-sarabun text-sm font-semibold">{suggestion.w}</span>
                      <span className="block font-sarabun text-xs text-neutral-400">{text.suggestionSource}</span>
                    </span>
                  </button>
                ))}
                {searchMessage && <p className="px-3 py-3 font-sarabun text-sm text-neutral-500">{searchMessage}</p>}
              </div>
            )}
          </div>

          <div
            className="absolute end-3 bottom-3 z-20 flex flex-col overflow-hidden rounded-xl border border-[#dbe8e2] bg-white shadow-[0_8px_24px_rgba(18,63,50,0.18)]"
            aria-label={text.zoomControls}
          >
            <button
              type="button"
              className="flex size-10 items-center justify-center text-[#174d3e] transition hover:bg-[#edf6f1] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#176b50]"
              aria-label={text.zoomIn}
              onClick={() => {
                const map = mapRef.current
                if (map) map.zoom(Math.min(map.zoom() + 1, 20), true)
              }}
            >
              <ZoomIn className="size-5" aria-hidden="true" />
            </button>
            <span className="mx-2 h-px bg-[#e3ebe7]" aria-hidden="true" />
            <button
              type="button"
              className="flex size-10 items-center justify-center text-[#174d3e] transition hover:bg-[#edf6f1] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#176b50]"
              aria-label={text.zoomOut}
              onClick={() => {
                const map = mapRef.current
                if (map) map.zoom(Math.max(map.zoom() - 1, 1), true)
              }}
            >
              <ZoomOut className="size-5" aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {!mapReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#eef3f0] font-sarabun text-sm font-medium text-[#31594e]">
          <span className="me-2 size-4 animate-spin rounded-full border-2 border-[#b7d1c6] border-t-[#176b50]" />
          {text.loading}
        </div>
      )}
    </div>
  )
}

export default LongdoLocationPicker
