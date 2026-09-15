'use client'

import { placeMapPreview } from '@/lib/mapPreviewPlacement'
import { useLayoutEffect, useRef } from 'react'

export function useMapAnchoredPreview(listingId: string, enabled: boolean) {
  const previewRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const preview = previewRef.current
    const canvas = preview?.closest<HTMLElement>('[data-map-canvas]')
    const surface = canvas?.querySelector<HTMLElement>('[data-map-marker-surface]')
    if (!enabled || !preview || !canvas || !surface) return

    let frame = 0
    const measure = () => {
      frame = 0
      const marker = surface.querySelector<HTMLElement>(`[data-mapx-listing-id="${CSS.escape(listingId)}"]`)
      const dot = marker?.querySelector<HTMLElement>('.mapx-compact-pin')
      const price = marker?.querySelector<HTMLElement>('.mapx-price-pill')
      if (!dot?.getClientRects().length) {
        preview.dataset.anchorVisible = 'false'
        return
      }
      const map = canvas.getBoundingClientRect()
      const pin = dot.getBoundingClientRect()
      const pill = price?.getClientRects().length ? price.getBoundingClientRect() : pin
      const search = canvas.querySelector<HTMLElement>('[data-map-location-search]')
      const results = canvas.querySelector<HTMLElement>('[data-map-results-panel]')
      const resultBounds = results?.getBoundingClientRect()
      const bottomSheet = resultBounds && resultBounds.width > map.width * 0.8 && resultBounds.height > 0
      const position = placeMapPreview(
        {
          left: Math.min(pin.left, pill.left) - map.left,
          right: Math.max(pin.right, pill.right) - map.left,
          top: Math.min(pin.top, pill.top) - map.top,
          bottom: pin.bottom - map.top,
        },
        {
          left: 12,
          right: map.width - 12,
          top: Math.max(12, (search?.getBoundingClientRect().bottom || map.top) - map.top + 12),
          bottom: (bottomSheet ? resultBounds.top - map.top : map.height) - 12,
        },
        preview.offsetWidth,
        preview.offsetHeight
      )
      preview.dataset.anchorVisible = String(Boolean(position))
      if (!position) return
      preview.style.left = `${position.left}px`
      preview.style.top = `${position.top}px`
      preview.style.setProperty('--preview-arrow-x', `${position.arrow}px`)
      preview.dataset.anchorPlacement = position.placement
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    // Observe only SDK-owned nodes. Moving the card never schedules its own measurement.
    const mutations = new MutationObserver(schedule)
    mutations.observe(surface, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-mapx-label-visible'],
    })
    const resize = new ResizeObserver(schedule)
    for (const element of [
      canvas,
      preview,
      canvas.querySelector('[data-map-location-search]'),
      canvas.closest('[data-map-mobile-preview]')?.querySelector('[data-map-navigation]'),
      canvas.querySelector('[data-map-results-panel]'),
    ]) {
      if (element) resize.observe(element)
    }
    window.addEventListener('resize', schedule)
    measure()
    return () => {
      mutations.disconnect()
      resize.disconnect()
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [listingId, enabled])

  return previewRef
}
