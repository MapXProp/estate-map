'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertyType } from '@/data/propertyTaxonomy'
import { getListingMediaUrl, getMyListings, type MyListing } from '@/lib/myListings'
import ButtonPrimary from '@/shared/ButtonPrimary'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentPlusIcon,
  MapPinIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

type ListingFilter = 'all' | 'pending' | 'active'

const MyListingsPanel = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [listings, setListings] = useState<MyListing[]>([])
  const [filter, setFilter] = useState<ListingFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadListings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setListings(await getMyListings())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isThai
            ? 'ยังโหลดประกาศไม่ได้ กรุณาลองอีกครั้ง'
            : 'Unable to load your listings. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [isThai])

  useEffect(() => {
    void loadListings()
  }, [loadListings])

  const visibleListings = useMemo(
    () => listings.filter((listing) => filter === 'all' || listingGroup(listing) === filter),
    [filter, listings]
  )
  const pendingCount = listings.filter((listing) => listingGroup(listing) === 'pending').length
  const activeCount = listings.filter((listing) => listingGroup(listing) === 'active').length

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-sarabun text-3xl font-semibold text-neutral-900 dark:text-white">
            {isThai ? 'ประกาศของฉัน' : 'My listings'}
          </h1>
          <p className="mt-2 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'ดูสถานะของทุกประกาศ รวมถึงประกาศที่กำลังรอทีมงานตรวจสอบ'
              : 'See every listing you submitted, including listings waiting for review.'}
          </p>
        </div>
        <ButtonPrimary href="/add-listing/1?new=1" className="h-11 shrink-0">
          <DocumentPlusIcon className="size-5" />
          {isThai ? 'ลงประกาศใหม่' : 'Create listing'}
        </ButtonPrimary>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-5 overflow-x-auto">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            {isThai ? `ทั้งหมด (${listings.length})` : `All (${listings.length})`}
          </FilterButton>
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
            {isThai ? `รอตรวจสอบ (${pendingCount})` : `In review (${pendingCount})`}
          </FilterButton>
          <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
            {isThai ? `เผยแพร่แล้ว (${activeCount})` : `Live (${activeCount})`}
          </FilterButton>
        </div>
        <button
          type="button"
          onClick={() => void loadListings()}
          disabled={loading}
          className="mb-2 inline-flex h-9 items-center gap-1.5 rounded-full px-3 font-sarabun text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-60 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <ArrowPathIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          {isThai ? 'รีเฟรช' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="mt-7 rounded-3xl border border-red-200 bg-red-50 p-5 font-sarabun text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          <p>{error}</p>
          <button type="button" className="mt-3 font-semibold underline" onClick={() => void loadListings()}>
            {isThai ? 'ลองอีกครั้ง' : 'Try again'}
          </button>
        </div>
      ) : null}

      {loading ? <ListingSkeleton /> : null}
      {!loading && !error && visibleListings.length === 0 ? (
        <EmptyState isThai={isThai} hasListings={listings.length > 0} />
      ) : null}
      {!loading && !error && visibleListings.length > 0 ? (
        <div className="mt-7 grid gap-4">
          {visibleListings.map((listing) => (
            <ListingRow key={listing.public_listing_id || listing.id} listing={listing} isThai={isThai} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

const ListingRow = ({ listing, isThai }: { listing: MyListing; isThai: boolean }) => {
  const status = statusFor(listing, isThai)
  const propertyType = getPropertyType(listing.property_type_code)
  const propertyLabel = isThai
    ? propertyType?.nameTh || listing.property_type_code
    : propertyType?.nameEn || listing.property_type_code
  const listingIsLive = listingGroup(listing) === 'active'

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm sm:flex dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative h-44 bg-neutral-100 sm:h-auto sm:w-56 dark:bg-neutral-800">
        {listing.primary_image_url ? (
          <img src={getListingMediaUrl(listing.primary_image_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-neutral-400 dark:text-neutral-500">
            <PhotoIcon className="size-8" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sarabun text-xs font-semibold ${status.className}`}
          >
            {status.kind === 'active' ? <CheckCircleIcon className="size-4" /> : <ClockIcon className="size-4" />}
            {status.label}
          </span>
          <time className="font-sarabun text-xs text-neutral-400 dark:text-neutral-500" dateTime={listing.updated_at}>
            {isThai
              ? `อัปเดต ${formatDate(listing.updated_at, 'th-TH')}`
              : `Updated ${formatDate(listing.updated_at, 'en-US')}`}
          </time>
        </div>
        <h2 className="mt-3 line-clamp-2 font-sarabun text-lg font-semibold text-neutral-900 dark:text-white">
          {listing.title}
        </h2>
        <p className="mt-1 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
          {propertyLabel}
          {listing.address ? ` · ${listing.address}` : ''}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-sarabun text-base font-semibold text-neutral-900 dark:text-white">
            {formatPrice(listing, isThai)}
          </p>
          {listingIsLive ? (
            <Link
              href={`/real-estate-listings/${listing.slug}`}
              className="inline-flex h-10 items-center rounded-full border border-neutral-200 px-4 font-sarabun text-sm font-semibold text-neutral-700 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-700 dark:text-neutral-200"
            >
              {isThai ? 'ดูหน้าประกาศ' : 'View listing'}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
              <MapPinIcon className="size-4" />
              {isThai ? 'ยังไม่แสดงในผลการค้นหาจนกว่าจะอนุมัติ' : 'Hidden from public search until approved'}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

const FilterButton = ({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 border-b-2 px-1 pb-3 font-sarabun text-sm font-medium transition ${
      active
        ? 'border-emerald-700 text-emerald-800 dark:border-emerald-400 dark:text-emerald-300'
        : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
    }`}
  >
    {children}
  </button>
)

const ListingSkeleton = () => (
  <div className="mt-7 grid gap-4">
    {[1, 2].map((item) => (
      <div key={item} className="h-52 animate-pulse rounded-3xl bg-neutral-100 dark:bg-neutral-800" />
    ))}
  </div>
)

const EmptyState = ({ isThai, hasListings }: { isThai: boolean; hasListings: boolean }) => (
  <div className="mt-7 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
    <DocumentPlusIcon className="mx-auto size-10 text-neutral-400 dark:text-neutral-500" />
    <h2 className="mt-4 font-sarabun text-lg font-semibold text-neutral-900 dark:text-white">
      {hasListings
        ? isThai
          ? 'ไม่พบประกาศในสถานะนี้'
          : 'No listings in this status'
        : isThai
          ? 'คุณยังไม่มีประกาศ'
          : 'You have not created a listing yet'}
    </h2>
    <p className="mt-2 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
      {hasListings
        ? isThai
          ? 'เลือกดูแท็บอื่นเพื่อพบประกาศของคุณ'
          : 'Try another tab to see your listings.'
        : isThai
          ? 'เริ่มลงประกาศได้ฟรี แล้วติดตามสถานะการตรวจสอบจากหน้านี้'
          : 'Create a listing for free, then track its review status here.'}
    </p>
    {!hasListings ? (
      <ButtonPrimary href="/add-listing/1?new=1" className="mt-6 h-11">
        {isThai ? 'เริ่มลงประกาศ' : 'Create listing'}
      </ButtonPrimary>
    ) : null}
  </div>
)

const listingGroup = (listing: MyListing): ListingFilter =>
  listing.listing_status === 'active' && listing.moderation_status === 'approved' ? 'active' : 'pending'

const statusFor = (listing: MyListing, isThai: boolean) => {
  if (listingGroup(listing) === 'active') {
    return {
      kind: 'active',
      label: isThai ? 'เผยแพร่แล้ว' : 'Live',
      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    }
  }
  if (listing.moderation_status === 'rejected') {
    return {
      kind: 'pending',
      label: isThai ? 'ต้องแก้ไขก่อนเผยแพร่' : 'Changes required',
      className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    }
  }
  return {
    kind: 'pending',
    label: isThai ? 'รอตรวจสอบ' : 'In review',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  }
}

const formatPrice = (listing: MyListing, isThai: boolean) => {
  if (typeof listing.price !== 'number') return isThai ? 'ยังไม่ระบุราคา' : 'Price on request'
  const price = new Intl.NumberFormat(isThai ? 'th-TH' : 'en-US', { maximumFractionDigits: 0 }).format(listing.price)
  const unit = listing.price_unit === 'month' ? (isThai ? '/ เดือน' : '/ month') : ''
  return `${price} ${isThai ? 'บาท' : 'THB'}${unit}`
}

const formatDate = (value: string, locale: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed)
}

export default MyListingsPanel
