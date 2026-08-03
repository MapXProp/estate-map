'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { CloseButton, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Check, House, KeyRound, Store } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mobileSites = [
  {
    id: 'buy',
    href: '/buy',
    titleTh: 'ซื้อบ้านและที่อยู่อาศัย',
    titleEn: 'Buy a home',
    descriptionTh: 'บ้าน คอนโด ทาวน์โฮม และที่ดินสำหรับอยู่อาศัย',
    descriptionEn: 'Homes, condos and residential land',
    icon: House,
    iconTone: 'bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200',
    activeTone: 'border-[#acd0c2] bg-[#f2f8f5] dark:border-emerald-800 dark:bg-emerald-950/35',
    checkTone: 'bg-[#176b50] text-white dark:bg-emerald-200 dark:text-emerald-950',
    dotTone: 'bg-[#176b50]',
  },
  {
    id: 'rent',
    href: '/rent',
    titleTh: 'เช่าบ้านและที่พัก',
    titleEn: 'Rent a home',
    descriptionTh: 'บ้านเช่า คอนโด อพาร์ตเมนต์ และที่พักรายเดือน',
    descriptionEn: 'Rental homes, condos and monthly stays',
    icon: KeyRound,
    iconTone: 'bg-[#e5f3ed] text-[#2a8063] dark:bg-emerald-950 dark:text-emerald-200',
    activeTone: 'border-[#9acdb9] bg-[#eff8f4] dark:border-emerald-700 dark:bg-emerald-950/35',
    checkTone: 'bg-[#2a8063] text-white dark:bg-emerald-200 dark:text-emerald-950',
    dotTone: 'bg-[#72d0ad]',
  },
  {
    id: 'business',
    href: '/business',
    titleTh: 'หาพื้นที่ทำธุรกิจ',
    titleEn: 'Business spaces',
    descriptionTh: 'ร้านค้า ล็อกตลาด ออฟฟิศ โกดัง และพื้นที่ออกบูธ',
    descriptionEn: 'Shops, stalls, offices, warehouses and event spaces',
    icon: Store,
    iconTone: 'bg-[#ffe8df] text-[#f04b2f] dark:bg-orange-950 dark:text-orange-200',
    activeTone: 'border-[#f5ad98] bg-[#fff2ed] dark:border-orange-700 dark:bg-orange-950/35',
    checkTone: 'bg-[#f04b2f] text-white dark:bg-orange-200 dark:text-orange-950',
    dotTone: 'bg-[#ff6a3d]',
  },
] as const

const MobilePropertyBrandMark = () => {
  const pathname = usePathname()
  const { locale } = usePreferences()
  const activeId = pathname.startsWith('/rent') ? 'rent' : pathname.startsWith('/business') ? 'business' : 'buy'
  const activeSite = mobileSites.find((site) => site.id === activeId) ?? mobileSites[0]

  return (
    <Popover className="group relative shrink-0">
      <PopoverButton
        aria-label={locale === 'th' ? 'เลือกส่วนของเว็บไซต์' : 'Choose site section'}
        className="relative grid size-9 place-items-center overflow-hidden rounded-[13px] border border-[#0d352a] bg-[#123f32] shadow-[0_5px_14px_rgba(18,63,50,0.20)] transition duration-200 focus-visible:ring-3 focus-visible:ring-[#176b50]/25 focus-visible:outline-none active:scale-95 dark:border-emerald-800 dark:bg-emerald-200 data-open:shadow-[0_7px_20px_rgba(18,63,50,0.25)] data-open:ring-4 data-open:ring-[#176b50]/10"
      >
        <span className="font-serif text-[20px] leading-none font-bold text-white dark:text-emerald-950">M</span>
        <span className={`absolute end-1.5 top-1.5 size-1.5 rounded-full ring-1 ring-white/80 ${activeSite.dotTone}`} />
      </PopoverButton>

      <PopoverPanel
        transition
        anchor={{ to: 'bottom start', gap: 7 }}
        className="z-[80] w-[calc(100vw-1rem)] max-w-sm origin-top-left overflow-visible! rounded-[26px] border border-neutral-200 bg-white p-2 shadow-[0_22px_65px_-18px_rgba(15,23,42,0.32)] transition duration-200 ease-out dark:border-neutral-700 dark:bg-neutral-900 data-closed:-translate-y-1.5 data-closed:scale-[0.98] data-closed:opacity-0"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 14 8"
          className="pointer-events-none absolute -top-[7px] left-[25px] z-20 h-2 w-3.5 overflow-visible"
        >
          <path
            d="M1 8 7 1 13 8"
            className="fill-white stroke-neutral-300 stroke-1 dark:fill-neutral-900 dark:stroke-neutral-600"
            strokeLinejoin="round"
          />
        </svg>

        <div className="relative px-3 pt-2 pb-1.5">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {locale === 'th' ? 'เลือกสิ่งที่ต้องการค้นหา' : 'Choose what you want to find'}
          </p>
        </div>

        <div className="relative grid gap-1.5">
          {mobileSites.map((site) => {
            const Icon = site.icon
            const isActive = site.id === activeId
            return (
              <CloseButton
                key={site.id}
                as={Link}
                href={site.href}
                className={`flex min-h-[72px] items-center gap-3 rounded-[19px] border px-3 py-2.5 text-start transition duration-150 active:scale-[0.99] ${
                  isActive
                    ? site.activeTone
                    : 'border-neutral-100 bg-white hover:border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800'
                }`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${site.iconTone}`}>
                  <Icon className="size-[18px]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-950 dark:text-white">
                    {locale === 'th' ? site.titleTh : site.titleEn}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {locale === 'th' ? site.descriptionTh : site.descriptionEn}
                  </span>
                </span>
                {isActive && (
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full ${site.checkTone}`}>
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                )}
              </CloseButton>
            )
          })}
        </div>
      </PopoverPanel>
    </Popover>
  )
}

export default MobilePropertyBrandMark
