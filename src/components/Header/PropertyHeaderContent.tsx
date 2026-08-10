'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertySearchOmnibox from '@/components/property-home/PropertySearchOmnibox'
import Logo from '@/shared/Logo'
import { usePathname } from 'next/navigation'
import AvatarDropdown from './AvatarDropdown'
import NotifyDropdown from './NotifyDropdown'
import PropertyListingCta from './PropertyListingCta'
import PropertySiteSwitcher from './PropertySiteSwitcher'

const PropertyHeaderContent = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const pathname = usePathname()
  const siteMode =
    pathname.startsWith('/rooms') || pathname.startsWith('/rent')
      ? 'rooms'
      : pathname.startsWith('/business')
        ? 'business'
        : 'homes'
  const searchPlaceholder = {
    homes: isThai ? 'ค้นหาบ้าน คอนโด หรือทำเล' : 'Search homes, condos or locations',
    rooms: isThai ? 'ค้นหาห้องเช่า หอพัก หรือทำเล' : 'Search rooms, dorms or locations',
    business: isThai ? 'ค้นหาพื้นที่ทำธุรกิจ' : 'Search business spaces',
  }[siteMode]
  const searchTone = siteMode === 'rooms' ? 'mint' : siteMode === 'business' ? 'commerce' : 'green'
  const buildSearchQuery = (query: string) => {
    if (siteMode === 'rooms') return `${isThai ? 'ห้องเช่ารายเดือน' : 'monthly rental'} ${query}`
    if (siteMode === 'homes') return query
    return `${isThai ? 'พื้นที่ทำธุรกิจ' : 'business space'} ${query}`
  }

  return (
    <header className="relative">
      <div className="container">
        <div className="flex h-20 items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex min-w-0 flex-1 items-center gap-3 min-[900px]:gap-4">
            <Logo className="w-20 min-[1100px]:w-24" />
            <div className="hidden h-7 border-l border-neutral-200 min-[900px]:block dark:border-neutral-700" />
            <div className="max-w-xl min-w-[190px] flex-1 min-[900px]:min-w-[250px]">
              <PropertySearchOmnibox
                variant="header"
                tone={searchTone}
                placeholder={searchPlaceholder}
                buildQuery={buildSearchQuery}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 min-[1100px]:gap-3">
            <PropertySiteSwitcher />
            <PropertyListingCta label={isThai ? 'ลงประกาศ' : 'List property'} freeLabel={isThai ? 'ฟรี' : 'Free'} />
            <NotifyDropdown className="hidden min-[744px]:block" />
            <AvatarDropdown showPreferencesAction />
          </div>
        </div>
      </div>
    </header>
  )
}

export default PropertyHeaderContent
