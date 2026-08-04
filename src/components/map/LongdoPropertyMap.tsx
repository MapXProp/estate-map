'use client'

import { TRealEstateListing } from '@/data/listings'
import { LoaderCircle, MapPin, Search, X } from 'lucide-react'
import Script from 'next/script'
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type LongdoLocation = { lon: number; lat: number }
type LongdoOverlay = object
type LongdoMapInstance = {
  Event: { bind: (event: string, callback: () => void) => void }
  Overlays: {
    add: (overlay: LongdoOverlay) => void
    clear: () => void
    remove: (overlay: LongdoOverlay) => void
  }
  location: (location?: LongdoLocation, animate?: boolean) => LongdoLocation
  zoom: (level?: number, animate?: boolean) => number
}
type LongdoNamespace = {
  Map: new (options: {
    placeholder: HTMLElement
    language?: string
    location?: LongdoLocation
    zoom?: number
    lastView?: boolean
    autoResize?: boolean
  }) => LongdoMapInstance
  Marker: new (
    location: LongdoLocation,
    options?: {
      title?: string
      detail?: string
      icon?: { html: string; offset: { x: number; y: number } }
      popup?: { html: string; size?: { width: number; height: number } }
      clickable?: boolean
    }
  ) => LongdoOverlay
}

type LongdoSuggestion = {
  w: string
  d?: string
  s?: string
}

type LongdoSearchResult = {
  name: string
  address?: string
  lat: number
  lon: number
  type?: string
}

declare global {
  interface Window {
    longdo?: LongdoNamespace
  }
}

const thailandDemoLocations: LongdoLocation[] = [
  { lon: 100.5018, lat: 13.7563 },
  { lon: 100.5324, lat: 13.7452 },
  { lon: 100.5683, lat: 13.7349 },
  { lon: 100.5418, lat: 13.7798 },
  { lon: 100.4762, lat: 13.7281 },
  { lon: 100.5914, lat: 13.7527 },
  { lon: 100.517, lat: 13.8006 },
  { lon: 100.4931, lat: 13.7862 },
]

const isInThailand = ({ lat, lng }: TRealEstateListing['map']) => lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106

const escapeHtml = (value: string | number) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const getListingLocation = (listing: TRealEstateListing, index: number): LongdoLocation =>
  isInThailand(listing.map)
    ? { lon: listing.map.lng, lat: listing.map.lat }
    : thailandDemoLocations[index % thailandDemoLocations.length]

const getMarkerHtml = (price: string, active: boolean) => `
  <div style="
    min-width:72px;
    height:34px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0 12px;
    border-radius:999px;
    border:2px solid #ffffff;
    background:${active ? '#123f32' : '#ffffff'};
    color:${active ? '#ffffff' : '#173f34'};
    font-family:Sarabun,Arial,sans-serif;
    font-size:13px;
    font-weight:700;
    white-space:nowrap;
    box-shadow:0 5px 16px rgba(18,63,50,.22);
    transform:${active ? 'scale(1.08)' : 'scale(1)'};
    transition:transform .15s ease,background .15s ease,color .15s ease;
  ">${escapeHtml(price)}</div>`

const getPopupHtml = (listing: TRealEstateListing) => `
  <article style="width:260px;padding:14px 16px;font-family:Sarabun,Arial,sans-serif;color:#171717;">
    <p style="margin:0 0 4px;color:#176b50;font-size:12px;font-weight:700;">อสังหาริมทรัพย์</p>
    <h3 style="margin:0;font-size:16px;line-height:1.35;font-weight:700;">${escapeHtml(listing.title)}</h3>
    <p style="margin:7px 0 0;color:#737373;font-size:13px;line-height:1.4;">${escapeHtml(listing.address)}</p>
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #eeeeee;display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <strong style="font-size:15px;white-space:nowrap;">${escapeHtml(listing.price)}</strong>
      <a href="/real-estate-listings/${encodeURIComponent(listing.handle)}" style="border-radius:999px;background:#123f32;color:#ffffff;padding:7px 12px;text-decoration:none;font-size:12px;font-weight:700;">ดูประกาศ</a>
    </div>
  </article>`

