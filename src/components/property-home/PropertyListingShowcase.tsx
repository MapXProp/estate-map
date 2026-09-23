'use client'

import ListingImageFallback from '@/components/ListingImageFallback'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyPrices from '@/components/PropertyPrices'
import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'
import { getPropertyType, normalizeLegacyPropertyType } from '@/data/propertyTaxonomy'
import {
  getPropertyLandingRows,
  propertyLandingRowHref,
  propertyLandingRowOptions,
  selectPropertyLandingRows,
  type PropertyLandingMode,
  type PropertyLandingRowData,
} from '@/lib/propertyLandingRows'
import { filterPropertyPrices, getPropertyPrices, propertyOffersLabel, type PropertyPrice } from '@/lib/propertyPrices'
import { fetchPropertySearch, type PropertySearchListing } from '@/lib/propertySearch'
import { ArrowRight, CheckCircle2, Heart, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ListingGroup = 'residential' | 'rooms' | 'mixed_use' | 'commercial' | 'land'

export type PrototypeListing = {
  prices?: PropertyPrice[]
  id: number
  identifier?: string
  group: ListingGroup
  type: string
  offer: string
  title: string
  location: string
  facts: string[]
  price: string
  priceAmount?: number
  priceCurrency?: string
  unit?: string
  image: string
  href?: string
  badge?: string
  verified?: boolean
  verificationLabel?: string
  priceLabel?: string
  imagePosition?: 'center' | 'top'
}

const DeferredListingImage = ({
  alt,
  eager,
  position = 'center',
  src,
}: {
  alt: string
  eager: boolean
  position?: 'center' | 'top'
  src: string
}) => {
  const [failedSrc, setFailedSrc] = useState('')
  const hasError = Boolean(src && failedSrc === src)

  return (
    <div className="absolute inset-0">
      {!src || hasError ? (
        <ListingImageFallback />
      ) : (
        <Image
          fill
          src={src}
          alt={alt}
          sizes="(max-width: 402px) 82vw, (max-width: 640px) 330px, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'low'}
          preload={eager}
          onError={() => setFailedSrc(src)}
          className={`object-cover transition duration-500 group-hover:scale-[1.035] ${
            position === 'top' ? 'object-top' : 'object-center'
          }`}
        />
      )}
    </div>
  )
}

// Historical visual references only. They are deliberately not rendered on
// public pages; live cards below come from the published-listings API.
export const archivedPrototypeListings: PrototypeListing[] = [
  {
    id: 11,
    group: 'land',
    type: 'ที่ดินเปล่า · 2 แปลงติดกัน',
    offer: 'ขาย',
    title: 'ที่ดิน 700 ตร.ว. สุทธิสาร หน้ากว้างติดถนน 87 ม.',
    location: 'ซอยจัดสรร ถนนสุทธิสารวินิจฉัย, กรุงเทพฯ',
    facts: ['700 ตร.ว.', '2 แปลง', 'หน้ากว้างรวม 87 ม.'],
    price: '315,000,000',
    unit: 'บาท',
    image: '/listing-media/mapxprop/sutthisan-700-sq-wah/01-cover.webp',
    href: '/real-estate-listings/land-for-sale-sutthisan-700-sq-wah',
    badge: 'เจ้าของลงเอง',
    verified: true,
    verificationLabel: 'ผู้ติดต่อเชื่อถือได้',
  },
  {
    id: 9,
    group: 'commercial',
    type: 'พื้นที่ออกบูธ · กลุ่มออฟฟิศ',
    offer: 'ติดต่อผู้จัดงาน',
    title: 'Food O’Clock — THE EMPIRE TOWER',
    location: 'ชั้น M, THE EMPIRE TOWER, สาทร',
    facts: ['5 รอบ', '31 ส.ค.–2 ต.ค. 2569', 'อาหารและไลฟ์สไตล์'],
    price: '0',
    priceLabel: 'สอบถามราคากับผู้จัด',
    image: '/listing-media/hbd/food-o-clock-empire-tower-2026.jpg',
    href: '/real-estate-listings/food-o-clock-the-empire-tower-2026',
    badge: 'พื้นที่ออกบูธ',
    verified: true,
    verificationLabel: 'ตรวจสอบผู้จัดแล้ว',
    imagePosition: 'top',
  },
  {
    id: 10,
    group: 'commercial',
    type: 'พื้นที่ออกบูธ · ศูนย์การค้า',
    offer: 'ติดต่อผู้จัดงาน',
    title: 'LOCAL FAVORITES — EMSPHERE',
    location: 'EM MARKET HALL ชั้น G, EMSPHERE',
    facts: ['11–22 ก.ย. 2569', 'อาหารและเครื่องดื่ม', 'คนเดินห้างและต่างชาติ'],
    price: '0',
    priceLabel: 'สอบถามราคากับผู้จัด',
    image: '/listing-media/hbd/local-favorites-emsphere-2026.jpg',
    href: '/real-estate-listings/local-favorites-emsphere-2026',
    badge: 'พื้นที่ออกบูธ',
    verified: true,
    verificationLabel: 'ตรวจสอบผู้จัดแล้ว',
    imagePosition: 'top',
  },
  {
    id: 1,
    group: 'residential',
    type: 'บ้านเดี่ยว',
    offer: 'ขาย',
    title: 'บ้านโมเดิร์น พร้อมสวนส่วนตัว ใกล้เมือง',
    location: 'สันทราย, เชียงใหม่',
    facts: ['3 ห้องนอน', '2 ห้องน้ำ', '60 ตร.ว.'],
    price: '5,500,000',
    unit: 'บาท',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=85&w=1400&auto=format&fit=crop',
    badge: 'เจ้าของลงเอง',
    verified: true,
  },
  {
    id: 2,
    group: 'residential',
    type: 'คอนโด',
    offer: 'เช่า',
    title: 'คอนโดแต่งครบ เดิน 4 นาทีถึง BTS อารีย์',
    location: 'พญาไท, กรุงเทพมหานคร',
    facts: ['1 ห้องนอน', '1 ห้องน้ำ', '38 ตร.ม.'],
    price: '18,000',
    unit: 'บาท/เดือน',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=85&w=1400&auto=format&fit=crop',
    badge: 'ใหม่วันนี้',
  },
  {
    id: 3,
    group: 'mixed_use',
    type: 'อาคารพาณิชย์',
    offer: 'เช่า',
    title: 'ตึกแถวริมถนนใหญ่ ชั้นล่างเปิดร้านได้',
    location: 'เมืองขอนแก่น, ขอนแก่น',
    facts: ['4 ชั้น', 'หน้ากว้าง 4 ม.', 'ทำอาหารได้'],
    price: '35,000',
    unit: 'บาท/เดือน',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=85&w=1400&auto=format&fit=crop',
    badge: 'เหมาะทำธุรกิจ',
    verified: true,
  },
  {
    id: 4,
    group: 'commercial',
    type: 'สำนักงาน',
    offer: 'เช่า',
    title: 'สำนักงานพร้อมใช้ ใจกลางย่านธุรกิจ',
    location: 'สาทร, กรุงเทพมหานคร',
    facts: ['120 ตร.ม.', '12 ที่นั่ง', 'จอดรถ 2 คัน'],
    price: '58,000',
    unit: 'บาท/เดือน',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=85&w=1400&auto=format&fit=crop',
    badge: 'พร้อมเข้าใช้',
  },
  {
    id: 5,
    group: 'residential',
    type: 'หอพัก',
    offer: 'เช่า',
    title: 'หอพักใกล้มหาวิทยาลัย มีห้องว่างหลายแบบ',
    location: 'คลองหลวง, ปทุมธานี',
    facts: ['เหลือ 4 ห้อง', 'มีแอร์', 'คีย์การ์ด'],
    price: '4,800',
    unit: 'บาท/เดือน เริ่มต้น',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=85&w=1400&auto=format&fit=crop',
    verified: true,
  },
  {
    id: 6,
    group: 'commercial',
    type: 'โกดัง',
    offer: 'เช่า',
    title: 'โกดังเพดานสูง รถสิบล้อเข้าได้ตลอดวัน',
    location: 'บางพลี, สมุทรปราการ',
    facts: ['800 ตร.ม.', 'ไฟ 3 เฟส', 'มีลานโหลด'],
    price: '95,000',
    unit: 'บาท/เดือน',
    image: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=85&w=1400&auto=format&fit=crop',
    badge: 'ราคาแนะนำ',
  },
  {
    id: 7,
    group: 'land',
    type: 'ที่ดิน',
    offer: 'ขาย',
    title: 'ที่ดินถมแล้ว วิวเขา เหมาะสร้างบ้านหรือรีสอร์ต',
    location: 'ปากช่อง, นครราชสีมา',
    facts: ['2 ไร่ 1 งาน', 'ถนน 8 ม.', 'มีไฟและน้ำ'],
    price: '7,900,000',
    unit: 'บาท',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=85&w=1400&auto=format&fit=crop',
    verified: true,
  },
  {
    id: 8,
    group: 'mixed_use',
    type: 'โฮมออฟฟิศ',
    offer: 'ขาย',
    title: 'โฮมออฟฟิศ 3 ชั้น แยกพื้นที่งานและที่พัก',
    location: 'เมืองชลบุรี, ชลบุรี',
    facts: ['3 ชั้น', '210 ตร.ม.', 'จอดรถ 3 คัน'],
    price: '8,900,000',
    unit: 'บาท',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=85&w=1400&auto=format&fit=crop',
    badge: 'อยู่ + ทำงาน',
  },
]

export const archivedPrototypeListingTranslations: Record<
  number,
  Pick<PrototypeListing, 'type' | 'offer' | 'title' | 'location' | 'facts' | 'unit' | 'badge'>
> = {
  11: {
    type: 'Vacant land · 2 adjoining plots',
    offer: 'Sale',
    title: '700 sq.wah land in Sutthisan with 87 m road frontage',
    location: 'Soi Chatsan, Sutthisan Winitchai Road, Bangkok',
    facts: ['2,800 sq.m.', '2 plots', 'Approx. 87 m frontage'],
    unit: '',
    badge: 'Owner listed',
  },
  9: {
    type: 'Event booth · Office crowd',
    offer: 'Booking open',
    title: 'Food O’Clock — THE EMPIRE TOWER',
    location: 'M Floor, THE EMPIRE TOWER, Sathon',
    facts: ['5 rounds', 'Aug 31–Oct 2, 2026', 'Food + lifestyle'],
    unit: '',
    badge: 'Event booth',
  },
  10: {
    type: 'Event booth · Shopping mall',
    offer: 'Booking open',
    title: 'LOCAL FAVORITES — EMSPHERE',
    location: 'EM MARKET HALL, G Floor, EMSPHERE',
    facts: ['Sep 11–22, 2026', 'Food + beverages', 'Mall visitors + expats'],
    unit: '',
    badge: 'Event booth',
  },
  1: {
    type: 'Detached house',
    offer: 'Sale',
    title: 'Modern home with private garden near the city',
    location: 'San Sai, Chiang Mai',
    facts: ['3 bedrooms', '2 bathrooms', '240 sq.m. land'],
    unit: '',
    badge: 'Owner listed',
  },
  2: {
    type: 'Condo',
    offer: 'Rent',
    title: 'Fully furnished condo, 4 minutes from BTS Ari',
    location: 'Phaya Thai, Bangkok',
    facts: ['1 bedroom', '1 bathroom', '38 sq.m.'],
    unit: '/month',
    badge: 'New today',
  },
  3: {
    type: 'Shophouse',
    offer: 'Rent',
    title: 'Main-road shophouse with retail-ready ground floor',
    location: 'Mueang Khon Kaen, Khon Kaen',
    facts: ['4 floors', '4 m frontage', 'Cooking allowed'],
    unit: '/month',
    badge: 'Business ready',
  },
  4: {
    type: 'Office',
    offer: 'Rent',
    title: 'Move-in-ready office in the central business district',
    location: 'Sathon, Bangkok',
    facts: ['120 sq.m.', '12 seats', '2 parking spaces'],
    unit: '/month',
    badge: 'Move-in ready',
  },
  5: {
    type: 'Dormitory',
    offer: 'Rent',
    title: 'University-area rooms with several layouts available',
    location: 'Khlong Luang, Pathum Thani',
    facts: ['4 rooms left', 'Air conditioning', 'Key card'],
    unit: '/month · starting at',
  },
  6: {
    type: 'Warehouse',
    offer: 'Rent',
    title: 'High-ceiling warehouse with all-day truck access',
    location: 'Bang Phli, Samut Prakan',
    facts: ['800 sq.m.', '3-phase power', 'Loading yard'],
    unit: '/month',
    badge: 'Recommended price',
  },
  7: {
    type: 'Land',
    offer: 'Sale',
    title: 'Filled land with mountain views for a home or resort',
    location: 'Pak Chong, Nakhon Ratchasima',
    facts: ['3,600 sq.m.', '8 m road', 'Water + electricity'],
    unit: '',
  },
  8: {
    type: 'Home office',
    offer: 'Sale',
    title: 'Three-storey home office with separate live/work zones',
    location: 'Mueang Chon Buri, Chon Buri',
    facts: ['3 floors', '210 sq.m.', '3 parking spaces'],
    unit: '',
    badge: 'Live + work',
  },
}

const getListingGroup = (listing: PropertySearchListing): ListingGroup => {
  if (listing.space_type_code === 'event_booth' || listing.space_type_codes?.includes('event_booth'))
    return 'commercial'
  if (listing.property_type_code === 'land') return 'land'
  if (listing.usage_type === 'mixed') return 'mixed_use'
  if (listing.usage_type === 'business') return 'commercial'
  if (
    [
      'apartment',
      'dormitory',
      'hotel',
      'hostel',
      'rental_room',
      'room_rental',
      'serviced_apartment',
      'monthly_hotel',
    ].includes(listing.property_type_code)
  )
    return 'rooms'
  if (['shophouse', 'home_office', 'mixed_use'].includes(listing.property_type_code)) return 'mixed_use'
  if (
    [
      'shop',
      'retail',
      'retail_space',
      'office',
      'warehouse',
      'factory',
      'hotel_resort',
      'market_stall',
      'mall_kiosk',
    ].includes(listing.property_type_code)
  )
    return 'commercial'
  return 'residential'
}

const formatEventSchedule = (startsOn: string | undefined, endsOn: string | undefined, isThai: boolean) => {
  if (!startsOn) return ''
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(value)
    )
  if (!endsOn || startsOn === endsOn) return formatDate(startsOn)
  return `${formatDate(startsOn)} – ${formatDate(endsOn)}`
}

