'use client'

import { useEffect, useRef, useState } from 'react'

export function useAutoHideBottomNavigation() {
  const navRef = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 743px)')
    const scrollPosition = () =>
      Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight))
    let previousY = scrollPosition()
    let direction = 0
    let travel = 0
    let frame = 0
    let viewportWidth = window.innerWidth

    const update = () => {
      frame = 0
      const y = scrollPosition()
      const delta = y - previousY
      previousY = y
      if (!mobile.matches) return
      // Ignore scroll locking and clamp elastic overscroll to avoid flicker.
      if (document.querySelector('[aria-modal="true"]')) {
        direction = 0
        travel = 0
        return
      }
      if (y <= 64 || navRef.current?.querySelector(':focus-visible')) {
        setHidden(false)
        direction = 0
        travel = 0
        return
      }
      if (!delta) return
      const nextDirection = Math.sign(delta)
      if (nextDirection !== direction) travel = 0
      direction = nextDirection
      travel += Math.abs(delta)
      if (direction > 0 && travel >= 20) setHidden(true)
      if (direction < 0 && travel >= 12) setHidden(false)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    const onFocus = () => {
      const focused = document.activeElement
      const isEditing =
        focused instanceof HTMLElement &&
        (focused.isContentEditable ||
          focused.matches(
            'textarea, select, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"])'
          ))
      // Keep the dock away from the software keyboard while completing forms.
      setEditing(isEditing)
    }
    const onResize = () => {
      // Mobile browser chrome changes height while scrolling; it must not reveal the dock.
      if (window.innerWidth === viewportWidth) return
      viewportWidth = window.innerWidth
      previousY = scrollPosition()
      direction = 0
      travel = 0
      setHidden(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', onFocus)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', onFocus)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return { navRef, hidden: hidden || editing, reveal: () => setHidden(false) }
}
