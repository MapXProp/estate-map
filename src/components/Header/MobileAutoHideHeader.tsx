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

const MOBILE_HEADER_HEIGHT = 64
const HIDE_TRAVEL = 12
const REVEAL_MIN_DELTA = 7
const REVEAL_MIN_SPEED = 0.5

type HeaderMode = 'natural' | 'hidden' | 'visible'

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
  const lastUpdateTimeRef = useRef(0)
  const directionRef = useRef<'up' | 'down' | null>(null)
  const directionTravelRef = useRef(0)
  const tickingRef = useRef(false)
  const modeRef = useRef<HeaderMode>('natural')
  const [mode, setMode] = useState<HeaderMode>('natural')

  useEffect(() => {
    lastScrollYRef.current = Math.max(window.scrollY, 0)
    lastUpdateTimeRef.current = performance.now()
    directionRef.current = null
    directionTravelRef.current = 0

    if (!autoHideEnabled) return

    const changeMode = (nextMode: HeaderMode) => {
      if (modeRef.current === nextMode) return
      modeRef.current = nextMode
      setMode(nextMode)
    }

    const updateHeader = (now: number) => {
      const currentScrollY = Math.max(window.scrollY, 0)
      const delta = currentScrollY - lastScrollYRef.current
      const nextDirection = delta > 0 ? 'down' : delta < 0 ? 'up' : null
      const elapsed = Math.max(now - lastUpdateTimeRef.current, 16)

      if (currentScrollY <= MOBILE_HEADER_HEIGHT) {
        changeMode('natural')
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

        if (hasOpenHeaderControl || hasOpenDialog) {
          changeMode('visible')
        } else if (nextDirection === 'down') {
          if (modeRef.current === 'natural' || directionTravelRef.current >= HIDE_TRAVEL) changeMode('hidden')
        } else {
          const upwardSpeed = Math.abs(delta) / elapsed
          if (modeRef.current === 'hidden' && Math.abs(delta) >= REVEAL_MIN_DELTA && upwardSpeed >= REVEAL_MIN_SPEED) {
            changeMode('visible')
          }
        }
      } else if (modeRef.current === 'natural') {
        changeMode('hidden')
      }

      lastScrollYRef.current = currentScrollY
      lastUpdateTimeRef.current = now
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

  if (!autoHideEnabled) {
    return <div className="sticky top-0 z-20 bg-white shadow-xs min-[744px]:hidden dark:bg-neutral-900">{children}</div>
  }

  return (
    <div className="relative z-20 h-16 min-[744px]:hidden">
      <div
        ref={headerRef}
        onFocusCapture={() => {
          modeRef.current = 'visible'
          setMode('visible')
        }}
        className={`inset-x-0 top-0 bg-white shadow-xs will-change-transform dark:bg-neutral-900 ${
          mode === 'natural'
            ? 'relative transition-none'
            : 'fixed z-20 transition-transform duration-100 ease-out motion-reduce:transition-none'
        } ${mode === 'hidden' ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {children}
      </div>
    </div>
  )
}