const pricePeriodLabel = (unit: string | undefined, isThai: boolean) => {
  if (unit?.includes('/เดือน')) return isThai ? '/เดือน' : '/month'
  if (unit?.includes('/วัน')) return isThai ? '/วัน' : '/day'
  if (unit?.includes('/สัปดาห์')) return isThai ? '/สัปดาห์' : '/week'
  if (unit?.includes('/งาน')) return isThai ? '/งาน' : '/event'
  return ''
}

const toShowcaseListing = (listing: PropertySearchListing, isThai: boolean, offerType?: string): PrototypeListing => {
  const prices = filterPropertyPrices(getPropertyPrices(listing), offerType ? [offerType] : [])
  const group = getListingGroup(listing)
  const propertyType = getPropertyType(normalizeLegacyPropertyType(listing.property_type_code))
  const isRetailSpace = listing.property_type_code === 'retail_space'
  const isEvent = listing.space_type_code === 'event_booth' || listing.space_type_codes?.includes('event_booth')
  const isRental = Boolean(
    (listing.offer_type === 'rent' || listing.offer_type === 'sublease' || listing.rent_price_monthly) &&
    !listing.sale_price
  )
  const landArea = listing.land_area_sqm
    ? `${Math.round(listing.land_area_sqm / 4).toLocaleString(isThai ? 'th-TH' : 'en-US')} ${isThai ? 'ตร.ว.' : 'sq.wah'}`
    : ''
  const usableArea = listing.usable_area_sqm
    ? `${Math.round(listing.usable_area_sqm).toLocaleString(isThai ? 'th-TH' : 'en-US')} ${isThai ? 'ตร.ม.' : 'sq.m.'}`
    : ''
  const area = group === 'land' && landArea ? landArea : usableArea ? usableArea : landArea
  const priceAmount = isRetailSpace ? listing.offer_amount : isRental ? listing.rent_price_monthly : listing.sale_price
  const price = listing.price_on_request || !priceAmount ? '' : String(priceAmount)
  const eventSchedule = isEvent ? formatEventSchedule(listing.event_starts_on, listing.event_ends_on, isThai) : ''
  const localizedAddress = isThai ? listing.address : listing.address_en || listing.address
  const localizedDistrict = isThai ? listing.district : listing.district_en || listing.district
  const localizedProvince = isThai ? listing.province : listing.province_en || listing.province

  return {
    id: listing.id,
    identifier: listing.slug || listing.public_listing_id,
    group,
    type: isEvent
      ? isThai
        ? 'พื้นที่ออกบูธ'
        : 'Event booth'
      : group === 'land'
        ? isThai
          ? 'ที่ดินเปล่า'
          : 'Land'
        : propertyType
          ? isThai
            ? propertyType.nameTh
            : propertyType.nameEn
          : isThai
            ? 'อสังหาริมทรัพย์'
            : 'Property',
    offer: propertyOffersLabel(prices, isThai),
    prices,
    title: isThai ? listing.title : listing.title_en || listing.title,
    location: [localizedAddress, localizedDistrict, localizedProvince].filter(Boolean).join(', '),
    facts: isEvent
      ? [
          eventSchedule,
          listing.event_round_count
            ? `${listing.event_round_count} ${isThai ? 'รอบ' : `round${listing.event_round_count === 1 ? '' : 's'}`}`
            : '',
        ].filter(Boolean)
      : [
          area,
          listing.bedroom_count
            ? `${listing.bedroom_count} ${isThai ? 'ห้องนอน' : `bedroom${listing.bedroom_count === 1 ? '' : 's'}`}`
            : '',
        ].filter(Boolean),
    price,
    priceAmount,
    priceCurrency: listing.currency,
    unit: listing.price_on_request
      ? undefined
      : isRetailSpace
        ? listing.offer_price_unit === 'day'
          ? 'บาท/วัน'
          : listing.offer_price_unit === 'week'
            ? 'บาท/สัปดาห์'
            : listing.offer_price_unit === 'month'
              ? 'บาท/เดือน'
              : 'บาท/งาน'
        : isRental
          ? 'บาท/เดือน'
          : 'บาท',
    image: listing.primary_image_url || '',
    href: `/real-estate-listings/${listing.slug || listing.public_listing_id}`,
    badge: isEvent
      ? isThai
        ? 'พื้นที่ออกบูธ'
        : 'Event booth'
      : group === 'mixed_use'
        ? isThai
          ? 'อยู่อาศัย + ธุรกิจ'
          : 'Mixed use · live + work'
        : listing.source_type === 'owner'
          ? isThai
            ? 'เจ้าของขายเอง'
            : 'Listed by owner'
          : undefined,
    verified: listing.is_verified,
    verificationLabel: listing.is_verified ? 'ตรวจสอบแล้ว' : undefined,
    priceLabel: listing.price_on_request ? (isEvent ? 'ติดต่อผู้จัดงาน' : 'สอบถามราคา') : undefined,
    imagePosition: isEvent ? 'top' : 'center',
  }
}

