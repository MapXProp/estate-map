'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import type { PropertySiteMode } from '@/components/property-home/PropertyHomeSearch'
import { getPropertyMapLocationHref } from '@/lib/propertyMapLocations'
import { ArrowRight, Building2, Compass, GraduationCap, Palmtree } from 'lucide-react'
import Link from 'next/link'

type ChannelMode = Exclude<PropertySiteMode, 'all'>

const copy = {
  homes: {
    eyebrowTh: 'เลือกทำเลก่อนเลือกบ้าน',
    eyebrowEn: 'Start with a location',
    titleTh: 'เริ่มจากเมืองที่อยากอยู่',
    titleEn: 'Start with a city you would live in',
    descriptionTh: 'ดูบ้านและคอนโดใกล้ตัวเมือง เดินทางสะดวก และใช้ชีวิตง่าย',
    descriptionEn: 'Explore homes and condos near city centres with convenient connections.',
  },
  rooms: {
    eyebrowTh: 'ทำเลสำหรับเช่ารายเดือน',
    eyebrowEn: 'Monthly rental locations',
    titleTh: 'หาห้องใกล้ที่เรียนและที่ทำงาน',
    titleEn: 'Find a room near work or university',
    descriptionTh: 'เริ่มจากตัวเมืองและแหล่งงาน แล้วค่อยเลือกห้องที่เหมาะกับงบ',
    descriptionEn: 'Start near city, work and study hubs, then choose a room that fits your budget.',
  },
  business: {
    eyebrowTh: 'ทำเลสำหรับธุรกิจ',
    eyebrowEn: 'Business locations',
    titleTh: 'เลือกเมืองและย่านเศรษฐกิจ',
    titleEn: 'Choose a city and economic hub',
    descriptionTh: 'ดูพื้นที่ใกล้ย่านการค้า แหล่งงาน อุตสาหกรรม และเมืองท่องเที่ยว',
    descriptionEn: 'Explore spaces near commercial, employment, industrial and tourism hubs.',
  },
} satisfies Record<
  ChannelMode,
  {
    eyebrowTh: string
    eyebrowEn: string
    titleTh: string
    titleEn: string
    descriptionTh: string
    descriptionEn: string
  }
>

const locationGroups = [
  {
    titleTh: 'กรุงเทพฯ และปริมณฑล',
    titleEn: 'Bangkok & vicinity',
    icon: Building2,
    locations: [
      { slug: 'bangkok', nameTh: 'กรุงเทพฯ', nameEn: 'Bangkok' },
      { slug: 'nonthaburi', nameTh: 'นนทบุรี', nameEn: 'Nonthaburi' },
      { slug: 'pathum-thani', nameTh: 'ปทุมธานี', nameEn: 'Pathum Thani' },
      { slug: 'samut-prakan', nameTh: 'สมุทรปราการ', nameEn: 'Samut Prakan' },
    ],
  },
  {
    titleTh: 'เมืองงานและการศึกษา',
    titleEn: 'Work & education hubs',
    icon: GraduationCap,
    locations: [
      { slug: 'chiang-mai', nameTh: 'เชียงใหม่', nameEn: 'Chiang Mai' },
      { slug: 'khon-kaen', nameTh: 'ขอนแก่น', nameEn: 'Khon Kaen' },
      { slug: 'chon-buri', nameTh: 'ชลบุรี', nameEn: 'Chon Buri' },
      { slug: 'rayong', nameTh: 'ระยอง', nameEn: 'Rayong' },
    ],
  },
  {
    titleTh: 'เมืองท่องเที่ยวและภูมิภาค',
    titleEn: 'Tourism & regional hubs',
    icon: Palmtree,
    locations: [
      { slug: 'hua-hin', nameTh: 'หัวหิน', nameEn: 'Hua Hin' },
      { slug: 'phuket', nameTh: 'ภูเก็ต', nameEn: 'Phuket' },
      { slug: 'surat-thani', nameTh: 'สุราษฎร์ธานี', nameEn: 'Surat Thani' },
      { slug: 'hat-yai', nameTh: 'หาดใหญ่', nameEn: 'Hat Yai' },
    ],
  },
]

