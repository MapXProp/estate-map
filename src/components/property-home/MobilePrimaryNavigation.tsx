'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'
import { useAutoHideBottomNavigation } from '@/hooks/useAutoHideBottomNavigation'
import { browseHref, parseBrowseState } from '@/lib/propertyBrowse'
import { CATALOG_PATH } from '@/lib/propertyCatalog'
import { OPEN_MOBILE_PROPERTY_SEARCH_EVENT, usesMobilePrimaryNavigation } from '@/lib/propertyNavigation'
import { Heart, House, Map, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import styles from './MobilePrimaryNavigation.module.css'

export default function MobilePrimaryNavigation() {
  const pathname = usePathname()
  if (!usesMobilePrimaryNavigation(pathname)) return null
  // Each destination starts visible, including restored scroll positions.
  return <FloatingNavigation key={pathname} pathname={pathname} />
}

function FloatingNavigation({ pathname }: { pathname: string }) {
  const params = useSearchParams()
  const { locale, propertyZone } = usePreferences()
  const { savedCount, isReady } = useSavedListings()
  const { navRef, hidden, reveal } = useAutoHideBottomNavigation()
  const th = locale === 'th'
  const items = [
    {
      th: 'หน้าแรก',
      en: 'Home',
      href: '/' + propertyZone,
      icon: House,
      active: ['/homes', '/rooms', '/business'].includes(pathname),
    },
    {
      th: 'แผนที่',
      en: 'Map',
      href:
        pathname === CATALOG_PATH
          ? browseHref(parseBrowseState(new URLSearchParams(params.toString())), 1, true)
          : '/properties/map',
      icon: Map,
      active: false,
    },
    { th: 'ลงประกาศ', en: 'Post', href: '/add-listing/1?new=1', icon: Plus, active: false, post: true },
    {
      th: 'บันทึก',
      en: 'Saved',
      href: '/account-savelists',
      icon: Heart,
      active: pathname === '/account-savelists',
      saved: true,
    },
  ]
  return (
    <>
      <div aria-hidden="true" className={styles.spacer} />
      <nav
        ref={navRef}
        data-mobile-primary-nav
        data-hidden={hidden}
        aria-label={th ? 'เมนูหลัก' : 'Main navigation'}
        className={styles.dock}
        onFocusCapture={reveal}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={`${styles.item} ${item.active ? styles.active : ''} ${item.post ? styles.post : ''}`}
          >
            <span className={item.post ? styles.postIcon : styles.icon}>
              <item.icon
                size={item.post ? 29 : 23}
                strokeWidth={item.post ? 2.2 : item.active ? 2.1 : 1.8}
                aria-hidden="true"
              />
              {item.saved && isReady && savedCount > 0 ? (
                <span
                  aria-label={th ? savedCount + ' รายการที่บันทึก' : savedCount + ' saved listings'}
                  className={styles.badge}
                >
                  {savedCount > 99 ? '99+' : savedCount}
                </span>
              ) : null}
            </span>
            <span className={styles.label}>{th ? item.th : item.en}</span>
          </Link>
        ))}
        <button
          type="button"
          data-mobile-bottom-search
          aria-haspopup="dialog"
          onClick={() => window.dispatchEvent(new Event(OPEN_MOBILE_PROPERTY_SEARCH_EVENT))}
          className={styles.item}
        >
          <span className={styles.icon}>
            <Search size={23} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className={styles.label}>{th ? 'ค้นหา' : 'Search'}</span>
        </button>
      </nav>
    </>
  )
}
