import type { PropertyTypeCode } from '@/data/propertyTaxonomy'
import type { PropertyDiscoveryChannel, PropertySearchListing, PropertySearchOptions } from './propertySearch'

export type PropertyLandingMode = PropertyDiscoveryChannel | 'all'
export type PropertyLandingRow = {
  id: string
  titleTh: string
  titleEn: string
  propertyTypes?: PropertyTypeCode[]
}
export type PropertyLandingRowData = PropertyLandingRow & { listings: PropertySearchListing[] }

export const LANDING_ROW_SIZE = 4

const houses: PropertyLandingRow = {
  id: 'houses',
  titleTh: 'บ้านและทาวน์โฮม',
  titleEn: 'Houses & townhomes',
  propertyTypes: ['detached_house', 'semi_detached_house', 'townhouse'],
}
const condos: PropertyLandingRow = { id: 'condos', titleTh: 'คอนโด', titleEn: 'Condos', propertyTypes: ['condo'] }
const land: PropertyLandingRow = { id: 'land', titleTh: 'ที่ดิน', titleEn: 'Land', propertyTypes: ['land'] }
const shophouses: PropertyLandingRow = {
  id: 'shophouses',
  titleTh: 'ตึกแถวและโฮมออฟฟิศ',
  titleEn: 'Shophouses & home offices',
  propertyTypes: ['shophouse', 'home_office'],
}

export function getPropertyLandingRows(mode: PropertyLandingMode): PropertyLandingRow[] {
  const latest: PropertyLandingRow = {
    id: 'latest',
    titleTh: mode === 'rooms' ? 'ห้องเช่ามาใหม่' : mode === 'business' ? 'พื้นที่ธุรกิจมาใหม่' : 'ประกาศมาใหม่',
    titleEn: mode === 'rooms' ? 'New room listings' : mode === 'business' ? 'New business spaces' : 'New listings',
  }
  if (mode === 'rooms')
    return [
      latest,
      { id: 'rental-rooms', titleTh: 'ห้องเช่า', titleEn: 'Rental rooms', propertyTypes: ['rental_room'] },
      {
        id: 'apartments',
        titleTh: 'อพาร์ตเมนต์',
        titleEn: 'Apartments',
        propertyTypes: ['apartment', 'serviced_apartment'],
      },
      { id: 'dormitories', titleTh: 'หอพัก', titleEn: 'Dormitories', propertyTypes: ['dormitory'] },
      { ...condos, titleTh: 'คอนโดให้เช่า', titleEn: 'Condos for rent' },
      { id: 'flats', titleTh: 'แฟลต', titleEn: 'Flats', propertyTypes: ['flat'] },
      { id: 'monthly-hotels', titleTh: 'โรงแรมรายเดือน', titleEn: 'Monthly hotels', propertyTypes: ['monthly_hotel'] },
    ]
  if (mode === 'business')
    return [
      latest,
      {
        id: 'retail',
        titleTh: 'พื้นที่ขายของและออกบูธ',
        titleEn: 'Retail spaces & event booths',
        propertyTypes: ['retail_space'],
      },
      { id: 'offices', titleTh: 'สำนักงาน', titleEn: 'Offices', propertyTypes: ['office'] },
      shophouses,
      {
        id: 'industrial',
        titleTh: 'โกดังและโรงงาน',
        titleEn: 'Warehouses & factories',
        propertyTypes: ['warehouse', 'factory'],
      },
      land,
      {
        id: 'hospitality',
        titleTh: 'อพาร์ตเมนต์และโรงแรมทั้งอาคาร',
        titleEn: 'Apartment buildings & hotels',
        propertyTypes: ['apartment', 'hotel_resort'],
      },
    ]
  return [latest, houses, condos, land, shophouses]
}

export function propertyLandingRowOptions(
  row: PropertyLandingRow,
  mode: PropertyLandingMode,
  offerType?: 'sale' | 'rent'
): PropertySearchOptions {
  return {
    discoveryChannel: mode === 'all' ? undefined : mode,
    propertyTypes: row.propertyTypes,
    offerTypes: offerType ? [offerType] : undefined,
    // Each category can lose up to four cards already shown in the newest row.
    limit: row.id === 'latest' ? LANDING_ROW_SIZE : LANDING_ROW_SIZE * 2,
  }
}

export function propertyLandingRowHref(
  row: PropertyLandingRow,
  mode: PropertyLandingMode,
  offerType?: 'sale' | 'rent'
) {
  const params = new URLSearchParams()
  if (mode !== 'all') params.set('channel', mode)
  if (offerType) params.set('offer_type', offerType)
  for (const type of row.propertyTypes || []) params.append('property_type', type)
  return `/properties/map${params.size ? `?${params}` : ''}`
}

// Keep a property in its first visible row only. Empty rows need no placeholder:
// they appear automatically as inventory grows, without repeating existing cards.
export function selectPropertyLandingRows(rows: PropertyLandingRowData[]): PropertyLandingRowData[] {
  const seen = new Set<number>()
  return rows.flatMap((row) => {
    const listings: PropertySearchListing[] = []
    for (const listing of row.listings) {
      if (seen.has(listing.id)) continue
      listings.push(listing)
      seen.add(listing.id)
      if (listings.length === LANDING_ROW_SIZE) break
    }
    return listings.length ? [{ ...row, listings }] : []
  })
}
