'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyHomeSearch, { PropertySiteMode } from '@/components/property-home/PropertyHomeSearch'
import PropertyListingShowcase from '@/components/property-home/PropertyListingShowcase'
import heroImage from '@/images/hero-right-3.png'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Factory,
  House,
  LandPlot,
  MapPin,
  ShieldCheck,
  Store,
  Utensils,
  Warehouse,
} from 'lucide-react'
import Image, { getImageProps } from 'next/image'
import Link from 'next/link'

const propertyGroups = [
  {
    title: 'ที่อยู่อาศัย',
    titleEn: 'Residential',
    description: 'บ้าน คอนโด ทาวน์เฮาส์ อพาร์ตเมนต์ และหอพัก',
    descriptionEn: 'Houses, condos, townhouses, apartments and dorms',
    href: '/real-estate-categories/all?property_group=residential',
    icon: House,
    tone: 'bg-[#edf6f1] text-[#176b50] dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  {
    title: 'อยู่และทำธุรกิจ',
    titleEn: 'Live and work',
    description: 'ตึกแถว อาคารพาณิชย์ และโฮมออฟฟิศ',
    descriptionEn: 'Shophouses, commercial buildings and home offices',
    href: '/real-estate-categories/all?property_group=mixed_use',
    icon: Building2,
    tone: 'bg-[#f4f1e7] text-[#78672f] dark:bg-yellow-950/50 dark:text-yellow-200',
  },
  {
    title: 'ธุรกิจและอุตสาหกรรม',
    titleEn: 'Business and industrial',
    description: 'พื้นที่ค้าขาย สำนักงาน โกดัง และโรงงาน',
    descriptionEn: 'Retail spaces, offices, warehouses and factories',
    href: '/real-estate-categories/all?property_group=commercial',
    icon: Warehouse,
    tone: 'bg-[#eef1f7] text-[#455a82] dark:bg-blue-950/50 dark:text-blue-200',
  },
  {
    title: 'ที่ดิน',
    titleEn: 'Land',
    description: 'ที่ดินเปล่า หรือที่ดินพร้อมสิ่งปลูกสร้าง',
    descriptionEn: 'Vacant land or land with existing buildings',
    href: '/real-estate-categories/all?property_group=land',
    icon: LandPlot,
    tone: 'bg-[#f6eee7] text-[#8a5e3a] dark:bg-orange-950/50 dark:text-orange-200',
  },
]

const useCaseHighlights = [
  {
    title: 'เปิดร้านอาหารหรือคาเฟ่',
    titleEn: 'Open a restaurant or café',
    description: 'ค้นหาพื้นที่ที่มีน้ำ ท่อน้ำทิ้ง และรองรับครัว',
    descriptionEn: 'Find spaces with water, drainage and kitchen support',
    href: '/real-estate-categories/all?use_case=food_service',
    icon: Utensils,
  },
  {
    title: 'ทำสำนักงานหรือโฮมออฟฟิศ',
    titleEn: 'Set up an office or home office',
    description: 'เลือกได้ทั้งออฟฟิศโดยตรง บ้าน และตึกแถวที่อนุญาต',
    descriptionEn: 'Browse offices, houses and shophouses that allow work use',
    href: '/real-estate-categories/all?use_case=office',
    icon: Briefcase,
  },
  {
    title: 'เก็บหรือกระจายสินค้า',
    titleEn: 'Store or distribute goods',
    description: 'โกดัง คลังสินค้า และพื้นที่ที่รถขนส่งเข้าถึงได้',
    descriptionEn: 'Warehouses and storage spaces with delivery access',
    href: '/real-estate-categories/all?use_case=storage',
    icon: Warehouse,
  },
  {
    title: 'ผลิตสินค้าและโรงงาน',
    titleEn: 'Manufacturing and factories',
    description: 'พื้นที่อุตสาหกรรม พร้อมข้อมูลไฟฟ้าและการขนส่ง',
    descriptionEn: 'Industrial spaces with power and transport details',
    href: '/real-estate-categories/all?use_case=industrial',
    icon: Factory,
  },
  {
    title: 'เปิดร้านหรือพื้นที่ขายของ',
    titleEn: 'Open a shop or retail space',
    description: 'ร้าน Standalone คีออส ล็อกตลาด และพื้นที่ค้าปลีก',
    descriptionEn: 'Standalone shops, kiosks, market units and retail spaces',
    href: '/real-estate-categories/all?use_case=retail',
    icon: Store,
  },
  {
    title: 'สร้างบ้านหรือทำเกษตร',
    titleEn: 'Build a home or farm',
    description: 'ค้นหาที่ดินตามการใช้งาน ถนน และสาธารณูปโภค',
    descriptionEn: 'Find land by intended use, road access and utilities',
    href: '/real-estate-categories/all?use_case=agriculture',
    icon: LandPlot,
  },
]

