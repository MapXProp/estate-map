'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertySearchOmnibox from '@/components/property-home/PropertySearchOmnibox'
import {
  defaultHeaderOffers,
  getHeaderMapSearchUrl,
  getHeaderOffers,
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
  const rentalOnly = siteMode === 'rooms'
  const selectedOffers = getHeaderOffers(siteMode, offers)
  const searchTone = siteMode === 'rooms' ? 'mint' : siteMode === 'business' ? 'commerce' : 'green'

  return (
    <header className={styles.header} data-property-header-layout="search-first">
      <div className="container">
        <div className={styles.row}>
          <Logo href={`/${siteMode}`} className={styles.logo} />
          <div className={styles.category}>
            <PropertySiteSwitcher compact />
          </div>
          <div className={styles.searchCluster} data-search-channel={siteMode}>
            <PropertySearchOmnibox
              variant="header"
              tone={searchTone}
              placeholder={isThai ? 'ค้นหาทำเล โครงการ หรือสถานี' : 'Location, project or station'}
              buildSearchUrl={(query) => getHeaderMapSearchUrl(query, siteMode, offers)}
              allowEmptyQuery
              showTypeLabels
            >
              <div
                className={styles.offers}
                data-header-offers="home-and-key"
                data-selection={selectedOffers.length === 2 ? 'both' : selectedOffers[0]}
                data-offer-count={rentalOnly ? 1 : 2}
                role="group"
                aria-label={
                  rentalOnly
                    ? isThai
                      ? 'รูปแบบประกาศ'
                      : 'Listing type'
                    : isThai
                      ? 'เลือกซื้อหรือเช่า'
                      : 'Choose buy or rent'
                }
              >
                <span className={styles.offerSelection} aria-hidden="true" />
                {rentalOnly ? (
                  <span className={styles.fixedOffer} data-header-offer-fixed="rent">
                    <span className={styles.offerIcon} aria-hidden="true">
                      <KeyRound size={18} strokeWidth={1.8} />
                    </span>
                    <span className={styles.offerLabel}>{isThai ? 'เช่า' : 'Rent'}</span>
                  </span>
                ) : (
                  <>
                    <span className={styles.offerDivider} aria-hidden="true" />
                    {defaultHeaderOffers.map((offer) => {
                      const selected = selectedOffers.includes(offer)
                      return (
                        <button
                          key={offer}
                          type="button"
                          data-header-offer={offer}
                          aria-pressed={selected}
                          onClick={() => setOffers([offer])}
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
                  </>
                )}
              </div>
            </PropertySearchOmnibox>
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
