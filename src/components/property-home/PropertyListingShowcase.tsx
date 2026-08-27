'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { fetchPropertySearch, type PropertySearchListing } from '@/lib/propertySearch'
import { CheckCircle2, Heart, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

type ListingGroup = 'residential' | 'rooms' | 'mixed_use' | 'commercial' | 'land'

export type PrototypeListing = {
  id: number
  group: ListingGroup
  type: string
  offer: string
  title: string
  location: string
  facts: string[]
  price: string
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(eager)

  useEffect(() => {
    if (shouldLoad || !containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: '240px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={containerRef} className="absolute inset-0">
      {shouldLoad ? (
        <Image
          fill
          src={src}
          alt={alt}
          sizes="(max-width: 402px) 82vw, (max-width: 640px) 330px, (max-width: 1280px) 50vw, 25vw"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'low'}
          preload={eager}
          className={`object-cover transition duration-500 group-hover:scale-[1.035] ${
            position === 'top' ? 'object-top' : 'object-center'
          }`}
        />
      ) : null}
    </div>
  )
}

const filters: { value: 'all' | ListingGroup; label: string; labelEn: string }[] = [
  { value: 'all', label: 'แนะนำ', labelEn: 'Featured' },
  { value: 'residential', label: 'ที่อยู่อาศัย', labelEn: 'Residential' },
  { value: 'mixed_use', label: 'อยู่ + ธุรกิจ', labelEn: 'Live + work' },
  { value: 'commercial', label: 'ธุรกิจ', labelEn: 'Business' },
  { value: 'land', label: 'ที่ดิน', labelEn: 'Land' },
]

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
    offer: 'เปิดจอง',
    title: "Food O’Clock — THE EMPIRE TOWER",
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
    offer: 'เปิดจอง',
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
    title: "Food O’Clock — THE EMPIRE TOWER",
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
  if (listing.space_type_code === 'event_booth') return 'commercial'
  if (['apartment', 'dormitory', 'hotel', 'hostel', 'room_rental', 'serviced_apartment'].includes(listing.property_type_code)) return 'rooms'
  if (['shophouse', 'home_office', 'mixed_use'].includes(listing.property_type_code)) return 'mixed_use'
  if (['shop', 'retail', 'office', 'warehouse', 'factory', 'market_stall', 'mall_kiosk'].includes(listing.property_type_code)) return 'commercial'
  if (listing.property_type_code === 'land') return 'land'
  return 'residential'
}

const formatEventSchedule = (startsOn?: string, endsOn?: string) => {
  if (!startsOn) return ''
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
  if (!endsOn || startsOn === endsOn) return formatDate(startsOn)
  return `${formatDate(startsOn)} – ${formatDate(endsOn)}`
}

const toShowcaseListing = (listing: PropertySearchListing): PrototypeListing => {
  const group = getListingGroup(listing)
  const isEvent = listing.space_type_code === 'event_booth'
  const isRental = Boolean(listing.rent_price_monthly && !listing.sale_price)
  const area = listing.land_area_sqm && group === 'land'
    ? `${Math.round(listing.land_area_sqm / 4).toLocaleString('th-TH')} ตร.ว.`
    : listing.usable_area_sqm
      ? `${Math.round(listing.usable_area_sqm).toLocaleString('th-TH')} ตร.ม.`
      : ''
  const price = listing.price_on_request
    ? ''
    : new Intl.NumberFormat('th-TH').format(isRental ? listing.rent_price_monthly || 0 : listing.sale_price || 0)
  const eventSchedule = isEvent ? formatEventSchedule(listing.event_starts_on, listing.event_ends_on) : ''

  return {
    id: listing.id,
    group,
    type: isEvent ? 'พื้นที่ออกบูธ' : group === 'land' ? 'ที่ดินเปล่า' : listing.property_type_code || 'อสังหาริมทรัพย์',
    offer: isEvent ? 'เปิดจอง' : isRental ? 'เช่า' : 'ขาย',
    title: listing.title,
    location: [listing.address, listing.district, listing.province].filter(Boolean).join(', '),
    facts: isEvent
      ? [eventSchedule, listing.event_round_count ? `${listing.event_round_count} รอบ` : ''].filter(Boolean)
      : [area, listing.bedroom_count ? `${listing.bedroom_count} ห้องนอน` : ''].filter(Boolean),
    price,
    unit: listing.price_on_request ? undefined : isRental ? 'บาท/เดือน' : 'บาท',
    image: listing.primary_image_url || '/M5.png',
    href: `/real-estate-listings/${listing.slug || listing.public_listing_id}`,
    badge: isEvent ? 'พื้นที่ออกบูธ' : listing.source_type === 'owner' ? 'เจ้าของขายเอง' : undefined,
    verified: listing.is_verified,
    verificationLabel: listing.is_verified ? 'ตรวจสอบแล้ว' : undefined,
    priceLabel: listing.price_on_request ? 'สอบถามราคา' : undefined,
    imagePosition: isEvent ? 'top' : 'center',
  }
}

const PropertyListingShowcase = ({
  mode = 'all',
  compact = false,
}: {
  mode?: 'all' | 'homes' | 'rooms' | 'business'
  compact?: boolean
}) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]['value']>('all')
  const [likedIds, setLikedIds] = useState<number[]>([])
  const [databaseListings, setDatabaseListings] = useState<PrototypeListing[]>([])

  useEffect(() => {
    let isCurrent = true
    const discoveryChannel = mode === 'all' ? undefined : mode
    fetchPropertySearch('', undefined, { discoveryChannel, limit: 12 })
      .then((result) => {
        if (isCurrent) setDatabaseListings(result.listings.map(toShowcaseListing))
      })
      .catch(() => {
        if (isCurrent) setDatabaseListings([])
      })
    return () => {
      isCurrent = false
    }
  }, [mode])

  const availableFilters = useMemo(() => {
    if (mode === 'homes') return filters.filter((filter) => ['all', 'residential', 'land'].includes(filter.value))
    if (mode === 'rooms') return filters.filter((filter) => filter.value === 'all')
    if (mode === 'business') return filters.filter((filter) => ['all', 'mixed_use', 'commercial', 'land'].includes(filter.value))
    return filters
  }, [mode])

  const availableListings = useMemo(
    () => {
      if (mode === 'homes') return databaseListings.filter((listing) => listing.group === 'residential' || listing.group === 'land')
      if (mode === 'rooms') return databaseListings.filter((listing) => listing.group === 'rooms')
      // Land can be suitable for a residence or future commercial development.
      // The database assigns those listings to both discovery channels, so the
      // homepage must not hide land from the Business surface.
      if (mode === 'business') return databaseListings.filter((listing) => listing.group === 'commercial' || listing.group === 'mixed_use' || listing.group === 'land')
      return databaseListings
    },
    [databaseListings, mode]
  )
  const visibleListings = useMemo(() => {
    return activeFilter === 'all'
      ? availableListings
      : availableListings.filter((listing) => listing.group === activeFilter)
  }, [activeFilter, availableListings])

  const toggleLike = (id: number) => {
    setLikedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <section className={compact ? 'pt-7 pb-10 sm:pt-9 sm:pb-14 lg:pt-11 lg:pb-16' : 'pt-14 pb-10 sm:pt-18 sm:pb-14 lg:pt-24 lg:pb-16'}>
      <div className="container">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wide text-[#176b50] dark:text-emerald-300">
              {isThai ? 'อัปเดตล่าสุด' : 'Recently updated'}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              {isThai ? 'ประกาศใหม่และน่าสนใจ' : 'New and notable listings'}
            </h2>
          </div>

          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
            {availableFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter.value
                    ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {isThai ? filter.label : filter.labelEn}
              </button>
            ))}
          </div>
        </div>

        {visibleListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400">
            {isThai ? 'ยังไม่มีประกาศที่เผยแพร่ในหมวดนี้' : 'There are no published listings in this category yet.'}
          </div>
        ) : (
        <div className="mx-0 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {visibleListings.map((listing, index) => {
            const liked = likedIds.includes(listing.id)
            const displayListing = listing
            return (
              <article
                key={listing.id}
                className="group w-[82vw] max-w-[330px] shrink-0 snap-start sm:w-auto sm:max-w-none"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-800">
                  <DeferredListingImage
                    src={listing.image}
                    alt={displayListing.title}
                    eager={index === 0}
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
                      onClick={() => toggleLike(listing.id)}
                      className="flex size-10 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition hover:scale-105"
                    >
                      <Heart className={`size-5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} strokeWidth={1.8} />
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
                        {isThai ? listing.verificationLabel || 'ตรวจสอบแล้ว' : listing.verificationLabel ? 'Organizer checked' : 'Verified'}
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
                    {listing.priceLabel ? (
                      <span className="text-base font-semibold text-[#123f32] dark:text-emerald-200">
                        {isThai ? listing.priceLabel : 'Ask the organizer for pricing'}
                      </span>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-neutral-950 dark:text-white">฿{listing.price}</span>{' '}
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {isThai ? listing.unit?.replace('บาท', '') : displayListing.unit}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/real-estate-categories/all"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:border-neutral-700 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"
          >
            {isThai ? 'ดูประกาศทั้งหมด' : 'View all listings'}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PropertyListingShowcase
