import BtnLikeIcon from '@/components/BtnLikeIcon'
import GallerySlider from '@/components/GallerySlider'
import ListingImageFallback from '@/components/ListingImageFallback'
import SaleOffBadge from '@/components/SaleOffBadge'
import StartRating from '@/components/StartRating'
import { TRealEstateListing } from '@/data/listings'
import { rememberPropertyResultsLocation } from '@/lib/propertyReturnNavigation'
import { Badge } from '@/shared/Badge'
import clsx from 'clsx'
import { CheckCircle2, Eye } from 'lucide-react'
import Link from 'next/link'
import { FC, MouseEvent, useSyncExternalStore } from 'react'

const TABLET_NAVIGATION_QUERY = '(min-width: 744px)'
const subscribeTabletNavigation = (callback: () => void) => {
  const mediaQuery = window.matchMedia(TABLET_NAVIGATION_QUERY)
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}
const getTabletNavigationSnapshot = () => window.matchMedia(TABLET_NAVIGATION_QUERY).matches
const getTabletNavigationServerSnapshot = () => false

interface Props {
  className?: string
  data: TRealEstateListing
  hoverPreviewGallery?: boolean
  compactMobile?: boolean
  openInNewTab?: boolean
  openInNewTabOnMobile?: boolean
  showQuickView?: boolean
}

const PropertyCard: FC<Props> = ({
  className = '',
  data,
  hoverPreviewGallery = false,
  compactMobile = false,
  openInNewTab = true,
  openInNewTabOnMobile = false,
  showQuickView = false,
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
    listingKind,
    metadataSummary,
    isVerified,
    isOwnerDirect,
    group,
    offer,
  } = data

  const listingHref = `/real-estate-listings/${listingHandle}`
  const isTabletOrLarger = useSyncExternalStore(
    subscribeTabletNavigation,
    getTabletNavigationSnapshot,
    getTabletNavigationServerSnapshot
  )
  const shouldOpenInNewTab = openInNewTab && (isTabletOrLarger || openInNewTabOnMobile)
  const detailHref = shouldOpenInNewTab ? listingHref : `${listingHref}?view=full`
  const categoryTone =
    group === 'commercial'
      ? 'bg-[#fff3e8] text-[#9a4e16] dark:bg-orange-950/45 dark:text-orange-200'
      : group === 'land'
        ? 'bg-[#eef6e8] text-[#3f6b28] dark:bg-lime-950/45 dark:text-lime-200'
        : group === 'rooms'
          ? 'bg-[#f1effb] text-[#5f4e91] dark:bg-violet-950/45 dark:text-violet-200'
          : group === 'mixed_use'
            ? 'bg-[#eef3f8] text-[#385f7a] dark:bg-sky-950/45 dark:text-sky-200'
            : 'bg-[#edf6f1] text-[#176b50] dark:bg-emerald-950/45 dark:text-emerald-200'

  const propertyFacts = metadataSummary
    ? metadataSummary
    : group === 'land'
      ? acreage
        ? `${Math.round(acreage / 4).toLocaleString('th-TH')} ตร.ว.`
        : ''
      : [
          bedrooms ? `${bedrooms} ห้องนอน` : '',
          bathrooms ? `${bathrooms} ห้องน้ำ` : '',
          acreage ? `${Number(acreage).toLocaleString('th-TH')} ตร.ม.` : '',
        ]
          .filter(Boolean)
          .join(' · ')

  const rememberReturnLocation = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const listingLink = target.closest<HTMLAnchorElement>('a')
    if (!listingLink) return

    const destination = new URL(listingLink.href, window.location.origin)
    if (destination.pathname !== listingHref) return

    rememberPropertyResultsLocation(`${window.location.pathname}${window.location.search}${window.location.hash}`)
  }

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full">
        <GallerySlider
          ratioClass="aspect-w-4 aspect-h-3"
          galleryImgs={galleryImgs}
          imageAlt={title}
          href={detailHref}
          hoverAutoPlay={hoverPreviewGallery}
          hoverAutoPlayDelay={1200}
          hoverAutoPlayInterval={2000}
          hoverAutoPlayLimit={4}
          instantImageChange
          openInNewTab={shouldOpenInNewTab}
          emptyFallback={<ListingImageFallback />}
        />
        <div
          className={clsx(
            'absolute z-3 flex items-center gap-1.5',
            compactMobile ? 'end-2 top-2 lg:end-3 lg:top-3' : 'end-3 top-3'
          )}
        >
          {showQuickView && listingKind !== 'event_booth' && (
            <Link
              href={listingHref}
              title="ดูแบบไว"
              aria-label={`ดู ${title} แบบไว`}
              className="flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Eye className="size-4" aria-hidden="true" />
            </Link>
          )}
          <BtnLikeIcon isLiked={like} listingIdentifier={listingHandle} className="shrink-0" />
        </div>
        {saleOff && <SaleOffBadge className="absolute start-3 top-3" />}
      </div>
    )
  }

  const renderContent = () => {
    return (
      <div
        className={clsx(
          'flex flex-col',
          compactMobile ? 'mt-1 gap-y-1 p-1.5 sm:p-2 lg:mt-2 lg:gap-y-2 lg:p-3' : 'mt-2 gap-y-2 p-3'
        )}
      >
        <div className="flex flex-col gap-y-2">
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold">
            <span className={`max-w-[70%] truncate rounded-full px-2 py-1 ${categoryTone}`}>{listingCategory}</span>
            {offer && (
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {offer}
              </span>
            )}
          </div>
          {(isVerified || isOwnerDirect) && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
              {isOwnerDirect && (
                <span className="rounded-full bg-[#edf5f1] px-2 py-1 text-[#176b50]">เจ้าของขายเอง</span>
              )}
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#edf5f1] px-2 py-1 text-[#176b50]">
                  <CheckCircle2 className="size-3" /> ผู้ติดต่อเชื่อถือได้
                </span>
              )}
            </div>
          )}
          <div
            className={clsx(
              'flex min-h-4 items-center text-neutral-500 dark:text-neutral-400',
              compactMobile ? 'text-xs lg:text-sm' : 'text-sm'
            )}
          >
            <span className="line-clamp-1">{propertyFacts || 'ดูรายละเอียดพื้นที่'}</span>
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
        <div
          className={clsx('w-14 border-b border-neutral-100 dark:border-neutral-800', compactMobile && 'max-lg:hidden')}
        ></div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className={compactMobile ? 'text-sm font-semibold lg:text-base' : 'text-base font-semibold'}>
              {' '}
              {price}
            </span>
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
    <div
      className={`group relative overflow-hidden rounded-xl bg-white dark:bg-neutral-900 ${className}`}
      onClickCapture={rememberReturnLocation}
    >
      {renderSliderGallery()}
      <Link
        href={detailHref}
        target={shouldOpenInNewTab ? '_blank' : undefined}
        rel={shouldOpenInNewTab ? 'noopener noreferrer' : undefined}
      >
        {renderContent()}
      </Link>
    </div>
  )
}

export default PropertyCard
