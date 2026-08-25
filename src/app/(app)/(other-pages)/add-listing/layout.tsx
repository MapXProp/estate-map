'use client'

import ListingDraftCloudSync from '@/components/add-listing/ListingDraftCloudSync'
import RequireAuth from '@/components/auth/RequireAuth'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { ArrowRightIcon, CheckIcon, ClockIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'
import React from 'react'

const steps = [
  { number: 1, label: 'ประเภททรัพย์' },
  { number: 2, label: 'รายละเอียด' },
  { number: 3, label: 'รูปภาพและราคา' },
  { number: 4, label: 'ตรวจสอบ' },
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
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#fffaf6] dark:bg-neutral-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-orange-50 via-[#fffaf6] to-transparent dark:from-orange-950/15 dark:via-neutral-950"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-28 size-80 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-900/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-80 -left-40 size-96 rounded-full bg-emerald-100/45 blur-3xl dark:bg-emerald-950/15"
      />

      <div className="relative mx-auto w-full max-w-[1440px] px-2 pt-4 pb-28 min-[744px]:px-8 sm:pt-10 lg:pb-32 xl:px-10">
        <div className="grid items-start gap-7 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:gap-10">
          <SellerGuide />

          <main className="min-w-0">
            <ProgressHeader pathname={pathname} />
            <div className="mt-3 flex w-full flex-col gap-y-5 rounded-[22px] border border-orange-100/80 bg-white/95 p-2.5 leading-relaxed shadow-[0_28px_90px_-52px_rgba(74,44,20,0.45)] backdrop-blur-sm min-[744px]:mt-5 min-[744px]:gap-y-8 min-[744px]:rounded-[30px] min-[744px]:p-8 lg:p-10 dark:border-neutral-800 dark:bg-neutral-900/95">
              {children}
            </div>
            <Pagination pathname={pathname} />
          </main>
        </div>
      </div>
    </div>
  )

  return index === 1 ? (
    content
  ) : (
    <RequireAuth>
      <ListingDraftCloudSync>{content}</ListingDraftCloudSync>
    </RequireAuth>
  )
}

const ProgressHeader = ({ pathname }: { pathname: string }) => {
  const index = getStepIndex(pathname)

  return (
    <div className="relative overflow-hidden rounded-[30px] bg-[#123f32] px-5 py-5 text-white shadow-[0_26px_70px_-38px_rgba(18,63,50,0.75)] sm:px-7 sm:py-6">
      <div aria-hidden="true" className="absolute -top-24 -right-14 size-64 rounded-full border border-white/10" />
      <div aria-hidden="true" className="absolute -right-6 -bottom-28 size-56 rounded-full bg-white/5" />

      <div className="relative flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-sarabun text-xs font-semibold tracking-[0.14em] text-orange-300 uppercase">
              ลงประกาศฟรี
            </p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-sarabun text-[11px] text-white/75">
              บันทึกร่างอัตโนมัติ
            </span>
          </div>
          <p className="mt-2 truncate font-sarabun text-lg font-semibold text-white sm:text-xl">
            ขั้นที่ {index} จาก {steps.length} · {steps[index - 1].label}
          </p>
        </div>
        <span className="font-sarabun text-sm font-medium text-white/70">
          {Math.round((index / steps.length) * 100)}%
        </span>
      </div>

      <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-[width] duration-500"
          style={{ width: `${(index / steps.length) * 100}%` }}
        />
      </div>

      <ol className="relative mt-5 grid grid-cols-4 gap-2" aria-label="ขั้นตอนลงประกาศ">
        {steps.map((step) => {
          const isComplete = step.number < index
          const isCurrent = step.number === index

          return (
            <li key={step.number} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isComplete
                      ? 'bg-white text-[#123f32]'
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
                  {step.label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 xl:hidden">
        <TrustItem icon={<ClockIcon className="size-4" />} label="ประมาณ 5–8 นาที" />
        <TrustItem icon={<ShieldCheckIcon className="size-4" />} label="ตรวจสอบก่อนเผยแพร่" />
        <TrustItem icon={<SparklesIcon className="size-4" />} label="แก้ไขภายหลังได้" />
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

const SellerGuide = () => (
  <aside className="hidden xl:sticky xl:top-28 xl:block">
    <section className="relative overflow-hidden rounded-[30px] bg-[#123f32] p-6 text-white shadow-[0_28px_70px_-42px_rgba(18,63,50,0.8)]">
      <div aria-hidden="true" className="absolute -top-16 -right-16 size-40 rounded-full border border-white/10" />
      <span className="relative flex size-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/20">
        <SparklesIcon className="size-5" />
      </span>
      <p className="relative mt-5 font-sarabun text-xs font-semibold tracking-[0.12em] text-orange-300 uppercase">
        เริ่มจากข้อมูลที่มี
      </p>
      <h2 className="relative mt-2 font-sarabun text-2xl leading-tight font-semibold">
        พื้นที่ของคุณ
        <br />
        อาจเป็นสิ่งที่ใครกำลังหา
      </h2>
      <ul className="relative mt-6 space-y-3 border-t border-white/10 pt-5">
        {['ลงประกาศได้ฟรี', 'เพิ่มข้อมูลเฉพาะหมวดภายหลัง', 'ทีมงานตรวจสอบก่อนเผยแพร่'].map((item) => (
          <li key={item} className="flex items-center gap-2.5 font-sarabun text-sm text-white/85">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-orange-300">
              <CheckIcon className="size-3.5" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  </aside>
)

const Pagination = ({ pathname }: { pathname: string }) => {
  const index = getStepIndex(pathname)

  if (index === steps.length) {
    return null
  }

  const backHref = `/add-listing/${index - 1}`

  return (
    <div
      className={`sticky bottom-2 z-20 mt-5 grid items-center gap-2.5 rounded-[22px] border border-neutral-200/80 bg-white/95 p-2.5 shadow-[0_18px_50px_-26px_rgba(15,23,42,0.45)] backdrop-blur-xl min-[744px]:static min-[744px]:mt-8 min-[744px]:flex min-[744px]:border-0 min-[744px]:bg-transparent min-[744px]:p-0 min-[744px]:shadow-none dark:border-neutral-800 dark:bg-neutral-900/95 min-[744px]:dark:bg-transparent ${
        index === 1
          ? 'grid-cols-1 min-[744px]:justify-end'
          : 'grid-cols-[auto_minmax(0,1fr)] min-[744px]:justify-between'
      }`}
    >
      {index > 1 ? (
        <ButtonSecondary type="button" href={backHref} className="h-12 px-5 min-[744px]:h-auto">
          ย้อนกลับ
        </ButtonSecondary>
      ) : null}
      <ButtonPrimary
        type="submit"
        form="add-listing-form"
        className="h-12 w-full text-base font-semibold shadow-[0_12px_28px_-14px_rgba(18,63,50,0.75)] min-[744px]:h-auto min-[744px]:w-auto min-[744px]:min-w-52"
      >
        {index === steps.length - 1 ? 'ตรวจสอบประกาศ' : 'ไปขั้นถัดไป'}
        <ArrowRightIcon className="h-5 w-5 rtl:rotate-180" />
      </ButtonPrimary>
    </div>
  )
}

export default Layout
