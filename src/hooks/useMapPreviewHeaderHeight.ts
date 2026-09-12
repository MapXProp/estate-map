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

    // Cover only the existing navigation and search row. Absolute positioning and
    // visibility:hidden keep the map's size and coordinate positions unchanged.
    const measure = () => {
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
