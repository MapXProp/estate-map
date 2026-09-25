'use client'

import {
  clearAnalyticsCookies,
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  hasAnalyticsConsent,
} from '@/lib/analyticsConsent'
import { initializeAnalytics, installContactAnalytics, type AnalyticsWindow } from '@/lib/contactAnalytics'
import Script from 'next/script'
import { useEffect, useState } from 'react'

export default function DeferredGoogleAnalytics({ gaId }: { gaId: string }) {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    if (!/^G-[A-Z0-9]+$/.test(gaId)) return
    const win = window as AnalyticsWindow
    let removeContactAnalytics: (() => void) | undefined
    const sync = () => {
      const allowed = hasAnalyticsConsent(win)
      const flag = 'ga-disable-' + gaId
      const changed = Reflect.get(win, flag) !== !allowed
      // Also stop a tag that was loaded before consent was withdrawn.
      Reflect.set(win, flag, !allowed)
      if (changed && win.gtag)
        win.gtag('consent', 'update', {
          analytics_storage: allowed ? 'granted' : 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        })
      removeContactAnalytics?.()
      removeContactAnalytics = undefined
      if (allowed && initializeAnalytics(gaId, win)) {
        removeContactAnalytics = installContactAnalytics(win, document, () => {})
        setEnabled(true)
      } else {
        setEnabled(false)
        clearAnalyticsCookies(document, win.location.hostname)
        try {
          win.sessionStorage.removeItem('mapxprop_analytics_listing_successes')
        } catch {
          /* Storage unavailable. */
        }
      }
    }
    const storage = (event: StorageEvent) => {
      if (event.key !== COOKIE_CONSENT_KEY && event.key !== null) return
      delete win.__mapxpropCookieChoice
      sync()
    }
    sync()
    window.addEventListener(COOKIE_CONSENT_EVENT, sync)
    window.addEventListener('storage', storage)
    window.addEventListener('focus', sync)
    const expiryCheck = window.setInterval(sync, 60000)
    return () => {
      removeContactAnalytics?.()
      window.clearInterval(expiryCheck)
      window.removeEventListener(COOKIE_CONSENT_EVENT, sync)
      window.removeEventListener('storage', storage)
      window.removeEventListener('focus', sync)
    }
  }, [gaId])
  return enabled ? <Script id="mapxprop-ga" src={'https://www.googletagmanager.com/gtag/js?id=' + gaId} /> : null
}
