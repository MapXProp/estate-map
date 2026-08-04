import BtnLikeIcon from '@/components/BtnLikeIcon'
import GallerySlider from '@/components/GallerySlider'
import SaleOffBadge from '@/components/SaleOffBadge'
import StartRating from '@/components/StartRating'
import { TRealEstateListing } from '@/data/listings'
import { Badge } from '@/shared/Badge'
import clsx from 'clsx'
import Link from 'next/link'
import { FC } from 'react'

interface Props {
  className?: string
  data: TRealEstateListing
  autoPlayGallery?: boolean
  autoPlayDelay?: number
  compactMobile?: boolean
}

const PropertyCard: FC<Props> = ({
  className = '',
  data,
  autoPlayGallery = false,
  autoPlayDelay = 0,
  compactMobile = false,
}) => {
  const {
    galleryImgs,
    listingCategory,
    address,
    title,
    handle: listingHandle,
    like,
    saleOff,
    isAds,
    price,
    reviewStart,
    reviewCount,
    bedrooms,
    bathrooms,
    acreage,
    maxGuests,
  } = data

  const listingHref = `/real-estate-listings/${listingHandle}`

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full">
        <GallerySlider
          ratioClass="aspect-w-4 aspect-h-3"
          galleryImgs={galleryImgs}
          href={listingHref}
          autoPlay={autoPlayGallery}
          autoPlayInterval={2500}
          autoPlayDelay={autoPlayDelay}
          openInNewTab
        />
        <BtnLikeIcon isLiked={like} className={compactMobile ? 'absolute end-2 top-2 z-1 lg:end-3 lg:top-3' : 'absolute end-3 top-3 z-1'} />
        {saleOff && <SaleOffBadge className="absolute start-3 top-3" />}
      </div>
    )
  }

  const renderContent = () => {
    return (
      <div className={clsx('flex flex-col', compactMobile ? 'mt-1 gap-y-1 p-1.5 sm:p-2 lg:mt-2 lg:gap-y-2 lg:p-3' : 'mt-2 gap-y-2 p-3')}>
        <div className="flex flex-col gap-y-2">
          <div
            className={clsx(
              'flex flex-wrap gap-1 text-sm text-neutral-500 dark:text-neutral-400',
              compactMobile && 'max-lg:hidden'
            )}
          >
            <span>{bedrooms} beds</span>
            <span>·</span>
            <span>{bathrooms} baths</span>
            <span>·</span>
            <span>{acreage} Sq. Fit</span>
          </div>

          <div className="flex items-center gap-x-2">
            {isAds && <Badge color="green">ADS</Badge>}
            <h2
              className={clsx(
                'font-semibold text-neutral-900 capitalize dark:text-white',
                compactMobile ? 'text-sm leading-snug lg:text-base' : 'text-base'
              )}
            >
              <span className={compactMobile ? 'line-clamp-2 lg:line-clamp-1' : 'line-clamp-1'}>{title}</span>
            </h2>
          </div>
          <div
            className={clsx(
              'flex items-center gap-x-1.5 text-neutral-500 dark:text-neutral-400',
              compactMobile ? 'line-clamp-1 text-xs lg:text-sm' : 'text-sm'
            )}
          >
            {address}
          </div>
        </div>
        <div className={clsx('w-14 border-b border-neutral-100 dark:border-neutral-800', compactMobile && 'max-lg:hidden')}></div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className={compactMobile ? 'text-sm font-semibold lg:text-base' : 'text-base font-semibold'}> {price}</span>
          </div>
          {!!reviewStart && (
            <span className={compactMobile ? 'max-lg:hidden' : ''}>
              <StartRating reviewCount={reviewCount} point={reviewStart} />
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`group relative overflow-hidden rounded-xl bg-white dark:bg-neutral-900 ${className}`}>
      {renderSliderGallery()}
      <Link href={listingHref} target="_blank" rel="noopener noreferrer">
        {renderContent()}
      </Link>
    </div>
  )
}

export default PropertyCard
