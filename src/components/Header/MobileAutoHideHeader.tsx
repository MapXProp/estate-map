'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'

const AUTO_HIDE_ROUTE_PREFIXES = [
  '/real-estate-listings/',
  '/stay-listings/',
  '/car-listings/',
  '/experience-listings/',
  '/add-listing/',
]

const HIDE_AFTER_Y = 80
const HIDE_TRAVEL = 36
const SHOW_TRAVEL = 12

function shouldAutoHideOnPath(pathname: string) {
  return AUTO_HIDE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export default function MobileAutoHideHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <AutoHideHeaderForPath key={pathname} autoHideEnabled={shouldAutoHideOnPath(pathname)}>
      {children}
    </AutoHideHeaderForPath>
  )
}

function AutoHideHeaderForPath({ children, autoHideEnabled }: { children: ReactNode; autoHideEnabled: boolean }) {
  const headerRef = useRef<HTMLDivElement>(null)
  const lastScrollYRef = useRef(0)
  const directionRef = useRef<'up' | 'down' | null>(null)
  const directionTravelRef = useRef(0)
  const tickingRef = useRef(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    lastScrollYRef.current = Math.max(window.scrollY, 0)
    directionRef.current = null
    directionTravelRef.current = 0

    if (!autoHideEnabled) return

    const updateHeader = () => {
      const currentScrollY = Math.max(window.scrollY, 0)
      const delta = currentScrollY - lastScrollYRef.current
      const nextDirection = delta > 0 ? 'down' : delta < 0 ? 'up' : null

      if (currentScrollY <= 24) {
        setIsVisible(true)
        directionRef.current = null
        directionTravelRef.current = 0
      } else if (nextDirection) {
        if (directionRef.current !== nextDirection) {
          directionRef.current = nextDirection
          directionTravelRef.current = 0
        }

        directionTravelRef.current += Math.abs(delta)

        const hasOpenHeaderControl = Boolean(headerRef.current?.querySelector('[aria-expanded="true"]'))
        const hasOpenDialog = Boolean(document.querySelector('[role="dialog"]'))
        if (nextDirection === 'down' && currentScrollY > HIDE_AFTER_Y && directionTravelRef.current >= HIDE_TRAVEL) {
          if (!hasOpenHeaderControl && !hasOpenDialog) setIsVisible(false)
        } else if (nextDirection === 'up' && directionTravelRef.current >= SHOW_TRAVEL) {
          setIsVisible(true)
        }
      }

      lastScrollYRef.current = currentScrollY
      tickingRef.current = false
    }

    const handleScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      window.requestAnimationFrame(updateHeader)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [autoHideEnabled])

  return (
    <div
      ref={headerRef}
      onFocusCapture={() => setIsVisible(true)}
      className={`sticky top-0 z-20 bg-white shadow-xs transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none min-[744px]:hidden dark:bg-neutral-900 ${
        autoHideEnabled && !isVisible ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      {children}
    </div>
  )
}
