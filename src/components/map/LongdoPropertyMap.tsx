'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { TRealEstateListing } from '@/data/listings'
import { rememberPropertyResultsLocation } from '@/lib/propertyReturnNavigation'
import { LoaderCircle, MapPin, Search, X, ZoomIn, ZoomOut } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Script from 'next/script'
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type LongdoLocation = { lon: number; lat: number }
export type PropertyMapBounds = {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
}
export type PropertyMapAreaSearch = {
  bounds: PropertyMapBounds
  center: LongdoLocation
  zoom: number
  filters: Record<string, string>
}
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
  bound: (bounds?: PropertyMapBounds) => PropertyMapBounds
  resize: () => LongdoMapInstance
  repaint: () => LongdoMapInstance
}
type LongdoNamespace = {
  UiComponent: { None: unknown }
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

const getDemoLocationIndex = (id: string) => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  return hash % thailandDemoLocations.length
}

const getListingLocation = (listing: TRealEstateListing): LongdoLocation =>
  isInThailand(listing.map)
    ? { lon: listing.map.lng, lat: listing.map.lat }
    : thailandDemoLocations[getDemoLocationIndex(listing.id)]

const getPromotionTierRank = (tier: TRealEstateListing['mapPromotionTier']) => {
  if (tier === 'premium') return 2
  if (tier === 'boosted') return 1
  return 0
}

const getListingQualityScore = (listing: TRealEstateListing) =>
  [
    Boolean(listing.featuredImage || listing.galleryImgs?.length),
    Boolean(listing.title),
    Boolean(listing.address),
    Boolean(listing.priceAmount || listing.priceLabel || listing.price),
    Boolean(listing.metadataSummary),
  ].filter(Boolean).length

const getMarkerHtml = (listing: TRealEstateListing, price: string, active: boolean, isThai: boolean) => {
  const background = active ? '#123f32' : '#ffffff'
  const color = active ? '#ffffff' : '#173f34'
  const listingPath = `/real-estate-listings/${encodeURIComponent(listing.handle)}`
  const title = isThai ? listing.title : listing.titleEn || listing.title
  const imageUrl = listing.featuredImage || listing.galleryImgs[0] || ''
  const categoryLabel = isThai ? 'อสังหาริมทรัพย์' : 'Property'
  const promotedLabel = listing.isMapPromoted ? (isThai ? 'โปรโมต' : 'Promoted') : ''
  const imageHtml = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" style="width:96px;height:82px;flex:0 0 96px;border-radius:10px;object-fit:cover;background:#eef3f0;" />`
    : `<span aria-hidden="true" style="width:96px;height:82px;flex:0 0 96px;border-radius:10px;background:linear-gradient(145deg,#dfece6,#f5f8f6);display:flex;align-items:center;justify-content:center;color:#176b50;font-size:11px;font-weight:700;">MapxProp</span>`

  return `
  <div
    data-mapx-price-marker="true"
    data-mapx-listing-id="${escapeHtml(listing.id)}"
    data-mapx-label-visible="true"
    class="mapx-price-marker${active ? ' is-active' : ''}"
    style="--mapx-marker-bg:${background};--mapx-marker-color:${color};--mapx-fan-x:0px;--mapx-fan-y:0px;--mapx-fan-length:0px;--mapx-fan-angle:0deg;position:relative;width:max-content;padding-bottom:10px;transform:translate(calc(-50% + var(--mapx-fan-x)),calc(-100% + var(--mapx-fan-y)));font-family:Sarabun,Arial,sans-serif;"
  >
    <a
      href="${listingPath}"
      data-mapx-marker-link="true"
      aria-label="${escapeHtml(title)}"
      class="mapx-price-marker-link"
      style="position:relative;display:block;color:inherit;text-decoration:none;outline:none;"
    >
      <span aria-hidden="true" class="mapx-compact-pin"></span>
      <span class="mapx-price-pill">${escapeHtml(price)}</span>
      <span aria-hidden="true" class="mapx-price-pointer-outer"></span>
      <span aria-hidden="true" class="mapx-price-pointer-inner"></span>
    </a>
    <span aria-hidden="true" class="mapx-fan-line"></span>
    <article data-mapx-hover-card="true" aria-hidden="true" class="mapx-marker-hover-card">
      ${imageHtml}
      <span style="min-width:0;display:flex;min-height:82px;flex:1;flex-direction:column;align-items:flex-start;">
        <span style="margin:1px 0 4px;color:#176b50;font-size:10px;font-weight:700;">${categoryLabel}${promotedLabel ? ` · ${promotedLabel}` : ''}</span>
        <strong style="display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;font-size:14px;line-height:1.35;font-weight:700;text-align:left;">${escapeHtml(title)}</strong>
        <span style="margin-top:auto;font-size:13px;font-weight:700;white-space:nowrap;">${escapeHtml(price)}</span>
      </span>
    </article>
  </div>`
}

