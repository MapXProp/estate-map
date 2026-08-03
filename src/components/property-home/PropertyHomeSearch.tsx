'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertySearchOmnibox from './PropertySearchOmnibox'

export type PropertySiteMode = 'all' | 'buy' | 'rent' | 'business'

const PropertyHomeSearch = ({ mode = 'buy' }: { mode?: PropertySiteMode }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const placeholder = {
    all: isThai ? 'ลองค้นหา “คอนโดอารีย์” หรือ “โกดังบางนา”' : 'Try “condo in Ari” or “warehouse Bang Na”',
    buy: isThai ? 'ลองค้นหา “บ้านเชียงใหม่” หรือ “คอนโดอารีย์”' : 'Try “house in Chiang Mai” or “condo in Ari”',
    rent: isThai
      ? 'ลองค้นหา “คอนโดเช่าอารีย์” หรือ “ห้องพักรายเดือน”'
      : 'Try “condo for rent in Ari” or “monthly room”',
    business: isThai ? 'ลองค้นหา “ล็อกตลาด” หรือ “โกดังบางนา”' : 'Try “market stall” or “warehouse Bang Na”',
  }[mode]
  const tone = mode === 'rent' ? 'mint' : mode === 'business' ? 'commerce' : 'green'

  const buildQuery = (query: string) => {
    if (mode === 'buy') return `${isThai ? 'ซื้อ' : 'buy'} ${query}`
    if (mode === 'rent') return `${isThai ? 'เช่า' : 'rent'} ${query}`
    if (mode === 'business') return `${isThai ? 'พื้นที่ทำธุรกิจ' : 'business space'} ${query}`
    return query
  }

  return <PropertySearchOmnibox variant="hero" tone={tone} placeholder={placeholder} buildQuery={buildQuery} />
}

export default PropertyHomeSearch
