'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  clearCloudListingDraft,
  clearListingDraft,
  getListingDraft,
  getListingDraftResumeStep,
  getListingDraftSummary,
  syncListingDraftAfterAuth,
  type ListingDraft,
} from '@/lib/listingDraft'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { ArrowRightIcon, ClockIcon, DocumentTextIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'

const ListingDraftAccountPanel = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    syncListingDraftAfterAuth()
      .catch(() => getListingDraft())
      .then((savedDraft) => {
        if (!cancelled) setDraft(Object.keys(savedDraft).length ? savedDraft : null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(() => (draft ? getListingDraftSummary(locale) : null), [draft, locale])
  const resumeStep = draft ? getListingDraftResumeStep(draft) : 1

  const deleteDraft = async () => {
    const confirmed = window.confirm(
      isThai
        ? 'ลบร่างประกาศนี้และไฟล์ที่ยังไม่ได้ส่งทั้งหมดใช่ไหม? การลบนี้ไม่สามารถย้อนกลับได้'
        : 'Delete this draft and all unsubmitted media? This cannot be undone.'
    )
    if (!confirmed) return

    setIsDeleting(true)
    setError('')
    try {
      await clearCloudListingDraft()
      clearListingDraft()
      setDraft(null)
    } catch {
      setError(isThai ? 'ยังลบร่างไม่ได้ กรุณาลองอีกครั้ง' : 'Unable to delete the draft. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="font-sarabun text-3xl font-semibold text-neutral-900 dark:text-white">
          {isThai ? 'ร่างประกาศ' : 'Listing draft'}
        </h1>
        <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {isThai
            ? 'กลับมากรอกประกาศที่ค้างไว้ได้ภายใน 48 ชั่วโมงหลังการบันทึกล่าสุด'
            : 'Continue an unfinished listing within 48 hours of the latest save.'}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-7 h-56 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-800" />
      ) : draft ? (
        <article className="mt-7 overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-[0_24px_65px_-48px_rgba(20,83,45,0.55)] dark:border-emerald-900/60 dark:bg-neutral-900">
          <div className="border-b border-emerald-100 bg-emerald-50/70 px-5 py-4 sm:px-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-sarabun text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                <span className="grid size-9 place-items-center rounded-xl bg-[#37a14f] text-white">
                  <DocumentTextIcon className="size-5" />
                </span>
                {isThai ? 'ร่างที่บันทึกไว้ 1 รายการ' : '1 saved draft'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-sarabun text-xs font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-neutral-900 dark:text-amber-200 dark:ring-amber-900">
                <ClockIcon className="size-4" />
                {formatExpiry(String(draft.draftExpiresAt || ''), isThai)}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="font-sarabun text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              {isThai ? `กรอกค้างไว้ที่ขั้นตอน ${resumeStep} จาก 4` : `Stopped at step ${resumeStep} of 4`}
            </p>
            <h2 className="mt-2 font-sarabun text-xl font-semibold text-neutral-900 dark:text-white">
              {summary?.propertyType || (isThai ? 'ประกาศอสังหาริมทรัพย์' : 'Property listing')}
            </h2>
            {summary?.discoveryChannel ? (
              <p className="mt-1 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
                {summary.discoveryChannel}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonPrimary href={`/add-listing/${resumeStep}`} className="h-11">
                {isThai ? 'กรอกประกาศต่อ' : 'Continue draft'}
                <ArrowRightIcon className="size-5" />
              </ButtonPrimary>
              <ButtonSecondary type="button" disabled={isDeleting} onClick={deleteDraft} className="h-11">
                <TrashIcon className="size-5" />
                {isDeleting ? (isThai ? 'กำลังลบ...' : 'Deleting...') : isThai ? 'ลบร่าง' : 'Delete draft'}
              </ButtonSecondary>
            </div>
          </div>
        </article>
      ) : (
        <div className="mt-7 rounded-[28px] border border-dashed border-neutral-300 bg-white px-5 py-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
            <DocumentTextIcon className="size-6" />
          </span>
          <h2 className="mt-4 font-sarabun text-lg font-semibold text-neutral-900 dark:text-white">
            {isThai ? 'ยังไม่มีร่างประกาศ' : 'No saved draft'}
          </h2>
          <p className="mt-2 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'เมื่อเริ่มกรอกประกาศ ระบบจะบันทึกร่างให้อัตโนมัติ'
              : 'Your work will be saved automatically when you start a listing.'}
          </p>
          <ButtonPrimary href="/add-listing/1?new=1" className="mt-5 h-11">
            <PlusIcon className="size-5" />
            {isThai ? 'เริ่มลงประกาศ' : 'Create listing'}
          </ButtonPrimary>
        </div>
      )}
    </div>
  )
}

const formatExpiry = (value: string, isThai: boolean) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return isThai ? 'เก็บไว้ 48 ชั่วโมง' : 'Kept for 48 hours'
  const formatted = new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return isThai ? `เก็บถึง ${formatted}` : `Saved until ${formatted}`
}

export default ListingDraftAccountPanel
