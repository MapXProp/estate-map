'use client'

import { useEffect, useRef } from 'react'

// Keep mobile search sheets inside the visible area when the software keyboard opens.
export function useMobileSearchViewport(enabled = true) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!enabled || !window.visualViewport) return
    const viewport = window.visualViewport
    const update = () => {
      // Native pinch zoom should stay under the browser's control.
      if (viewport.scale !== 1) return
      ref.current?.style.setProperty('--search-viewport-height', `${viewport.height}px`)
      ref.current?.style.setProperty('--search-viewport-top', `${viewport.offsetTop}px`)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [enabled])
  return ref
}
