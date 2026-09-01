'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Building2, CreditCard, FileClock, Heart, ShieldCheck, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const navigation = [
  {
    titleTh: 'ข้อมูลส่วนตัว',
    titleEn: 'Personal details',
    href: '/account',
    icon: UserRound,
  },
  {
    titleTh: 'ทรัพย์ของฉัน',
    titleEn: 'My properties',
    href: '/account-listings',
    icon: Building2,
  },
  {
    titleTh: 'ร่างประกาศ',
    titleEn: 'Listing draft',
    href: '/account-drafts',
    icon: FileClock,
  },
  {
    titleTh: 'ที่บันทึกไว้',
    titleEn: 'Saved',
    href: '/account-savelists',
    icon: Heart,
  },
  {
    titleTh: 'ความปลอดภัย',
    titleEn: 'Security',
    href: '/account-password',
    icon: ShieldCheck,
  },
  {
    titleTh: 'แพ็กเกจและบิล',
    titleEn: 'Plan & billing',
    href: '/account-billing',
    icon: CreditCard,
  },
]

export const PageNavigation = () => {
  const pathname = usePathname()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const activeMobileItemRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    activeMobileItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [pathname])

  return (
    <div className="container">
      <nav
        aria-label={isThai ? 'เมนูบัญชี' : 'Account navigation'}
        className="hidden grid-cols-3 gap-1.5 rounded-[24px] bg-neutral-100 p-1.5 ring-1 ring-neutral-200/80 min-[744px]:grid xl:grid-cols-6 dark:bg-neutral-800/80 dark:ring-neutral-700"
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const label = isThai ? item.titleTh : item.titleEn
          return (
            <Link
              key={`desktop-${item.href}`}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex min-h-16 min-w-0 items-center gap-3 rounded-[18px] px-3 py-2.5 transition-all duration-200 focus-visible:ring-3 focus-visible:ring-[#176b50]/25 focus-visible:outline-hidden ${
                isActive
                  ? 'bg-white text-[#124e3c] shadow-[0_5px_18px_rgba(15,61,47,0.09)] ring-1 ring-[#176b50]/10 dark:bg-neutral-900 dark:text-emerald-300 dark:ring-emerald-700/30'
                  : 'text-neutral-600 hover:bg-white/70 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900/60 dark:hover:text-white'
              }`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#124e3c] text-white shadow-sm dark:bg-emerald-700'
                    : 'bg-white text-neutral-500 ring-1 ring-neutral-200 group-hover:text-[#176b50] dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700'
                }`}
              >
                <item.icon className="size-[18px]" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 text-sm leading-5 font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      <nav
        aria-label={isThai ? 'เมนูบัญชี' : 'Account navigation'}
        className="-mx-4 hidden-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 py-1 min-[744px]:hidden"
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const label = isThai ? item.titleTh : item.titleEn
          return (
            <Link
              key={`mobile-${item.href}`}
              ref={isActive ? activeMobileItemRef : undefined}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 snap-center items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition focus-visible:ring-3 focus-visible:ring-[#176b50]/25 focus-visible:outline-hidden ${
                isActive
                  ? 'border-[#124e3c] bg-[#124e3c] text-white shadow-[0_5px_16px_rgba(18,78,60,0.22)] dark:border-emerald-700 dark:bg-emerald-700'
                  : 'border-neutral-200 bg-white text-neutral-600 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
              }`}
            >
              <item.icon className="size-[17px]" strokeWidth={1.9} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
