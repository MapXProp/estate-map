'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import aboutPropertyCollage from '@/images/about-property-collage-v3.png'
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Building2,
  Heart,
  House,
  Map,
  MapPin,
  Shapes,
  Store,
  TrainFront,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './AboutPage.module.css'

type AboutPageContentProps = {
  listingCount: number
  propertyTypeCount: number
  discoveryChannelCount: number
}

const aboutCopy = {
  th: {
    eyebrow: 'รู้จัก MapxProp',
    title: 'พื้นที่ที่ใช่',
    titleSecond: 'เริ่มจากการค้นพบ',
    introduction: 'บ้านหลังใหม่ ห้องใกล้ที่ทำงาน หรือพื้นที่เริ่มธุรกิจ — ทุกการเริ่มต้นมีพื้นที่ของมัน',
    description:
      'MapxProp รวมการค้นหาและลงประกาศไว้ในที่เดียว ให้คุณเลือกพื้นที่ที่สนใจ พร้อมดูทำเลบนแผนที่ก่อนตัดสินใจ',
    explore: 'เริ่มค้นหาบนแผนที่',
    contact: 'คุยกับเรา',
    collageAlt: 'ภาพบ้าน ห้องพัก หน้าร้าน ออฟฟิศ และที่ดิน',
    collageCaption: 'พื้นที่สำหรับชีวิตและธุรกิจ',
    facts: 'MapxProp ในภาพรวม',
    listingLabel: 'ประกาศที่เผยแพร่',
    channelLabel: 'กลุ่มการค้นหาหลัก',
    propertyTypeLabel: 'ประเภททรัพย์',
    spacesEyebrow: 'ต่างความต้องการ ก็เจอพื้นที่ที่ใช่ได้',
    spacesTitle: 'คุณกำลังมองหาพื้นที่แบบไหน?',
    spacesDescription: 'เลือกจุดเริ่มต้นที่เข้ากับคุณ แล้วค่อยค้นหาให้ตรงใจ',
    homesTitle: 'พื้นที่สำหรับอยู่อาศัย',
    homesDescription: 'บ้าน คอนโด และที่ดิน สำหรับการเริ่มต้นบทใหม่',
    roomsTitle: 'ห้องที่เข้ากับชีวิต',
    roomsDescription: 'ห้องเช่า หอพัก และอพาร์ตเมนต์ ใกล้ชีวิตประจำวัน',
    businessTitle: 'พื้นที่ให้ธุรกิจเติบโต',
    businessDescription: 'ร้านค้า ออฟฟิศ โกดัง และพื้นที่สำหรับไอเดียของคุณ',
    toolsEyebrow: 'จากตัวเลือก สู่พื้นที่ที่ชอบ',
    toolsTitle: 'เห็นมากกว่ารูปประกาศ',
    mapTitle: 'ดูทำเลก่อนตัดสินใจ',
    mapDescription: 'สำรวจประกาศและพื้นที่รอบ ๆ บนแผนที่',
    transitTitle: 'เริ่มจากสถานีที่เดินทาง',
    transitDescription: 'เลือกสายและสถานีรถไฟฟ้า เพื่อค้นหาพื้นที่ใกล้เคียง',
    savedTitle: 'เก็บที่ชอบไว้ดูต่อ',
    savedDescription: 'กดหัวใจ แล้วกลับมาดูตัวเลือกของคุณได้ในที่เดียว',
  },
  en: {
    eyebrow: 'Get to know MapxProp',
    title: 'The right space.',
    titleSecond: 'A new beginning.',
    introduction: 'A new home, a room near work, or a place to start a business. Every beginning needs a space.',
    description:
      'MapxProp brings property discovery and listing together. Find spaces that interest you and explore their location on the map before deciding.',
    explore: 'Explore the map',
    contact: 'Talk to us',
    collageAlt: 'A collage of a house, a room, a storefront, an office and land',
    collageCaption: 'Spaces for life and business',
    facts: 'MapxProp at a glance',
    listingLabel: 'Published listings',
    channelLabel: 'Ways to explore',
    propertyTypeLabel: 'Property types',
    spacesEyebrow: 'Different needs. A space for each.',
    spacesTitle: 'What kind of space is next for you?',
    spacesDescription: 'Choose your starting point, then make the search your own.',
    homesTitle: 'A place to call home',
    homesDescription: 'Houses, condos and land for your next chapter.',
    roomsTitle: 'A room for your routine',
    roomsDescription: 'Monthly rooms, dorms and apartments for everyday life.',
    businessTitle: 'Room for your business',
    businessDescription: 'Shops, offices, warehouses and space for your ideas.',
    toolsEyebrow: 'From possibilities to favourites',
    toolsTitle: 'See beyond the listing photo',
    mapTitle: 'Get to know the location',
    mapDescription: 'Explore listings and the surrounding area on the map.',
    transitTitle: 'Start with your station',
    transitDescription: 'Choose a transit line and station to explore nearby spaces.',
    savedTitle: 'Keep your favourites',
    savedDescription: 'Tap the heart and return to your choices in one place.',
  },
} as const

