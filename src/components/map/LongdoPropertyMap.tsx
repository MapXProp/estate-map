'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { TRealEstateListing } from '@/data/listings'
import {
  fetchMapSearchSuggestions,
  preferredMapProject,
  projectSearchSuggestion,
  searchMapPlace,
  searchMapProjects,
  type MapSearchSuggestion,
} from '@/lib/propertyMapLocationSearch'
import {
  groupMapProjects,
  projectCategoryLabel,
  type MapProject,
  type MapProjectDetails,
  type PropertyMapMode,
} from '@/lib/propertyMapProjects'
import { rememberPropertyResultsLocation } from '@/lib/propertyReturnNavigation'
import { Building2, House, LoaderCircle, MapPin, Search, ShoppingBag, X, ZoomIn, ZoomOut } from 'lucide-react'
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
  Ui: { Crosshair: { visible: (state: boolean) => unknown } }
  Event: { bind: (event: string, callback: () => void) => void }
  Overlays: {
    add: (overlay: LongdoOverlay) => void
    clear: () => void
    remove: (overlay: LongdoOverlay) => void
  }
  location: (location?: LongdoLocation | { x: number; y: number }, animate?: boolean) => LongdoLocation
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

declare global {
  interface Window {
    longdo?: LongdoNamespace
  }
}

const isValidLocation = ({ lat, lon }: LongdoLocation) =>
  Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180

const escapeHtml = (value: string | number) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export const getSearchMarkerHtml = (label: string) => `
  <div data-mapx-search-marker="true" class="mapx-search-marker" role="img" aria-label="${escapeHtml(label)}">
    <span class="mapx-search-marker-label" aria-hidden="true">${escapeHtml(label)}</span>
    <svg class="mapx-search-marker-pin" aria-hidden="true" width="22" height="30" viewBox="0 0 22 30">
      <path d="M11 0C5 0 0 4.9 0 11c0 8 11 19 11 19s11-11 11-19C22 4.9 17 0 11 0Z" fill="#ef0000"/>
      <circle cx="11" cy="10.5" r="4" fill="white"/>
    </svg>
  </div>`

const getListingLocation = (listing: TRealEstateListing): LongdoLocation => ({
  lon: listing.map.lng,
  lat: listing.map.lat,
})

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

// Screen offsets only: each spoke still ends at the listing's stored coordinate.
// Callers order by listing ID so choosing a different preview cannot shuffle pins.
export const getSpiderOffsets = (count: number, labelWidth: number) => {
  const offsets: Array<{ x: number; y: number }> = []
  if (count < 2) return offsets
  const horizontalRadius = Math.max(64, Math.min(84, labelWidth / 2 + 12))
  for (let start = 0, ring = 1; start < count; ring++) {
    const ringCount = Math.min(8 * ring, count - start)
    for (let index = 0; index < ringCount; index++) {
      const angle = (index * Math.PI * 2) / ringCount - (count === 2 ? Math.PI : Math.PI / 2)
      offsets.push({
        x: Math.round(Math.cos(angle) * horizontalRadius * ring),
        y: Math.round(Math.sin(angle) * 64 * ring),
      })
    }
    start += ringCount
  }
  return offsets
}

