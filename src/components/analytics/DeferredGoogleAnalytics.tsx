'use client'

import { initializeAnalytics, installContactAnalytics } from '@/lib/contactAnalytics'
import Script from 'next/script'
import { useEffect, useState } from 'react'

const interactionEvents: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart']

export default function DeferredGoogleAnalytics({ gaId }: { gaId: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!initializeAnalytics(gaId)) return
    let active = true
    const enable = () => {
      if (active) setEnabled(true)
    }

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, enable, { once: true, passive: true })
    })
    const removeContactAnalytics = installContactAnalytics(window, document, enable)

    // Initialize the queue immediately, then load during idle time or within
    // two seconds. A contact click can enable it sooner without losing the event.
    const idle = window.requestIdleCallback?.(enable, { timeout: 2000 })
    const timeout = window.setTimeout(enable, 2000)

    return () => {
      active = false
      window.clearTimeout(timeout)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      removeContactAnalytics()
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, enable))
    }
  }, [gaId])

  return enabled ? <Script id="mapxprop-ga" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} /> : null
}
