'use client'

import { syncListingDraftAfterAuth } from '@/lib/listingDraft'
import { useEffect, useState, type ReactNode } from 'react'

const ListingDraftCloudSync = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const startNew = new URLSearchParams(window.location.search).get('new') === '1'

    const sync = startNew ? Promise.resolve({}) : syncListingDraftAfterAuth()
    sync
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-800" />
  }

  return children
}

export default ListingDraftCloudSync
