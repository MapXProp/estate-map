'use client'

import { useLayoutEffect, useRef } from 'react'

export function useMapPreviewHeaderHeight() {
  const searchRef = useRef<HTMLElement>(null)
  const categoriesRef = useRef<HTMLElement>(null)
  const areaControlRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const search = searchRef.current
    const categories = categoriesRef.current
    const areaControl = areaControlRef.current
    if (!search || !categories || !areaControl) return

    // Navigation overlays the full-size map. Only the controls below it move
    // when categories expand or fold; the map surface never changes dimensions.
    const measure = () => {
      search.style.setProperty('--map-navigation-height', `${categories.getBoundingClientRect().height}px`)
      const height = Math.max(0, areaControl.getBoundingClientRect().bottom - search.getBoundingClientRect().top + 6)
      search.style.setProperty('--mobile-preview-height', `${height}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const element of [search, categories, areaControl]) observer.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return { searchRef, categoriesRef, areaControlRef }
}
