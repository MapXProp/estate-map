'use client'

import { useCallback, useEffect, useRef, useState, type UIEvent } from 'react'

// Match the scroll-up close action in the main listing's HeaderGallery.
export function useGalleryQuickClose() {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollTop = useRef(0)
  const upwardDistance = useRef(0)

  const hide = useCallback(() => {
    setVisible(false)
    upwardDistance.current = 0
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    []
  )

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const top = Math.max(0, event.currentTarget.scrollTop)
      const delta = top - lastScrollTop.current
      lastScrollTop.current = top

      if (top <= 120 || delta > 2) {
        hide()
        return
      }
      if (delta < -1) {
        upwardDistance.current += Math.abs(delta)
        if (upwardDistance.current >= 28) {
          setVisible(true)
          if (timer.current !== null) clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            setVisible(false)
            timer.current = null
          }, 2600)
        }
      }
    },
    [hide]
  )

  return { visible, hide, onScroll }
}
