'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertySearchOmnibox from '@/components/property-home/PropertySearchOmnibox'
import {
  defaultHeaderOffers,
  getHeaderMapSearchUrl,
  toggleHeaderOffer,
  type HeaderOfferType,
} from '@/lib/propertyHeaderSearch'
import { getPropertyZoneFromPathname } from '@/lib/propertyZone'
import Logo from '@/shared/Logo'
import { House, KeyRound } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import AvatarDropdown from './AvatarDropdown'
import CurrLangDropdown from './CurrLangDropdown'
import NotifyDropdown from './NotifyDropdown'
import PropertyHeaderClassic from './PropertyHeaderClassic'
import styles from './PropertyHeaderContent.module.css'
import PropertyListingCta from './PropertyListingCta'
import PropertySiteSwitcher from './PropertySiteSwitcher'

const SearchFirstHeader = () => {
  const { locale, propertyZone } = usePreferences()
  const isThai = locale === 'th'
  const pathname = usePathname()
  const siteMode = getPropertyZoneFromPathname(pathname) ?? propertyZone
  const [offers, setOffers] = useState<HeaderOfferType[]>(() => [...defaultHeaderOffers])
  const searchTone = siteMode === 'rooms' ? 'mint' : siteMode === 'business' ? 'commerce' : 'green'

  return (
    <header className={styles.header} data-property-header-layout="search-first">
      <div className="container">
        <div className={styles.row}>
          <Logo href={`/${siteMode}`} className={styles.logo} />
          <div className={styles.category}>
            <PropertySiteSwitcher compact />
          </div>
          <div className={styles.searchCluster}>
            <div
              className={styles.offers}
              data-header-offers="home-and-key"
              data-selection={offers.length === 2 ? 'both' : offers[0]}
              role="group"
              aria-label={isThai ? 'ซื้อหรือเช่า เลือกได้ทั้งคู่' : 'Buy or rent, select either or both'}
            >
              <span className={styles.offerSelection} aria-hidden="true" />
              <span className={styles.offerDivider} aria-hidden="true" />
              {defaultHeaderOffers.map((offer) => {
                const selected = offers.includes(offer)
                return (
                  <button
                    key={offer}
                    type="button"
                    data-header-offer={offer}
                    aria-pressed={selected}
                    disabled={selected && offers.length === 1}
                    onClick={() => setOffers((previous) => toggleHeaderOffer(previous, offer))}
                  >
                    <span className={styles.offerIcon} aria-hidden="true">
                      {offer === 'sale' ? (
                        <House size={18} strokeWidth={1.8} />
                      ) : (
                        <KeyRound size={18} strokeWidth={1.8} />
                      )}
                    </span>
                    <span className={styles.offerLabel}>
                      {offer === 'sale' ? (isThai ? 'ซื้อ' : 'Buy') : isThai ? 'เช่า' : 'Rent'}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className={styles.searchField}>
              <PropertySearchOmnibox
                variant="header"
                tone={searchTone}
                placeholder={isThai ? 'ค้นหาทำเล โครงการ หรือสถานี' : 'Location, project or station'}
                buildSearchUrl={(query) => getHeaderMapSearchUrl(query, siteMode, offers)}
                allowEmptyQuery
                showTypeLabels
              />
            </div>
          </div>
          <div className={styles.actions}>
            <PropertyListingCta
              tone="bright"
              label={isThai ? 'ลงประกาศ' : 'List property'}
              freeLabel={isThai ? 'ฟรี' : 'Free'}
            />
            <div className={styles.utilities}>
              <NotifyDropdown />
              <AvatarDropdown />
              <CurrLangDropdown />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

const PropertyHeaderContent = ({ layout = 'search-first' }: { layout?: 'search-first' | 'classic' }) =>
  layout === 'classic' ? <PropertyHeaderClassic /> : <SearchFirstHeader />

export default PropertyHeaderContent
