'use client'

import ListingImageFallback from '@/components/ListingImageFallback'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertyType } from '@/data/propertyTaxonomy'
import { clearListingDraft, getListingDraft, loadMyListingForEdit } from '@/lib/listingDraft'
import { deleteMyListing, getListingMediaUrl, getMyListings, type MyListing } from '@/lib/myListings'
import ButtonPrimary from '@/shared/ButtonPrimary'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { ArrowUpRight, Ellipsis, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './AccountDashboard.module.css'

type ListingFilter = 'all' | 'pending' | 'active'

const MyListingsPanel = () => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [listings, setListings] = useState<MyListing[]>([])
  const [filter, setFilter] = useState<ListingFilter>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const [editingListingId, setEditingListingId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MyListing | null>(null)
  const [deletingListingId, setDeletingListingId] = useState('')
  const [deleteError, setDeleteError] = useState('')

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

  const handleEdit = async (listing: MyListing) => {
    if (!listing.public_listing_id || editingListingId) return

    setEditError('')
    setEditingListingId(listing.public_listing_id)
    try {
      await loadMyListingForEdit(listing.public_listing_id)
      router.push('/add-listing/1')
    } catch (err) {
      setEditError(
        err instanceof Error && err.message
          ? err.message
          : isThai
            ? 'ไม่สามารถเปิดประกาศนี้เพื่อแก้ไขได้ กรุณาลองอีกครั้ง'
            : 'Unable to open this listing for editing. Please try again.'
      )
    } finally {
      setEditingListingId('')
    }
  }

  const closeDeleteConfirmation = () => {
    if (!deletingListingId) {
      setDeleteTarget(null)
    }
  }

  const handleDelete = async () => {
    const publicListingId = deleteTarget?.public_listing_id
    if (!publicListingId || deletingListingId) return

    setDeleteError('')
    setDeletingListingId(publicListingId)
    try {
      await deleteMyListing(publicListingId)
      if (String(getListingDraft().editingPublicListingId || '').trim() === publicListingId) {
        clearListingDraft()
      }
      setListings((current) => current.filter((listing) => listing.public_listing_id !== publicListingId))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(
        err instanceof Error && err.message
          ? err.message
          : isThai
            ? 'ไม่สามารถลบประกาศนี้ได้ กรุณาลองอีกครั้ง'
            : 'Unable to delete this listing. Please try again.'
      )
    } finally {
      setDeletingListingId('')
    }
  }

  const visibleListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          (filter === 'all' || listingGroup(listing) === filter) &&
          [listing.title, listing.address, listing.organization_name]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase())
      ),
    [filter, listings, query]
  )
  const pendingCount = listings.filter((listing) => listingGroup(listing) === 'pending').length
  const activeCount = listings.filter((listing) => listingGroup(listing) === 'active').length

  return (
    <div>
      <header className={styles.heading} data-compact>
        <div>
          <span className={styles.eyebrow}>MY LISTINGS</span>
          <h1>{isThai ? 'ประกาศของฉัน' : 'My listings'}</h1>
          <p>
            {isThai
              ? 'ดูสถานะ แก้ไข และจัดการประกาศของคุณในที่เดียว'
              : 'Track, edit and manage your listings in one place.'}
          </p>
        </div>
        <Link
          href="/add-listing/1?new=1"
          className={styles.primaryAction}
          aria-label={isThai ? 'ลงประกาศใหม่' : 'Create listing'}
        >
          <DocumentPlusIcon className="size-5" />
          <span>{isThai ? 'ลงประกาศใหม่' : 'Create listing'}</span>
        </Link>
      </header>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={isThai ? 'ค้นหาในประกาศของฉัน' : 'Search my listings'}
            placeholder={isThai ? 'ค้นหาชื่อประกาศ หรือทำเล' : 'Search title or location'}
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label={isThai ? 'ล้างคำค้น' : 'Clear search'}>
              <X size={16} />
            </button>
          ) : null}
        </label>
        <button
          type="button"
          onClick={() => void loadListings()}
          disabled={loading}
          className={styles.secondaryAction}
          aria-label={isThai ? 'รีเฟรชประกาศ' : 'Refresh listings'}
        >
          <ArrowPathIcon className={loading ? 'size-4 animate-spin' : 'size-4'} />
          <span>{isThai ? 'รีเฟรช' : 'Refresh'}</span>
        </button>
      </div>
      <div className={styles.filterRow}>
        <div className={styles.filters} role="group" aria-label={isThai ? 'สถานะประกาศ' : 'Listing status'}>
          {(
            [
              { value: 'all', th: 'ทั้งหมด', en: 'All', count: listings.length },
              { value: 'active', th: 'เผยแพร่แล้ว', en: 'Live', count: activeCount },
              { value: 'pending', th: 'รอดำเนินการ', en: 'Pending', count: pendingCount },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {isThai ? item.th : item.en}
              <small>{loading ? '—' : item.count}</small>
            </button>
          ))}
        </div>
        {!loading && !error ? (
          <p className={styles.resultCount} role="status">
            {isThai ? visibleListings.length + ' ประกาศ' : visibleListings.length + ' listings'}
          </p>
        ) : null}
      </div>
      {[error, editError, deleteError].filter(Boolean).map((message, index) => (
        <div
          key={index}
          role="alert"
          className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
        >
          <p>{message}</p>
          {message === error ? (
            <button type="button" onClick={() => void loadListings()} className="mt-2 min-h-11 underline">
              {isThai ? 'ลองอีกครั้ง' : 'Retry'}
            </button>
          ) : null}
        </div>
      ))}
      {loading ? <ListingSkeleton /> : null}
      {!loading && !error && visibleListings.length === 0 ? (
        query.trim() ? (
          <section className={styles.empty}>
            <Search size={32} />
            <h2>{isThai ? 'ไม่พบประกาศที่ตรงกับคำค้น' : 'No matching listings'}</h2>
            <p>
              {isThai
                ? 'ลองใช้ชื่อหรือทำเลอื่น หรือดูประกาศทั้งหมดของคุณ'
                : 'Try another title or location, or view all your listings.'}
            </p>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
            >
              {isThai ? 'ดูประกาศทั้งหมด' : 'View all listings'}
            </button>
          </section>
        ) : (
          <EmptyState isThai={isThai} hasListings={listings.length > 0} />
        )
      ) : null}
      {!loading && !error && visibleListings.length > 0 ? (
        <div className={styles.listingList}>
          {visibleListings.map((listing) => (
            <ListingRow
              key={listing.public_listing_id || listing.id}
              listing={listing}
              isThai={isThai}
              editing={editingListingId === listing.public_listing_id}
              editDisabled={Boolean(editingListingId || deletingListingId)}
              onEdit={() => void handleEdit(listing)}
              actionDisabled={Boolean(editingListingId || deletingListingId)}
              onDelete={() => {
                setDeleteError('')
                setDeleteTarget(listing)
              }}
            />
          ))}
        </div>
      ) : null}
      <DeleteListingDialog
        listing={deleteTarget}
        isThai={isThai}
        deleting={Boolean(deleteTarget && deletingListingId === deleteTarget.public_listing_id)}
        error={deleteError}
        onClose={closeDeleteConfirmation}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

