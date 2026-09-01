'use client'

import ListingDraftAutosave from '@/components/add-listing/ListingDraftAutosave'
import ListingDraftCloudSync from '@/components/add-listing/ListingDraftCloudSync'
import {
  ListingFlowProgressProvider,
  useListingFlowProgress,
} from '@/components/add-listing/ListingFlowProgressContext'
import RequireAuth from '@/components/auth/RequireAuth'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { ArrowRightIcon, CheckIcon, ClockIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const steps = [
  { number: 1, labelTh: 'ประเภททรัพย์', labelEn: 'Property type' },
  { number: 2, labelTh: 'รายละเอียด', labelEn: 'Details' },
  { number: 3, labelTh: 'สื่อ ราคา และติดต่อ', labelEn: 'Media, price & contact' },
  { number: 4, labelTh: 'ตรวจและส่ง', labelEn: 'Review & submit' },
]

const getStepIndex = (pathname: string) => {
  const matchedStep = Number(pathname.match(/\d+$/)?.[0] || '1')
  return Math.min(Math.max(matchedStep, 1), steps.length)
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const index = getStepIndex(pathname)

  React.useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [pathname])

  const content = (
    <ListingFlowProgressProvider>
      <div className="relative isolate min-h-screen overflow-x-clip bg-[#fffaf6] dark:bg-neutral-950">
        <div className="relative mx-auto w-full max-w-[1440px] px-3 pt-4 pb-12 min-[744px]:px-8 min-[744px]:pb-28 sm:pt-10 lg:pb-32 xl:px-10">
          <div className="grid items-start gap-7 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:gap-10">
            <SellerGuide />

            <main className="min-w-0">
              <ProgressHeader pathname={pathname} />
              <div className="mt-3 flex w-full flex-col gap-y-4 leading-relaxed min-[744px]:mt-5 min-[744px]:gap-y-8 min-[744px]:rounded-[30px] min-[744px]:border min-[744px]:border-[#e1dcd3] min-[744px]:bg-white min-[744px]:p-8 min-[744px]:shadow-[0_30px_80px_-55px_rgba(45,37,27,0.38)] lg:p-10 dark:min-[744px]:border-neutral-800 dark:min-[744px]:bg-neutral-900">
                {children}
              </div>
              <ListingDraftAutosave step={index} />
              <Pagination pathname={pathname} />
            </main>
          </div>
        </div>
      </div>
    </ListingFlowProgressProvider>
  )

  return index === 1 ? (
    <ListingDraftCloudSync>{content}</ListingDraftCloudSync>
  ) : (
    <RequireAuth>
      <ListingDraftCloudSync>{content}</ListingDraftCloudSync>
    </RequireAuth>
  )
}

