'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertySearchOmnibox from './PropertySearchOmnibox'

export type PropertySiteMode = 'all' | 'homes' | 'rooms' | 'business'

const PropertyHomeSearch = ({ mode = 'homes' }: { mode?: PropertySiteMode }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const placeholder = {
    all: isThai ? 'ลองค้นหา “คอนโดอารีย์” หรือ “โกดังบางนา”' : 'Try “condo in Ari” or “warehouse Bang Na”',
    homes: isThai ? 'ลองค้นหา “คอนโดอารีย์” หรือ “บ้านเชียงใหม่”' : 'Try “condo in Ari” or “house in Chiang Mai”',
    rooms: isThai
      ? 'ลองค้นหา “ห้องเช่าอารีย์” หรือ “หอพักใกล้มหาวิทยาลัย”'
      : 'Try “room in Ari” or “dorm near university”',
    business: isThai ? 'ลองค้นหา “ล็อกตลาด” หรือ “โกดังบางนา”' : 'Try “market stall” or “warehouse Bang Na”',
  }[mode]
  const tone = mode === 'rooms' ? 'mint' : mode === 'business' ? 'commerce' : 'green'

  const buildQuery = (query: string) => {
    // Homes intentionally keeps both sale and rent results. Transaction is a filter,
    // not the user's first decision. Rooms is always a monthly-rental discovery mode.
    if (mode === 'rooms') return `${isThai ? 'ห้องเช่ารายเดือน' : 'monthly rental'} ${query}`
    if (mode === 'business') return `${isThai ? 'พื้นที่ทำธุรกิจ' : 'business space'} ${query}`
    return query
  }

  return <PropertySearchOmnibox variant="hero" tone={tone} placeholder={placeholder} buildQuery={buildQuery} />
}

export default PropertyHomeSearch