const locations = [
  {
    name: 'กรุงเทพมหานคร',
    nameEn: 'Bangkok',
    count: '4,280 ประกาศ',
    image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=85&w=1200&auto=format&fit=crop',
  },
  {
    name: 'เชียงใหม่',
    nameEn: 'Chiang Mai',
    count: '1,240 ประกาศ',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=85&w=1200&auto=format&fit=crop',
  },
  {
    name: 'ชลบุรี',
    nameEn: 'Chon Buri',
    count: '1,865 ประกาศ',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=1200&auto=format&fit=crop',
  },
  {
    name: 'ภูเก็ต',
    nameEn: 'Phuket',
    count: '980 ประกาศ',
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=85&w=1200&auto=format&fit=crop',
  },
]

const heroContent = {
  all: {
    titleTh: 'พื้นที่ที่ใช่',
    titleEn: 'The right space',
    accentTh: 'สำหรับชีวิตและธุรกิจ',
    accentEn: 'for life and business',
    descriptionTh:
      'ไม่ว่าคุณจะหาบ้าน ตึกแถว ร้านค้า โกดัง หรือที่ดิน MapxProp ช่วยค้นหาจากสิ่งที่คุณต้องการทำได้โดยตรง',
    descriptionEn:
      'Whether you need a home, shophouse, retail space, warehouse or land, MapxProp helps you search by what you want to do.',
    popular: [
      ['คอนโดใกล้รถไฟฟ้า', 'Condos near transit'],
      ['ตึกแถวทำร้านอาหาร', 'Shophouses for restaurants'],
      ['โกดังสมุทรปราการ', 'Samut Prakan warehouses'],
      ['ที่ดินเชียงใหม่', 'Land in Chiang Mai'],
    ],
  },
  buy: {
    titleTh: 'บ้านที่ใช่',
    titleEn: 'A home that feels right',
    accentTh: 'สำหรับเป็นของคุณ',
    accentEn: 'made to be yours',
    descriptionTh: 'ค้นหาบ้าน คอนโด ทาวน์โฮม และที่ดินสำหรับอยู่อาศัย จากทำเลและงบที่คุณต้องการ',
    descriptionEn: 'Find homes, condos, townhouses and residential land in the location and budget that fit you.',
    popular: [
      ['ซื้อคอนโดใกล้รถไฟฟ้า', 'Buy a condo near transit'],
      ['บ้านเดี่ยวเชียงใหม่', 'Houses in Chiang Mai'],
      ['ทาวน์โฮมกรุงเทพ', 'Bangkok townhouses'],
      ['ที่ดินสร้างบ้าน', 'Land for building a home'],
    ],
  },
  rent: {
    titleTh: 'ที่อยู่ที่พอดี',
    titleEn: 'A place that fits',
    accentTh: 'กับทุกช่วงชีวิต',
    accentEn: 'every stage of life',
    descriptionTh: 'ค้นหาบ้านเช่า คอนโด อพาร์ตเมนต์ และห้องพักรายเดือน รวมถึงโรงแรมที่เปิดให้เช่าระยะยาว',
    descriptionEn: 'Find rental homes, condos, apartments, monthly rooms and hotels offering longer stays.',
    popular: [
      ['คอนโดเช่าอารีย์', 'Condos for rent in Ari'],
      ['ห้องพักรายเดือน', 'Monthly rooms'],
      ['อพาร์ตเมนต์ใกล้รถไฟฟ้า', 'Apartments near transit'],
      ['โรงแรมรายเดือน', 'Monthly hotel stays'],
    ],
  },
  business: {
    titleTh: 'พื้นที่ที่พร้อม',
    titleEn: 'Space that is ready',
    accentTh: 'ให้ธุรกิจเติบโต',
    accentEn: 'for business to grow',
    descriptionTh: 'ค้นหาร้านค้า ล็อกตลาด ออฟฟิศ โกดัง โรงงาน และพื้นที่ออกบูธ จากรูปแบบการใช้งานจริง',
    descriptionEn: 'Find shops, market stalls, offices, warehouses, factories and event spaces by real business needs.',
    popular: [
      ['ล็อกตลาดให้เช่า', 'Market stalls for rent'],
      ['พื้นที่ออกบูธในห้าง', 'Mall event spaces'],
      ['โกดังสมุทรปราการ', 'Samut Prakan warehouses'],
      ['ออฟฟิศกรุงเทพ', 'Bangkok offices'],
    ],
  },
} satisfies Record<
  PropertySiteMode,
  {
    titleTh: string
    titleEn: string
    accentTh: string
    accentEn: string
    descriptionTh: string
    descriptionEn: string
    popular: string[][]
  }
