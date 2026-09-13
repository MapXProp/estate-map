'use client'

import { getListingDraft } from '@/lib/listingDraft'
import { trackListingFunnel, type ListingStep } from '@/lib/listingFunnelAnalytics'
import { useEffect, useRef } from 'react'

export function useListingStepAnalytics(step: ListingStep, ready: boolean) {
  const recorded = useRef(false)
  useEffect(() => {
    // These hooks live in the actual forms, behind auth/cloud loading gates.
    // Re-renders and Strict Mode effect replay do not create extra step views.
    if (ready && !recorded.current) {
      recorded.current = trackListingFunnel({ kind: 'step', step }, getListingDraft())
    }
  }, [ready, step])
}