interface Props {
  apiKey: string
  currentHoverID: string
  listings: TRealEstateListing[]
}

const LongdoPropertyMap = ({ apiKey, currentHoverID, listings }: Props) => {
  const placeholderRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<LongdoMapInstance | null>(null)
  const listingMarkersRef = useRef<LongdoOverlay[]>([])
  const searchMarkerRef = useRef<LongdoOverlay | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<LongdoSuggestion[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const locations = useMemo(() => listings.map((listing, index) => getListingLocation(listing, index)), [listings])
  const center = useMemo(() => locations[0] || { lon: 100.5018, lat: 13.7563 }, [locations])

  useEffect(() => {
    const keyword = searchText.trim()
    if (!isSearchFocused || keyword.length < 3) {
      setSuggestions([])
      setActiveSuggestionIndex(-1)
      setIsSuggesting(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
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
        if (!result.data?.length) setSearchMessage('ไม่พบคำแนะนำ ลองระบุเขต จังหวัด หรือชื่อสถานที่')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setSearchMessage('ค้นหาคำแนะนำไม่สำเร็จ กรุณาลองอีกครั้ง')
      } finally {
        if (!controller.signal.aborted) setIsSuggesting(false)
      }
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [apiKey, isSearchFocused, searchText])

  const searchLocation = useCallback(
    async (rawKeyword: string) => {
      const keyword = rawKeyword.trim()
      const map = mapRef.current
      const longdo = window.longdo
      if (!keyword || !map || !longdo) return

      setSearchText(keyword)
      setSuggestions([])
      setIsSearching(true)
      setSearchMessage('')
      try {
        const params = new URLSearchParams({ keyword, limit: '8', locale: 'th', key: apiKey })
        const response = await fetch(`https://search.longdo.com/mapsearch/json/search?${params}`)
        if (!response.ok) throw new Error('Longdo search request failed')
        const result = (await response.json()) as { data?: LongdoSearchResult[] }
        const place = result.data?.find(
          (item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon))
        )
        if (!place) {
          setSearchMessage('ไม่พบสถานที่นี้ ลองเพิ่มชื่อเขตหรือจังหวัด')
          setIsSearchFocused(true)
          return
        }

        const location = { lon: Number(place.lon), lat: Number(place.lat) }
        if (searchMarkerRef.current) map.Overlays.remove(searchMarkerRef.current)
        const marker = new longdo.Marker(location, {
          title: place.name || keyword,
          detail: place.address || 'ตำแหน่งที่ค้นหา',
          clickable: true,
        })
        searchMarkerRef.current = marker
        map.Overlays.add(marker)
        map.location(location, true)
        map.zoom(15, true)
        setSearchText(place.name || keyword)
        setIsSearchFocused(false)
        searchInputRef.current?.blur()
      } catch {
        setSearchMessage('ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง')
        setIsSearchFocused(true)
      } finally {
        setIsSearching(false)
      }
    },
    [apiKey]
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
    if (!sdkReady || !placeholderRef.current || !window.longdo || mapRef.current) return

    const map = new window.longdo.Map({
      placeholder: placeholderRef.current,
      language: 'th',
      location: center,
      zoom: 12,
      lastView: false,
      autoResize: true,
    })

    mapRef.current = map
    map.Event.bind('ready', () => setMapReady(true))

    return () => {
      map.Overlays.clear()
      listingMarkersRef.current = []
      searchMarkerRef.current = null
      mapRef.current = null
    }
  }, [center, sdkReady])

  useEffect(() => {
    const map = mapRef.current
    const longdo = window.longdo
    if (!mapReady || !map || !longdo) return

    listingMarkersRef.current.forEach((marker) => map.Overlays.remove(marker))
    const nextMarkers: LongdoOverlay[] = []
    listings.forEach((listing, index) => {
      const active = listing.id === currentHoverID
      const marker = new longdo.Marker(locations[index], {
        title: listing.title,
        clickable: true,
        icon: {
          html: getMarkerHtml(listing.price, active),
          offset: { x: 40, y: 17 },
        },
        popup: {
          html: getPopupHtml(listing),
          size: { width: 292, height: 210 },
        },
      })
      map.Overlays.add(marker)
      nextMarkers.push(marker)
    })
    listingMarkersRef.current = nextMarkers
  }, [currentHoverID, listings, locations, mapReady])

  return (
    <div className="relative size-full overflow-hidden bg-[#eef3f0]">
      <Script
        id="longdo-map-sdk"
        src={`https://api.longdo.com/map/?key=${encodeURIComponent(apiKey)}`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onReady={() => setSdkReady(true)}
      />
      <div ref={placeholderRef} className="size-full" aria-label="แผนที่ประกาศอสังหาริมทรัพย์" />
      {mapReady && (
        <div
          ref={searchContainerRef}
          className="absolute top-3 left-1/2 z-20 w-[min(92%,26rem)] -translate-x-1/2"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsSearchFocused(false)
          }}
        >
          <div className="flex h-12 items-center rounded-2xl border border-white/80 bg-white px-3 shadow-[0_8px_28px_rgba(18,63,50,0.18)] ring-1 ring-[#dbe8e2] transition focus-within:ring-2 focus-within:ring-[#176b50]/35">
            <Search className="me-2.5 size-5 shrink-0 text-[#176b50]" aria-hidden="true" />
            <input
              ref={searchInputRef}
              value={searchText}
              type="search"
              role="combobox"
              aria-label="ค้นหาสถานที่บนแผนที่"
              aria-autocomplete="list"
              aria-expanded={isSearchFocused && (suggestions.length > 0 || !!searchMessage)}
              aria-controls="longdo-location-suggestions"
              aria-activedescendant={
                activeSuggestionIndex >= 0 ? `longdo-location-suggestion-${activeSuggestionIndex}` : undefined
              }
              placeholder="ค้นหาเขต ย่าน ถนน หรือสถานที่"
              className="min-w-0 flex-1 bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-400"
              onChange={(event) => {
                setSearchText(event.target.value)
                setSearchMessage('')
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
            />
            {(isSuggesting || isSearching) && (
              <LoaderCircle className="ms-2 size-4 shrink-0 animate-spin text-[#176b50]" aria-label="กำลังค้นหา" />
            )}
            {searchText && !isSuggesting && !isSearching && (
              <button
                type="button"
                aria-label="ล้างคำค้น"
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
              id="longdo-location-suggestions"
              role="listbox"
              className="mt-2 overflow-hidden rounded-2xl border border-[#dfe9e5] bg-white p-1.5 shadow-[0_16px_40px_rgba(18,63,50,0.2)]"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  id={`longdo-location-suggestion-${index}`}
                  key={`${suggestion.w}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeSuggestionIndex}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
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
                    <span className="block truncate text-sm font-semibold">{suggestion.w}</span>
                    <span className="block text-xs text-neutral-400">สถานที่จาก Longdo Map</span>
                  </span>
                </button>
              ))}
              {searchMessage && <p className="px-3 py-3 text-sm text-neutral-500">{searchMessage}</p>}
            </div>
          )}
        </div>
      )}
      {!mapReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#eef3f0] text-sm font-medium text-[#31594e]">
          <span className="me-2 size-4 animate-spin rounded-full border-2 border-[#b7d1c6] border-t-[#176b50]" />
          กำลังโหลดแผนที่ Longdo
        </div>
      )}
    </div>
  )
}

export default LongdoPropertyMap