const AboutPageContent = ({ listingCount, propertyTypeCount, discoveryChannelCount }: AboutPageContentProps) => {
  const { locale } = usePreferences()
  const t = aboutCopy[locale === 'th' ? 'th' : 'en']
  const formatNumber = (value: number) => value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')
  const facts = [
    { value: listingCount, label: t.listingLabel, icon: Building2 },
    { value: discoveryChannelCount, label: t.channelLabel, icon: MapPin },
    { value: propertyTypeCount, label: t.propertyTypeLabel, icon: Shapes },
  ]
  const spaces = [
    {
      href: '/homes',
      title: t.homesTitle,
      description: t.homesDescription,
      image: 'home-garden.jpg',
      icon: House,
      tone: 'homes',
    },
    {
      href: '/rooms',
      title: t.roomsTitle,
      description: t.roomsDescription,
      image: 'monthly-room-turquoise.jpg',
      icon: BedDouble,
      tone: 'rooms',
    },
    {
      href: '/business',
      title: t.businessTitle,
      description: t.businessDescription,
      image: 'office-daylight.jpg',
      icon: Store,
      tone: 'business',
    },
  ]
  const tools = [
    { href: '/properties/map', title: t.mapTitle, description: t.mapDescription, icon: Map },
    { href: '/all-transits', title: t.transitTitle, description: t.transitDescription, icon: TrainFront },
    { href: '/account-savelists', title: t.savedTitle, description: t.savedDescription, icon: Heart },
  ]

  return (
    <main className={styles.page}>
      <div className={`container ${styles.container}`}>
        <section className={styles.hero} aria-labelledby="about-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" />
              {t.eyebrow}
            </p>
            <h1 id="about-title">
              {t.title}
              <br />
              {t.titleSecond}
            </h1>
            <p className={styles.introduction}>{t.introduction}</p>
            <p className={styles.description}>{t.description}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/properties/map">
                <Map size={18} aria-hidden="true" />
                {t.explore}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className={styles.secondary} href="/contact">
                {t.contact}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <figure className={styles.heroVisual}>
            <div className={styles.visualAccent} aria-hidden="true" />
            <Image
              src={aboutPropertyCollage}
              alt={t.collageAlt}
              sizes="(max-width: 743px) 100vw, (max-width: 1280px) 55vw, 680px"
              className={styles.collage}
              preload
            />
            <figcaption className={styles.visualCaption}>
              <span>
                <MapPin size={18} aria-hidden="true" />
              </span>
              {t.collageCaption}
            </figcaption>
          </figure>
        </section>

        <section className={styles.facts} aria-label={t.facts}>
          {facts.map(({ value, label, icon: Icon }) => (
            <div className={styles.fact} key={label}>
              <Icon aria-hidden="true" />
              <div>
                <strong>{formatNumber(value)}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </section>

        <section className={styles.spaces} aria-labelledby="about-spaces-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>{t.spacesEyebrow}</p>
              <h2 id="about-spaces-title">{t.spacesTitle}</h2>
            </div>
            <p className={styles.sectionDescription}>{t.spacesDescription}</p>
          </div>
          <div className={styles.spaceGrid}>
            {spaces.map(({ href, title, description, image, icon: Icon, tone }) => (
              <Link href={href} key={href} className={styles.spaceCard} data-tone={tone}>
                <div className={styles.spacePhoto}>
                  <Image
                    src={`/images/channel-heroes/${image}`}
                    alt=""
                    fill
                    sizes="(max-width: 743px) 112px, (max-width: 1280px) 33vw, 410px"
                  />
                  <span className={styles.spaceIcon}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                </div>
                <div className={styles.spaceCopy}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className={styles.spaceArrow}>
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.tools} aria-labelledby="about-tools-title">
          <div className={styles.toolsHeading}>
            <p className={styles.sectionEyebrow}>{t.toolsEyebrow}</p>
            <h2 id="about-tools-title">{t.toolsTitle}</h2>
          </div>
          <div className={styles.toolGrid}>
            {tools.map(({ href, title, description, icon: Icon }) => (
              <Link href={href} key={href} className={styles.tool}>
                <span className={styles.toolIcon}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <ArrowUpRight className={styles.toolArrow} size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AboutPageContent
