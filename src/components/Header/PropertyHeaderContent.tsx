'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getCurrencies, getLanguages } from '@/data/navigation'
import Logo from '@/shared/Logo'
import { Map } from 'lucide-react'
import Link from 'next/link'
import AvatarDropdown from './AvatarDropdown'
import CurrLangDropdown from './CurrLangDropdown'
import NotifyDropdown from './NotifyDropdown'
import PropertyListingCta from './PropertyListingCta'
import PropertyMegaMenu from './PropertyMegaMenu'

type Props = {
  currencies: Awaited<ReturnType<typeof getCurrencies>>
  languages: Awaited<ReturnType<typeof getLanguages>>
}

const offerLinks = [
  { label: 'ซื้อ', labelEn: 'Buy', value: 'sale' },
  { label: 'เช่า', labelEn: 'Rent', value: 'rent' },
  { label: 'เซ้ง', labelEn: 'Transfer', value: 'business_transfer' },
] as const

const PropertyHeaderContent = ({ currencies, languages }: Props) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  return (
    <header className="relative">
      <div className="container">
        <div className="flex h-20 items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex min-w-0 items-center gap-2 min-[900px]:gap-4">
            <Logo className="w-20 min-[1100px]:w-24" />
            <div className="hidden h-7 border-l border-neutral-200 min-[900px]:block dark:border-neutral-700" />
            <nav
              aria-label={isThai ? 'เมนูค้นหาอสังหาริมทรัพย์' : 'Property search navigation'}
              className="flex items-center gap-0.5"
            >
              {offerLinks.map((item) => (
                <Link
                  key={item.value}
                  href={`/real-estate-categories/all?offer_type=${item.value}`}
                  className="rounded-full px-2.5 py-2.5 text-sm font-semibold whitespace-nowrap text-neutral-700 transition hover:bg-neutral-100 hover:text-[#176b50] min-[1100px]:px-3.5 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-300"
                >
                  {isThai ? item.label : item.labelEn}
                </Link>
              ))}
              <PropertyMegaMenu />
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 min-[1100px]:gap-3">
            <Link
              href="/real-estate-categories-map/all"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-[#176b50] min-[1100px]:flex dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-300"
            >
              <Map className="size-4" />
              {isThai ? 'แผนที่' : 'Map'}
            </Link>
            <CurrLangDropdown currencies={currencies} languages={languages} className="hidden min-[900px]:block" />
            <PropertyListingCta
              label={isThai ? 'ลงประกาศ' : 'List property'}
              freeLabel={isThai ? 'ฟรี' : 'Free'}
            />
            <NotifyDropdown className="hidden min-[900px]:block" />
            <AvatarDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}

export default PropertyHeaderContent
