'use client'

import type { PropertyMapBounds, PropertyMapViewport } from '@/components/map/LongdoPropertyMap'
import { useEffect, useSyncExternalStore } from 'react'

// Include touch tablets, but keep phones manual in either orientation.
const autoSearchMedia = '(min-width: 768px) and (min-height: 600px), (hover: hover) and (pointer: fine)'
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(autoSearchMedia)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
const getSnapshot = () => window.matchMedia(autoSearchMedia).matches
const getServerSnapshot = () => false

export function useMapAutoAreaSearch(
  viewport: PropertyMapViewport | undefined,
  onSearch: (bounds: PropertyMapBounds) => void
) {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useEffect(() => {
    const bounds = viewport?.bounds
    if (!enabled || !bounds) return
    const timer = setTimeout(() => onSearch(bounds), 700)
    return () => clearTimeout(timer)
  }, [enabled, viewport, onSearch])
  return enabled
}
