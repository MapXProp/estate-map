'use client'

import ListingDraftCloudSync from '@/components/add-listing/ListingDraftCloudSync'
import RequireAuth from '@/components/auth/RequireAuth'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline'
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
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-24 min-[744px]:px-8 sm:pt-12 lg:max-w-4xl lg:pb-32 xl:max-w-5xl 2xl:max-w-6xl">
      <ProgressHeader pathname={pathname} />
      <div className="mt-8 listingSection__wrap">{children}</div>
      <Pagination pathname={pathname} />
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
    <div className="rounded-[28px] border border-neutral-200 bg-white px-5 py-5 shadow-sm sm:px-7 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-sarabun text-xs font-semibold tracking-[0.16em] text-orange-600 uppercase">
            ลงประกาศอสังหา
          </p>
          <p className="mt-1 font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            ขั้นที่ {index} จาก {steps.length} · {steps[index - 1].label}
          </p>
        </div>
        <span className="font-sarabun text-sm text-neutral-400">{Math.round((index / steps.length) * 100)}%</span>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-[width] duration-500"
          style={{ width: `${(index / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="ขั้นตอนลงประกาศ">
        {steps.map((step) => {
          const isComplete = step.number < index
          const isCurrent = step.number === index

          return (
            <li key={step.number} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-orange-500 text-white ring-4 ring-orange-100 dark:ring-orange-950'
                        : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
                  }`}
                >
                  {isComplete ? <CheckIcon className="size-4" /> : step.number}
                </span>
                <span
                  className={`hidden truncate font-sarabun text-xs sm:block ${
                    isCurrent ? 'font-medium text-neutral-900 dark:text-neutral-100' : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const Pagination = ({ pathname }: { pathname: string }) => {
  const index = getStepIndex(pathname)

  if (index === steps.length) {
    return null
  }

  const backHref = index > 1 ? `/add-listing/${index - 1}` : '/'

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <ButtonSecondary type="button" href={backHref}>
        {index > 1 ? 'ย้อนกลับ' : 'กลับหน้าหลัก'}
      </ButtonSecondary>
      <ButtonPrimary type="submit" form="add-listing-form">
        {index === steps.length - 1 ? 'ตรวจสอบประกาศ' : 'ไปขั้นถัดไป'}
        <ArrowRightIcon className="h-5 w-5 rtl:rotate-180" />
      </ButtonPrimary>
    </div>
  )
}

export default Layout