const tones = {
  homes: {
    panel:
      'border-[#dcebe4] bg-gradient-to-br from-[#f3faf6] via-white to-[#edf7f2] dark:border-emerald-900/70 dark:from-[#10251e] dark:via-neutral-900 dark:to-[#11271f]',
    accent: 'text-[#176b50] dark:text-emerald-300',
    icon: 'bg-[#dcefe6] text-[#176b50] dark:bg-emerald-900/70 dark:text-emerald-200',
    button:
      'border-[#bcd9cc] bg-white text-[#176b50] hover:bg-[#e9f5ef] dark:border-emerald-800 dark:bg-neutral-900 dark:text-emerald-200 dark:hover:bg-emerald-950',
    link: 'hover:border-[#a9cdbd] hover:bg-[#edf7f2] hover:text-[#176b50] dark:hover:border-emerald-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-200',
  },
  rooms: {
    panel:
      'border-[#d8eaf4] bg-gradient-to-br from-[#f2f9fd] via-white to-[#ecf7fc] dark:border-sky-900/70 dark:from-[#10232d] dark:via-neutral-900 dark:to-[#102733]',
    accent: 'text-[#247fac] dark:text-sky-300',
    icon: 'bg-[#dceff9] text-[#247fac] dark:bg-sky-900/70 dark:text-sky-200',
    button:
      'border-[#b8dbea] bg-white text-[#247fac] hover:bg-[#eaf6fb] dark:border-sky-800 dark:bg-neutral-900 dark:text-sky-200 dark:hover:bg-sky-950',
    link: 'hover:border-[#a6d1e4] hover:bg-[#edf8fc] hover:text-[#247fac] dark:hover:border-sky-800 dark:hover:bg-sky-950/50 dark:hover:text-sky-200',
  },
  business: {
    panel:
      'border-[#f2ddd5] bg-gradient-to-br from-[#fff7f3] via-white to-[#fff0e9] dark:border-orange-900/70 dark:from-[#2d1a14] dark:via-neutral-900 dark:to-[#301b14]',
    accent: 'text-[#d95129] dark:text-orange-300',
    icon: 'bg-[#fde6dd] text-[#d95129] dark:bg-orange-900/70 dark:text-orange-200',
    button:
      'border-[#efc6b7] bg-white text-[#d95129] hover:bg-[#fff0e9] dark:border-orange-800 dark:bg-neutral-900 dark:text-orange-200 dark:hover:bg-orange-950',
    link: 'hover:border-[#e9bba9] hover:bg-[#fff2ec] hover:text-[#d95129] dark:hover:border-orange-800 dark:hover:bg-orange-950/50 dark:hover:text-orange-200',
  },
} satisfies Record<ChannelMode, Record<'panel' | 'accent' | 'icon' | 'button' | 'link', string>>

const ChannelLocationExplorer = ({ mode }: { mode: ChannelMode }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const content = copy[mode]
  const tone = tones[mode]

  return (
    <section className="container pt-3 sm:pt-4 lg:pt-5" aria-labelledby="location-explorer-title">
      <div
        className={`mx-auto grid max-w-[1180px] gap-4 rounded-[26px] border p-4 shadow-[0_12px_32px_rgba(16,24,40,0.055)] sm:p-5 lg:grid-cols-[0.85fr_2.15fr] lg:items-stretch lg:gap-5 ${tone.panel}`}
      >
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-5 lg:flex-col lg:justify-center">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
              <Compass className="size-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className={`text-xs font-semibold sm:text-sm ${tone.accent}`}>
                {isThai ? content.eyebrowTh : content.eyebrowEn}
              </p>
              <h1
                id="location-explorer-title"
                className="mt-0.5 text-xl/[1.25] font-semibold tracking-tight text-neutral-950 sm:text-2xl/[1.2] dark:text-white"
              >
                {isThai ? content.titleTh : content.titleEn}
              </h1>
              <p className="mt-1.5 max-w-md text-sm/5 text-neutral-600 dark:text-neutral-300">
                {isThai ? content.descriptionTh : content.descriptionEn}
              </p>
            </div>
          </div>

          <Link
            href={`/properties/map?channel=${mode}`}
            className={`mt-3 inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition hover:-translate-y-px sm:mt-0 lg:mt-4 ${tone.button}`}
          >
            {isThai ? 'ดูทั้งหมดบนแผนที่' : 'View all on map'}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <nav
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
          aria-label={isThai ? 'เลือกค้นหาอสังหาริมทรัพย์ตามเมือง' : 'Browse properties by city'}
        >
          {locationGroups.map((group) => {
            const GroupIcon = group.icon
            return (
              <div
                key={group.titleEn}
                className="w-[76vw] max-w-[290px] shrink-0 snap-start rounded-2xl border border-white/90 bg-white/75 p-3 shadow-[0_1px_2px_rgba(16,24,40,0.035)] sm:w-auto sm:max-w-none dark:border-white/10 dark:bg-neutral-900/55"
              >
                <p className="flex items-center gap-2 px-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  <GroupIcon className={`size-4 ${tone.accent}`} strokeWidth={1.8} />
                  {isThai ? group.titleTh : group.titleEn}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {group.locations.map((location) => (
                    <Link
                      key={location.slug}
                      href={getPropertyMapLocationHref(location.slug, mode)}
                      className={`group inline-flex min-w-0 items-center justify-between gap-1 rounded-xl border border-neutral-200/80 bg-white px-2.5 py-2 text-sm font-medium text-neutral-700 transition active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 ${tone.link}`}
                    >
                      <span className="truncate">{isThai ? location.nameTh : location.nameEn}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-current dark:text-neutral-600" />
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </div>
    </section>
  )
}

export default ChannelLocationExplorer