>

const siteThemes = {
  all: {
    hero: 'bg-[#edf4f0] dark:bg-[#10231d]',
    glow: 'bg-emerald-200/35 dark:bg-emerald-700/15',
    accent: 'text-[#176b50] dark:text-emerald-300',
    gradient: 'from-[#edf4f0] dark:from-[#10231d]',
    link: 'hover:text-[#176b50] dark:hover:text-emerald-300',
  },
  buy: {
    hero: 'bg-[#edf4f0] dark:bg-[#10231d]',
    glow: 'bg-emerald-200/35 dark:bg-emerald-700/15',
    accent: 'text-[#176b50] dark:text-emerald-300',
    gradient: 'from-[#edf4f0] dark:from-[#10231d]',
    link: 'hover:text-[#176b50] dark:hover:text-emerald-300',
  },
  rent: {
    hero: 'bg-[#eef7f3] dark:bg-[#11251e]',
    glow: 'bg-emerald-200/50 dark:bg-emerald-700/18',
    accent: 'text-[#2a8063] dark:text-emerald-300',
    gradient: 'from-[#eef7f3] dark:from-[#11251e]',
    link: 'hover:text-[#2a8063] dark:hover:text-emerald-300',
  },
  business: {
    hero: 'bg-[#fff0e9] dark:bg-[#301915]',
    glow: 'bg-orange-300/60 dark:bg-orange-700/20',
    accent: 'text-[#f04b2f] dark:text-orange-300',
    gradient: 'from-[#fff0e9] dark:from-[#301915]',
    link: 'hover:text-[#f04b2f] dark:hover:text-orange-300',
  },
} satisfies Record<
  PropertySiteMode,
  {
    hero: string
    glow: string
    accent: string
    gradient: string
    link: string
  }
>

