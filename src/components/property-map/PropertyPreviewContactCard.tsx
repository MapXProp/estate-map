'use client'

import ListingContactDetails from '@/components/property-home/ListingContactDetails'
import { listingAnalyticsAttributes } from '@/lib/contactAnalytics'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import { MapPin } from 'lucide-react'
import type { ReactNode } from 'react'

export default function PropertyPreviewContactCard({
  listing,
  price,
  isThai,
  directionsUrl,
}: {
  listing: PropertyListingDetail
  price: ReactNode
  isThai: boolean
  directionsUrl?: string | null
}) {
  return (
    <div
      {...listingAnalyticsAttributes(listing, 'map_modal')}
      className="rounded-2xl border border-[#dbe8e2] bg-white p-5 shadow-[0_12px_32px_rgba(18,63,50,.09)] lg:sticky lg:top-5 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto dark:border-neutral-800 dark:bg-neutral-900"
    >
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{isThai ? 'ราคาประกาศ' : 'Listed price'}</p>
      <div className="mt-1 text-2xl font-semibold text-neutral-950 dark:text-white">{price}</div>
      <div className="my-5 h-px bg-neutral-200 dark:bg-neutral-800" />
      <ListingContactDetails listing={listing} isThai={isThai} />
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d7e5df] bg-[#f3f8f6] px-3 py-2 text-sm font-medium text-[#176b50] hover:bg-[#e7f3ee] dark:border-[#315f50] dark:bg-[#183d32] dark:text-[#8bd49c]"
        >
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {isThai ? 'เปิดเส้นทางใน Google Maps' : 'Get directions in Google Maps'}
        </a>
      )}
    </div>
  )
}
