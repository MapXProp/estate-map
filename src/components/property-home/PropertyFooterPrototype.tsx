'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import Logo from '@/shared/Logo'
import { ArrowRight, CheckCircle2, ChevronDown, Flag, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const footerNavigation = [
  {
    title: 'ค้นหาอสังหา',
    titleEn: 'Find property',
    links: [
      ['ซื้ออสังหา', 'Buy property', '/real-estate-categories/all?offer_type=sale'],
      ['เช่าอสังหา', 'Rent property', '/real-estate-categories/all?offer_type=rent'],
      ['เซ้งกิจการ', 'Business transfers', '/real-estate-categories/all?offer_type=business_transfer'],
      ['ประกาศใหม่', 'New listings', '/real-estate-categories/all?sort=newest'],
      ['ดูบนแผนที่', 'View on map', '/real-estate-categories-map/all'],
    ],
  },
  {
    title: 'เจ้าของทรัพย์',
    titleEn: 'Property owners',
    links: [
      ['ลงประกาศฟรี', 'List for free', '/add-listing/1'],
      ['จัดการบัญชี', 'Manage account', '/account'],
      ['รายการที่บันทึก', 'Saved listings', '/account-savelists'],
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

const NavigationLinks = ({
  links,
  isThai,
}: {
  links: (typeof footerNavigation)[number]['links']
  isThai: boolean
}) => (
  <ul className="space-y-3">
    {links.map(([label, labelEn, href]) => (
      <li key={href}>
        <Link
          href={href}
          className="text-sm text-neutral-600 transition hover:text-[#176b50] dark:text-neutral-400 dark:hover:text-emerald-300"
        >
          {isThai ? label : labelEn}
        </Link>
      </li>
    ))}
  </ul>
)

const PropertyFooterPrototype = () => {
  const { locale, currency } = usePreferences()
  const isThai = locale === 'th'

  return (
    <footer className="bg-[#f5f7f4] dark:bg-neutral-950">
      <div className="container pt-10 min-[744px]:pt-14 lg:pt-16">
        <div className="relative overflow-hidden rounded-[30px] bg-[#123f32] px-6 py-9 text-white min-[744px]:flex min-[744px]:items-center min-[744px]:justify-between min-[744px]:gap-8 min-[744px]:px-9 min-[744px]:py-10 lg:px-12 dark:bg-emerald-950">
          <div className="pointer-events-none absolute -top-20 right-14 size-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-16 -bottom-36 size-72 rounded-full bg-emerald-300/10" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold text-emerald-200">
              {isThai ? 'สำหรับเจ้าของทรัพย์และผู้ประกอบการ' : 'For property owners and businesses'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight min-[744px]:text-3xl">
              {isThai ? 'มีพื้นที่ดี ๆ ที่อยากให้คนค้นพบ?' : 'Have a great space people should discover?'}
            </h2>
            <p className="mt-2 max-w-xl text-sm/6 text-emerald-50/75 min-[744px]:text-base/7">
              {isThai
                ? 'ลงรายละเอียดครั้งเดียว ให้ผู้ซื้อและผู้เช่าค้นพบทรัพย์ของคุณจากประเภทและการใช้งานที่ตรงกัน'
                : 'Add the details once and help buyers or tenants discover your property by type and intended use.'}
            </p>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-3 min-[744px]:mt-0 min-[744px]:shrink-0">
            <Link
              href="/add-listing/1"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
            >
              {isThai ? 'ลงประกาศฟรี' : 'List for free'}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact?topic=listing"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {isThai ? 'สอบถามเรา' : 'Contact us'}
            </Link>
          </div>
        </div>

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
            <span className="rounded-full border border-neutral-200 px-3 py-1.5 dark:border-neutral-800">
              {isThai ? 'ภาษาไทย' : 'English'} · {currency}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PropertyFooterPrototype