const PropertyHomePrototype = ({ mode = 'buy' }: { mode?: PropertySiteMode }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const content = heroContent[mode]
  const theme = siteThemes[mode]
  const {
    props: { srcSet: desktopHeroSrcSet },
  } = getImageProps({
    alt: '',
    fill: true,
    quality: 78,
    sizes: '(max-width: 1024px) 50vw, 620px',
    src: heroImage,
  })

  return (
    <main className="overflow-hidden bg-white dark:bg-neutral-900">
      <section className="container pt-3 sm:pt-6 lg:pt-10">
        <div className={`relative overflow-hidden rounded-[32px] lg:rounded-[44px] ${theme.hero}`}>
          <div
            className={`pointer-events-none absolute -top-24 -left-24 size-72 rounded-full blur-3xl ${theme.glow}`}
          />
          <div className="grid min-[744px]:min-h-[360px] min-[744px]:grid-cols-[1.05fr_0.95fr] lg:min-h-[420px] lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-8 min-[744px]:px-8 min-[744px]:py-10 sm:px-8 sm:py-9 lg:px-12 lg:py-12 xl:px-14">
              <h1 className="max-w-2xl text-[2.15rem]/[1.08] font-semibold tracking-[-0.035em] text-neutral-950 min-[744px]:text-[2.4rem]/[1.08] sm:text-4xl/[1.08] lg:text-5xl/[1.08] xl:text-6xl/[1.08] dark:text-white">
                {isThai ? content.titleTh : content.titleEn}
                <br />
                <span className={theme.accent}>{isThai ? content.accentTh : content.accentEn}</span>
              </h1>
              <p className="mt-3 line-clamp-2 max-w-xl text-sm/6 text-neutral-600 min-[744px]:line-clamp-none sm:text-base/7 lg:text-lg/8 dark:text-neutral-300">
                {isThai ? content.descriptionTh : content.descriptionEn}
              </p>
              <div className="mt-6 hidden flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 min-[744px]:flex dark:text-neutral-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className={`size-4 ${theme.accent}`} />{' '}
                  {isThai ? 'ข้อมูลตรงประเภททรัพย์' : 'Property-specific details'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className={`size-4 ${theme.accent}`} />{' '}
                  {isThai ? 'มีสถานะยืนยันประกาศ' : 'Verified listing status'}
                </span>
              </div>
            </div>

            <div className="relative hidden min-h-full overflow-hidden min-[744px]:block">
              <picture>
                <source media="(min-width: 744px)" srcSet={desktopHeroSrcSet} sizes="(max-width: 1024px) 50vw, 620px" />
                {/* The transparent fallback prevents phones from downloading this desktop-only image. */}
                <img
                  src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                  alt={isThai ? 'พื้นที่อสังหาริมทรัพย์สำหรับชีวิตและธุรกิจ' : 'A space for life and business'}
                  fetchPriority="high"
                  className="absolute inset-0 size-full object-cover object-center"
                />
              </picture>
              <div className={`absolute inset-0 bg-gradient-to-r via-transparent to-transparent ${theme.gradient}`} />
            </div>
          </div>
        </div>

        <div className="relative z-20 mx-auto -mt-4 max-w-[1180px] px-2 min-[744px]:-mt-12 sm:-mt-6 sm:px-5 lg:-mt-14">
          <div className="hidden min-[744px]:block">
            <PropertyHomeSearch mode={mode} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {isThai ? 'ค้นหายอดนิยม:' : 'Popular searches:'}
            </span>
            {content.popular.map(([label, labelEn]) => (
              <Link
                key={label}
                href={`/real-estate-categories/all?q=${encodeURIComponent(label)}`}
                className={`hover:underline ${theme.link}`}
              >
                {isThai ? label : labelEn}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PropertyListingShowcase />

      <section className="container py-10 sm:py-14 lg:py-16">
        <div className="mb-6 flex items-end justify-between gap-5 sm:mb-8">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#176b50] dark:text-emerald-300">
              {isThai ? 'สำรวจจากทำเล' : 'Explore by location'}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              {isThai ? 'เมืองที่คนกำลังค้นหา' : 'Cities people are searching'}
            </h2>
          </div>
          <Link
            href="/properties/map"
            className="hidden items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-[#176b50] sm:inline-flex dark:text-neutral-300 dark:hover:text-emerald-300"
          >
            {isThai ? 'ดูบนแผนที่' : 'View map'} <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {locations.map((location) => (
            <Link
              key={location.name}
              href={`/real-estate-categories/all?location=${encodeURIComponent(location.name)}`}
              className="group relative w-[78vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-3xl bg-neutral-200 sm:w-auto sm:max-w-none"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  fill
                  src={location.image}
                  alt={isThai ? `อสังหาริมทรัพย์ใน${location.name}` : `Property in ${location.nameEn}`}
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="flex items-center gap-1.5 text-lg font-semibold">
                    <MapPin className="size-5" /> {isThai ? location.name : location.nameEn}
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    {isThai ? location.count : `${location.count.replace(' ประกาศ', '')} listings`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/properties/map"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-[#176b50] sm:hidden dark:text-neutral-300 dark:hover:text-emerald-300"
        >
          {isThai ? 'ดูบนแผนที่' : 'View map'} <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="container pt-16 pb-8 sm:pt-20 lg:pt-24">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#176b50] dark:text-emerald-300">
              {isThai ? 'เริ่มจากภาพใหญ่ก่อน' : 'Start with the big picture'}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              {isThai ? 'คุณกำลังมองหาพื้นที่แบบไหน' : 'What kind of space are you looking for?'}
            </h2>
          </div>
          <p className="hidden max-w-md text-right text-sm text-neutral-500 lg:block dark:text-neutral-400">
            {isThai
              ? 'เราแสดงเพียง 4 กลุ่มหลัก แล้วค่อยเปิดรายละเอียดเมื่อคุณต้องการ'
              : 'We start with four clear groups, then reveal the details when you need them.'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {propertyGroups.map((group) => {
            const Icon = group.icon
            return (
              <Link
                key={group.title}
                href={group.href}
                className="group flex min-h-44 flex-col rounded-3xl border border-neutral-200 p-5 transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-200/50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:shadow-black/20"
              >
                <span className={`flex size-12 items-center justify-center rounded-2xl ${group.tone}`}>
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-neutral-950 dark:text-white">
                  {isThai ? group.title : group.titleEn}
                </h3>
                <p className="mt-1 text-sm/6 text-neutral-500 dark:text-neutral-400">
                  {isThai ? group.description : group.descriptionEn}
                </p>
                <ArrowRight className="mt-auto size-5 translate-x-0 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-[#176b50] dark:group-hover:text-emerald-300" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="bg-[#f5f7f4] py-16 sm:py-20 lg:py-24 dark:bg-neutral-950/60">
        <div className="container">
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold text-[#176b50] dark:text-emerald-300">
              {isThai ? 'ไม่ต้องรู้ชื่อประเภททรัพย์ก่อนก็ได้' : 'You do not need to know the property category'}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              {isThai ? 'ค้นหาจากสิ่งที่คุณอยากทำ' : 'Search by what you want to do'}
            </h2>
            <p className="mt-3 text-neutral-500 dark:text-neutral-400">
              {isThai
                ? 'ระบบจะค้นข้ามประเภททรัพย์ให้ เช่น “เปิดร้านอาหาร” อาจพบทั้งตึกแถว พื้นที่ค้าขาย และที่ดินที่เหมาะสม'
                : 'We search across property types. For example, “open a restaurant” can match shophouses, retail spaces and suitable land.'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {useCaseHighlights.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4 transition hover:border-[#8fbfac] hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700"
                >
                  <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-[#e9f3ee] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                    <Icon className="size-6" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-950 dark:text-white">
                      {isThai ? item.title : item.titleEn}
                    </span>
                    <span className="mt-1 block text-sm/5 text-neutral-500 dark:text-neutral-400">
                      {isThai ? item.description : item.descriptionEn}
                    </span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-[#176b50] dark:text-neutral-600 dark:group-hover:text-emerald-300" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

export default PropertyHomePrototype