interface Props {
  apiKey: string
  currentHoverID: string
  listings: TRealEstateListing[]
  searchSourceListings?: TRealEstateListing[]
  areaSearchRequestId?: number
  onSearchArea?: (search: PropertyMapAreaSearch, listingIds: string[]) => number | void | Promise<number | void>
  onViewportChange?: () => void
  mobileControlsVisible?: boolean
  resizeRequestId?: number
  initialCenter?: LongdoLocation
  initialZoom?: number
}

const LongdoPropertyMap = ({
  apiKey,
  currentHoverID,
  listings,
  searchSourceListings = listings,
  areaSearchRequestId = 0,
  onSearchArea,
  onViewportChange,
  mobileControlsVisible = true,
  resizeRequestId = 0,
  initialCenter,
  initialZoom = 12,
}: Props) => {
  const { locale, formatCurrencyFrom } = usePreferences()
  const isThai = locale === 'th'
  const pathname = usePathname()
  const router = useRouter()
  const placeholderRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<LongdoMapInstance | null>(null)
  const listingMarkersRef = useRef<LongdoOverlay[]>([])
  const searchMarkerRef = useRef<LongdoOverlay | null>(null)
  const onViewportChangeRef = useRef(onViewportChange)
  const viewportEventsEnabledRef = useRef(false)
  const declutterAnimationFrameRef = useRef<number | null>(null)
  const declutterMarkersRef = useRef<() => void>(() => undefined)
  const [sdkReady, setSdkReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<LongdoSuggestion[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const locations = useMemo(() => listings.map((listing) => getListingLocation(listing)), [listings])
  const displayPrices = useMemo(
    () =>
      listings.map((listing) => {
        if (typeof listing.priceAmount === 'number' && listing.priceAmount > 0) {
          return `${formatCurrencyFrom(listing.priceAmount, listing.priceCurrency)}${formatPricePeriod(listing.priceUnit, isThai)}`
        }
        if (!listing.priceLabel) return listing.price
        if (isThai) return listing.priceLabel
        return listing.priceLabel === 'ติดต่อผู้จัดงาน' ? 'Contact organizer' : 'Price on request'
      }),
    [formatCurrencyFrom, isThai, listings]
  )
  const searchSourceLocations = useMemo(
    () => searchSourceListings.map((listing) => getListingLocation(listing)),
    [searchSourceListings]
  )
  const listingsById = useMemo(() => new Map(listings.map((listing) => [listing.id, listing])), [listings])

  const applyMarkerDeclutter = useCallback(() => {
    const map = mapRef.current
    const mapContainer = placeholderRef.current
    if (!map || !mapContainer) return

    const roots = Array.from(mapContainer.querySelectorAll<HTMLElement>('[data-mapx-price-marker="true"]'))
    const candidates = roots
      .map((root) => {
        const listing = listingsById.get(root.dataset.mapxListingId || '')
        const pill = root.querySelector<HTMLElement>('.mapx-price-pill')
        if (!listing || !pill) return null

        root.dataset.mapxLabelVisible = 'true'
        root.dataset.mapxFanned = 'false'
        root.style.setProperty('--mapx-fan-x', '0px')
        root.style.setProperty('--mapx-fan-y', '0px')
        root.style.setProperty('--mapx-fan-length', '0px')
        root.style.setProperty('--mapx-fan-angle', '0deg')
        return { root, pill, listing }
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
      .sort((first, second) => {
        const firstActive = first.listing.id === currentHoverID ? 1 : 0
        const secondActive = second.listing.id === currentHoverID ? 1 : 0
        if (firstActive !== secondActive) return secondActive - firstActive

        const tierDifference =
          getPromotionTierRank(second.listing.mapPromotionTier) - getPromotionTierRank(first.listing.mapPromotionTier)
        if (tierDifference) return tierDifference

        const weightDifference = (second.listing.mapPriorityWeight || 0) - (first.listing.mapPriorityWeight || 0)
        if (weightDifference) return weightDifference

        const verificationDifference = Number(second.listing.isVerified) - Number(first.listing.isVerified)
        if (verificationDifference) return verificationDifference

        const qualityDifference = getListingQualityScore(second.listing) - getListingQualityScore(first.listing)
        if (qualityDifference) return qualityDifference

        const freshnessDifference =
          new Date(second.listing.date || 0).getTime() - new Date(first.listing.date || 0).getTime()
        if (freshnessDifference) return freshnessDifference
        return first.listing.id.localeCompare(second.listing.id)
      })

    if (!candidates.length) return

    const zoom = map.zoom()
    const showEveryLabel = zoom >= 19
    if (showEveryLabel) {
      const coordinateGroups = new Map<string, typeof candidates>()
      candidates.forEach((candidate) => {
        const { lat, lng } = candidate.listing.map
        const key = `${lat.toFixed(7)}:${lng.toFixed(7)}`
        coordinateGroups.set(key, [...(coordinateGroups.get(key) || []), candidate])
      })

      coordinateGroups.forEach((group) => {
        if (group.length < 2) return
        const horizontalSpacing = Math.max(
          105,
          Math.min(190, Math.max(...group.map(({ pill }) => pill.offsetWidth)) + 18)
        )
        group.forEach(({ root }, index) => {
          if (index === 0) return
          const row = Math.ceil(index / 3)
          const column = ((index - 1) % 3) - 1
          const fanX = column * horizontalSpacing
          const fanY = row * -50
          const lineX = -fanX
          const lineY = -fanY
          const lineLength = Math.hypot(lineX, lineY)
          const lineAngle = (Math.atan2(lineY, lineX) * 180) / Math.PI
          root.dataset.mapxFanned = 'true'
          root.style.setProperty('--mapx-fan-x', `${fanX}px`)
          root.style.setProperty('--mapx-fan-y', `${fanY}px`)
          root.style.setProperty('--mapx-fan-length', `${lineLength}px`)
          root.style.setProperty('--mapx-fan-angle', `${lineAngle}deg`)
        })
      })
      return
    }

    const mapRect = mapContainer.getBoundingClientRect()
    const collisionGap = zoom <= 10 ? 14 : zoom <= 13 ? 10 : zoom <= 16 ? 7 : 4
    const acceptedRects: Array<{ left: number; top: number; right: number; bottom: number }> = []

    candidates.forEach(({ root, pill }, priorityIndex) => {
      const rect = pill.getBoundingClientRect()
      const outsideViewport =
        rect.right < mapRect.left || rect.left > mapRect.right || rect.bottom < mapRect.top || rect.top > mapRect.bottom
      if (outsideViewport) {
        root.dataset.mapxLabelVisible = 'false'
        return
      }

      const expandedRect = {
        left: rect.left - collisionGap,
        top: rect.top - collisionGap,
        right: rect.right + collisionGap,
        bottom: rect.bottom + collisionGap,
      }
      const overlaps = acceptedRects.some(
        (accepted) =>
          expandedRect.left < accepted.right &&
          expandedRect.right > accepted.left &&
          expandedRect.top < accepted.bottom &&
          expandedRect.bottom > accepted.top
      )

      root.dataset.mapxLabelVisible = overlaps ? 'false' : 'true'
      root.style.zIndex = String(900 - Math.min(priorityIndex, 850))
      if (!overlaps) acceptedRects.push(expandedRect)
    })
  }, [currentHoverID, listingsById])

  const scheduleMarkerDeclutter = useCallback(() => {
    if (declutterAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(declutterAnimationFrameRef.current)
    }
    declutterAnimationFrameRef.current = window.requestAnimationFrame(() => {
      declutterAnimationFrameRef.current = null
      applyMarkerDeclutter()
    })
  }, [applyMarkerDeclutter])

  useEffect(() => {
    declutterMarkersRef.current = scheduleMarkerDeclutter
  }, [scheduleMarkerDeclutter])

  useEffect(
    () => () => {
      if (declutterAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(declutterAnimationFrameRef.current)
      }
    },
    []
  )

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange
  }, [onViewportChange])

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

  const center = useMemo(
    () => initialCenter || locations[0] || { lon: 100.5018, lat: 13.7563 },
    [initialCenter, locations]
  )
  const initialCenterRef = useRef<LongdoLocation>(center)
  const initialZoomRef = useRef(initialZoom)

  useEffect(() => {
    const handleListingLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) return
      const propertyLink = target.closest<HTMLAnchorElement>('a[data-mapx-property-link="true"]')
      const link = target.closest<HTMLAnchorElement>('a[data-mapx-quick-view="true"], a[data-mapx-marker-link="true"]')
      if (!link && !propertyLink) return

      rememberPropertyResultsLocation(`${window.location.pathname}${window.location.search}${window.location.hash}`)

      if (!link) return

      event.preventDefault()
      event.stopImmediatePropagation()
      router.push(link.getAttribute('href') || link.href)
    }

    document.addEventListener('click', handleListingLink, true)
    return () => document.removeEventListener('click', handleListingLink, true)
  }, [router])

  useEffect(() => {
    const keyword = searchText.trim()
    if (!isSearchFocused || keyword.length < 3) {
      // Reset the asynchronous suggestion UI when the input is no longer eligible for lookup.
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

        const nextSearchParams = new URLSearchParams(window.location.search)
        nextSearchParams.set('q', place.name || keyword)
        router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
      } catch {
        setSearchMessage('ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง')
        setIsSearchFocused(true)
      } finally {
        setIsSearching(false)
      }
    },
    [apiKey, pathname, router]
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
      location: initialCenterRef.current,
      zoom: initialZoomRef.current,
      lastView: false,
      autoResize: true,
      ui: window.longdo.UiComponent.None,
    })

    let enableViewportEventsTimer: ReturnType<typeof setTimeout> | undefined
    const notifyViewportChange = () => {
      declutterMarkersRef.current()
      window.setTimeout(() => declutterMarkersRef.current(), 180)
      if (viewportEventsEnabledRef.current) onViewportChangeRef.current?.()
    }

    mapRef.current = map
    map.Event.bind('ready', () => {
      setMapReady(true)
      enableViewportEventsTimer = setTimeout(() => {
        viewportEventsEnabledRef.current = true
      }, 600)
    })
    map.Event.bind('location', notifyViewportChange)
    map.Event.bind('zoom', notifyViewportChange)

    return () => {
      if (enableViewportEventsTimer) clearTimeout(enableViewportEventsTimer)
      viewportEventsEnabledRef.current = false
      map.Overlays.clear()
      listingMarkersRef.current = []
      searchMarkerRef.current = null
      mapRef.current = null
    }
  }, [sdkReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !initialCenter) return

    map.location(initialCenter, false)
    map.zoom(initialZoom, false)
  }, [initialCenter, initialZoom, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || resizeRequestId === 0) return

    const refreshMap = () => {
      map.resize()
      map.repaint()
      declutterMarkersRef.current()
      placeholderRef.current?.focus({ preventScroll: true })
    }
    const animationFrame = window.requestAnimationFrame(refreshMap)
    const transitionTimer = window.setTimeout(refreshMap, 340)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(transitionTimer)
    }
  }, [mapReady, resizeRequestId])

  useEffect(() => {
    const map = mapRef.current
    const longdo = window.longdo
    if (!mapReady || !map || !longdo) return

    listingMarkersRef.current.forEach((marker) => map.Overlays.remove(marker))
    const nextMarkers: LongdoOverlay[] = []
    listings.forEach((listing, index) => {
      const active = listing.id === currentHoverID
      const marker = new longdo.Marker(locations[index], {
        clickable: true,
        icon: {
          html: getMarkerHtml(listing, displayPrices[index], active, isThai),
          // The exact coordinate is the bottom tip of the marker, never the price label.
          offset: { x: 0, y: 0 },
        },
      })
      map.Overlays.add(marker)
      nextMarkers.push(marker)
    })
    listingMarkersRef.current = nextMarkers
    scheduleMarkerDeclutter()
    const settleTimers = [100, 500, 1500, 4000].map((delay) => window.setTimeout(scheduleMarkerDeclutter, delay))
    return () => settleTimers.forEach((timer) => window.clearTimeout(timer))
  }, [currentHoverID, displayPrices, isThai, listings, locations, mapReady, scheduleMarkerDeclutter])

  useEffect(() => {
    if (!areaSearchRequestId || !mapReady || !onSearchArea) return

    const map = mapRef.current
    if (!map) return

    const bounds = map.bound()
    const listingIds = searchSourceListings
      .filter((_, index) => {
        const location = searchSourceLocations[index]
        return (
          location.lat >= bounds.minLat &&
          location.lat <= bounds.maxLat &&
          location.lon >= bounds.minLon &&
          location.lon <= bounds.maxLon
        )
      })
      .map((listing) => listing.id)

    const filters = Object.fromEntries(new URLSearchParams(window.location.search).entries())
    void onSearchArea(
      {
        bounds,
        center: map.location(),
        zoom: map.zoom(),
        filters,
      },
      listingIds
    )
  }, [areaSearchRequestId, mapReady, onSearchArea, searchSourceListings, searchSourceLocations])

  return (
    <div className="relative size-full overflow-hidden bg-[#eef3f0]">
      <style>{`
        .mapx-price-marker {
          cursor: pointer;
          isolation: isolate;
        }
        .mapx-price-marker[data-mapx-label-visible="false"] .mapx-price-pill,
        .mapx-price-marker[data-mapx-label-visible="false"] .mapx-price-pointer-outer,
        .mapx-price-marker[data-mapx-label-visible="false"] .mapx-price-pointer-inner {
          display: none;
        }
        .mapx-compact-pin {
          display: none;
          width: 14px;
          height: 14px;
          box-sizing: border-box;
          border: 2px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          background: #176b50;
          box-shadow: 0 3px 8px rgba(18, 63, 50, 0.28);
          transform: rotate(-45deg);
        }
        .mapx-price-marker[data-mapx-label-visible="false"] .mapx-compact-pin {
          display: block;
        }
        .mapx-price-marker[data-mapx-label-visible="false"] .mapx-price-marker-link {
          padding: 2px;
        }
        .mapx-fan-line {
          position: absolute;
          bottom: 0;
          left: 50%;
          z-index: -1;
          display: none;
          width: var(--mapx-fan-length);
          height: 1px;
          background: rgba(23, 107, 80, 0.62);
          pointer-events: none;
          transform: rotate(var(--mapx-fan-angle));
          transform-origin: 0 50%;
        }
        .mapx-price-marker[data-mapx-fanned="true"] .mapx-fan-line {
          display: block;
        }
        .mapx-price-marker:hover,
        .mapx-price-marker:focus-within {
          --mapx-marker-bg: #123f32 !important;
          --mapx-marker-color: #ffffff !important;
          z-index: 1000;
        }
        .mapx-price-pill {
          min-width: 72px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 0 12px;
          border: 2px solid #ffffff;
          border-radius: 999px;
          background: var(--mapx-marker-bg);
          color: var(--mapx-marker-color);
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 5px 16px rgba(18, 63, 50, 0.22);
          transform: scale(1);
          transform-origin: center bottom;
          transition: transform 150ms ease, background 150ms ease, color 150ms ease;
        }
        .mapx-price-marker.is-active .mapx-price-pill,
        .mapx-price-marker:hover .mapx-price-pill,
        .mapx-price-marker:focus-within .mapx-price-pill {
          transform: scale(1.08);
        }
        .mapx-price-pointer-outer,
        .mapx-price-pointer-inner {
          position: absolute;
          left: 50%;
          width: 0;
          height: 0;
          transform: translateX(-50%);
        }
        .mapx-price-pointer-outer {
          bottom: -10px;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 11px solid #ffffff;
          filter: drop-shadow(0 3px 2px rgba(18, 63, 50, 0.16));
        }
        .mapx-price-pointer-inner {
          bottom: -7px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 7px solid var(--mapx-marker-bg);
          transition: border-top-color 150ms ease;
        }
        .mapx-marker-hover-card {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          width: 280px;
          box-sizing: border-box;
          display: flex;
          gap: 10px;
          padding: 9px;
          border: 1px solid rgba(18, 63, 50, 0.14);
          border-radius: 13px;
          background: #ffffff;
          color: #171717;
          box-shadow: 0 14px 34px rgba(18, 63, 50, 0.22);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translate(-50%, -5px) scale(0.97);
          transform-origin: top center;
          transition: opacity 130ms ease, visibility 130ms ease, transform 130ms ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .mapx-price-marker:hover .mapx-marker-hover-card,
          .mapx-price-marker:focus-within .mapx-marker-hover-card {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
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
        aria-label="แผนที่ประกาศอสังหาริมทรัพย์"
      />
      {mapReady && (
        <>
          <div
            ref={searchContainerRef}
            className={`absolute top-3 left-1/2 z-20 w-[min(92%,26rem)] -translate-x-1/2 ${
              mobileControlsVisible ? '' : 'max-lg:hidden'
            }`}
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
                      <span className="block truncate text-sm font-semibold">{suggestion.w}</span>
                      <span className="block text-xs text-neutral-400">สถานที่จาก Longdo Map</span>
                    </span>
                  </button>
                ))}
                {searchMessage && <p className="px-3 py-3 text-sm text-neutral-500">{searchMessage}</p>}
              </div>
            )}
          </div>

          <div
            className={`absolute end-3 bottom-3 z-20 flex flex-col overflow-hidden rounded-xl border border-[#dbe8e2] bg-white shadow-[0_8px_24px_rgba(18,63,50,0.18)] ${
              mobileControlsVisible ? '' : 'max-lg:hidden'
            }`}
            aria-label="ควบคุมระดับการซูมแผนที่"
          >
            <button
              type="button"
              className="flex size-10 items-center justify-center text-[#174d3e] transition hover:bg-[#edf6f1] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#176b50]"
              aria-label="ขยายแผนที่"
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
              aria-label="ย่อแผนที่"
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#eef3f0] text-sm font-medium text-[#31594e]">
          <span className="me-2 size-4 animate-spin rounded-full border-2 border-[#b7d1c6] border-t-[#176b50]" />
          กำลังโหลดแผนที่ Longdo
        </div>
      )}
    </div>
  )
}

export default LongdoPropertyMap

const formatPricePeriod = (unit: string | undefined, isThai: boolean) => {
  if (unit === 'month') return isThai ? '/เดือน' : '/month'
  if (unit === 'day') return isThai ? '/วัน' : '/day'
  if (unit === 'week') return isThai ? '/สัปดาห์' : '/week'
  if (unit === 'event_period') return isThai ? '/งาน' : '/event'
  return ''
}
