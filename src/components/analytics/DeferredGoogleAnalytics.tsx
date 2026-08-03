'use client'

import { GoogleAnalytics } from '@next/third-parties/google'
import { useEffect, useState } from 'react'

const interactionEvents: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart']

export default function DeferredGoogleAnalytics({ gaId }: { gaId: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let active = true
    const enable = () => {
      if (active) setEnabled(true)
    }

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, enable, { once: true, passive: true })
    })

    // Keep analytics for visitors who read without interacting, but leave the
    // critical loading window free for the page's own content.
    const timeout = window.setTimeout(enable, 10_000)

    return () => {
      active = false
      window.clearTimeout(timeout)
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, enable))
    }
  }, [])

  return enabled ? <GoogleAnalytics gaId={gaId} /> : null
}