const PropertyListingShowcase = ({
  mode = 'all',
  compact = false,
  initialRows,
  offerType,
}: {
  mode?: PropertyLandingMode
  compact?: boolean
  initialRows?: PropertyLandingRowData[]
  offerType?: 'sale' | 'rent'
}) => {
  const { locale, formatCurrencyFrom } = usePreferences()
  const savedListings = useSavedListings()
  const isThai = locale === 'th'
  const requestKey = `${mode}:${offerType || 'all'}`
  const [result, setResult] = useState<{ key: string; rows: PropertyLandingRowData[]; error: boolean } | null>(null)
  const loadState = result?.key !== requestKey ? 'loading' : result.error ? 'error' : 'ready'
  const rows = useMemo(
    () => selectPropertyLandingRows(initialRows || (result?.key === requestKey ? result.rows : [])),
    [initialRows, result, requestKey]
  )

  useEffect(() => {
    if (initialRows) return
    const controller = new AbortController()
    Promise.all(
      getPropertyLandingRows(mode).map(async (row) => {
        const result = await fetchPropertySearch('', controller.signal, propertyLandingRowOptions(row, mode, offerType))
        return { ...row, listings: result.listings }
      })
    )
      .then((rows) => {
        if (controller.signal.aborted) return
        setResult({ key: requestKey, rows, error: false })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key: requestKey, rows: [], error: true })
      })
    return () => controller.abort()
  }, [initialRows, mode, offerType, requestKey])

  return (
    <section
      id="latest-listings"
      style={{ scrollMarginTop: 100 }}
      className={
        compact ? 'pt-5 pb-5 sm:pt-7 sm:pb-8 lg:pt-8 lg:pb-10' : 'pt-14 pb-10 sm:pt-18 sm:pb-14 lg:pt-24 lg:pb-16'
      }
    >
      <div className="container">
        {rows.length === 0 ? (
          <p
            role="status"
            className="rounded-3xl border border-dashed border-neutral-300 px-6 py-12 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
          >
            {!initialRows && loadState === 'loading'
              ? isThai
                ? 'กำลังโหลดประกาศ…'
                : 'Loading listings…'
              : !initialRows && loadState === 'error'
                ? isThai
                  ? 'โหลดประกาศไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
                  : 'Listings could not load. Please try again.'
                : isThai
                  ? 'ยังไม่มีประกาศที่เผยแพร่ในหมวดนี้'
                  : 'There are no published listings in this category yet.'}
          </p>
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {rows.map((row, rowIndex) => (
              <section key={row.id} data-listing-row={row.id} aria-labelledby={'listing-row-' + row.id}>
                <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
                  <h2
                    id={'listing-row-' + row.id}
                    className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl dark:text-white"
                  >
                    {isThai ? row.titleTh : row.titleEn}
                  </h2>
                  <Link
                    href={propertyLandingRowHref(row, mode, offerType)}
                    aria-label={isThai ? 'ดูทั้งหมด: ' + row.titleTh : 'View all: ' + row.titleEn}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-neutral-600 transition hover:bg-black/5 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    {isThai ? 'ดูทั้งหมด' : 'View all'} <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
                <div
                  role="region"
                  aria-label={isThai ? row.titleTh : row.titleEn}
                  tabIndex={0}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pt-1 pb-3 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:gap-6 xl:grid xl:grid-cols-4 xl:overflow-visible xl:px-0"
                >
                  {row.listings.map((record, index) => {
                    const listing = toShowcaseListing(record, isThai, offerType)
                    const liked = savedListings.isSaved(listing.identifier)
                    const displayListing = listing
                    const parsedPrice = listing.priceAmount ?? Number(listing.price.replace(/,/g, ''))
                    const formattedPrice = Number.isFinite(parsedPrice)
                      ? formatCurrencyFrom(parsedPrice, listing.priceCurrency)
                      : listing.price
                    const pricePeriod = pricePeriodLabel(listing.unit, isThai)
                    return (
                      <article
                        key={listing.id}
                        className="group w-[82vw] max-w-[330px] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] sm:max-w-none lg:w-[calc((100%-3rem)/3)] xl:w-auto"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-800">
                          <DeferredListingImage
                            src={listing.image}
                            alt={displayListing.title}
                            eager={rowIndex === 0 && index === 0}
                            position={listing.imagePosition}
                          />
                          <Link
                            href={listing.href || '/real-estate-categories/all'}
                            aria-label={displayListing.title}
                            className="absolute inset-0"
                          />
                          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-neutral-950 shadow-sm backdrop-blur">
                                {displayListing.offer}
                              </span>
                              {listing.badge && (
                                <span className="rounded-full bg-[#123f32]/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                                  {displayListing.badge}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              aria-label={
                                liked
                                  ? isThai
                                    ? 'นำออกจากรายการโปรด'
                                    : 'Remove from favorites'
                                  : isThai
                                    ? 'บันทึกเป็นรายการโปรด'
                                    : 'Save to favorites'
                              }
                              disabled={savedListings.isBusy(listing.identifier)}
                              onClick={() => listing.identifier && void savedListings.toggleSaved(listing.identifier)}
                              className="flex size-10 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition hover:scale-105"
                            >
                              <Heart
                                className={`size-5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`}
                                strokeWidth={1.8}
                              />
                            </button>
                          </div>
                        </div>

                        <Link href={listing.href || '/real-estate-categories/all'} className="block pt-4">
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                              {displayListing.type}
                            </span>
                            {listing.verified && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#176b50] dark:text-emerald-300">
                                <CheckCircle2 className="size-3.5" />{' '}
                                {isThai
                                  ? listing.verificationLabel || 'ตรวจสอบแล้ว'
                                  : listing.verificationLabel
                                    ? 'Organizer checked'
                                    : 'Verified'}
                              </span>
                            )}
                          </div>
                          <h3 className="line-clamp-1 text-base font-semibold text-neutral-950 transition group-hover:text-[#176b50] dark:text-white dark:group-hover:text-emerald-300">
                            {displayListing.title}
                          </h3>
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                            <MapPin className="size-4 shrink-0" strokeWidth={1.7} />
                            <span className="truncate">{displayListing.location}</span>
                          </p>
                          <div className="mt-3 flex min-h-6 flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                            {displayListing.facts.map((fact, index) => (
                              <span key={fact} className="whitespace-nowrap">
                                {index > 0 && <span className="me-2 text-neutral-300 dark:text-neutral-600">·</span>}
                                {fact}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                            {listing.prices ? (
                              <PropertyPrices prices={listing.prices} className="text-neutral-950 dark:text-white" />
                            ) : listing.priceLabel ? (
                              <span className="text-base font-semibold text-[#123f32] dark:text-emerald-200">
                                {isThai ? listing.priceLabel : 'Ask the organizer for pricing'}
                              </span>
                            ) : (
                              <>
                                <span className="text-lg font-bold text-neutral-950 dark:text-white">
                                  {formattedPrice}
                                </span>{' '}
                                {pricePeriod ? (
                                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{pricePeriod}</span>
                                ) : null}
                              </>
                            )}
                          </div>
                        </Link>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PropertyListingShowcase
