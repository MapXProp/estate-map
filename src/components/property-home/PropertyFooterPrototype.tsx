'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import CookieSettingsLink from '@/components/privacy/CookieSettingsLink'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import SocialMediaLinks from '@/components/SocialMediaLinks'
import Logo from '@/shared/Logo'
import { CheckCircle2, ChevronDown, Flag, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import PropertyFooterPreferencesDialog from './PropertyFooterPreferencesDialog'
import PropertyListingCta from './PropertyListingCta'
import styles from './PropertyListingCta.module.css'

const footerNavigation = [
  {
    title: 'ค้นหาอสังหา',
    titleEn: 'Find property',
    links: [
      ['บ้าน คอนโด & ที่อยู่อาศัย', 'Homes & residential', '/homes'],
      ['ห้องเช่า & ที่พักรายเดือน', 'Rooms & monthly stays', '/rooms'],
      ['พื้นที่ทำธุรกิจ', 'Business spaces', '/business'],
      ['ประกาศขาย', 'Properties for sale', '/buy'],
      ['ประกาศเช่า', 'Properties for rent', '/rooms'],
      ['ประกาศทั้งหมด', 'All listings', '/real-estate-categories/all'],
      ['ดูบนแผนที่', 'View on map', '/properties/map'],
      ['อสังหาฯ ใกล้รถไฟฟ้า', 'Property near transit', '/all-transits'],
    ],
  },
  {
    title: 'เจ้าของทรัพย์',
    titleEn: 'Property owners',
    links: [
      ['ลงประกาศฟรี', 'List for free', '/add-listing/1?new=1'],
      ['องค์กรและบริษัทอสังหา', 'Property organizations', '/organizations'],
      ['จัดการบัญชี', 'Manage account', '/account'],
      ['ประกาศของฉัน', 'My listings', '/account-listings'],
      ['รายละเอียดลงประกาศฟรี', 'Free listing service', '/listing-plans'],
      ['สอบถามการลงประกาศ', 'Listing support', '/contact?topic=listing'],
    ],
  },
  {
    title: 'เกี่ยวกับ MapxProp',
    titleEn: 'About MapxProp',
    links: [
      ['เกี่ยวกับเรา', 'About us', '/about'],
      ['บทความและคำแนะนำ', 'Guides and articles', '/blog'],
      ['ติดต่อเรา', 'Contact us', '/contact'],
      ['แจ้งประกาศไม่ถูกต้อง', 'Report a listing', '/contact?topic=report-listing'],
    ],
  },
] as const

const popularLocations = [
  ['กรุงเทพมหานคร', 'Bangkok'],
  ['เชียงใหม่', 'Chiang Mai'],
  ['ชลบุรี', 'Chon Buri'],
  ['ภูเก็ต', 'Phuket'],
  ['ขอนแก่น', 'Khon Kaen'],
  ['นครราชสีมา', 'Nakhon Ratchasima'],
] as const

const NavigationLinks = ({ links, isThai }: { links: (typeof footerNavigation)[number]['links']; isThai: boolean }) => (
  <ul className="space-y-3">
    {links.map(([label, labelEn, href]) => (
      <li key={href}>
        <Link
          href={href}
          className="text-sm text-neutral-600 transition hover:text-[#176b50] dark:text-neutral-400 dark:hover:text-emerald-300"
        >
          {isThai ? <PropertyCategoryLabel label={label} /> : labelEn}
        </Link>
      </li>
    ))}
  </ul>
)

interface PropertyFooterPrototypeProps {
  showListingCta?: boolean
}

const PropertyFooterPrototype = ({ showListingCta = true }: PropertyFooterPrototypeProps) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  return (
    <footer className={styles.footer}>
      <div className="container pt-10 min-[744px]:pt-14 lg:pt-16">
        {showListingCta && <PropertyListingCta isThai={isThai} />}

        <div className="grid gap-10 py-12 min-[744px]:grid-cols-12 min-[744px]:gap-7 lg:py-14">
          <div className="min-[744px]:col-span-5 lg:col-span-4">
            <Logo className="w-24" />
            <p className="mt-5 max-w-sm text-sm/6 text-neutral-600 dark:text-neutral-400">
              {isThai
                ? 'ช่วยค้นหาพื้นที่สำหรับชีวิตและธุรกิจ ตั้งแต่บ้าน คอนโด ร้านค้า โกดัง โรงงาน ไปจนถึงที่ดิน'
                : 'Find spaces for life and business, from homes and condos to shops, warehouses, factories and land.'}
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#176b50] dark:text-emerald-300" />
                {isThai ? 'ข้อมูลตรงประเภททรัพย์' : 'Property-specific details'}
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#176b50] dark:text-emerald-300" />
                {isThai ? 'แสดงสถานะยืนยันประกาศ' : 'Verified listing status'}
              </p>
              <p className="flex items-center gap-2">
                <Flag className="size-4 text-[#176b50] dark:text-emerald-300" />
                {isThai ? 'แจ้งประกาศไม่ถูกต้องได้' : 'Easy listing reports'}
              </p>
            </div>
            <SocialMediaLinks className="mt-6" />
          </div>

          <div className="hidden min-[744px]:col-span-7 min-[744px]:grid min-[744px]:grid-cols-2 min-[744px]:gap-8 lg:col-span-8 lg:grid-cols-3">
            {footerNavigation.map((section) => (
              <div key={section.title}>
                <h3 className="mb-5 text-sm font-semibold text-neutral-950 dark:text-white">
                  {isThai ? section.title : section.titleEn}
                </h3>
                <NavigationLinks links={section.links} isThai={isThai} />
              </div>
            ))}
          </div>

          <div className="divide-y divide-neutral-200 border-y border-neutral-200 min-[744px]:hidden dark:divide-neutral-800 dark:border-neutral-800">
            {footerNavigation.map((section, index) => (
              <details key={section.title} className="group" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold text-neutral-950 marker:hidden dark:text-white">
                  {isThai ? section.title : section.titleEn}
                  <ChevronDown className="size-4 text-neutral-400 transition group-open:rotate-180" />
                </summary>
                <div className="pb-5">
                  <NavigationLinks links={section.links} isThai={isThai} />
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="border-y border-neutral-200 py-6 dark:border-neutral-800">
          <div className="flex flex-col gap-4 min-[744px]:flex-row min-[744px]:items-center">
            <p className="shrink-0 text-sm font-semibold text-neutral-950 dark:text-white">
              {isThai ? 'ทำเลยอดนิยม' : 'Popular locations'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {popularLocations.map(([location, locationEn]) => (
                <Link
                  key={location}
                  href={`/real-estate-categories/all?location=${encodeURIComponent(location)}`}
                  className="text-sm text-neutral-600 transition hover:text-[#176b50] dark:text-neutral-400 dark:hover:text-emerald-300"
                >
                  {isThai ? location : locationEn}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 pb-28 text-sm text-neutral-500 min-[744px]:flex-row min-[744px]:items-center min-[744px]:justify-between min-[744px]:pb-8 dark:text-neutral-500">
          <p>
            © 2026 MapxProp. {isThai ? 'พื้นที่ที่ใช่ สำหรับชีวิตและธุรกิจ' : 'The right space for life and business'}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/about" className="transition hover:text-neutral-900 dark:hover:text-white">
              {isThai ? 'เกี่ยวกับเรา' : 'About us'}
            </Link>
            <Link href="/contact" className="transition hover:text-neutral-900 dark:hover:text-white">
              {isThai ? 'ติดต่อเรา' : 'Contact us'}
            </Link>
            <Link href="/privacy" className="transition hover:text-neutral-900 dark:hover:text-white">
              {isThai ? 'ความเป็นส่วนตัว' : 'Privacy'}
            </Link>
            <Link href="/terms" className="transition hover:text-neutral-900 dark:hover:text-white">
              {isThai ? 'เงื่อนไขใช้งาน' : 'Terms'}
            </Link>
            <Link href="/cookies" className="transition hover:text-neutral-900 dark:hover:text-white">
              {isThai ? 'คุกกี้' : 'Cookies'}
            </Link>
            <CookieSettingsLink className="transition hover:text-neutral-900 dark:hover:text-white" />
            <PropertyFooterPreferencesDialog />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PropertyFooterPrototype
