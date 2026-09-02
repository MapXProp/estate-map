'use client'

import ListingImageFallback from '@/components/ListingImageFallback'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import {
  getAdminReviewListing,
  getAdminReviewListings,
  updateAdminListingModeration,
  type AdminListingReviewStatus,
  type AdminReviewCounts,
  type AdminReviewListing,
} from '@/lib/adminListings'
import { getListingMediaUrl } from '@/lib/myListings'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhotoIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { FormEvent, useCallback, useEffect, useState } from 'react'

const PAGE_SIZE = 30
const emptyCounts: AdminReviewCounts = { pending: 0, approved: 0, rejected: 0 }

type ModerationDialogState = {
  listing: AdminReviewListing
  action: 'approve' | 'unapprove'
}

const AdminListingModeration = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const { isLoading: authLoading, user } = useAuth()
  const isSuperAdmin = user?.role_code === 'super_admin'
  const [status, setStatus] = useState<AdminListingReviewStatus>('approved')
  const [listings, setListings] = useState<AdminReviewListing[]>([])
  const [counts, setCounts] = useState<AdminReviewCounts>(emptyCounts)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [detail, setDetail] = useState<AdminReviewListing | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [moderationDialog, setModerationDialog] = useState<ModerationDialogState | null>(null)
  const [moderationNote, setModerationNote] = useState('')
  const [moderating, setModerating] = useState(false)

  const loadQueue = useCallback(async () => {
    if (!isSuperAdmin) return
    setLoading(true)
    setError('')
    try {
      const result = await getAdminReviewListings(status, appliedQuery, offset, PAGE_SIZE)
      setListings(result.listings || [])
      setCounts(result.counts || emptyCounts)
      setTotal(result.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot load moderation queue')
    } finally {
      setLoading(false)
    }
  }, [appliedQuery, isSuperAdmin, offset, status])

  useEffect(() => {
    if (!authLoading && isSuperAdmin) void loadQueue()
  }, [authLoading, isSuperAdmin, loadQueue, reloadKey])

  const openDetail = async (listing: AdminReviewListing) => {
    setDetail(listing)
    setDetailLoading(true)
    setError('')
    try {
      setDetail(await getAdminReviewListing(listing.public_listing_id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot load listing details')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const openModeration = (listing: AdminReviewListing, action: ModerationDialogState['action']) => {
    setModerationNote('')
    setModerationDialog({ listing, action })
  }

  const confirmModeration = async () => {
    if (!moderationDialog || moderating) return
    if (moderationDialog.action === 'unapprove' && !moderationNote.trim()) return
    setModerating(true)
    setError('')
    try {
      await updateAdminListingModeration(
        moderationDialog.listing.public_listing_id,
        moderationDialog.action,
        moderationNote.trim()
      )
      setModerationDialog(null)
      setDetail(null)
      setReloadKey((value) => value + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot update listing moderation')
      setModerationDialog(null)
    } finally {
      setModerating(false)
    }
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOffset(0)
    setAppliedQuery(query.trim())
  }

  if (authLoading) return <CenteredLoading label={isThai ? 'กำลังตรวจสอบสิทธิ์…' : 'Checking permission…'} />

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <ShieldCheckIcon className="mx-auto size-10 text-neutral-400" />
        <h1 className="mt-4 font-sarabun text-xl font-semibold">
          {isThai ? 'สำหรับ Super Admin เท่านั้น' : 'Super admin access only'}
        </h1>
        <p className="mt-2 font-sarabun text-sm text-neutral-500">
          {isThai ? 'บัญชีนี้ไม่มีสิทธิ์ตรวจและอนุมัติประกาศ' : 'This account cannot review listings.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="font-sarabun text-xs font-semibold tracking-wide text-[#176b50] uppercase dark:text-emerald-300">
            Super Admin
          </p>
          <h1 className="mt-2 font-sarabun text-3xl font-semibold text-neutral-950 dark:text-white">
            {isThai ? 'ตรวจและอนุมัติประกาศ' : 'Listing approvals'}
          </h1>
          <p className="mt-2 max-w-2xl font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'ประกาศใหม่เผยแพร่ทันที ตรวจข้อมูล รูป วิดีโอ ราคา และผู้ติดต่อย้อนหลัง หากไม่เหมาะสมสามารถไม่อนุมัติและซ่อนได้'
              : 'New listings publish immediately. Review their information and media, then unapprove and hide anything unsuitable.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full border border-neutral-200 bg-white px-4 font-sarabun text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        >
          <ArrowPathIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          {isThai ? 'รีเฟรชรายการ' : 'Refresh listings'}
        </button>
      </header>

      <section className="mt-7 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 p-4 sm:p-5 dark:border-neutral-800">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['approved', 'rejected', 'pending'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setStatus(item)
                  setOffset(0)
                }}
                className={`shrink-0 rounded-full px-4 py-2 font-sarabun text-sm font-semibold transition ${
                  status === item
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                {reviewStatusLabel(item, isThai)} ({counts[item]})
              </button>
            ))}
          </div>
          <form onSubmit={submitSearch} className="mt-4 flex w-full max-w-lg gap-2">
            <label className="relative flex-1">
              <span className="sr-only">{isThai ? 'ค้นหาประกาศ' : 'Search listings'}</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={120}
                placeholder={isThai ? 'ค้นหาชื่อประกาศ โครงการ หรืออีเมล' : 'Search title, project, or email'}
                className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 ps-10 pe-3 font-sarabun text-sm outline-none transition focus:border-[#176b50] focus:ring-2 focus:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </label>
            <button type="submit" className="h-10 rounded-xl bg-[#124e3c] px-4 font-sarabun text-sm font-semibold text-white">
              {isThai ? 'ค้นหา' : 'Search'}
            </button>
          </form>
        </div>

        {error ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3 p-4 sm:p-5">
            {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <CheckCircleIcon className="mx-auto size-10 text-neutral-300" />
            <p className="mt-3 font-sarabun text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              {status === 'approved'
                ? isThai ? 'ยังไม่มีประกาศที่เผยแพร่' : 'There are no published listings yet'
                : isThai ? 'ไม่พบประกาศในสถานะนี้' : 'No listings in this status'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {listings.map((listing) => (
              <ReviewCard
                key={listing.public_listing_id}
                listing={listing}
                isThai={isThai}
                onDetail={() => void openDetail(listing)}
                onApprove={() => openModeration(listing, 'approve')}
                onRequestChanges={() => openModeration(listing, 'unapprove')}
              />
            ))}
          </div>
        )}

        {total > PAGE_SIZE ? (
          <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <span className="font-sarabun text-xs text-neutral-500">{offset + 1}-{Math.min(offset + listings.length, total)} / {total}</span>
            <div className="flex gap-2">
              <button type="button" disabled={offset === 0 || loading} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))} className="h-9 rounded-full border border-neutral-200 px-4 font-sarabun text-xs font-semibold disabled:opacity-40 dark:border-neutral-700">
                {isThai ? 'ก่อนหน้า' : 'Previous'}
              </button>
              <button type="button" disabled={offset + listings.length >= total || loading} onClick={() => setOffset((value) => value + PAGE_SIZE)} className="h-9 rounded-full border border-neutral-200 px-4 font-sarabun text-xs font-semibold disabled:opacity-40 dark:border-neutral-700">
                {isThai ? 'ถัดไป' : 'Next'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <ReviewDetailDialog
        listing={detail}
        loading={detailLoading}
        isThai={isThai}
        onClose={() => !detailLoading && setDetail(null)}
        onApprove={(listing) => openModeration(listing, 'approve')}
        onRequestChanges={(listing) => openModeration(listing, 'unapprove')}
      />
      <ModerationConfirmDialog
        state={moderationDialog}
        note={moderationNote}
        isThai={isThai}
        moderating={moderating}
        onNoteChange={setModerationNote}
        onClose={() => !moderating && setModerationDialog(null)}
        onConfirm={() => void confirmModeration()}
      />
    </div>
  )
}

const ReviewCard = ({ listing, isThai, onDetail, onApprove, onRequestChanges }: {
  listing: AdminReviewListing
  isThai: boolean
  onDetail: () => void
  onApprove: () => void
  onRequestChanges: () => void
}) => (
  <article className="grid gap-4 p-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[12rem_minmax(0,1fr)_auto]">
    <div className="h-40 overflow-hidden rounded-2xl bg-neutral-100 sm:h-36 dark:bg-neutral-800">
      <ReviewImage url={listing.primary_image_url} />
    </div>
    <div className="min-w-0 py-1">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={listing.moderation_status} isThai={isThai} />
        <span className="font-sarabun text-xs text-neutral-400">
          {formatDate(listing.moderation_submitted_at || listing.updated_at, isThai)}
        </span>
      </div>
      <h2 className="mt-2 line-clamp-2 font-sarabun text-lg font-semibold text-neutral-950 dark:text-white">{listing.title}</h2>
      <p className="mt-1 line-clamp-1 font-sarabun text-sm text-neutral-500">{listing.address || (isThai ? 'ยังไม่ระบุที่อยู่' : 'No address')}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-sarabun text-xs text-neutral-500">
        <span>{isThai ? listing.property_type_name_th : listing.property_type_name_en}</span>
        <span>{formatPrice(listing.price, listing.currency, isThai)}</span>
        <span className="inline-flex items-center gap-1"><PhotoIcon className="size-4" />{listing.image_count}</span>
        <span className="inline-flex items-center gap-1"><VideoCameraIcon className="size-4" />{listing.video_count + listing.panorama_count}</span>
      </div>
      <p className="mt-2 truncate font-sarabun text-xs text-neutral-400">{listing.owner_name || listing.owner_email} · {listing.owner_email}</p>
    </div>
    <div className="flex flex-wrap items-end gap-2 sm:col-start-2 lg:col-start-auto lg:flex-col lg:justify-center">
      <button type="button" onClick={onDetail} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 px-4 font-sarabun text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
        <EyeIcon className="size-4" />{isThai ? 'ตรวจรายละเอียด' : 'Review details'}
      </button>
      {listing.moderation_status !== 'approved' ? (
        <button type="button" onClick={onApprove} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#124e3c] px-4 font-sarabun text-sm font-semibold text-white">
          <CheckCircleIcon className="size-4" />{isThai ? 'อนุมัติ' : 'Approve'}
        </button>
      ) : null}
      {listing.moderation_status !== 'rejected' ? (
        <button type="button" onClick={onRequestChanges} className="h-9 px-3 font-sarabun text-xs font-semibold text-red-600 hover:text-red-700">
          {isThai ? 'ไม่อนุมัติและซ่อน' : 'Unapprove and hide'}
        </button>
      ) : null}
    </div>
  </article>
)

const ReviewDetailDialog = ({ listing, loading, isThai, onClose, onApprove, onRequestChanges }: {
  listing: AdminReviewListing | null
  loading: boolean
  isThai: boolean
  onClose: () => void
  onApprove: (listing: AdminReviewListing) => void
  onRequestChanges: (listing: AdminReviewListing) => void
}) => (
  <Dialog open={Boolean(listing)} onClose={onClose} className="relative z-[100]">
    <DialogBackdrop className="fixed inset-0 bg-neutral-950/50 backdrop-blur-[1px]" />
    <div className="fixed inset-0 overflow-y-auto p-2 sm:p-5">
      <div className="flex min-h-full items-end justify-center sm:items-center">
        <DialogPanel className="max-h-[94dvh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl dark:bg-neutral-900">
          {listing ? (
            <>
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
                <div className="min-w-0">
                  <DialogTitle className="truncate font-sarabun text-xl font-semibold text-neutral-950 dark:text-white">{listing.title}</DialogTitle>
                  <p className="mt-1 font-sarabun text-xs text-neutral-500">{isThai ? 'ตรวจข้อมูลและสื่อของประกาศ' : 'Review listing information and media'}</p>
                </div>
                <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800"><XMarkIcon className="size-5" /></button>
              </div>

              {loading ? <CenteredLoading label={isThai ? 'กำลังโหลดรายละเอียด…' : 'Loading details…'} /> : (
                <div className="grid gap-7 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] sm:p-7">
                  <div className="min-w-0">
                    <MediaGallery listing={listing} isThai={isThai} />
                    <section className="mt-7">
                      <h3 className="font-sarabun text-base font-semibold">{isThai ? 'รายละเอียดประกาศ' : 'Listing description'}</h3>
                      <p className="mt-2 whitespace-pre-wrap font-sarabun text-sm leading-7 text-neutral-600 dark:text-neutral-300">{listing.description || '-'}</p>
                    </section>
                    <section className="mt-7 grid gap-3 sm:grid-cols-2">
                      <InfoBox icon={<MapPinIcon className="size-5" />} label={isThai ? 'ที่อยู่' : 'Address'} value={listing.address || '-'} />
                      <InfoBox icon={<UserCircleIcon className="size-5" />} label={isThai ? 'ผู้ลงประกาศ' : 'Owner'} value={`${listing.owner_name || '-'}\n${listing.owner_email}`} />
                    </section>
                  </div>

                  <aside className="space-y-4">
                    <section className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/70">
                      <StatusPill status={listing.moderation_status} isThai={isThai} />
                      <dl className="mt-4 space-y-3 font-sarabun text-sm">
                        <DetailRow label={isThai ? 'ประเภท' : 'Type'} value={isThai ? listing.property_type_name_th : listing.property_type_name_en} />
                        <DetailRow label={isThai ? 'ราคา' : 'Price'} value={formatPrice(listing.price, listing.currency, isThai)} />
                        <DetailRow label={isThai ? 'พื้นที่ใช้สอย' : 'Usable area'} value={listing.usable_area_sqm ? `${listing.usable_area_sqm} ตร.ม.` : '-'} />
                        <DetailRow label={isThai ? 'ขนาดที่ดิน' : 'Land area'} value={listing.land_area_sqm ? `${listing.land_area_sqm} ตร.ม.` : '-'} />
                        <DetailRow label={isThai ? 'ห้องนอน / ห้องน้ำ' : 'Beds / Baths'} value={`${listing.bedroom_count ?? '-'} / ${listing.bathroom_count ?? '-'}`} />
                      </dl>
                    </section>
                    <section className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                      <h3 className="font-sarabun text-sm font-semibold">{isThai ? 'ช่องทางติดต่อ' : 'Contact'}</h3>
                      <p className="mt-2 whitespace-pre-line font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">{[listing.contact_name, listing.contact_phone, listing.contact_email].filter(Boolean).join('\n') || '-'}</p>
                    </section>
                    {listing.moderation_note ? <p className="rounded-2xl bg-red-50 p-4 font-sarabun text-sm text-red-700 dark:bg-red-950/25 dark:text-red-300">{listing.moderation_note}</p> : null}
                  </aside>
                </div>
              )}

              {!loading ? (
                <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-neutral-100 bg-white/95 p-4 backdrop-blur sm:flex-row sm:justify-end dark:border-neutral-800 dark:bg-neutral-900/95">
                  {listing.moderation_status !== 'rejected' ? <button type="button" onClick={() => onRequestChanges(listing)} className="h-11 rounded-full border border-red-200 px-5 font-sarabun text-sm font-semibold text-red-600">{isThai ? 'ไม่อนุมัติและซ่อน' : 'Unapprove and hide'}</button> : null}
                  {listing.moderation_status !== 'approved' ? <button type="button" onClick={() => onApprove(listing)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#124e3c] px-6 font-sarabun text-sm font-semibold text-white"><CheckCircleIcon className="size-5" />{isThai ? 'อนุมัติและเผยแพร่' : 'Approve and publish'}</button> : null}
                </div>
              ) : null}
            </>
          ) : null}
        </DialogPanel>
      </div>
    </div>
  </Dialog>
)

const ModerationConfirmDialog = ({ state, note, isThai, moderating, onNoteChange, onClose, onConfirm }: {
  state: ModerationDialogState | null
  note: string
  isThai: boolean
  moderating: boolean
  onNoteChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) => {
  const approving = state?.action === 'approve'
  return (
    <Dialog open={Boolean(state)} onClose={onClose} className="relative z-[120]">
      <DialogBackdrop className="fixed inset-0 bg-neutral-950/50 backdrop-blur-[1px]" />
      <div className="fixed inset-0 overflow-y-auto p-4"><div className="flex min-h-full items-center justify-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:p-7">
          <span className={`grid size-11 place-items-center rounded-full ${approving ? 'bg-emerald-50 text-[#176b50]' : 'bg-red-50 text-red-600'}`}>
            {approving ? <CheckCircleIcon className="size-6" /> : <ExclamationTriangleIcon className="size-6" />}
          </span>
          <DialogTitle className="mt-5 font-sarabun text-xl font-semibold text-neutral-950 dark:text-white">
            {approving ? (isThai ? 'อนุมัติและเผยแพร่ประกาศ?' : 'Approve and publish?') : (isThai ? 'ไม่อนุมัติและซ่อนประกาศ?' : 'Unapprove and hide this listing?')}
          </DialogTitle>
          <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">{state?.listing.title}</p>
          {approving ? (
            <p className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3 font-sarabun text-xs leading-5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {isThai ? 'ประกาศจะเผยแพร่ทันที และระบบจะส่งข้อความแจ้งเจ้าของประกาศใน Notification' : 'The listing will go live immediately and the owner will receive a notification.'}
            </p>
          ) : (
            <label className="mt-4 block">
              <span className="font-sarabun text-sm font-semibold">{isThai ? 'เหตุผลที่ไม่อนุมัติ *' : 'Reason for unapproval *'}</span>
              <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} maxLength={1000} rows={4} placeholder={isThai ? 'เช่น ข้อมูลไม่ถูกต้อง รูปไม่เกี่ยวข้อง หรือควรแก้ไขส่วนใด' : 'For example: incorrect information, unrelated media, or required changes'} className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-3 font-sarabun text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-neutral-700 dark:bg-neutral-800" />
            </label>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={moderating} className="h-11 rounded-full border border-neutral-200 px-5 font-sarabun text-sm font-semibold dark:border-neutral-700">{isThai ? 'ยกเลิก' : 'Cancel'}</button>
            <button type="button" onClick={onConfirm} disabled={moderating || (!approving && !note.trim())} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 font-sarabun text-sm font-semibold text-white disabled:opacity-50 ${approving ? 'bg-[#124e3c]' : 'bg-red-600'}`}>
              {moderating ? <ArrowPathIcon className="size-4 animate-spin" /> : null}
              {moderating ? (isThai ? 'กำลังบันทึก…' : 'Saving…') : approving ? (isThai ? 'ยืนยันอนุมัติ' : 'Confirm approval') : (isThai ? 'ยืนยันไม่อนุมัติ' : 'Confirm unapproval')}
            </button>
          </div>
        </DialogPanel>
      </div></div>
    </Dialog>
  )
}

const MediaGallery = ({ listing, isThai }: { listing: AdminReviewListing; isThai: boolean }) => {
  const media = listing.media || []
  if (media.length === 0) return <div className="grid h-64 place-items-center rounded-2xl bg-neutral-100 dark:bg-neutral-800"><ListingImageFallback /></div>
  return (
    <section>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {media.slice(0, 8).map((item, index) => (
          <div key={item.id} className={`overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 ${index === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'}`}>
            {item.media_type === 'video' ? <video src={getListingMediaUrl(item.url)} controls preload="metadata" className="h-full w-full object-cover" /> : <ReviewImage url={item.url} />}
          </div>
        ))}
      </div>
      <p className="mt-2 font-sarabun text-xs text-neutral-400">{isThai ? `สื่อทั้งหมด ${media.length} ไฟล์` : `${media.length} media files`}</p>
    </section>
  )
}

const ReviewImage = ({ url }: { url: string }) => {
  const resolved = getListingMediaUrl(url)
  const [failedURL, setFailedURL] = useState('')
  return resolved && failedURL !== resolved ? (
    <img src={resolved} alt="" className="h-full w-full object-cover" onError={() => setFailedURL(resolved)} />
  ) : (
    <ListingImageFallback />
  )
}

const StatusPill = ({ status, isThai }: { status: AdminListingReviewStatus; isThai: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sarabun text-xs font-semibold ${status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : status === 'rejected' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'}`}>
    {status === 'pending' ? <ClockIcon className="size-3.5" /> : status === 'approved' ? <CheckCircleIcon className="size-3.5" /> : <ExclamationTriangleIcon className="size-3.5" />}
    {reviewStatusLabel(status, isThai)}
  </span>
)

const InfoBox = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => <div className="flex gap-3 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/70"><span className="text-neutral-400">{icon}</span><div><p className="font-sarabun text-xs text-neutral-400">{label}</p><p className="mt-1 whitespace-pre-line font-sarabun text-sm text-neutral-700 dark:text-neutral-200">{value}</p></div></div>
const DetailRow = ({ label, value }: { label: string; value: string }) => <div className="flex justify-between gap-4"><dt className="text-neutral-500">{label}</dt><dd className="text-end font-semibold text-neutral-800 dark:text-neutral-100">{value}</dd></div>
const CenteredLoading = ({ label }: { label: string }) => <div className="py-20 text-center font-sarabun text-sm text-neutral-500"><ArrowPathIcon className="mx-auto mb-3 size-6 animate-spin" />{label}</div>
const reviewStatusLabel = (status: AdminListingReviewStatus, isThai: boolean) => status === 'approved' ? (isThai ? 'เผยแพร่แล้ว' : 'Published') : status === 'rejected' ? (isThai ? 'ไม่อนุมัติ / ซ่อนแล้ว' : 'Unapproved / hidden') : (isThai ? 'รอตรวจสอบ (เดิม)' : 'Legacy pending')
const formatPrice = (price: number | undefined, currency: string, isThai: boolean) => typeof price === 'number' ? `${new Intl.NumberFormat(isThai ? 'th-TH' : 'en-US', { maximumFractionDigits: 0 }).format(price)} ${currency || 'THB'}` : (isThai ? 'ไม่ระบุราคา' : 'Price not specified')
const formatDate = (value: string, isThai: boolean) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date) }

export default AdminListingModeration