export const getMarkerHtml = (
  listing: TRealEstateListing,
  price: string,
  active: boolean,
  isThai: boolean,
  dockedPreview: boolean,
  previewSelected: boolean
) => {
  const background = active ? '#123f32' : '#ffffff'
  const color = active ? '#ffffff' : '#173f34'
  const listingPath = `/real-estate-listings/${encodeURIComponent(listing.handle)}`
  const title = isThai ? listing.title : listing.titleEn || listing.title
  const imageUrl = listing.featuredImage || listing.galleryImgs[0] || ''
  const categoryLabel = isThai ? 'อสังหาริมทรัพย์' : 'Property'
  const promotedLabel = listing.isMapPromoted ? (isThai ? 'โปรโมต' : 'Promoted') : ''
  const imageHtml = imageUrl
    ? `<img data-mapx-preview-src="${escapeHtml(imageUrl)}" alt="" loading="lazy" style="width:96px;height:82px;flex:0 0 96px;border-radius:10px;object-fit:cover;background:#eef3f0;" />`
    : `<span aria-hidden="true" style="width:96px;height:82px;flex:0 0 96px;border-radius:10px;background:linear-gradient(145deg,#dfece6,#f5f8f6);display:flex;align-items:center;justify-content:center;color:#176b50;font-size:11px;font-weight:700;">MapxProp</span>`
  const previewLabel = isThai ? 'ดูรูปและราคา' : 'Preview photos and price'

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
      aria-label="${dockedPreview ? `${previewLabel} ` : ''}${escapeHtml(title)}"
      ${dockedPreview ? `aria-controls="map-property-preview" aria-expanded="${previewSelected}"` : ''}
      class="mapx-price-marker-link"
      style="position:relative;display:block;color:inherit;text-decoration:none;outline:none;"
    >
      <span aria-hidden="true" class="mapx-compact-pin"></span>
      ${
        dockedPreview
          ? ''
          : `<span class="mapx-price-pill">${escapeHtml(price)}</span>
      <span aria-hidden="true" class="mapx-price-pointer-outer"></span>
      <span aria-hidden="true" class="mapx-price-pointer-inner"></span>`
      }
    </a>
    ${
      dockedPreview
        ? `<a
      href="${listingPath}"
      data-mapx-quick-view="true"
      class="mapx-price-details-link"
      style="color:inherit;text-decoration:none;"
      aria-controls="map-property-preview"
      aria-expanded="${previewSelected}"
      aria-label="${previewLabel} ${escapeHtml(title)} · ${escapeHtml(price)}"
    ><span class="mapx-price-pill">${escapeHtml(price)}</span></a>`
        : ''
    }
    <span aria-hidden="true" class="mapx-fan-line"></span>
    ${
      dockedPreview
        ? ''
        : `<article data-mapx-hover-card="true" aria-hidden="true" class="mapx-marker-hover-card">
      ${imageHtml}
      <span style="min-width:0;display:flex;min-height:82px;flex:1;flex-direction:column;align-items:flex-start;">
        <span style="margin:1px 0 4px;color:#176b50;font-size:10px;font-weight:700;">${categoryLabel}${promotedLabel ? ` · ${promotedLabel}` : ''}</span>
        <strong style="display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;font-size:14px;line-height:1.35;font-weight:700;text-align:left;">${escapeHtml(title)}</strong>
        <span style="margin-top:auto;font-size:13px;font-weight:700;white-space:nowrap;">${escapeHtml(price)}</span>
      </span>
    </article>`
    }
  </div>`
}

export type PropertyMapViewport = {
  center: LongdoLocation
  zoom: number
  bounds?: PropertyMapBounds
  initial?: boolean
}

export const getProjectMarkerHtml = (project: MapProject, isThai: boolean, selected: boolean) => {
  const name = project.displayName || project.nameEn || project.name
  const label = isThai ? 'ดูประกาศทั้งหมดในโครงการ' : 'View all listings in this project'
  const count = project.listingCount ?? project.listingIds.length
  const countLabel =
    project.listingCount === undefined
      ? isThai
        ? 'ประกาศที่ตรงกับการค้นหา'
        : 'Matching listings'
      : isThai
        ? 'ประกาศทั้งหมดในโครงการ'
        : 'All project listings'
  const location = `&lat=${project.location.lat}&lon=${project.location.lon}&zoom=17`
  return `<div data-mapx-project-marker="true" data-mapx-project-id="${escapeHtml(project.id)}" data-mapx-project-slug="${escapeHtml(project.slug)}" class="mapx-project-marker${selected ? ' is-selected' : ''}">
    <a href="/properties/map?map_mode=projects&amp;project=${encodeURIComponent(project.slug || project.id)}${escapeHtml(location)}" data-mapx-project-link="true" aria-controls="map-project-listings" aria-expanded="${selected}" aria-label="${escapeHtml(name)} · ${label}" class="mapx-project-link">
      <span class="mapx-project-label"><span>${escapeHtml(name)}</span><small>${isThai ? 'โครงการ · ดูประกาศ' : 'Project · View listings'}</small></span>
      <span class="mapx-project-pin"><svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3"/></svg><b aria-label="${countLabel}">${count}</b></span>
    </a>
  </div>`
}

interface Props {
  apiKey: string
  currentHoverID: string
  listings: TRealEstateListing[]
  searchSourceListings?: TRealEstateListing[]
  areaSearchRequestId?: number
  onSearchArea?: (search: PropertyMapAreaSearch, listingIds: string[]) => number | void | Promise<number | void>
  onViewportChange?: (viewport: PropertyMapViewport) => void
  mobileControlsVisible?: boolean
  resizeRequestId?: number
  initialCenter?: LongdoLocation
  initialZoom?: number
  exactCoordinates?: boolean
  searchContainerClassName?: string
  zoomControlsClassName?: string
  onLocationSearchFocus?: () => void
  onLocationSearch?: (location: LongdoLocation, label: string) => void
  onMarkerSelect?: (id: string) => void
  onProjectSelect?: (project: MapProject) => void
  onProjectSearchSelect?: (project: MapProjectDetails) => void
  selectedProjectId?: string
  mapMode?: PropertyMapMode
  projectMarkers?: MapProject[]
  onMapInteraction?: () => void
  onMapBackgroundTap?: () => void
  previewListingId?: string
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
  exactCoordinates = false,
  searchContainerClassName,
  zoomControlsClassName,
  onLocationSearchFocus,
  onLocationSearch,
  onMarkerSelect,
  onProjectSelect,
  onProjectSearchSelect,
  selectedProjectId = '',
  mapMode = 'listings',
  projectMarkers,
  onMapInteraction,
  onMapBackgroundTap,
  previewListingId = '',
}: Props) => {
  const { locale, formatCurrencyFrom } = usePreferences()
  const isThai = locale === 'th'
  const pathname = usePathname()
  const router = useRouter()
  const placeholderRef = useRef<HTMLDivElement>(null)
  const singlePointerGestureRef = useRef(false)
  const backgroundTapRef = useRef<{ pointerId: number; x: number; y: number; started: number; moved: boolean } | null>(
    null
  )
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<LongdoMapInstance | null>(null)
  const listingMarkersRef = useRef<LongdoOverlay[]>([])
  const searchMarkerRef = useRef<{
    overlay: LongdoOverlay
    map: LongdoMapInstance
    timer: number
    fading: boolean
  } | null>(null)
  const searchMarkerGestureRef = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const onViewportChangeRef = useRef(onViewportChange)
  const onLocationSearchRef = useRef(onLocationSearch)
  const viewportEventsEnabledRef = useRef(false)
  const declutterAnimationFrameRef = useRef<number | null>(null)
  const declutterMarkersRef = useRef<() => void>(() => undefined)
  const currentHoverIDRef = useRef(currentHoverID)
  const previewListingIdRef = useRef(previewListingId)
  const selectedProjectIdRef = useRef(selectedProjectId)
  const [sdkReady, setSdkReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<MapSearchSuggestion[]>([])
  const searchRequestRef = useRef<AbortController | null>(null)
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
  const projects = useMemo(
    () => (mapMode === 'projects' ? (projectMarkers ?? groupMapProjects(listings)) : []),
    [listings, mapMode, projectMarkers]
  )

  const clearSearchMarker = useCallback(() => {
    const cue = searchMarkerRef.current
    if (!cue) return
    window.clearTimeout(cue.timer)
    cue.map.Overlays.remove(cue.overlay)
    searchMarkerRef.current = null
  }, [])

  const fadeSearchMarker = useCallback(() => {
    const cue = searchMarkerRef.current
    if (!cue || cue.fading) return
    window.clearTimeout(cue.timer)
    cue.fading = true
    const element = placeholderRef.current?.querySelector<HTMLElement>('[data-mapx-search-marker="true"]')
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clearSearchMarker()
      return
    }
    element.style.opacity = '0'
    cue.timer = window.setTimeout(() => {
      if (searchMarkerRef.current === cue) clearSearchMarker()
    }, 500)
  }, [clearSearchMarker])

  useEffect(() => {
    if (previewListingId || selectedProjectId) fadeSearchMarker()
  }, [previewListingId, selectedProjectId, fadeSearchMarker])

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
        const firstActive = first.listing.id === currentHoverIDRef.current ? 1 : 0
        const secondActive = second.listing.id === currentHoverIDRef.current ? 1 : 0
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

    const zoom = map.zoom()
    const projectRoots = Array.from(mapContainer.querySelectorAll<HTMLElement>('[data-mapx-project-marker]'))
    projectRoots.forEach((root) => {
      root.dataset.mapxProjectLabel = zoom >= 16 ? 'true' : 'false'
    })
    if (!candidates.length) return
    const showEveryLabel = !exactCoordinates && zoom >= 19
    // Expand duplicates at street zoom, or on selection while zoomed out.
    if (zoom >= 16 || currentHoverIDRef.current) {
      const coordinateGroups = new Map<string, typeof candidates>()
      candidates.forEach((candidate) => {
        const { lat, lng } = candidate.listing.map
        const key = `${lat.toFixed(7)}:${lng.toFixed(7)}`
        coordinateGroups.set(key, [...(coordinateGroups.get(key) || []), candidate])
      })

      coordinateGroups.forEach((group) => {
        if (group.length < 2) return
        if (zoom < 16 && !group.some(({ listing }) => listing.id === currentHoverIDRef.current)) return
        group.sort((first, second) => first.listing.id.localeCompare(second.listing.id))
        const offsets = getSpiderOffsets(group.length, Math.max(...group.map(({ pill }) => pill.offsetWidth)))
        group.forEach(({ root }, index) => {
          const { x: fanX, y: fanY } = offsets[index]
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
    }

    if (exactCoordinates && zoom <= 12) {
      candidates.forEach(({ root, listing }) => {
        root.dataset.mapxLabelVisible =
          root.dataset.mapxFanned === 'true' || listing.id === currentHoverIDRef.current ? 'true' : 'false'
      })
      return
    }

    if (showEveryLabel) {
      return
    }

    const mapRect = mapContainer.getBoundingClientRect()
    const collisionGap = zoom <= 10 ? 14 : zoom <= 13 ? 10 : zoom <= 16 ? 7 : 4
    const acceptedRects: Array<{ left: number; top: number; right: number; bottom: number }> = projectRoots.flatMap(
      (root) => {
        const label = root.querySelector<HTMLElement>('.mapx-project-label')
        return [root.getBoundingClientRect(), ...(label?.offsetWidth ? [label.getBoundingClientRect()] : [])]
      }
    )

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
  }, [exactCoordinates, listingsById])

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

  useEffect(() => {
    currentHoverIDRef.current = currentHoverID
    previewListingIdRef.current = previewListingId
    selectedProjectIdRef.current = selectedProjectId

    const mapContainer = placeholderRef.current
    if (!mapContainer) return

    mapContainer.querySelectorAll<HTMLElement>('[data-mapx-price-marker="true"]').forEach((root) => {
      root.classList.toggle('is-active', root.dataset.mapxListingId === currentHoverID)
      root.querySelectorAll('[aria-controls="map-property-preview"]').forEach((link) => {
        link.setAttribute('aria-expanded', String(root.dataset.mapxListingId === previewListingId))
      })
    })
    mapContainer.querySelectorAll<HTMLElement>('[data-mapx-project-marker]').forEach((root) => {
      const selected =
        Boolean(selectedProjectId) &&
        (root.dataset.mapxProjectId === selectedProjectId || root.dataset.mapxProjectSlug === selectedProjectId)
      root.classList.toggle('is-selected', selected)
      root.querySelector('[data-mapx-project-link]')?.setAttribute('aria-expanded', String(selected))
    })
    scheduleMarkerDeclutter()
  }, [currentHoverID, previewListingId, selectedProjectId, scheduleMarkerDeclutter])

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
    onLocationSearchRef.current = onLocationSearch
  }, [onViewportChange, onLocationSearch])

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
    () => initialCenter || locations.find(isValidLocation) || { lon: 100.5018, lat: 13.7563 },
    [initialCenter, locations]
  )
  const initialCenterRef = useRef<LongdoLocation>(center)
  const initialZoomRef = useRef(initialZoom)

  useEffect(() => {
    const markerLink = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null
      const link = target.closest<HTMLAnchorElement>(
        'a[data-mapx-quick-view="true"], a[data-mapx-marker-link="true"], a[data-mapx-project-link="true"]'
      )
      return link && placeholderRef.current?.contains(link) ? link : null
    }
    const activateMarker = (link: HTMLAnchorElement) => {
      fadeSearchMarker()
      if (link.dataset.mapxProjectLink === 'true' && onProjectSelect) {
        const projectId = link.closest<HTMLElement>('[data-mapx-project-marker]')?.dataset.mapxProjectId
        const project = projects.find((item) => item.id === projectId)
        if (project) onProjectSelect(project)
        return
      }
      const markerId = link.closest<HTMLElement>('[data-mapx-price-marker="true"]')?.dataset.mapxListingId
      if (markerId && onMarkerSelect) {
        if (previewListingIdRef.current !== markerId) onMarkerSelect(markerId)
        return
      }
      rememberPropertyResultsLocation(`${window.location.pathname}${window.location.search}${window.location.hash}`)
      router.push(link.getAttribute('href') || link.href, { scroll: false })
    }
    let tap: {
      link: HTMLAnchorElement
      pointerId: number
      x: number
      y: number
      started: number
      moved: boolean
    } | null = null
    let markerTouch = false
    let ignoreTouchClickUntil = 0
    const pendingTaps = new Set<number>()
    // Longdo prevents the default touch sequence, which can suppress the browser's
    // compatibility click. Track actual taps before the SDK handles those events.
    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        ignoreTouchClickUntil = 0
        markerTouch = false
        tap = null
        return
      }
      if (!event.isPrimary || event.button !== 0) {
        tap = null
        return
      }
      ignoreTouchClickUntil = 0
      const link = markerLink(event.target)
      markerTouch = Boolean(link)
      tap = link
        ? {
            link,
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            started: event.timeStamp,
            moved: false,
          }
        : null
    }
    const pointerMove = (event: PointerEvent) => {
      if (tap?.pointerId === event.pointerId && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 10)
        tap.moved = true
    }
    const pointerUp = (event: PointerEvent) => {
      if (markerTouch && event.pointerType !== 'mouse') {
        ignoreTouchClickUntil = Date.now() + 800
        if (event.isPrimary) markerTouch = false
      }
      if (!tap || tap.pointerId !== event.pointerId) return
      const ended = tap
      tap = null
      ignoreTouchClickUntil = Date.now() + 800
      if (
        ended.moved ||
        Math.hypot(event.clientX - ended.x, event.clientY - ended.y) > 10 ||
        event.timeStamp - ended.started > 600
      )
        return
      // Let the SDK finish touchend before changing the preview or opening a modal.
      const frame = window.requestAnimationFrame(() => {
        pendingTaps.delete(frame)
        activateMarker(ended.link)
      })
      pendingTaps.add(frame)
    }
    const pointerCancel = () => {
      if (markerTouch) ignoreTouchClickUntil = Date.now() + 800
      markerTouch = false
      tap = null
    }
    const handleListingLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) return
      const propertyLink = target.closest<HTMLAnchorElement>('a[data-mapx-property-link="true"]')
      const link = markerLink(target)
      if (!link && !propertyLink) return
      if (!link) {
        rememberPropertyResultsLocation(`${window.location.pathname}${window.location.search}${window.location.hash}`)
        return
      }
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.detail !== 0 && Date.now() < ignoreTouchClickUntil) return
      activateMarker(link)
    }

    document.addEventListener('pointerdown', pointerDown, true)
    document.addEventListener('pointermove', pointerMove, true)
    document.addEventListener('pointerup', pointerUp, true)
    document.addEventListener('pointercancel', pointerCancel, true)
    document.addEventListener('click', handleListingLink, true)
    return () => {
      pendingTaps.forEach((frame) => window.cancelAnimationFrame(frame))
      document.removeEventListener('pointerdown', pointerDown, true)
      document.removeEventListener('pointermove', pointerMove, true)
      document.removeEventListener('pointerup', pointerUp, true)
      document.removeEventListener('pointercancel', pointerCancel, true)
      document.removeEventListener('click', handleListingLink, true)
    }
  }, [onMarkerSelect, onProjectSelect, projects, router, fadeSearchMarker])

  useEffect(() => {
    const container = placeholderRef.current
    if (!container) return
    // A hidden hover card must not download a full image for every map pin.
    const loadPreviewImage = (event: Event) => {
      if (!(event.target instanceof Element)) return
      const root = event.target.closest('[data-mapx-price-marker="true"]')
      const preview = root?.querySelector<HTMLImageElement>('img[data-mapx-preview-src]')
      if (!preview?.dataset.mapxPreviewSrc) return
      preview.src = preview.dataset.mapxPreviewSrc
      delete preview.dataset.mapxPreviewSrc
    }
    container.addEventListener('pointerover', loadPreviewImage)
    container.addEventListener('focusin', loadPreviewImage)
    return () => {
      container.removeEventListener('pointerover', loadPreviewImage)
      container.removeEventListener('focusin', loadPreviewImage)
    }
  }, [])

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
        const result = await fetchMapSearchSuggestions(keyword, mapMode, apiKey, controller.signal)
        if (controller.signal.aborted) return
        setSuggestions(result)
        setActiveSuggestionIndex(-1)
        if (!result.length)
          setSearchMessage(
            isThai
              ? 'ไม่พบคำแนะนำ ลองระบุเขต จังหวัด หรือชื่อสถานที่'
              : 'No suggestions. Try a district, city or place name.'
          )
      } catch (error) {
        if (!controller.signal.aborted && (error as Error).name !== 'AbortError')
          setSearchMessage(
            isThai ? 'ค้นหาคำแนะนำไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Suggestions unavailable. Please try again.'
          )
      } finally {
        if (!controller.signal.aborted) setIsSuggesting(false)
      }
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [apiKey, isSearchFocused, searchText, mapMode, isThai])

  useEffect(() => {
    searchRequestRef.current?.abort()
    clearSearchMarker()
    setIsSearching(false)
    setSuggestions([])
    setActiveSuggestionIndex(-1)
    setSearchMessage('')
    return () => searchRequestRef.current?.abort()
  }, [mapMode, clearSearchMarker])

  const searchLocation = useCallback(
    async (rawKeyword: string, suggestion?: MapSearchSuggestion) => {
      const keyword = rawKeyword.trim()
      const map = mapRef.current
      const longdo = window.longdo
      if (!keyword || !map || !longdo) return

      searchRequestRef.current?.abort()
      clearSearchMarker()
      const controller = new AbortController()
      searchRequestRef.current = controller
      setSearchText(keyword)
      setSuggestions([])
      setActiveSuggestionIndex(-1)
      setIsSearching(true)
      setSearchMessage('')
      try {
        let project = suggestion?.kind === 'project' ? suggestion.project : undefined
        if (mapMode === 'projects' && !suggestion) {
          const matches = await searchMapProjects(keyword, controller.signal).catch((error) => {
            if (controller.signal.aborted) throw error
            return []
          })
          project = preferredMapProject(keyword, matches)
          if (!project && matches.length > 1) {
            setSuggestions([
              ...matches.map(projectSearchSuggestion),
              { kind: 'place', label: keyword, direct: true },
            ])
            setSearchMessage(
              isThai
                ? 'เลือกโครงการที่ต้องการ หรือค้นหาสถานที่ด้วยคำนี้'
                : 'Choose a project or search places with this name.'
            )
            setIsSearchFocused(true)
            return
          }
        }
        controller.signal.throwIfAborted()
        if (project) {
          if (onProjectSearchSelect) onProjectSearchSelect(project)
          else
            router.push(
              `/properties/map?map_mode=projects&project=${encodeURIComponent(project.slug || project.public_project_id)}`
            )
          setSearchText(project.display_name || project.name_en || project.name_th)
          setIsSearchFocused(false)
          searchInputRef.current?.blur()
          return
        }
        const place = await searchMapPlace(keyword, apiKey, isThai, controller.signal)
        controller.signal.throwIfAborted()
        if (!place) {
          setSearchMessage(
            isThai ? 'ไม่พบสถานที่นี้ ลองเพิ่มชื่อเขตหรือจังหวัด' : 'Place not found. Try adding a district or city.'
          )
          setIsSearchFocused(true)
          return
        }

        const location = { lon: Number(place.lon), lat: Number(place.lat) }
        map.location(location, false)
        map.zoom(15, false)
        const marker = new longdo.Marker(location, {
          title: place.name || keyword,
          icon: { html: getSearchMarkerHtml(place.name || keyword), offset: { x: 0, y: 0 } },
          clickable: false,
        })
        map.Overlays.add(marker)
        searchMarkerRef.current = {
          overlay: marker,
          map,
          timer: window.setTimeout(fadeSearchMarker, 3000),
          fading: false,
        }
        onLocationSearchRef.current?.(location, place.name || keyword)
        setSearchText(place.name || keyword)
        setIsSearchFocused(false)
        searchInputRef.current?.blur()

        // The dedicated map page owns its viewport URL and local panel state.
        if (!onLocationSearchRef.current) {
          const nextSearchParams = new URLSearchParams(window.location.search)
          nextSearchParams.set('q', place.name || keyword)
          router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
        }
      } catch {
        if (controller.signal.aborted) return
        setSearchMessage(isThai ? 'ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Search unavailable. Please try again.')
        setIsSearchFocused(true)
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    },
    [apiKey, pathname, router, mapMode, isThai, onProjectSearchSelect, clearSearchMarker, fadeSearchMarker]
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
      void searchLocation(suggestion?.label || searchText, suggestion)
      return
    }
    if (event.key === 'Escape') {
      searchRequestRef.current?.abort()
      setIsSearching(false)
      setSuggestions([])
      setIsSearchFocused(false)
      searchInputRef.current?.blur()
    }
  }

  useEffect(() => {
    if (!isSearchFocused || activeSuggestionIndex < 0) return
    const listbox = searchContainerRef.current?.querySelector<HTMLElement>('[role="listbox"]')
    const active = listbox?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!listbox || !active) return
    const bounds = listbox.getBoundingClientRect()
    const option = active.getBoundingClientRect()
    if (option.bottom > bounds.bottom) listbox.scrollTop += option.bottom - bounds.bottom
    else if (option.top < bounds.top) listbox.scrollTop -= bounds.top - option.top
  }, [activeSuggestionIndex, isSearchFocused])

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
    map.Ui.Crosshair.visible(false)

    let enableViewportEventsTimer: ReturnType<typeof setTimeout> | undefined
    const notifyViewportChange = () => {
      declutterMarkersRef.current()
      window.setTimeout(() => declutterMarkersRef.current(), 180)
      if (viewportEventsEnabledRef.current) {
        onViewportChangeRef.current?.({ center: map.location(), zoom: map.zoom(), bounds: map.bound() })
      }
    }

    mapRef.current = map
    map.Event.bind('ready', () => {
      setMapReady(true)
      enableViewportEventsTimer = setTimeout(() => {
        viewportEventsEnabledRef.current = true
        onViewportChangeRef.current?.({ center: map.location(), zoom: map.zoom(), bounds: map.bound(), initial: true })
      }, 600)
    })
    map.Event.bind('location', notifyViewportChange)
    map.Event.bind('zoom', notifyViewportChange)

    return () => {
      if (enableViewportEventsTimer) clearTimeout(enableViewportEventsTimer)
      viewportEventsEnabledRef.current = false
      clearSearchMarker()
      map.Overlays.clear()
      listingMarkersRef.current = []
      mapRef.current = null
    }
  }, [sdkReady, clearSearchMarker])

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
    }
    const animationFrame = window.requestAnimationFrame(refreshMap)
    const transitionTimer = window.setTimeout(refreshMap, 340)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(transitionTimer)
    }
  }, [mapReady, resizeRequestId])

  useEffect(() => {
    const container = placeholderRef.current
    const map = mapRef.current
    if (!mapReady || !container || !map) return
    let frame = 0
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        map.resize()
        map.repaint()
        declutterMarkersRef.current()
      })
    })
    observer.observe(container)
    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [mapReady])

  useEffect(() => {
    if (!mapReady) return

    const refreshMap = () => {
      if (document.visibilityState === 'hidden') return
      const map = mapRef.current
      if (!map) return
      map.resize()
      map.repaint()
      declutterMarkersRef.current()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshMap()
    }

    window.addEventListener('focus', refreshMap)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('focus', refreshMap)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [mapReady])

  useEffect(() => {
    const map = mapRef.current
    const longdo = window.longdo
    if (!mapReady || !map || !longdo) return

    listingMarkersRef.current.forEach((marker) => map.Overlays.remove(marker))
    const nextMarkers: LongdoOverlay[] = []
    listings.forEach((listing, index) => {
      if (!isValidLocation(locations[index])) return
      if (mapMode === 'projects') return
      const active = listing.id === currentHoverIDRef.current
      const marker = new longdo.Marker(locations[index], {
        clickable: true,
        icon: {
          html: getMarkerHtml(
            listing,
            displayPrices[index],
            active,
            isThai,
            Boolean(onMarkerSelect),
            listing.id === previewListingIdRef.current
          ),
          // The exact coordinate is the bottom tip of the marker, never the price label.
          offset: { x: 0, y: 0 },
        },
      })
      map.Overlays.add(marker)
      nextMarkers.push(marker)
    })
    projects.forEach((project) => {
      const marker = new longdo.Marker(project.location, {
        clickable: true,
        icon: {
          html: getProjectMarkerHtml(
            project,
            isThai,
            project.id === selectedProjectIdRef.current || project.slug === selectedProjectIdRef.current
          ),
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
  }, [displayPrices, isThai, listings, locations, mapReady, scheduleMarkerDeclutter, onMarkerSelect, mapMode, projects])

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
    <div
      className={`relative size-full overflow-hidden bg-[#eef3f0] ${exactCoordinates ? 'mapx-exact-coordinates' : ''}`}
    >
      <style>{`
        .mapx-search-marker { position: relative; width: 0; height: 0; pointer-events: none; opacity: 1; transition: opacity 500ms ease-out; font-family: Sarabun,Arial,sans-serif; }
        .mapx-search-marker-label { position: absolute; bottom: 35px; left: 0; transform: translateX(-50%); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; width: max-content; max-width: min(240px,70vw); padding: 6px 12px; border: 1px solid #f3b5b5; border-radius: 16px; background: #fff7f7; color: #b91c1c; box-shadow: 0 2px 8px #7f1d1d18; font-size: 13px; font-weight: 600; line-height: 1.4; text-align: center; overflow-wrap: anywhere; }
        .mapx-search-marker-pin { position: absolute; bottom: 0; left: -11px; filter: drop-shadow(0 1px 2px #7f1d1d30); }
        @media (prefers-reduced-motion: reduce) { .mapx-search-marker { transition: none; } }
        .mapx-project-marker { position: relative; width: 44px; height: 44px; transform: translate(-50%,-50%); font-family: Sarabun,Arial,sans-serif; z-index: 920; }
        .mapx-project-link { position: relative; display: grid; width: 44px; height: 44px; place-items: center; text-decoration: none !important; color: #176b50 !important; border-radius: 50%; }
        .mapx-project-pin { position: relative; display: grid; width: 32px; height: 32px; place-items: center; border: 2px solid #176b50; border-radius: 11px; background: white; box-shadow: 0 3px 10px #123f3230; }
        .mapx-project-pin b { position: absolute; top: -8px; right: -10px; display: grid; min-width: 19px; height: 19px; padding: 0 4px; place-items: center; border: 2px solid white; border-radius: 12px; background: #176b50; color: white; font-size: 10px; }
        .mapx-project-label { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); display: flex; max-width: 186px; width: max-content; flex-direction: column; align-items: center; padding: 6px 11px; border: 1px solid #c5dbcf; border-radius: 12px; background: white; box-shadow: 0 3px 10px #123f321a; font-size: 12px; font-weight: 700; line-height: 1.4; }
        .mapx-project-label > span { overflow: hidden; max-width: 100%; text-overflow: ellipsis; white-space: nowrap; }
        .mapx-project-label small { margin-top: 2px; font-size: 10px; color: #638171; font-weight: 400; }
        .mapx-project-marker[data-mapx-project-label="false"] .mapx-project-label { display: none; }
        .mapx-project-marker:hover .mapx-project-label, .mapx-project-marker:focus-within .mapx-project-label, .mapx-project-marker.is-selected .mapx-project-label { display: flex; }
        .mapx-project-marker.is-selected .mapx-project-pin { background: #176b50; color: white; }
        .mapx-project-link:focus-visible { outline: 2px solid #176b50; outline-offset: 3px; }
        div:has(> .mapx-project-marker) { z-index: 920 !important; }
        div:has(> .mapx-project-marker:hover), div:has(> .mapx-project-marker:focus-within), div:has(> .mapx-project-marker.is-selected) { z-index: 2147482999 !important; }
        .mapx-price-marker {
          cursor: pointer;
          isolation: isolate;
        }
        .mapx-price-marker[data-mapx-label-visible="false"] .mapx-price-pill,
        .mapx-price-marker[data-mapx-label-visible="false"] .mapx-price-details-link,
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
        .mapx-price-details-link {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          color: inherit;
          text-decoration: none;
          border-radius: 999px;
        }
        .mapx-price-details-link:focus-visible {
          outline: 2px solid #176b50;
          outline-offset: 2px;
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
        .mapx-fan-line::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -3px;
          width: 6px;
          height: 6px;
          box-sizing: border-box;
          border: 1px solid #176b50;
          border-radius: 50%;
          background: #ffffff;
          transform: translateY(-50%);
        }
        .mapx-price-marker.is-active,
        .mapx-price-marker:hover,
        .mapx-price-marker:focus-within {
          --mapx-marker-bg: #123f32 !important;
          --mapx-marker-color: #ffffff !important;
          z-index: 2147483000 !important;
        }
        div:has(> .mapx-price-marker.is-active),
        div:has(> .mapx-price-marker:hover),
        div:has(> .mapx-price-marker:focus-within) {
          z-index: 2147483000 !important;
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
          bottom: 16px;
          left: 50%;
          z-index: 10;
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
          transform: translate(-50%, 5px) scale(0.97);
          transform-origin: bottom center;
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
        .mapx-exact-coordinates .mapx-price-marker {
          width: 0 !important;
          height: 0;
          padding: 0 !important;
          transform: translate(var(--mapx-fan-x), var(--mapx-fan-y)) !important;
        }
        .mapx-exact-coordinates .mapx-price-marker-link {
          position: absolute !important;
          width: 32px;
          height: 32px;
          padding: 0 !important;
          transform: translate(-50%, -50%);
        }
        .mapx-exact-coordinates .mapx-compact-pin {
          position: absolute;
          display: block !important;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border-width: 1.5px;
          transform: translate(-50%, -50%);
          box-shadow: 0 1px 4px rgba(18,63,50,.28);
        }
        .mapx-exact-coordinates .mapx-price-marker.is-active .mapx-compact-pin,
        .mapx-exact-coordinates .mapx-price-marker:focus-within .mapx-compact-pin {
          width: 16px;
          height: 16px;
          box-shadow: 0 0 0 5px rgba(23,107,80,.18);
        }
        .mapx-exact-coordinates .mapx-price-pill {
          position: absolute;
          bottom: 27px;
          left: 50%;
          height: 30px;
          min-width: 64px;
          padding: 0 9px;
          font-size: 12px;
          transform: translateX(-50%);
        }
        .mapx-exact-coordinates .mapx-price-marker.is-active .mapx-price-pill,
        .mapx-exact-coordinates .mapx-price-marker:hover .mapx-price-pill,
        .mapx-exact-coordinates .mapx-price-marker:focus-within .mapx-price-pill {
          transform: translateX(-50%) scale(1.06);
        }
        .mapx-exact-coordinates .mapx-price-details-link {
          position: absolute;
          bottom: 4px;
          left: 0;
          width: max-content;
          transform: translateX(-50%);
        }
        .mapx-exact-coordinates .mapx-price-marker .mapx-price-details-link .mapx-price-pill {
          position: static;
          transform: none;
        }
        .mapx-exact-coordinates .mapx-price-pointer-outer,
        .mapx-exact-coordinates .mapx-price-pointer-inner { display: none !important; }
        .mapx-exact-coordinates .mapx-marker-hover-card { bottom: 40px; }
        @media (max-width: 1023px) {
          .mapx-exact-coordinates .mapx-price-marker-link {
            width: 44px;
            height: 44px;
          }
          .mapx-exact-coordinates .mapx-price-details-link {
            bottom: 8px;
          }
        }
      `}</style>
      <link rel="preconnect" href="https://api.longdo.com" />
      <link rel="preconnect" href="https://ms.longdo.com" />
      <link rel="preconnect" href="https://search.longdo.com" />
      <link rel="preload" as="script" href={`https://api.longdo.com/map/?key=${encodeURIComponent(apiKey)}`} />
      <Script
        id="longdo-map-sdk"
        src={`https://api.longdo.com/map/?key=${encodeURIComponent(apiKey)}`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onReady={() => setSdkReady(true)}
      />
      <div
        ref={placeholderRef}
        data-map-marker-surface
        tabIndex={-1}
        className="pointer-events-auto size-full touch-none overscroll-contain outline-none"
        onPointerEnter={() => {
          const map = mapRef.current
          if (!map) return
          map.resize()
          map.repaint()
          declutterMarkersRef.current()
        }}
        onPointerDownCapture={(event) => {
          const primaryPress = event.isPrimary && event.button === 0
          searchMarkerGestureRef.current = primaryPress
            ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
            : null
          if (!event.isPrimary) fadeSearchMarker()
          singlePointerGestureRef.current = primaryPress && event.pointerType !== 'mouse'
          if (primaryPress && event.pointerType === 'mouse') onMapInteraction?.()
          const target = event.target
          backgroundTapRef.current =
            event.isPrimary &&
            event.button === 0 &&
            target instanceof Element &&
            !target.closest('a,button,input,select,textarea,[data-mapx-price-marker]')
              ? {
                  pointerId: event.pointerId,
                  x: event.clientX,
                  y: event.clientY,
                  started: event.timeStamp,
                  moved: false,
                }
              : null
          placeholderRef.current?.focus({ preventScroll: true })
        }}
        onPointerMoveCapture={(event) => {
          const gesture = searchMarkerGestureRef.current
          if (
            gesture?.pointerId === event.pointerId &&
            Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6
          ) {
            searchMarkerGestureRef.current = null
            fadeSearchMarker()
          }
          const tap = backgroundTapRef.current
          if (tap?.pointerId === event.pointerId && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 10)
            tap.moved = true
        }}
        onPointerUpCapture={(event) => {
          searchMarkerGestureRef.current = null
          // Mouse presses already folded on pointer down. Wait for touch gestures to finish so pinching stays stable.
          if (singlePointerGestureRef.current && event.isPrimary && event.button === 0 && onMapInteraction)
            window.requestAnimationFrame(onMapInteraction)
          const tap = backgroundTapRef.current
          if (
            tap &&
            tap.pointerId === event.pointerId &&
            !tap.moved &&
            Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <= 10 &&
            event.timeStamp - tap.started <= 600 &&
            onMapBackgroundTap
          )
            window.requestAnimationFrame(onMapBackgroundTap)
          backgroundTapRef.current = null
          singlePointerGestureRef.current = false
        }}
        onPointerCancelCapture={() => {
          searchMarkerGestureRef.current = null
          backgroundTapRef.current = null
          singlePointerGestureRef.current = false
        }}
        onWheelCapture={fadeSearchMarker}
        onDoubleClickCapture={fadeSearchMarker}
        onKeyDownCapture={(event) => {
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', '='].includes(event.key))
            fadeSearchMarker()
        }}
        aria-label="แผนที่ประกาศอสังหาริมทรัพย์"
      />
      <>
        <div
          ref={searchContainerRef}
          data-map-location-search
          aria-busy={!mapReady}
          className={`${searchContainerClassName || 'absolute top-3 left-1/2 z-20 w-[min(92%,26rem)] -translate-x-1/2'} ${
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
          <div
            data-map-location-field
            className="flex h-12 items-center rounded-2xl border border-white/80 bg-white px-3 shadow-[0_8px_28px_rgba(18,63,50,0.18)] ring-1 ring-[#dbe8e2] transition focus-within:ring-2 focus-within:ring-[#176b50]/35"
          >
            <Search className="me-2.5 size-5 shrink-0 text-[#176b50]" aria-hidden="true" />
            <input
              ref={searchInputRef}
              disabled={!mapReady}
              value={searchText}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              maxLength={120}
              role="combobox"
              aria-label={
                mapMode === 'projects'
                  ? isThai
                    ? 'ค้นหาโครงการหรือสถานที่บนแผนที่'
                    : 'Search projects or places on the map'
                  : isThai
                    ? 'ค้นหาสถานที่บนแผนที่'
                    : 'Search places on the map'
              }
              aria-autocomplete="list"
              aria-expanded={isSearchFocused && (suggestions.length > 0 || !!searchMessage)}
              aria-controls="longdo-location-suggestions"
              aria-activedescendant={
                activeSuggestionIndex >= 0 ? `longdo-location-suggestion-${activeSuggestionIndex}` : undefined
              }
              placeholder={
                mapMode === 'projects'
                  ? isThai
                    ? 'ค้นหาชื่อห้าง โครงการ หมู่บ้าน หรือสถานที่'
                    : 'Search malls, projects, housing estates or places'
                  : isThai
                    ? 'ค้นหาเขต ย่าน ถนน หรือสถานที่'
                    : 'Search districts, neighborhoods, roads or places'
              }
              className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-0"
              onChange={(event) => {
                searchRequestRef.current?.abort()
                clearSearchMarker()
                setIsSearching(false)
                setSearchText(event.target.value)
                setSuggestions([])
                setActiveSuggestionIndex(-1)
                setSearchMessage('')
              }}
              onFocus={() => {
                setIsSearchFocused(true)
                onLocationSearchFocus?.()
              }}
              onKeyDown={handleSearchKeyDown}
            />
            {(isSuggesting || isSearching) && (
              <LoaderCircle
                className="ms-2 size-4 shrink-0 animate-spin text-[#176b50]"
                aria-label={isThai ? 'กำลังค้นหา' : 'Searching'}
              />
            )}
            {searchText && !isSuggesting && !isSearching && (
              <button
                type="button"
                aria-label={isThai ? 'ล้างคำค้น' : 'Clear search'}
                className="ms-2 flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                onClick={() => {
                  searchRequestRef.current?.abort()
                  clearSearchMarker()
                  setIsSearching(false)
                  setSearchText('')
                  setSuggestions([])
                  setActiveSuggestionIndex(-1)
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
              aria-label={isThai ? 'ผลค้นหาแนะนำ' : 'Search suggestions'}
              className="mt-2 max-h-[min(360px,45dvh)] overflow-y-auto overscroll-contain rounded-2xl border border-[#dfe9e5] bg-white p-1.5 shadow-[0_16px_40px_rgba(18,63,50,0.2)]"
            >
              {suggestions.map((suggestion, index) => {
                const project = suggestion.kind === 'project' ? suggestion.project : undefined
                const Icon = project
                  ? project.project_category === 'housing_estate'
                    ? House
                    : project.project_category === 'commercial_complex'
                      ? ShoppingBag
                      : Building2
                  : MapPin
                const description = project
                  ? [
                      projectCategoryLabel(project.project_category, isThai),
                      project.district || project.province,
                      typeof project.listing_count === 'number'
                        ? `${project.listing_count} ${isThai ? 'ประกาศ' : 'listings'}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : suggestion.kind === 'place' && suggestion.direct
                    ? isThai
                      ? 'ค้นหาสถานที่ด้วยคำนี้'
                      : 'Search places with this name'
                    : isThai
                      ? 'สถานที่'
                      : 'Place'
                return (
                  <button
                    id={`longdo-location-suggestion-${index}`}
                    key={project?.public_project_id || `${suggestion.label}-${index}`}
                    data-map-search-result={suggestion.kind}
                    data-map-search-project={project?.public_project_id}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    className={`flex w-full touch-manipulation items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
                      index === activeSuggestionIndex
                        ? 'bg-[#edf6f1] text-[#124d3c]'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={() => void searchLocation(suggestion.label, suggestion)}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#edf6f1] text-[#176b50]">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{suggestion.label}</span>
                      <span className="block text-xs text-neutral-500">{description}</span>
                    </span>
                  </button>
                )
              })}
              {searchMessage && <p className="px-3 py-3 text-sm text-neutral-500">{searchMessage}</p>}
            </div>
          )}
        </div>

        <div
          className={`${zoomControlsClassName || 'absolute end-3 bottom-3 z-20'} flex flex-col overflow-hidden rounded-xl border border-[#dbe8e2] bg-white shadow-[0_8px_24px_rgba(18,63,50,0.18)] ${
            mobileControlsVisible ? '' : 'max-lg:hidden'
          }`}
          aria-label="ควบคุมระดับการซูมแผนที่"
        >
          <button
            type="button"
            className="flex size-10 items-center justify-center text-[#174d3e] transition hover:bg-[#edf6f1] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#176b50]"
            aria-label="ขยายแผนที่"
            disabled={!mapReady}
            onClick={() => {
              const map = mapRef.current
              fadeSearchMarker()
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
            disabled={!mapReady}
            onClick={() => {
              const map = mapRef.current
              fadeSearchMarker()
              if (map) map.zoom(Math.max(map.zoom() - 1, 1), true)
            }}
          >
            <ZoomOut className="size-5" aria-hidden="true" />
          </button>
        </div>
      </>
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
