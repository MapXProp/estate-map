'use client'

import type { PropertyMapBounds, PropertyMapViewport } from '@/components/map/LongdoPropertyMap'
import { useEffect } from 'react'

export function useMapAutoAreaSearch(
  viewport: PropertyMapViewport | undefined,
  onSearch: (bounds: PropertyMapBounds) => void
) {
  useEffect(() => {
    const bounds = viewport?.bounds
    if (!bounds) return
    // Search on every device, once the map has settled, using the loaded inventory.
    const timer = setTimeout(() => onSearch(bounds), 700)
    return () => clearTimeout(timer)
  }, [viewport, onSearch])
  return true
}
