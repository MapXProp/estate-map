'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Heart, Home, Map, Plus, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const channelHomePaths = ['/homes', '/rooms', '/business']

const MobilePrimaryNavigation = ({ prototype = false }: { prototype?: boolean }) => {
  const pathname = usePathname()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const isChannelHome = channelHomePaths.includes(pathname)

  if (!prototype && !isChannelHome) return null

  const navigationItems = [
    {
      labelTh: 'หน้าแรก',
      labelEn: 'Home',
      href: prototype ? '/homes2' : '/',
      icon: Home,
      active: prototype ? pathname === '/homes2' : isChannelHome,
    },
    {
      labelTh: 'แผนที่',
      labelEn: 'Map',
      href: '/properties/map',
      icon: Map,
      active: pathname === '/properties/map',
    },
    {
      labelTh: 'ลงประกาศ',
      labelEn: 'List',
      href: '/add-listing/1?new=1',
      icon: Plus,
      primary: true,
      active: pathname.startsWith('/add-listing'),
    },
    {
      labelTh: 'บันทึก',
      labelEn: 'Saved',
      href: '/account-savelists',
      icon: Heart,
      active: pathname === '/account-savelists',
    },
    {
      labelTh: 'บัญชี',
      labelEn: 'Account',
      href: '/account',
      icon: UserRound,
      active: pathname === '/account',
    },
  ]

  return (
    <>
      {!prototype ? (
        <div aria-hidden="true" className="h-[calc(66px+env(safe-area-inset-bottom))] min-[744px]:hidden" />
      ) : null}
      <nav
        aria-label={isThai ? 'เมนูหลัก' : 'Main navigation'}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl min-[744px]:hidden dark:border-neutral-800 dark:bg-neutral-950/95"
      >
        <div className="mx-auto grid h-[66px] max-w-md grid-cols-5 items-end px-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const label = isThai ? item.labelTh : item.labelEn

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={label}
                  className="group flex min-h-[66px] touch-manipulation flex-col items-center justify-end gap-0.5 pb-1.5 text-orange-600 focus-visible:outline-none"
                >
                  <span className="grid size-11 -translate-y-1 place-items-center rounded-full bg-orange-500 text-white shadow-[0_7px_18px_rgba(249,82,28,0.32)] ring-4 ring-white transition group-active:scale-95 dark:ring-neutral-950">
                    <Icon className="size-6" strokeWidth={2.2} />
                  </span>
                  <span className="-mt-1 text-[10px] leading-4 font-semibold">{label}</span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={`relative flex min-h-[58px] touch-manipulation flex-col items-center justify-center gap-0.5 rounded-2xl pb-1 text-[10px] leading-4 font-medium transition focus-visible:outline-none active:scale-95 ${
                  item.active ? 'text-[#176b50] dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <Icon className="size-[21px]" strokeWidth={item.active ? 2.25 : 1.8} />
                <span>{label}</span>
                {item.active ? (
                  <span className="absolute bottom-0 h-1 w-1 rounded-full bg-[#176b50] dark:bg-emerald-300" />
                ) : null}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default MobilePrimaryNavigation
