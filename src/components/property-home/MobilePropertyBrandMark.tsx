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
    titleTh: 'ซื้อที่อยู่อาศัย',
    titleEn: 'Buy a home',
    descriptionTh: 'บ้าน คอนโด และที่ดินสำหรับอยู่อาศัย',
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
    titleTh: 'เช่าที่อยู่อาศัย',
    titleEn: 'Rent a home',
    descriptionTh: 'บ้านเช่า คอนโด และที่พักรายเดือน',
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
    titleTh: 'พื้นที่ทำธุรกิจ',
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
    <Popover className="relative shrink-0">
      <PopoverButton
        aria-label={locale === 'th' ? 'เลือกส่วนของเว็บไซต์' : 'Choose site section'}
        className="relative grid size-9 place-items-center overflow-hidden rounded-[13px] border border-[#0d352a] bg-[#123f32] shadow-[0_5px_14px_rgba(18,63,50,0.20)] transition focus-visible:ring-3 focus-visible:ring-[#176b50]/25 focus-visible:outline-none active:scale-95 dark:border-emerald-800 dark:bg-emerald-200"
      >
        <span className="font-serif text-[20px] leading-none font-bold text-white dark:text-emerald-950">M</span>
        <span className={`absolute end-1.5 top-1.5 size-1.5 rounded-full ring-1 ring-white/80 ${activeSite.dotTone}`} />
      </PopoverButton>

      <PopoverPanel
        transition
        anchor={{ to: 'bottom start', gap: 12 }}
        className="z-[80] w-[calc(100vw-1rem)] max-w-sm rounded-[26px] border border-neutral-200 bg-white p-2 shadow-[0_22px_65px_-18px_rgba(15,23,42,0.32)] transition duration-200 dark:border-neutral-700 dark:bg-neutral-900 data-closed:-translate-y-1 data-closed:opacity-0"
      >
        <div className="px-3 pt-2 pb-2.5">
          <p className="text-sm font-semibold text-neutral-950 dark:text-white">
            {locale === 'th' ? 'อยากค้นหาพื้นที่แบบไหน?' : 'What kind of space do you need?'}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {locale === 'th' ? 'เลือกโซนให้ตรงกับสิ่งที่กำลังหา' : 'Choose the section that matches your goal'}
          </p>
        </div>

        <div className="grid gap-1.5">
          {mobileSites.map((site) => {
            const Icon = site.icon
            const isActive = site.id === activeId
            return (
              <CloseButton
                key={site.id}
                as={Link}
                href={site.href}
                className={`flex min-h-[68px] items-center gap-3 rounded-[19px] border px-3 py-2.5 text-start transition active:scale-[0.99] ${
                  isActive ? site.activeTone : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'
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
