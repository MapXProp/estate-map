'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import type { TRealEstateListing } from '@/data/listings'
import { getPropertyType, offerTypes } from '@/data/propertyTaxonomy'
import { rememberPropertyResultsLocation } from '@/lib/propertyReturnNavigation'
import { MapPin, Maximize2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function MapResultCard({
  listing,
  onHover,
  onLocate,
}: {
  listing: TRealEstateListing
  onHover: (id: string) => void
  onLocate: () => void
}) {
  const { locale, formatCurrencyFrom } = usePreferences()
  const th = locale === 'th'
  const title = th ? listing.title : listing.titleEn || listing.title
  const price = listing.priceAmount
    ? formatCurrencyFrom(listing.priceAmount, listing.priceCurrency)
    : th
      ? listing.priceLabel || listing.price
      : 'Price on request'
  const period =
    listing.priceUnit === 'month'
      ? th
        ? '/เดือน'
        : '/mo'
      : listing.priceUnit === 'day'
        ? th
          ? '/วัน'
          : '/day'
        : listing.priceUnit === 'week'
          ? th
            ? '/สัปดาห์'
            : '/wk'
          : listing.priceUnit === 'event_period'
            ? th
              ? '/งาน'
              : '/event'
            : ''
  return (
    <article
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover('')}
      onFocus={() => onHover(listing.id)}
      onBlur={() => onHover('')}
      className="group rounded-2xl border border-transparent p-3 transition focus-within:border-[#176b50] hover:border-[#d4e7dd] hover:bg-[#f5faf7] dark:hover:bg-neutral-800"
    >
      <Link
        href={`/real-estate-listings/${encodeURIComponent(listing.handle)}`}
        scroll={false}
        onClick={() => rememberPropertyResultsLocation(`${window.location.pathname}${window.location.search}`)}
        className="flex gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-[#176b50]"
      >
        <div className="relative h-[108px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-[#e9f0eb]">
          {listing.featuredImage ? (
            <Image
              src={listing.featuredImage}
              alt=""
              fill
              sizes="112px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <MapPin className="absolute inset-0 m-auto size-8 text-[#699580]" />
          )}
          {listing.isMapPromoted && (
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] text-[#176b50]">
              {th ? 'โปรโมต' : 'Promoted'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-[#568170] dark:text-emerald-400">
            {th ? listing.listingCategory : getPropertyType(listing.propertyTypeCode || '')?.nameEn || 'Property'} ·{' '}
            {th ? listing.offer : offerTypes.find((offer) => offer.nameTh === listing.offer)?.nameEn || listing.offer}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm leading-5 font-semibold text-neutral-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 truncate text-xs text-neutral-500">
            {th ? listing.address : listing.addressEn || listing.address}
          </p>
          <p className="mt-2 text-base leading-5 font-bold text-[#176b50] dark:text-emerald-400">
            {price}
            <span className="ms-0.5 text-[11px] font-normal">{period}</span>
          </p>
        </div>
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-neutral-500">
          {th ? listing.metadataSummary : listing.metadataSummaryEn}
        </p>
        <button
          type="button"
          onClick={onLocate}
          className="flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[#176b50] hover:bg-[#e4f1e9] dark:text-emerald-400 dark:hover:bg-neutral-700"
          aria-label={`${th ? 'ดูตำแหน่ง' : 'Locate'} ${title}`}
        >
          <Maximize2 className="size-3" />
          {th ? 'ดูตำแหน่ง' : 'Locate'}
        </button>
      </div>
    </article>
  )
}
