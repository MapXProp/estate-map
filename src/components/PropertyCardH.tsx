'use client'

import BtnLikeIcon from '@/components/BtnLikeIcon'
import GallerySlider from '@/components/GallerySlider'
import ListingImageFallback from '@/components/ListingImageFallback'
import SaleOffBadge from '@/components/SaleOffBadge'
import StartRating from '@/components/StartRating'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { TRealEstateListing } from '@/data/listings'
import { Badge } from '@/shared/Badge'
import Link from 'next/link'
import { FC } from 'react'

interface PropertyCardHProps {
  className?: string
  data: TRealEstateListing
}

const PropertyCardH: FC<PropertyCardHProps> = ({ className = '', data }) => {
  const { locale, formatCurrencyFrom } = usePreferences()
  const isThai = locale === 'th'
  const {
    galleryImgs,
    title: sourceTitle,
    handle: listingHandle,
    like,
    saleOff,
    isAds,
    price,
    reviewStart,
    reviewCount,
  } = data
  const title = isThai ? sourceTitle : data.titleEn || sourceTitle
  const displayPrice =
    typeof data.priceAmount === 'number' && data.priceAmount > 0
      ? `${formatCurrencyFrom(data.priceAmount, data.priceCurrency)}${formatPricePeriod(data.priceUnit, isThai)}`
      : data.priceLabel
        ? isThai
          ? data.priceLabel
          : data.priceLabel === 'ติดต่อผู้จัดงาน'
            ? 'Contact organizer'
            : 'Price on request'
        : price === 'สอบถามราคา'
          ? isThai
            ? 'สอบถามราคา'
            : 'Price on request'
          : price

  const listingHref = `/real-estate-listings/${listingHandle}`

  const renderSliderGallery = () => {
    return (
      <div className="w-full shrink-0 p-3 sm:w-64">
        <GallerySlider
          ratioClass="aspect-w-1 aspect-h-1"
          galleryImgs={galleryImgs}
          imageAlt={title}
          className="h-full w-full overflow-hidden rounded-2xl"
          href={listingHref}
          emptyFallback={<ListingImageFallback />}
        />

        {saleOff && <SaleOffBadge className="absolute start-5 top-5 bg-orange-500!" />}
      </div>
    )
  }

  const renderTienIch = () => {
    const facts = isThai ? data.metadataSummary : data.metadataSummaryEn
    return facts ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{facts}</p> : null
  }
  const renderContent = () => {
    return (
      <div className="flex grow flex-col items-start p-3 sm:pe-6">
        <div className="w-full space-y-4">
          <div className="flex items-center gap-x-2">
            {isAds && <Badge color="green">{isThai ? 'โฆษณา' : 'Ads'}</Badge>}
            <h2 className="text-lg font-medium capitalize">
              <Link href={listingHref} prefetch={false} className="relative line-clamp-2">
                {title}
              </Link>
            </h2>
          </div>
          {renderTienIch()}
          <p className="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
            {isThai ? data.address : data.addressEn || data.address}
          </p>
          <div className="w-14 border-b border-neutral-200/80 dark:border-neutral-700"></div>
          <div className="flex w-full items-end justify-between">
            {reviewCount > 0 && <StartRating reviewCount={reviewCount} point={reviewStart} />}
            <span className="flex items-center justify-center rounded-lg border-2 border-secondary-500 px-2.5 py-1.5 text-sm leading-none font-medium text-secondary-500">
              {displayPrice}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group nc-PropertyCardH relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
    >
      <Link href={listingHref} prefetch={false} aria-label={title} className="absolute inset-0" tabIndex={-1}></Link>
      <div className="flex h-full w-full flex-col sm:flex-row sm:items-center">
        {renderSliderGallery()}
        {renderContent()}
      </div>
      <BtnLikeIcon
        listingIdentifier={listingHandle}
        colorClass="bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200/70 text-neutral-600 dark:text-neutral-400"
        isLiked={like}
        className="absolute end-5 top-5 sm:end-3 sm:top-3"
      />
    </div>
  )
}

export default PropertyCardH

const formatPricePeriod = (unit: string | undefined, isThai: boolean) => {
  if (unit === 'month') return isThai ? '/เดือน' : '/month'
  if (unit === 'day') return isThai ? '/วัน' : '/day'
  if (unit === 'week') return isThai ? '/สัปดาห์' : '/week'
  if (unit === 'event_period') return isThai ? '/งาน' : '/event'
  return ''
}