const ListingRow = ({
  listing,
  isThai,
  editing,
  editDisabled,
  onEdit,
  actionDisabled,
  onDelete,
}: {
  listing: MyListing
  isThai: boolean
  editing: boolean
  editDisabled: boolean
  onEdit: () => void
  actionDisabled: boolean
  onDelete: () => void
}) => {
  const { formatCurrencyFrom } = usePreferences()
  const status = statusFor(listing, isThai)
  const propertyType = getPropertyType(listing.property_type_code)
  const propertyLabel = isThai
    ? propertyType?.nameTh || listing.property_type_code
    : propertyType?.nameEn || listing.property_type_code
  const live = listingGroup(listing) === 'active'
  return (
    <article className={styles.listing} data-my-listing={listing.public_listing_id}>
      <div className={styles.listingImage}>
        <ListingCardImage url={listing.primary_image_url} />
      </div>
      <div className={styles.listingBody}>
        <div className={styles.listingStatus}>
          <span
            className={
              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium ' + status.className
            }
          >
            {status.kind === 'active' ? <CheckCircleIcon className="size-3.5" /> : <ClockIcon className="size-3.5" />}
            {status.label}
          </span>
          <time dateTime={listing.updated_at}>
            {isThai ? 'อัปเดต ' : 'Updated '}
            {formatDate(listing.updated_at, isThai ? 'th-TH' : 'en-US')}
          </time>
        </div>
        <h2>{listing.title}</h2>
        <p className={styles.listingAddress}>
          <MapPinIcon className="size-3.5" />
          <span>
            {propertyLabel}
            {listing.address ? ' · ' + listing.address : ''}
          </span>
        </p>
        <p className={styles.listingPrice}>{formatPrice(listing, isThai, formatCurrencyFrom)}</p>
      </div>
      <div className={styles.listingActions}>
        {listing.organization_name ? (
          <p>
            {listing.organization_name}
            {listing.organization_verification_status === 'verified' ? (isThai ? ' · ตรวจสอบแล้ว' : ' · Verified') : ''}
          </p>
        ) : !live ? (
          <p>
            {listing.moderation_status === 'rejected'
              ? isThai
                ? 'แก้ไขข้อมูลเพื่อส่งตรวจอีกครั้ง'
                : 'Edit and resubmit for review'
              : isThai
                ? 'ยังไม่แสดงในผลการค้นหา'
                : 'Not yet visible in search'}
          </p>
        ) : null}
        {listing.can_edit !== false ? (
          <button
            type="button"
            onClick={onEdit}
            disabled={editDisabled || !listing.public_listing_id}
            className={styles.primaryAction}
          >
            {editing ? <ArrowPathIcon className="size-4 animate-spin" /> : <PencilSquareIcon className="size-4" />}
            {editing ? (isThai ? 'กำลังเปิด…' : 'Opening…') : isThai ? 'แก้ไขประกาศ' : 'Edit listing'}
          </button>
        ) : null}
        {live ? (
          <>
            <Link
              href={'/real-estate-listings/' + listing.slug}
              className={`${styles.secondaryAction} ${styles.mobileView}`}
            >
              {isThai ? 'ดูประกาศ' : 'View listing'}
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href={'/real-estate-listings/' + listing.slug}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.secondaryAction} ${styles.desktopView}`}
            >
              {isThai ? 'ดูประกาศ' : 'View listing'}
              <ArrowUpRight size={16} />
            </Link>
          </>
        ) : null}
        {listing.can_delete !== false ? (
          <Menu>
            <MenuButton
              className={styles.moreButton}
              disabled={actionDisabled || !listing.public_listing_id}
              aria-label={(isThai ? 'ตัวเลือกเพิ่มเติม: ' : 'More actions: ') + listing.title}
            >
              <Ellipsis size={20} />
            </MenuButton>
            <MenuItems anchor="bottom end" className={styles.moreMenu}>
              <MenuItem>
                <button type="button" onClick={onDelete}>
                  <TrashIcon className="size-4" />
                  {isThai ? 'ลบประกาศ' : 'Delete listing'}
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        ) : null}
      </div>
    </article>
  )
}

const DeleteListingDialog = ({
  listing,
  isThai,
  deleting,
  onClose,
  onConfirm,
  error,
}: {
  listing: MyListing | null
  isThai: boolean
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
  error: string
}) => (
  <Dialog open={Boolean(listing)} onClose={onClose} className="relative z-[100]">
    <DialogBackdrop className="fixed inset-0 bg-neutral-950/45 backdrop-blur-[1px]" />
    <div className="fixed inset-0 overflow-y-auto p-4">
      <div className="flex min-h-full items-center justify-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7 dark:bg-neutral-900">
          <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <ExclamationTriangleIcon className="size-6" />
          </div>
          <DialogTitle className="mt-5 font-sarabun text-xl font-semibold text-neutral-950 dark:text-white">
            {isThai ? 'ยืนยันการลบประกาศ' : 'Delete this listing?'}
          </DialogTitle>
          <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {isThai
              ? `ประกาศ “${listing?.title || ''}” จะถูกซ่อนจากหน้าสาธารณะและหน้าประกาศของคุณทันที`
              : `“${listing?.title || ''}” will immediately be hidden from public pages and your listings.`}
          </p>
          <p className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3 font-sarabun text-xs leading-5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {isThai
              ? 'หากต้องการเปลี่ยนข้อมูลอย่างเดียว ให้ยกเลิกแล้วเลือกแก้ไขประกาศ'
              : 'If you only need to change the details, cancel and choose Edit listing instead.'}
          </p>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 px-5 font-sarabun text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {isThai ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 font-sarabun text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
            >
              {deleting ? <ArrowPathIcon className="size-4 animate-spin" /> : <TrashIcon className="size-4" />}
              {deleting ? (isThai ? 'กำลังลบ…' : 'Deleting…') : isThai ? 'ยืนยันลบประกาศ' : 'Delete listing'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
)

const ListingCardImage = ({ url }: { url: string }) => {
  const resolvedURL = getListingMediaUrl(url)
  const [failedURL, setFailedURL] = useState('')

  if (!resolvedURL || failedURL === resolvedURL) {
    return <ListingImageFallback />
  }

  return (
    <img src={resolvedURL} alt="" className="h-full w-full object-cover" onError={() => setFailedURL(resolvedURL)} />
  )
}

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
          ? 'ลองเลือกสถานะอื่นเพื่อดูประกาศของคุณ'
          : 'Choose another status to see your listings.'
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

const formatPrice = (
  listing: MyListing,
  isThai: boolean,
  formatAmount: (amount: number, sourceCurrency?: string) => string
) => {
  if (typeof listing.price !== 'number') return isThai ? 'ยังไม่ระบุราคา' : 'Price on request'
  const price = formatAmount(listing.price, listing.currency)
  const unit =
    listing.price_unit === 'month'
      ? isThai
        ? '/ เดือน'
        : '/ month'
      : listing.price_unit === 'day'
        ? isThai
          ? '/ วัน'
          : '/ day'
        : listing.price_unit === 'week'
          ? isThai
            ? '/ สัปดาห์'
            : '/ week'
          : listing.price_unit === 'event_period'
            ? isThai
              ? '/ งาน'
              : '/ event'
            : ''
  return `${price}${unit}`
}

const formatDate = (value: string, locale: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed)
}

export default MyListingsPanel
