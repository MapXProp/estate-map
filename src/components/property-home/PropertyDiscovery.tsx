'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import type { DiscoveryChannelCode, PropertyTypeCode } from '@/data/propertyTaxonomy'
import { getHeaderMapSearchUrl, type HeaderOfferType } from '@/lib/propertyHeaderSearch'
import {
  ArrowRight,
  BedDouble,
  Building,
  Building2,
  DoorOpen,
  Factory,
  GraduationCap,
  Hotel,
  House,
  HousePlus,
  KeyRound,
  LandPlot,
  Map,
  MapPin,
  PanelsTopLeft,
  Store,
  Tent,
  Warehouse,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import DiscoveryHero from './DiscoveryHero'
import styles from './PropertyDiscovery.module.css'
import PropertySearchOmnibox from './PropertySearchOmnibox'

type DiscoveryCategory = {
  type: PropertyTypeCode
  spaceType?: string
  th: string
  en: string
  icon: typeof House
  tone: string
}

const channelCategories: Record<DiscoveryChannelCode, DiscoveryCategory[]> = {
  homes: [
    { type: 'condo', th: 'คอนโด', en: 'Condos', icon: Building2, tone: 'sky' },
    { type: 'detached_house', th: 'บ้านเดี่ยว', en: 'Houses', icon: House, tone: 'green' },
    { type: 'townhouse', th: 'ทาวน์โฮม', en: 'Townhomes', icon: Building, tone: 'sand' },
    { type: 'semi_detached_house', th: 'บ้านแฝด', en: 'Semi-detached', icon: HousePlus, tone: 'rose' },
    { type: 'home_office', th: 'โฮมออฟฟิศ', en: 'Home offices', icon: PanelsTopLeft, tone: 'slate' },
    { type: 'shophouse', th: 'ตึกแถว', en: 'Shophouses', icon: Store, tone: 'orange' },
    { type: 'land', th: 'ที่ดิน', en: 'Land', icon: LandPlot, tone: 'green' },
  ],
  rooms: [
    { type: 'rental_room', th: 'ห้องเช่า', en: 'Rental rooms', icon: KeyRound, tone: 'sky' },
    { type: 'apartment', th: 'อพาร์ตเมนต์', en: 'Apartments', icon: Building, tone: 'slate' },
    { type: 'dormitory', th: 'หอพัก', en: 'Dormitories', icon: GraduationCap, tone: 'sand' },
    { type: 'condo', th: 'คอนโดเช่า', en: 'Condo rentals', icon: Building2, tone: 'green' },
    { type: 'flat', th: 'แฟลต', en: 'Flats', icon: DoorOpen, tone: 'rose' },
    { type: 'monthly_hotel', th: 'โรงแรมรายเดือน', en: 'Monthly hotels', icon: Hotel, tone: 'orange' },
  ],
  business: [
    { type: 'retail_space', th: 'ร้านค้า', en: 'Retail spaces', icon: Store, tone: 'orange' },
    {
      type: 'retail_space',
      spaceType: 'event_booth',
      th: 'พื้นที่ออกบูธ',
      en: 'Event booths',
      icon: Tent,
      tone: 'rose',
    },
    { type: 'office', th: 'ออฟฟิศ', en: 'Offices', icon: PanelsTopLeft, tone: 'sky' },
    { type: 'warehouse', th: 'โกดัง', en: 'Warehouses', icon: Warehouse, tone: 'sand' },
    { type: 'factory', th: 'โรงงาน', en: 'Factories', icon: Factory, tone: 'slate' },
    { type: 'shophouse', th: 'ตึกแถว', en: 'Shophouses', icon: Building, tone: 'orange' },
    { type: 'home_office', th: 'โฮมออฟฟิศ', en: 'Home offices', icon: House, tone: 'sky' },
    { type: 'land', th: 'ที่ดิน', en: 'Land', icon: LandPlot, tone: 'green' },
  ],
}

const channelContent = {
  homes: {
    brand: 'HOMES & LIVING',
    photos: [
      { src: '/images/channel-heroes/residential-house-daylight.jpg', th: 'บ้านพร้อมสวน', en: 'A home with a garden' },
      {
        src: '/images/channel-heroes/apartment-living.jpg',
        th: 'มุมพักผ่อนในอพาร์ตเมนต์',
        en: 'Apartment living',
        position: 'center 62%',
        mobilePosition: '63% center',
      },
      {
        src: '/images/channel-heroes/home-garden.jpg',
        th: 'บ้านและพื้นที่สีเขียว',
        en: 'A home close to nature',
        position: 'center 57%',
        mobilePosition: '59% center',
      },
    ],
    tone: 'green',
    titleTh: 'บ้านที่ใช่',
    titleEn: 'The right home,',
    accentTh: 'ในทำเลที่ชอบ',
    accentEn: 'where you belong.',
    descriptionTh: 'ค้นหาบ้าน คอนโด และที่ดิน ทั้งซื้อและเช่า',
    descriptionEn: 'Discover houses, condos and land, to buy or rent.',
    mapTitleTh: 'เห็นทำเล ก่อนเลือกบ้าน',
    mapTitleEn: 'Find your neighborhood',
    placeholderTh: 'ค้นหาทำเล โครงการ หรือสถานีรถไฟฟ้า',
    placeholderEn: 'Search location, project or transit station',
    categoryLeadTh: 'พื้นที่แบบไหน',
    categoryLeadEn: 'What kind of place',
    categoryAccentTh: 'ที่เป็นคุณ',
    categoryAccentEn: 'feels like you?',
    categoryLabelTh: 'เลือกประเภทที่อยู่อาศัย',
    categoryLabelEn: 'Browse home types',
    locations: [
      { th: 'อารีย์', en: 'Ari' },
      { th: 'ทองหล่อ', en: 'Thong Lo' },
      { th: 'พระราม 9', en: 'Rama 9' },
      { th: 'บางนา', en: 'Bang Na' },
    ],
  },
  rooms: {
    brand: 'ROOMS & MONTHLY STAYS',
    photos: [
      { src: '/images/channel-heroes/monthly-room-daylight.jpg', th: 'ห้องพักแสงธรรมชาติ', en: 'A sunlit room' },
      {
        src: '/images/channel-heroes/monthly-room-turquoise.jpg',
        th: 'ห้องพักโทนสดใส',
        en: 'A colorful bedroom',
        position: 'center 65%',
        mobilePosition: '58% center',
      },
      {
        src: '/images/channel-heroes/apartment-living.jpg',
        th: 'พื้นที่พักผ่อนและใช้ชีวิต',
        en: 'Room to live and relax',
        position: 'center 62%',
        mobilePosition: '63% center',
      },
    ],
    tone: 'mint',
    titleTh: 'ห้องที่ใช่',
    titleEn: 'Your next room,',
    accentTh: 'ในจังหวะชีวิตคุณ',
    accentEn: 'your kind of living.',
    descriptionTh: 'ห้องเช่า หอพัก และอพาร์ตเมนต์ ใกล้ที่เรียน ใกล้ที่ทำงาน',
    descriptionEn: 'Rooms, dorms and apartments near work or study.',
    mapTitleTh: 'หาห้อง ใกล้ชีวิตคุณ',
    mapTitleEn: 'Stay close to your day',
    placeholderTh: 'ค้นหาทำเล มหาวิทยาลัย หรือสถานีรถไฟฟ้า',
    placeholderEn: 'Search area, university or transit station',
    categoryLeadTh: 'ห้องพักแบบไหน',
    categoryLeadEn: 'Your kind of room,',
    categoryAccentTh: 'ที่อยู่แล้วสบาย',
    categoryAccentEn: 'your own space.',
    categoryLabelTh: 'เลือกประเภทห้องเช่ารายเดือน',
    categoryLabelEn: 'Browse monthly rental types',
    locations: [
      { th: 'ลาดพร้าว', en: 'Lat Phrao' },
      { th: 'รังสิต', en: 'Rangsit' },
      { th: 'รามคำแหง', en: 'Ramkhamhaeng' },
      { th: 'อ่อนนุช', en: 'On Nut' },
    ],
  },
  business: {
    brand: 'SPACES FOR BUSINESS',
    photos: [
      { src: '/images/business-hero/cafe-interior.jpg', th: 'ร้านค้าและคาเฟ่', en: 'Shops and cafes' },
      {
        src: '/images/channel-heroes/office-daylight.jpg',
        th: 'สำนักงานและพื้นที่ทำงาน',
        en: 'Offices and workspaces',
        position: 'center 57%',
        mobilePosition: '60% center',
      },
      {
        src: '/images/channel-heroes/business-park.jpg',
        th: 'อาคารและพื้นที่ธุรกิจ',
        en: 'Commercial properties',
        position: 'center 52%',
        mobilePosition: 'center',
      },
    ],
    tone: 'commerce',
    titleTh: 'ทำเลที่ใช่',
    titleEn: 'The right space,',
    accentTh: 'ให้ธุรกิจไปต่อ',
    accentEn: 'for your next move.',
    descriptionTh: 'ร้านค้า ออฟฟิศ โกดัง และพื้นที่ออกบูธ ค้นหาตามการใช้งาน',
    descriptionEn: 'Shops, offices, warehouses and event spaces. Find your fit.',
    mapTitleTh: 'เห็นทำเล เห็นโอกาส',
    mapTitleEn: 'Explore your next location',
    placeholderTh: 'ค้นหาทำเล อาคาร หรือลอง “โกดังบางนา”',
    placeholderEn: 'Search area, building or “warehouse Bang Na”',
    categoryLeadTh: 'ธุรกิจของคุณ',
    categoryLeadEn: 'Your business,',
    categoryAccentTh: 'เริ่มที่พื้นที่แบบไหน',
    categoryAccentEn: 'your next space.',
    categoryLabelTh: 'เลือกประเภทพื้นที่ธุรกิจ',
    categoryLabelEn: 'Browse business space types',
    locations: [
      { th: 'สาทร', en: 'Sathorn' },
      { th: 'อโศก', en: 'Asok' },
      { th: 'บางนา', en: 'Bang Na' },
      { th: 'สมุทรปราการ', en: 'Samut Prakan' },
    ],
  },
} as const

const offers = [
  { value: 'all', th: 'ซื้อและเช่า', en: 'Buy & rent' },
  { value: 'sale', th: 'ซื้อ', en: 'Buy' },
  { value: 'rent', th: 'เช่า', en: 'Rent' },
] as const

export default function PropertyDiscovery({ mode }: { mode: DiscoveryChannelCode }) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const content = channelContent[mode]
  const categories = channelCategories[mode]
  const rentalOnly = mode === 'rooms'
  const [offer, setOffer] = useState<'all' | HeaderOfferType>('all')
  const selectedOffers: HeaderOfferType[] = rentalOnly ? ['rent'] : offer === 'all' ? ['sale', 'rent'] : [offer]
  const searchHref = (query: string) => getHeaderMapSearchUrl(query, mode, selectedOffers)

  return (
    <section className={styles.discovery} aria-labelledby={`${mode}-hero-title`}>
      <div className="container">
        <DiscoveryHero
          key={mode}
          photos={content.photos}
          isThai={th}
          mapLink={
            <Link href={searchHref('')} className={styles.mapCard}>
              <span className={styles.mapIcon}>
                <Map size={24} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span>
                <strong>{th ? content.mapTitleTh : content.mapTitleEn}</strong>
                <span>{th ? 'เริ่มสำรวจบนแผนที่' : 'Start exploring on the map'}</span>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          }
        >
          <p className={styles.eyebrow}>
            <span /> MAPXPROP · {content.brand}
          </p>
          <h1 id={`${mode}-hero-title`}>
            {th ? content.titleTh : content.titleEn}
            <span>{th ? content.accentTh : content.accentEn}</span>
          </h1>
          <p className={styles.description}>{th ? content.descriptionTh : content.descriptionEn}</p>
        </DiscoveryHero>

        <div className={styles.searchPanel}>
          <div className={styles.searchTop}>
            <div className={styles.offerChoices} role="group" aria-label={th ? 'รูปแบบประกาศ' : 'Listing type'}>
              {rentalOnly ? (
                <span className={styles.rentalOffer}>
                  <BedDouble size={16} aria-hidden="true" />
                  {th ? 'เช่ารายเดือน' : 'Monthly rentals'}
                </span>
              ) : (
                offers.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={offer === item.value}
                    onClick={() => setOffer(item.value)}
                  >
                    {th ? item.th : item.en}
                  </button>
                ))
              )}
            </div>
            <Link href={searchHref('')} className={styles.mapLink}>
              <Map size={16} aria-hidden="true" />
              {th ? 'ค้นหาบนแผนที่' : 'Explore map'}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.searchField}>
            <PropertySearchOmnibox
              variant="hero"
              tone={content.tone}
              placeholder={th ? content.placeholderTh : content.placeholderEn}
              buildSearchUrl={searchHref}
              allowEmptyQuery
              showTypeLabels
            />
          </div>
          <div className={styles.quickLocations}>
            <span>
              <MapPin size={13} aria-hidden="true" /> {th ? 'ลองเริ่มจาก' : 'Start with'}
            </span>
            {content.locations.map((location) => (
              <Link key={location.en} href={searchHref(location.th)}>
                {th ? location.th : location.en}
              </Link>
            ))}
          </div>
        </div>

        <nav className={styles.categories} aria-label={th ? content.categoryLabelTh : content.categoryLabelEn}>
          <div className={styles.categoryIntro}>
            <span>{th ? content.categoryLeadTh : content.categoryLeadEn}</span>
            <strong>{th ? content.categoryAccentTh : content.categoryAccentEn}</strong>
          </div>
          <div className={styles.categoryLinks}>
            {categories.map(({ type, spaceType, icon: Icon, tone, ...label }) => (
              <Link
                key={`${type}:${spaceType || ''}`}
                href={`${searchHref('')}${spaceType ? `&space_type=${spaceType}` : `&property_type=${type}`}`}
                className={styles.category}
              >
                <span className={styles.categoryIcon} data-tone={tone}>
                  <Icon size={27} strokeWidth={1.55} aria-hidden="true" />
                </span>
                <span>{th ? label.th : label.en}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </section>
  )
}
