'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyHomeSearch, { PropertySiteMode } from '@/components/property-home/PropertyHomeSearch'
import PropertyListingShowcase from '@/components/property-home/PropertyListingShowcase'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import heroImage from '@/images/hero-right-3.png'
import {
  ArrowRight,
  BedDouble,
  Briefcase,
  CheckCircle2,
  Factory,
  House,
  LandPlot,
  ShieldCheck,
  Store,
  Utensils,
  Warehouse,
} from 'lucide-react'
import { getImageProps } from 'next/image'
import Link from 'next/link'

const discoveryModes = [
  {
    title: 'บ้าน คอนโด & ที่อยู่อาศัย',
    titleEn: 'Homes & residential',
    description: 'ค้นหาบ้าน คอนโด ทาวน์โฮม และที่ดิน ทั้งประกาศขายและให้เช่า',
    descriptionEn: 'Find homes, condos, townhouses and land, for sale or rent',
    href: '/homes',
    icon: House,
    tone: 'bg-[#edf6f1] text-[#176b50] dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  {
    title: 'ห้องเช่า & ที่พักรายเดือน',
    titleEn: 'Rooms & monthly stays',
    description: 'ค้นหาอพาร์ตเมนต์ หอพัก แฟลต ห้องเช่า และที่พักระยะยาว',
    descriptionEn: 'Find apartments, dorms, flats, rooms and long-stay accommodation',
    href: '/rooms',
    icon: BedDouble,
    tone: 'bg-[#EFF8FD] text-[#2D8FC7] dark:bg-[#102b3a] dark:text-[#8fd4f4]',
  },
  {
    title: 'พื้นที่ทำธุรกิจ',
    titleEn: 'Business spaces',
    description: 'ค้นหาร้านค้า ล็อกตลาด ออฟฟิศ โกดัง โรงงาน และพื้นที่ชั่วคราว',
    descriptionEn: 'Find shops, stalls, offices, warehouses, factories and temporary spaces',
    href: '/business',
    icon: Store,
    tone: 'bg-[#FFF2EC] text-[#E65A2F] dark:bg-[#351B14] dark:text-[#FFC2AD]',
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
  homes: {
    titleTh: 'บ้านที่ใช่',
    titleEn: 'A home that feels right',
    accentTh: 'ไม่ว่าจะซื้อหรือเช่า',
    accentEn: 'whether buying or renting',
    descriptionTh: 'ค้นหาบ้าน คอนโด ทาวน์โฮม และที่ดินสำหรับอยู่อาศัย โดยยังไม่ต้องตัดสินใจก่อนว่าจะซื้อหรือเช่า',
    descriptionEn: 'Find homes, condos, townhouses and residential land without deciding whether to buy or rent first.',
    popular: [
      ['คอนโดใกล้รถไฟฟ้า', 'Condos near transit'],
      ['บ้านเดี่ยวเชียงใหม่', 'Houses in Chiang Mai'],
      ['ทาวน์โฮมกรุงเทพ', 'Bangkok townhouses'],
      ['ที่ดินสร้างบ้าน', 'Land for building a home'],
    ],
  },
  rooms: {
    titleTh: 'ห้องที่พอดี',
    titleEn: 'A room that fits',
    accentTh: 'สำหรับอยู่เป็นเดือน',
    accentEn: 'for monthly living',
    descriptionTh: 'ค้นหาห้องเช่า อพาร์ตเมนต์ หอพัก แฟลต เซอร์วิสอพาร์ตเมนต์ และโรงแรมรายเดือน',
    descriptionEn: 'Find rental rooms, apartments, dorms, flats, serviced apartments and monthly hotels.',
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
  homes: {
    hero: 'bg-[#edf4f0] dark:bg-[#10231d]',
    glow: 'bg-emerald-200/35 dark:bg-emerald-700/15',
    accent: 'text-[#176b50] dark:text-emerald-300',
    gradient: 'from-[#edf4f0] dark:from-[#10231d]',
    link: 'hover:text-[#176b50] dark:hover:text-emerald-300',
  },
  rooms: {
    hero: 'bg-[#EFF8FD] dark:bg-[#102b3a]',
    glow: 'bg-sky-200/55 dark:bg-sky-700/18',
    accent: 'text-[#2D8FC7] dark:text-[#8fd4f4]',
    gradient: 'from-[#EFF8FD] dark:from-[#102b3a]',
    link: 'hover:text-[#1676AE] dark:hover:text-[#8fd4f4]',
  },
  business: {
    hero: 'bg-[#FFF2EC] dark:bg-[#351B14]',
    glow: 'bg-[#FFD0BE]/70 dark:bg-[#BE3E1B]/20',
    accent: 'text-[#E65A2F] dark:text-[#FFC2AD]',
    gradient: 'from-[#FFF2EC] dark:from-[#351B14]',
    link: 'hover:text-[#D94A22] dark:hover:text-[#FFC2AD]',
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

const zoneIntroContent = {
  homes: {
    titleTh: 'บ้าน คอนโด & ที่อยู่อาศัย',
    titleEn: 'Homes & residential',
  },
  rooms: {
    titleTh: 'ห้องเช่า & ที่พักรายเดือน',
    titleEn: 'Rooms & monthly stays',
  },
  business: {
    titleTh: 'พื้นที่ทำธุรกิจ',
    titleEn: 'Business spaces',
  },
} satisfies Record<Exclude<PropertySiteMode, 'all'>, { titleTh: string; titleEn: string }>

const PropertyHomePrototype = ({ mode = 'homes' }: { mode?: PropertySiteMode }) => {
  const { locale, setPropertyZone } = usePreferences()
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
      {mode === 'all' ? (
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
                  <source
                    media="(min-width: 744px)"
                    srcSet={desktopHeroSrcSet}
                    sizes="(max-width: 1024px) 50vw, 620px"
                  />
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
      ) : (
        <section className="container pt-2 sm:pt-4 lg:pt-5">
          <div className={`relative overflow-hidden rounded-[22px] px-5 py-4 sm:px-6 sm:py-5 lg:px-8 ${theme.hero}`}>
            <div
              className={`pointer-events-none absolute -top-20 -left-12 size-48 rounded-full blur-3xl ${theme.glow}`}
            />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${theme.accent}`}>
                  {isThai ? 'สำรวจพื้นที่ที่ตรงกับคุณ' : 'Explore your property zone'}
                </p>
                <h1 className="mt-0.5 text-2xl font-semibold tracking-[-0.025em] text-neutral-950 sm:text-3xl dark:text-white">
                  {isThai ? zoneIntroContent[mode].titleTh : zoneIntroContent[mode].titleEn}
                </h1>
                <p className="mt-1 hidden max-w-2xl truncate text-sm text-neutral-500 sm:block dark:text-neutral-400">
                  {isThai ? content.descriptionTh : content.descriptionEn}
                </p>
              </div>
              <div className="flex max-w-full gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {content.popular.slice(0, 3).map(([label, labelEn]) => (
                  <Link
                    key={label}
                    href={`/properties/map?q=${encodeURIComponent(label)}`}
                    className="shrink-0 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm transition hover:bg-white hover:text-neutral-950 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {isThai ? label : labelEn}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <PropertyListingShowcase mode={mode} compactStart={mode !== 'all'} />

      <section className="container pt-16 pb-8 sm:pt-20 lg:pt-24">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#176b50] dark:text-emerald-300">
              {isThai ? 'เลือกตามสิ่งที่ต้องการจริง' : 'Start with what you really need'}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              {isThai ? 'เริ่มค้นหาจาก 3 เส้นทางหลัก' : 'Start with three clear paths'}
            </h2>
          </div>
          <p className="hidden max-w-md text-right text-sm text-neutral-500 lg:block dark:text-neutral-400">
            {isThai
              ? 'ทรัพย์หนึ่งรายการอาจอยู่ได้มากกว่าหนึ่งเส้นทาง เพื่อให้คุณพบสิ่งที่ตรงใจเร็วขึ้น'
              : 'One property can appear in more than one path, helping you find the right fit faster.'}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {discoveryModes.map((group) => {
            const Icon = group.icon
            return (
              <Link
                key={group.title}
                href={group.href}
                onClick={() => setPropertyZone(group.href.slice(1) as 'homes' | 'rooms' | 'business')}
                className="group flex min-h-44 flex-col rounded-3xl border border-neutral-200 p-5 transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-200/50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:shadow-black/20"
              >
                <span className={`flex size-12 items-center justify-center rounded-2xl ${group.tone}`}>
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-neutral-950 dark:text-white">
                  {isThai ? <PropertyCategoryLabel label={group.title} /> : group.titleEn}
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
