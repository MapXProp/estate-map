'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  createListingViewEventID,
  getListingViewCount,
  recordListingOpening,
  scheduleListingOpening,
  subscribeListingViews,
  type ListingViewSource,
} from '@/lib/listingViews'
import { Eye } from 'lucide-react'
import { useEffect, useRef, useSyncExternalStore } from 'react'

export default function ListingViewCount({
  listingId,
  initialCount = 0,
  source,
  enabled = true,
  compact = false,
  className = '',
}: {
  listingId: string
  initialCount?: number
  source?: ListingViewSource
  enabled?: boolean
  compact?: boolean
  className?: string
}) {
  const { locale } = usePreferences()
  const opening = useRef<{ listingId: string; source: ListingViewSource; eventId: string } | null>(null)
  const count = useSyncExternalStore(
    subscribeListingViews,
    () => getListingViewCount(listingId, initialCount),
    () => (Number.isSafeInteger(initialCount) && initialCount > 0 ? initialCount : 0)
  )
  useEffect(() => {
    if (!source || !enabled) return
    if (opening.current?.listingId !== listingId || opening.current.source !== source) {
      opening.current = { listingId, source, eventId: createListingViewEventID() }
    }
    const eventId = opening.current.eventId
    return scheduleListingOpening(document, () => {
      void recordListingOpening(listingId, source, eventId)
    })
  }, [listingId, source, enabled])

  if (count <= 0) return null
  const th = locale === 'th'
  const label = th
    ? `เปิดดู ${count.toLocaleString('th-TH')} ครั้ง`
    : `${count.toLocaleString('en-US')} ${count === 1 ? 'view' : 'views'}`
  return (
    <span
      data-listing-view-count={count}
      aria-label={label}
      className={`inline-flex shrink-0 items-center gap-1 text-xs font-normal whitespace-nowrap text-neutral-500 dark:text-neutral-400 ${className}`}
      title={
        th
          ? 'ยอดเปิดตัวอย่างและหน้ารายละเอียด รวมการเปิดซ้ำและรีเฟรช'
          : 'Preview and detail-page openings, including repeat visits and refreshes'
      }
    >
      <Eye aria-hidden="true" className="size-3.5" />
      {compact ? count.toLocaleString(th ? 'th-TH' : 'en-US') : label}
    </span>
  )
}
