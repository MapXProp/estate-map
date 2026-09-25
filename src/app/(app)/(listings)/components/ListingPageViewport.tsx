'use client'

import { usePathname } from 'next/navigation'
import { createContext, type ReactNode, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import styles from './ListingPageViewport.module.css'

export const ListingDockPortalContext = createContext<HTMLElement | null>(null)

const mobileQuery = '(max-width: 1099px)'
const usesTouchWebKit = () => CSS.supports('-webkit-touch-callout', 'none') && window.matchMedia(mobileQuery).matches
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(mobileQuery)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

// Interrupting an ancestor's momentum on iOS can consume the touch stream
// before JavaScript receives it (WebKit #191218 / #251513). Keep the native
// page scroller and dock in separate DOM branches, as in map details.
export default function ListingPageViewport({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const touchWebKit = useSyncExternalStore(subscribe, usesTouchWebKit, () => false)
  const isolated = touchWebKit && pathname.startsWith('/real-estate-listings/')
  const viewportRef = useRef<HTMLDivElement>(null)
  const previous = useRef({ isolated: false, top: 0, path: '' })

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    if (!isolated) {
      if (previous.current.isolated && previous.current.path === pathname) {
        window.scrollTo({ top: previous.current.top, behavior: 'instant' })
      }
      previous.current = { isolated: false, path: pathname, top: window.scrollY }
      const trackDocument = () => {
        previous.current.top = window.scrollY
      }
      window.addEventListener('scroll', trackDocument, { passive: true })
      return () => window.removeEventListener('scroll', trackDocument)
    }

    const stored = window.history.state?.mapxListingScroll
    const top =
      stored?.path === pathname && Number.isFinite(stored.top)
        ? stored.top
        : previous.current.path === pathname
          ? previous.current.top
          : window.scrollY
    viewport.scrollTop = Math.max(0, top)
    window.scrollTo({ top: 0, behavior: 'instant' })
    previous.current = { isolated: true, path: pathname, top: viewport.scrollTop }
    let timer: ReturnType<typeof setTimeout> | undefined
    const remember = () => {
      clearTimeout(timer)
      if (viewport.dataset.isolated === 'true') previous.current.top = viewport.scrollTop
      // Never overwrite the next entry if navigation already changed the URL.
      if (window.location.pathname !== pathname) return
      window.history.replaceState(
        { ...window.history.state, mapxListingScroll: { path: pathname, top: previous.current.top } },
        ''
      )
    }
    const onScroll = () => {
      previous.current.top = viewport.scrollTop
      clearTimeout(timer)
      timer = setTimeout(remember, 150)
    }
    viewport.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', remember, true)
    window.addEventListener('pagehide', remember)
    return () => {
      remember()
      viewport.removeEventListener('scroll', onScroll)
      document.removeEventListener('click', remember, true)
      window.removeEventListener('pagehide', remember)
    }
  }, [isolated, pathname])

  return (
    <ListingDockPortalContext.Provider value={isolated ? document.body : null}>
      <div ref={viewportRef} className={styles.viewport} data-listing-page-scroll data-isolated={isolated || undefined}>
        {children}
      </div>
    </ListingDockPortalContext.Provider>
  )
}
