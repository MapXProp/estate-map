'use client'

import { formatMapArea, mapAreaQuery, readMapArea, type MapArea } from '@/lib/mapAreaLabel'
import { useEffect, useState } from 'react'

const cache = new Map<string, MapArea>()

export function useMapAreaLabel(center: { lat: number; lon: number } | undefined, zoom: number, locale: 'th' | 'en') {
  const query = zoom >= 7 ? mapAreaQuery(center, locale) : ''
  const [result, setResult] = useState<{ query: string; area: MapArea | null }>({ query: '', area: null })
  useEffect(() => {
    if (!query || cache.has(query)) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/map-area-label?${query}`, { signal: controller.signal })
        if (!response.ok) return
        const area = readMapArea((await response.json()).area)
        if (controller.signal.aborted) return
        if (area) {
          if (cache.size >= 100) cache.delete(cache.keys().next().value!)
          cache.set(query, area)
        }
        setResult({ query, area })
      } catch {
        // Area names are optional; keep search and map gestures usable if geocoding is unavailable.
      }
    }, 800)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])
  // Never leave a previous district's name on a newly moved map while the next lookup is pending.
  return formatMapArea(cache.get(query) || (result.query === query ? result.area : null), zoom, locale)
}
