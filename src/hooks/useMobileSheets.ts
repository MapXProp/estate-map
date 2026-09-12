'use client'

import {
  bindVerticalSheetDrag,
  chooseSheetSnap,
  shouldDismissSheet,
  type SheetDragOptions,
  type SheetSnap,
} from '@/lib/verticalSheetGesture'
import { useCallback, useEffect, useRef, useState } from 'react'

const duration = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260)
const mobile = () => window.matchMedia('(max-width: 1023px)').matches

function useSheetDrag(node: HTMLElement | null, options: SheetDragOptions) {
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })
  useEffect(() => (node ? bindVerticalSheetDrag(node, () => latest.current) : undefined), [node])
}

export function useSwipeDismiss(onClose: () => void, enabled = true) {
  const [node, panelRef] = useState<HTMLElement | null>(null)
  const [backdrop, backdropRef] = useState<HTMLElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closing = useRef(false)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  const move = (offset: number) => {
    node?.style.setProperty('--sheet-offset', `${Math.max(0, offset)}px`)
    backdrop?.style.setProperty(
      '--sheet-backdrop',
      String(Math.max(0, 1 - offset / Math.max(1, node?.offsetHeight || 1)))
    )
  }
  const dismiss = () => {
    if (closing.current) return
    if (!mobile() || !node || duration() === 0) {
      onClose()
      return
    }
    closing.current = true
    node.setAttribute('data-sheet-dragging', 'false')
    node.setAttribute('data-sheet-closing', 'true')
    backdrop?.setAttribute('data-sheet-dragging', 'false')
    move(window.innerHeight + 40)
    timer.current = setTimeout(onClose, duration())
  }
  useSheetDrag(node, {
    enabled,
    canDrag: (down, handle, atTop) => !closing.current && down && (handle || atTop),
    onStart: () => {
      node?.setAttribute('data-sheet-dragging', 'true')
      backdrop?.setAttribute('data-sheet-dragging', 'true')
    },
    onMove: (dy) => move(Math.max(0, dy) * 0.95),
    onEnd: (dy, velocity, cancelled) => {
      node?.setAttribute('data-sheet-dragging', 'false')
      backdrop?.setAttribute('data-sheet-dragging', 'false')
      if (!cancelled && shouldDismissSheet(dy, velocity, node?.offsetHeight || window.innerHeight)) dismiss()
      else move(0)
    },
  })
  return { panelRef, backdropRef, dismiss }
}

export function useMapBottomSheet(snap: SheetSnap, previewId: string | undefined, onSnap: (snap: SheetSnap) => void) {
  const [node, panelRef] = useState<HTMLElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frame = useRef<number | null>(null)
  const baseHeight = useRef(0)
  const points = useRef({ peek: 56, middle: 300, full: 500 })
  const measure = () => {
    if (!node) return
    const canvas = node.parentElement
    const css = getComputedStyle(node)
    const canvasHeight = canvas?.clientHeight || 600
    const ceiling = parseFloat(css.getPropertyValue('--mobile-panel-ceiling')) || 68
    // The collapsed grab area includes the device's bottom safe area.
    const probe = node.querySelector<HTMLElement>('[data-map-mobile-panel-toggle]')
    const safeBottom = probe ? parseFloat(getComputedStyle(probe).paddingBottom) - 8 : 0
    const peek = 56 + Math.max(0, safeBottom || 0, parseFloat(css.paddingBottom) || 0)
    const full = Math.max(peek, canvasHeight - ceiling)
    points.current = {
      peek,
      full,
      middle: Math.min(full, previewId ? Math.min(470, canvasHeight * 0.7) : canvasHeight * 0.65),
    }
  }
  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    if (node) {
      node.removeAttribute('data-sheet-dragging')
      node.removeAttribute('data-sheet-settling')
      node.style.removeProperty('--mobile-sheet-height')
    }
  }, [node])
  useEffect(() => {
    reset()
    return reset
  }, [reset, snap, previewId])
  useEffect(() => {
    if (!node) return
    const media = window.matchMedia('(max-width: 1023px)')
    media.addEventListener('change', reset)
    window.addEventListener('resize', reset)
    return () => {
      media.removeEventListener('change', reset)
      window.removeEventListener('resize', reset)
    }
  }, [node, reset])
  useSheetDrag(node, {
    enabled: true,
    canDrag: (down, handle, atTop) => handle || (atTop && (down || snap !== 'full')),
    onStart: () => {
      if (!node) return
      if (timer.current) clearTimeout(timer.current)
      baseHeight.current = node.getBoundingClientRect().height
      measure()
      node.setAttribute('data-sheet-dragging', 'true')
      node.setAttribute('data-sheet-settling', 'false')
      node.style.setProperty('--mobile-sheet-height', `${baseHeight.current}px`)
    },
    onMove: (dy) => {
      const height = Math.max(points.current.peek, Math.min(points.current.full, baseHeight.current - dy))
      node?.style.setProperty('--mobile-sheet-height', `${height}px`)
    },
    onEnd: (dy, velocity, cancelled) => {
      if (!node) return
      const height = Math.max(points.current.peek, Math.min(points.current.full, baseHeight.current - dy))
      const target = cancelled ? snap : chooseSheetSnap(height, velocity, points.current)
      node.setAttribute('data-sheet-dragging', 'false')
      node.setAttribute('data-sheet-settling', 'true')
      node.style.setProperty('--mobile-sheet-height', `${points.current[target]}px`)
      timer.current = setTimeout(() => {
        onSnap(target)
        frame.current = requestAnimationFrame(reset)
      }, duration())
    },
  })
  return { panelRef }
}
