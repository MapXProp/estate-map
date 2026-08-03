'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Check, ChevronDown, House, KeyRound, Store } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sites = [
  {
    id: 'buy',
    href: '/buy',
    labelTh: 'ซื้อ',
    labelEn: 'Buy',
    titleTh: 'ซื้อที่อยู่อาศัย',
    titleEn: 'Buy a home',
    descriptionTh: 'บ้าน คอนโด ทาวน์โฮม ตึกแถว และที่ดิน',
    descriptionEn: 'Homes, condos, townhouses and residential land',
    icon: House,
    tone: 'bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950/60 dark:text-emerald-200',
    activeTone: 'bg-[#f0f7f4] dark:bg-emerald-950/35',
    checkTone: 'text-[#176b50] dark:text-emerald-300',
    triggerTone: 'hover:border-[#a8c8bc] hover:bg-[#f7fbf9] dark:hover:border-emerald-700',
  },
  {
    id: 'rent',
    href: '/rent',
    labelTh: 'เช่า',
    labelEn: 'Rent',
    titleTh: 'เช่าที่อยู่อาศัย',
    titleEn: 'Rent a home',
    descriptionTh: 'บ้าน คอนโด อพาร์ตเมนต์ ตึกแถว และหอพัก',
    descriptionEn: 'Rental homes, condos, apartments and monthly stays',
    icon: KeyRound,
    tone: 'bg-[#e5f3ed] text-[#2a8063] dark:bg-emerald-950/60 dark:text-emerald-200',
    activeTone: 'bg-[#eff8f4] dark:bg-emerald-950/35',
    checkTone: 'text-[#2a8063] dark:text-emerald-300',
    triggerTone: 'hover:border-[#8bc9b2] hover:bg-[#f6fbf9] dark:hover:border-emerald-600',
  },
  {
    id: 'business',
    href: '/business',
    labelTh: 'ธุรกิจ',
    labelEn: 'Business',
    titleTh: 'หาพื้นที่ค้าขาย',
    titleEn: 'Business spaces',
    descriptionTh: 'พื้นที่ขายของ ล็อคในตลาด ออฟฟิศ และที่ดิน',
    descriptionEn: 'Shops, market stalls, offices, warehouses and event spaces',
    icon: Store,
    tone: 'bg-[#ffe8df] text-[#f04b2f] dark:bg-orange-950/50 dark:text-orange-200',
    activeTone: 'bg-[#fff2ed] dark:bg-orange-950/35',
    checkTone: 'text-[#f04b2f] dark:text-orange-300',
    triggerTone: 'hover:border-[#f59a80] hover:bg-[#fff8f5] dark:hover:border-orange-600',
  },
] as const

const PropertySiteSwitcher = () => {
  const pathname = usePathname()
  const { locale } = usePreferences()
  const activeId = pathname.startsWith('/rent') ? 'rent' : pathname.startsWith('/business') ? 'business' : 'buy'
  const activeSite = sites.find((site) => site.id === activeId) ?? sites[0]
  const ActiveIcon = activeSite.icon

  return (
    <Popover className="relative hidden min-[744px]:block">
      <PopoverButton
        aria-label={locale === 'th' ? 'เลือกส่วนของเว็บไซต์' : 'Choose site section'}
        className={`group flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-2.5 shadow-sm transition focus-visible:ring-3 focus-visible:ring-neutral-400/20 focus-visible:outline-none min-[860px]:px-3 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 ${activeSite.triggerTone}`}
      >
        <span className={`grid size-7 shrink-0 place-items-center rounded-full ${activeSite.tone}`}>
          <ActiveIcon className="size-3.5" strokeWidth={1.9} />
        </span>
        <span className="hidden text-sm font-semibold whitespace-nowrap text-neutral-800 min-[768px]:inline min-[1100px]:hidden dark:text-neutral-100">
          {locale === 'th' ? activeSite.labelTh : activeSite.labelEn}
        </span>
        <span className="hidden text-sm font-semibold whitespace-nowrap text-neutral-800 min-[1100px]:inline dark:text-neutral-100">
          {locale === 'th' ? activeSite.titleTh : activeSite.titleEn}
        </span>
        <ChevronDown className="hidden size-3.5 text-neutral-400 transition group-data-open:rotate-180 min-[900px]:block" />
      </PopoverButton>

      <PopoverPanel
        transition
        anchor={{ to: 'bottom end', gap: 12 }}
        className="z-50 w-80 max-w-[calc(100vw-1rem)] rounded-3xl border border-neutral-200 bg-white p-2 shadow-[0_22px_65px_-20px_rgba(15,23,42,0.32)] transition duration-200 dark:border-neutral-700 dark:bg-neutral-900 data-closed:translate-y-1 data-closed:opacity-0"
      >
        <div className="px-3 pt-2 pb-2">
          <p className="text-sm font-semibold text-neutral-950 dark:text-white">
            {locale === 'th' ? 'ท่านกำลังมองหา?' : 'What are you looking for?'}
          </p>
          <p className="font-sarabun mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {locale === 'th'
              ? 'เลือกสิ่งที่ต้องการค้นหาตามหมวด'
              : 'Choose what you want to find by category'}
          </p>
        </div>

        <div className="grid gap-1">
          {sites.map((site) => {
            const Icon = site.icon
            const isActive = site.id === activeId
            return (
              <Link
                key={site.id}
                href={site.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                  isActive ? site.activeTone : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${site.tone}`}>
                  <Icon className="size-4.5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-white">
                    {locale === 'th' ? site.titleTh : site.titleEn}
                  </span>
                  <span className="font-sarabun mt-0.5 block text-xs/5 text-neutral-500 dark:text-neutral-400">
                    {locale === 'th' ? site.descriptionTh : site.descriptionEn}
                  </span>
                </span>
                {isActive && <Check className={`size-4 shrink-0 ${site.checkTone}`} strokeWidth={2.2} />}
              </Link>
            )
          })}
        </div>
      </PopoverPanel>
    </Popover>
  )
}

export default PropertySiteSwitcher