const ProgressHeader = ({ pathname }: { pathname: string }) => {
  const index = getStepIndex(pathname)
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#174c3d] via-[#123f32] to-[#0d3228] px-4 py-4 text-white shadow-[0_28px_72px_-42px_rgba(12,47,37,0.62)] ring-1 ring-black/5 min-[744px]:rounded-[30px] min-[744px]:px-7 min-[744px]:py-6">
      <div aria-hidden="true" className="absolute -top-24 -right-14 size-64 rounded-full border border-white/10" />
      <div aria-hidden="true" className="absolute -right-6 -bottom-28 size-56 rounded-full bg-orange-200/[0.06]" />

      <div className="relative flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-sarabun text-xs font-semibold tracking-[0.14em] text-orange-300 uppercase">
              {isThai ? 'ลงประกาศฟรี' : 'List for free'}
            </p>
            <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-sarabun text-[11px] text-white/80 ring-1 ring-white/10">
              {isThai ? 'บันทึกอัตโนมัติ · เก็บ 48 ชม.' : 'Autosaved · kept 48h'}
            </span>
          </div>
          <p className="mt-1.5 truncate font-sarabun text-[17px] font-semibold text-white min-[744px]:mt-2 min-[744px]:text-xl">
            {isThai ? `ขั้นที่ ${index} จาก ${steps.length}` : `Step ${index} of ${steps.length}`} ·{' '}
            {isThai ? steps[index - 1].labelTh : steps[index - 1].labelEn}
          </p>
        </div>
        <span className="font-sarabun text-sm font-medium text-white/70">
          {Math.round((index / steps.length) * 100)}%
        </span>
      </div>

      <div className="relative mt-3.5 h-1.5 overflow-hidden rounded-full bg-black/15 ring-1 ring-white/10 min-[744px]:mt-5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-[width] duration-500"
          style={{ width: `${(index / steps.length) * 100}%` }}
        />
      </div>

      <ol
        className="relative mt-3 grid grid-cols-4 gap-2 min-[744px]:mt-5"
        aria-label={isThai ? 'ขั้นตอนลงประกาศ' : 'Listing steps'}
      >
        {steps.map((step) => {
          const isComplete = step.number < index
          const isCurrent = step.number === index
          const label = isThai ? step.labelTh : step.labelEn
          const content = (
            <>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isComplete
                    ? 'bg-white text-[#123f32] group-hover:bg-orange-100 group-hover:text-orange-700'
                    : isCurrent
                      ? 'bg-orange-500 text-white ring-4 ring-orange-300/20'
                      : 'bg-white/10 text-white/55'
                }`}
              >
                {isComplete ? <CheckIcon className="size-4" /> : step.number}
              </span>
              <span
                className={`hidden truncate font-sarabun text-xs sm:block ${
                  isCurrent ? 'font-medium text-white' : isComplete ? 'text-white/80' : 'text-white/45'
                }`}
              >
                {label}
              </span>
            </>
          )

          return (
            <li key={step.number} className="min-w-0">
              {isComplete ? (
                <Link
                  href={`/add-listing/${step.number}`}
                  aria-label={
                    isThai ? `ย้อนกลับไปขั้นที่ ${step.number}: ${label}` : `Go back to step ${step.number}: ${label}`
                  }
                  className="group flex min-h-11 w-full items-center gap-2 rounded-xl px-1.5 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
                >
                  {content}
                </Link>
              ) : (
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-disabled={!isCurrent}
                  aria-label={label}
                  className="flex min-h-11 w-full items-center gap-2 px-1.5"
                >
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="relative mt-5 hidden grid-cols-3 gap-2 border-t border-white/10 pt-4 min-[744px]:grid xl:hidden">
        <TrustItem icon={<ClockIcon className="size-4" />} label={isThai ? 'ประมาณ 5–8 นาที' : 'About 5–8 minutes'} />
        <TrustItem
          icon={<ShieldCheckIcon className="size-4" />}
          label={isThai ? 'ตรวจสอบก่อนเผยแพร่' : 'Reviewed before publishing'}
        />
        <TrustItem icon={<SparklesIcon className="size-4" />} label={isThai ? 'แก้ไขภายหลังได้' : 'Edit anytime'} />
      </div>
    </div>
  )
}

const TrustItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <span className="flex min-w-0 flex-col items-center gap-1.5 text-center font-sarabun text-[10px] leading-4 text-white/65 min-[520px]:flex-row min-[520px]:justify-center min-[520px]:text-xs">
    <span className="text-orange-300">{icon}</span>
    <span>{label}</span>
  </span>
)

const SellerGuide = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const benefits = isThai
    ? ['ลงประกาศได้ฟรี', 'เพิ่มข้อมูลเฉพาะหมวดภายหลัง', 'ทีมงานตรวจสอบก่อนเผยแพร่']
    : ['List for free', 'Add category-specific details later', 'Reviewed before publishing']

  return (
    <aside className="hidden xl:sticky xl:top-28 xl:block">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#174c3d] via-[#123f32] to-[#0d3228] p-6 text-white shadow-[0_30px_74px_-44px_rgba(12,47,37,0.65)] ring-1 ring-black/5">
        <div aria-hidden="true" className="absolute -top-16 -right-16 size-40 rounded-full border border-white/10" />
        <span className="relative flex size-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/20">
          <SparklesIcon className="size-5" />
        </span>
        <p className="relative mt-5 font-sarabun text-xs font-semibold tracking-[0.12em] text-orange-300 uppercase">
          {isThai ? 'เริ่มจากข้อมูลที่มี' : 'Start with what you know'}
        </p>
        <h2 className="relative mt-2 font-sarabun text-2xl leading-tight font-semibold">
          {isThai ? (
            <>
              พื้นที่ของคุณ
              <br />
              อาจเป็นสิ่งที่ใครกำลังหา
            </>
          ) : (
            <>
              Your space could be
              <br />
              exactly what someone needs
            </>
          )}
        </h2>
        <ul className="relative mt-6 space-y-3 border-t border-white/10 pt-5">
          {benefits.map((item) => (
            <li key={item} className="flex items-center gap-2.5 font-sarabun text-sm text-white/85">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-300/10 text-orange-300 ring-1 ring-orange-200/10">
                <CheckIcon className="size-3.5" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}

const Pagination = ({ pathname }: { pathname: string }) => {
  const index = getStepIndex(pathname)
  const { locale } = usePreferences()
  const { mediaProgress } = useListingFlowProgress()
  const isThai = locale === 'th'
  const isMediaBusy = index === 3 && (mediaProgress.phase === 'uploading' || mediaProgress.phase === 'saving')

  if (index === steps.length) {
    return null
  }

  const backHref = `/add-listing/${index - 1}`

  return (
    <div
      className={`mt-6 grid items-center gap-2.5 min-[744px]:mt-8 min-[744px]:flex ${
        index === 1
          ? 'grid-cols-1 min-[744px]:justify-end'
          : 'grid-cols-[auto_minmax(0,1fr)] min-[744px]:justify-between'
      }`}
    >
      {index > 1 ? (
        isMediaBusy ? (
          <ButtonSecondary type="button" disabled className="h-12 px-5 min-[744px]:h-auto">
            {isThai ? 'ย้อนกลับ' : 'Back'}
          </ButtonSecondary>
        ) : (
          <ButtonSecondary type="button" href={backHref} className="h-12 px-5 min-[744px]:h-auto">
            {isThai ? 'ย้อนกลับ' : 'Back'}
          </ButtonSecondary>
        )
      ) : null}
      <ButtonPrimary
        type="submit"
        form="add-listing-form"
        disabled={isMediaBusy}
        aria-busy={isMediaBusy}
        className="h-12 w-full text-base font-semibold shadow-[0_12px_28px_-14px_rgba(18,63,50,0.75)] min-[744px]:h-auto min-[744px]:w-auto min-[744px]:min-w-52"
      >
        {index === 3 ? (
          <>
            {isMediaBusy ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white dark:border-neutral-400 dark:border-t-neutral-950" />
            ) : null}
            {mediaProgress.phase === 'uploading'
              ? isThai
                ? `กำลังอัปโหลด ${mediaProgress.completedCount}/${mediaProgress.totalCount}`
                : `Uploading ${mediaProgress.completedCount}/${mediaProgress.totalCount}`
              : mediaProgress.phase === 'saving'
                ? isThai
                  ? 'กำลังเปิดหน้าตรวจสอบ...'
                  : 'Opening review...'
                : mediaProgress.pendingCount
                  ? isThai
                    ? `อัปโหลด ${mediaProgress.pendingCount} ไฟล์และตรวจสอบ`
                    : `Upload ${mediaProgress.pendingCount} files & review`
                  : isThai
                    ? 'บันทึกและตรวจสอบประกาศ'
                    : 'Save & review listing'}
          </>
        ) : index === steps.length - 1 ? (
          isThai ? (
            'ตรวจสอบประกาศ'
          ) : (
            'Review listing'
          )
        ) : isThai ? (
          'ไปขั้นถัดไป'
        ) : (
          'Continue'
        )}
        {!isMediaBusy ? <ArrowRightIcon className="h-5 w-5 rtl:rotate-180" /> : null}
      </ButtonPrimary>
    </div>
  )
}

export default Layout
