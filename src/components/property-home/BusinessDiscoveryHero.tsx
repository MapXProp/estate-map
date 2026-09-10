'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertyMapLocationHref, propertyMapLocationPresets } from '@/lib/propertyMapLocations'
import { ArrowDown, ArrowRight, ChevronDown, Map, MapPin, Store } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './BusinessDiscoveryHero.module.css'

const featuredLocations = ['bangkok', 'chiang-mai', 'chon-buri', 'phuket']
const photoSource = 'https://unsplash.com/photos/empty-cafe-dining-area-with-wooden-chairs-and-tables-A54YSu4ZpGc'

export default function BusinessDiscoveryHero() {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const cityLabel = (location: (typeof propertyMapLocationPresets)[number]) =>
    th ? (location.slug === 'bangkok' ? 'กรุงเทพฯ' : location.nameTh) : location.nameEn

  return (
    <section className={`container ${styles.section}`} aria-labelledby="business-hero-title">
      <div className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <Store size={15} strokeWidth={1.7} aria-hidden="true" />
            {th ? 'พื้นที่ทำธุรกิจ' : 'Spaces for business'}
          </p>
          <h1 id="business-hero-title" className={styles.title}>
            {th ? 'ทำเลที่ใช่' : 'The right space,'}
            <span>{th ? 'ให้ธุรกิจคุณ' : 'for your next chapter.'}</span>
          </h1>
          <p className={styles.description}>
            {th
              ? 'ร้านค้า ออฟฟิศ โกดัง และที่ดิน ในทำเลที่คุณเลือก'
              : 'Shops, offices, warehouses and land. Find your location.'}
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/properties/map?channel=business" className={styles.primary}>
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
            src="/images/business-hero/cafe-interior.jpg"
            alt=""
            fill
            preload
            sizes="(max-width: 639px) 30vw, (max-width: 1279px) 43vw, 530px"
            className={styles.photo}
          />
          <figcaption className={styles.photoCredit}>
            <a
              href={photoSource}
              target="_blank"
              rel="noreferrer"
              aria-label={
                th
                  ? 'ภาพบรรยากาศ โดย Haberdoedas บน Unsplash (เปิดแท็บใหม่)'
                  : 'Atmosphere photo by Haberdoedas on Unsplash (opens a new tab)'
              }
            >
              <span>{th ? 'ภาพบรรยากาศ · ' : 'Inspiration · '}</span>Unsplash
            </a>
          </figcaption>
        </figure>
      </div>

      <nav className={styles.locations} aria-label={th ? 'ค้นหาพื้นที่ธุรกิจตามเมือง' : 'Find business spaces by city'}>
        <div className={styles.locationBar}>
          <span className={styles.locationLabel}>
            <MapPin size={15} aria-hidden="true" />
            {th ? 'เริ่มจากทำเล' : 'Start with a city'}
          </span>
          <div className={styles.featuredCities}>
            {featuredLocations.map((slug) => {
              const location = propertyMapLocationPresets.find((item) => item.slug === slug)!
              return (
                <Link key={slug} href={getPropertyMapLocationHref(slug, 'business')}>
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
                <Link key={location.slug} href={getPropertyMapLocationHref(location.slug, 'business')}>
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
