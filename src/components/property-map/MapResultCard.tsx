'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyPrices from '@/components/PropertyPrices'
import type { TRealEstateListing } from '@/data/listings'
import { getPropertyType, offerTypes } from '@/data/propertyTaxonomy'
import { getMapListingPrices, propertyOffersLabel } from '@/lib/propertyPrices'
import { rememberPropertyResultsLocation } from '@/lib/propertyReturnNavigation'
import { MapPin, Maximize2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function MapResultCard({
  listing,
  onHover,
  onLocate,
  compact = false,
}: {
  listing: TRealEstateListing
  onHover: (id: string) => void
  onLocate?: () => void
  compact?: boolean
}) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const title = th ? listing.title : listing.titleEn || listing.title
  const prices = getMapListingPrices(listing)
  const category = th ? listing.listingCategory : getPropertyType(listing.propertyTypeCode || '')?.nameEn || 'Property'
  const offer =
    propertyOffersLabel(prices, th) ||
    (th ? listing.offer : offerTypes.find((item) => item.nameTh === listing.offer)?.nameEn || listing.offer)
  return (
    <article
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover('')}
      onFocus={() => onHover(listing.id)}
      onBlur={() => onHover('')}
      className={`group rounded-2xl border transition focus-within:border-[#176b50] hover:border-[#a9cbbb] ${compact ? 'border-transparent p-3 hover:bg-[#f5faf7] dark:hover:bg-neutral-800' : 'overflow-hidden border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'}`}
    >
      <Link
        href={`/real-estate-listings/${encodeURIComponent(listing.handle)}`}
        scroll={false}
        onClick={() => rememberPropertyResultsLocation(`${window.location.pathname}${window.location.search}`)}
        className={`flex rounded-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#176b50] ${compact ? 'gap-3' : 'flex-col'}`}
      >
        <div
          className={`relative shrink-0 overflow-hidden bg-[#e9f0eb] ${compact ? 'size-[88px] rounded-xl' : 'aspect-[16/10] w-full'}`}
        >
          {listing.featuredImage ? (
            <Image
              src={listing.featuredImage}
              alt=""
              fill
              sizes={
                compact ? '88px' : '(min-width: 1024px) 474px, (min-width: 640px) calc(50vw - 18px), calc(100vw - 24px)'
              }
              className="object-cover"
            />
          ) : (
            <MapPin className="absolute inset-0 m-auto size-8 text-[#699580]" />
          )}
          {!compact && (
            <span className="absolute top-2.5 left-2.5 max-w-[calc(100%_-_20px)] truncate rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
              {category} · {offer}
            </span>
          )}
          {listing.isMapPromoted && (
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] text-[#176b50]">
              {th ? 'โปรโมต' : 'Promoted'}
            </span>
          )}
        </div>
        <div className={`flex min-w-0 flex-1 flex-col ${compact ? '' : 'px-3 pt-3'}`}>
          {compact && <p className="text-[11px] font-medium text-[#568170] dark:text-emerald-400">{offer}</p>}
          <h3
            className={
              compact
                ? 'order-2 mt-1 truncate text-xs text-neutral-600 dark:text-neutral-300'
                : 'order-2 mt-1.5 line-clamp-2 text-sm leading-5 font-medium text-neutral-900 dark:text-white'
            }
          >
            {title}
          </h3>
          <PropertyPrices
            prices={prices}
            variant={compact ? 'compact' : 'card'}
            className={`order-1 text-[#176b50] dark:text-emerald-400 ${compact ? 'mt-1' : ''}`}
          />
          {compact && (
            <p className="order-3 mt-1 text-[11px] text-neutral-500">
              {th ? listing.metadataSummary : listing.metadataSummaryEn}
            </p>
          )}
        </div>
      </Link>
      <div className={`flex items-center justify-between gap-2 ${compact ? 'mt-2' : 'px-3 pt-1 pb-2'}`}>
        {!compact && (
          <p className="min-w-0 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            {th ? listing.metadataSummary : listing.metadataSummaryEn}
          </p>
        )}
        {onLocate && (
          <button
            type="button"
            onClick={onLocate}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#176b50] hover:bg-[#e4f1e9] dark:text-emerald-400 dark:hover:bg-neutral-700"
            aria-label={`${th ? 'ดูตำแหน่ง' : 'Locate'} ${title}`}
          >
            <Maximize2 className="size-3.5" />
            {th ? 'ดูตำแหน่ง' : 'Locate'}
          </button>
        )}
      </div>
    </article>
  )
}
