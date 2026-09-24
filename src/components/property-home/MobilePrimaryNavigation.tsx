'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'
import { usesMobilePrimaryNavigation } from '@/lib/propertyNavigation'
import { Compass, Heart, LayoutGrid, Map } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobilePrimaryNavigation() {
  const pathname = usePathname()
  const { locale, propertyZone } = usePreferences()
  const { savedCount, isReady } = useSavedListings()
  const th = locale === 'th'
  if (!usesMobilePrimaryNavigation(pathname)) return null
  const items = [
    {
      th: 'สำรวจ',
      en: 'Explore',
      href: '/' + propertyZone,
      icon: Compass,
      active: ['/homes', '/rooms', '/business'].includes(pathname),
    },
    { th: 'แผนที่', en: 'Map', href: '/properties/map', icon: Map, active: pathname === '/properties/map' },
    {
      th: 'บันทึก',
      en: 'Saved',
      href: '/account-savelists',
      icon: Heart,
      active: pathname === '/account-savelists',
      saved: true,
    },
    {
      th: 'เมนู',
      en: 'Menu',
      href: '/account',
      icon: LayoutGrid,
      active: pathname.startsWith('/account') && pathname !== '/account-savelists',
    },
  ]
  return (
    <>
      <div aria-hidden="true" className="h-[calc(72px+env(safe-area-inset-bottom))] min-[744px]:hidden" />
      <nav
        data-mobile-primary-nav
        aria-label={th ? 'เมนูหลัก' : 'Main navigation'}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e0e8e3] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_24px_rgba(24,55,39,0.05)] backdrop-blur-xl min-[744px]:hidden dark:border-neutral-800 dark:bg-neutral-950/95"
      >
        <div className="mx-auto grid h-[72px] max-w-lg grid-cols-4 items-center gap-1 px-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={
                'group flex min-h-[60px] min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] leading-4 font-medium outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ' +
                (item.active ? 'text-[#176b50] dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400')
              }
            >
              <span
                className={
                  'relative grid h-8 w-14 place-items-center rounded-xl transition-colors group-active:scale-95 ' +
                  (item.active
                    ? 'bg-[#eaf4ee] dark:bg-emerald-950'
                    : 'group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800')
                }
              >
                <item.icon size={21} strokeWidth={item.active ? 2.1 : 1.7} aria-hidden="true" />
                {item.saved && isReady && savedCount > 0 ? (
                  <span
                    aria-label={th ? savedCount + ' รายการที่บันทึก' : savedCount + ' saved listings'}
                    className="absolute -top-0.5 right-0 min-w-4 rounded-full bg-[#176b50] px-1 text-center text-[9px] leading-4 font-semibold text-white"
                  >
                    {savedCount > 99 ? '99+' : savedCount}
                  </span>
                ) : null}
              </span>
              <span>{th ? item.th : item.en}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
