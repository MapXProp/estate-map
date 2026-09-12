'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import type { PropertySiteMode } from '@/components/property-home/PropertyHomeSearch'
import { getPropertyMapLocationHref, propertyMapLocationPresets } from '@/lib/propertyMapLocations'
import { ArrowDown, ArrowRight, ChevronDown, House, KeyRound, Map, MapPin, Store } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './ChannelDiscoveryHero.module.css'

const featuredLocations = ['bangkok', 'chiang-mai', 'chon-buri', 'phuket']
type ChannelMode = Exclude<PropertySiteMode, 'all'>
const channelContent = {
  homes: {
    icon: House,
    th: {
      eyebrow: 'ที่อยู่อาศัย',
      title: 'บ้านที่ใช่',
      accent: 'ในทำเลที่ชอบ',
      description: 'บ้าน คอนโด และที่ดิน ทั้งซื้อและเช่า',
      cityLabel: 'ค้นหาที่อยู่อาศัยตามเมือง',
    },
    en: {
      eyebrow: 'Homes & living',
      title: 'The right home,',
      accent: 'where you belong.',
      description: 'Houses, condos and land, to buy or rent.',
      cityLabel: 'Find homes by city',
    },
    photo: '/images/channel-heroes/home-garden.jpg',
  },
  rooms: {
    icon: KeyRound,
    th: {
      eyebrow: 'ห้องเช่ารายเดือน',
      title: 'ห้องที่ใช่',
      accent: 'ในงบของคุณ',
      description: 'ห้องเช่า หอพัก และอพาร์ตเมนต์ ใกล้ที่เรียนและที่ทำงาน',
      cityLabel: 'ค้นหาห้องเช่ารายเดือนตามเมือง',
    },
    en: {
      eyebrow: 'Monthly rentals',
      title: 'Your next room,',
      accent: 'within your budget.',
      description: 'Rooms, dorms and apartments near work or study.',
      cityLabel: 'Find monthly rentals by city',
    },
    photo: '/images/channel-heroes/monthly-room.jpg',
  },
  business: {
    icon: Store,
    th: {
      eyebrow: 'พื้นที่ทำธุรกิจ',
      title: 'ทำเลที่ใช่',
      accent: 'ให้ธุรกิจคุณ',
      description: 'ร้านค้า ออฟฟิศ โกดัง และที่ดิน ในทำเลที่คุณเลือก',
      cityLabel: 'ค้นหาพื้นที่ธุรกิจตามเมือง',
    },
    en: {
      eyebrow: 'Spaces for business',
      title: 'The right space,',
      accent: 'for your next chapter.',
      description: 'Shops, offices, warehouses and land. Find your location.',
      cityLabel: 'Find business spaces by city',
    },
    photo: '/images/business-hero/cafe-interior.jpg',
  },
} satisfies Record<ChannelMode, unknown>

export default function ChannelDiscoveryHero({ mode, offerType }: { mode: ChannelMode; offerType?: 'sale' | 'rent' }) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const content = channelContent[mode]
  const originalCopy = content[th ? 'th' : 'en']
  const copy = offerType
    ? {
        ...originalCopy,
        eyebrow: th
          ? offerType === 'sale'
            ? 'ประกาศขาย'
            : 'ประกาศเช่า'
          : offerType === 'sale'
            ? 'For sale'
            : 'For rent',
        title: th
          ? offerType === 'sale'
            ? 'ซื้อบ้านที่ใช่'
            : 'เช่าห้องที่ใช่'
          : offerType === 'sale'
            ? 'Buy your next home,'
            : 'Rent your next room,',
        description: th
          ? offerType === 'sale'
            ? 'บ้าน คอนโด และที่ดิน ที่ลงประกาศขาย'
            : 'ห้องพักและอพาร์ตเมนต์ ที่ลงประกาศให้เช่า'
          : offerType === 'sale'
            ? 'Homes, condos and land available to buy.'
            : 'Rooms and apartments available to rent.',
      }
    : originalCopy
  const Icon = content.icon
  const cityLabel = (location: (typeof propertyMapLocationPresets)[number]) =>
    th ? (location.slug === 'bangkok' ? 'กรุงเทพฯ' : location.nameTh) : location.nameEn

  return (
    <section className={`container ${styles.section}`} data-property-hero={mode} aria-labelledby={`${mode}-hero-title`}>
      <div className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <Icon size={15} strokeWidth={1.7} aria-hidden="true" />
            {copy.eyebrow}
          </p>
          <h1 id={`${mode}-hero-title`} className={styles.title}>
            {copy.title}
            <span>{copy.accent}</span>
          </h1>
          <p className={styles.description}>{copy.description}</p>
        </div>

        <div className={styles.actions}>
          <Link
            href={`/properties/map?channel=${mode}${offerType ? `&offer_type=${offerType}` : ''}`}
            className={styles.primary}
          >
            <Map size={18} strokeWidth={1.8} aria-hidden="true" />
            {th ? 'ค้นหาบนแผนที่' : 'Explore the map'}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <a href="#latest-listings" className={styles.secondary}>
            {th ? 'ดูประกาศล่าสุด' : 'Latest listings'}
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>

        <figure className={styles.visual}>
          <Image
            src={content.photo}
            alt=""
            fill
            preload
            sizes="(max-width: 639px) 30vw, (max-width: 1279px) 43vw, 530px"
            className={styles.photo}
          />
        </figure>
      </div>

      <nav className={styles.locations} aria-label={copy.cityLabel}>
        <div className={styles.locationBar}>
          <span className={styles.locationLabel}>
            <MapPin size={15} aria-hidden="true" />
            {th ? 'เริ่มจากทำเล' : 'Start with a city'}
          </span>
          <div className={styles.featuredCities}>
            {featuredLocations.map((slug) => {
              const location = propertyMapLocationPresets.find((item) => item.slug === slug)!
              return (
                <Link key={slug} href={getPropertyMapLocationHref(slug, mode)}>
                  {cityLabel(location)}
                </Link>
              )
            })}
          </div>
        </div>
        <details className={styles.moreCities}>
          <summary>
            {th ? 'ทำเลอื่น' : 'More cities'}
            <ChevronDown size={15} aria-hidden="true" />
          </summary>
          <div className={styles.cityGrid}>
            {propertyMapLocationPresets
              .filter((location) => !featuredLocations.includes(location.slug))
              .map((location) => (
                <Link key={location.slug} href={getPropertyMapLocationHref(location.slug, mode)}>
                  {cityLabel(location)}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              ))}
          </div>
        </details>
      </nav>
    </section>
  )
}
