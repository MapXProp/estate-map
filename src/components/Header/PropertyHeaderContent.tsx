'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertySearchOmnibox from '@/components/property-home/PropertySearchOmnibox'
import { getCurrencies, getLanguages } from '@/data/navigation'
import Logo from '@/shared/Logo'
import AvatarDropdown from './AvatarDropdown'
import CurrLangDropdown from './CurrLangDropdown'
import NotifyDropdown from './NotifyDropdown'
import PropertyListingCta from './PropertyListingCta'

type Props = {
  currencies: Awaited<ReturnType<typeof getCurrencies>>
  languages: Awaited<ReturnType<typeof getLanguages>>
}

const PropertyHeaderContent = ({ currencies, languages }: Props) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  return (
    <header className="relative">
      <div className="container">
        <div className="flex h-20 items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex min-w-0 flex-1 items-center gap-3 min-[900px]:gap-4">
            <Logo className="w-20 min-[1100px]:w-24" />
            <div className="hidden h-7 border-l border-neutral-200 min-[900px]:block dark:border-neutral-700" />
            <div className="max-w-xl min-w-[190px] flex-1 min-[900px]:min-w-[250px]">
              <PropertySearchOmnibox variant="header" />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 min-[1100px]:gap-3">
            <CurrLangDropdown currencies={currencies} languages={languages} className="hidden min-[744px]:block" />
            <PropertyListingCta label={isThai ? 'ลงประกาศ' : 'List property'} freeLabel={isThai ? 'ฟรี' : 'Free'} />
            <NotifyDropdown className="hidden min-[744px]:block" />
            <AvatarDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}

export default PropertyHeaderContent
