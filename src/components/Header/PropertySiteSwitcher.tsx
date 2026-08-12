'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BedDouble, Check, ChevronDown, House, Store } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sites = [
  {
    id: 'homes',
    href: '/homes',
    labelTh: 'บ้าน',
    labelEn: 'Homes',
    titleTh: 'บ้าน คอนโด & ที่อยู่อาศัย',
    titleEn: 'Homes & residential',
    descriptionTh: 'บ้าน คอนโด ทาวน์โฮม และที่ดิน ทั้งซื้อและเช่า',
    descriptionEn: 'Homes, condos, townhouses and land, for sale or rent',
    icon: House,
    tone: 'bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950/60 dark:text-emerald-200',
    activeTone: 'bg-[#f0f7f4] dark:bg-emerald-950/35',
    checkTone: 'text-[#176b50] dark:text-emerald-300',
    triggerTone: 'hover:border-[#a8c8bc] hover:bg-[#f7fbf9] dark:hover:border-emerald-700',
  },
  {
    id: 'rooms',
    href: '/rooms',
    labelTh: 'ห้องเช่า',
    labelEn: 'Rooms',
    titleTh: 'ห้องเช่า & ที่พักรายเดือน',
    titleEn: 'Rooms & monthly stays',
    descriptionTh: 'อพาร์ตเมนต์ หอพัก แฟลต และที่พักระยะยาว',
    descriptionEn: 'Apartments, dorms, flats and long-stay rooms',
    icon: BedDouble,
    tone: 'bg-[#EFF8FD] text-[#2D8FC7] dark:bg-[#102b3a] dark:text-[#8fd4f4]',
    activeTone: 'bg-[#E0F2FC] dark:bg-[#102b3a]',
    checkTone: 'text-[#2D8FC7] dark:text-[#8fd4f4]',
    triggerTone: 'hover:border-[#9ED4ED] hover:bg-[#EFF8FD] dark:hover:border-[#356d89]',
  },
  {
    id: 'business',
    href: '/business',
    labelTh: 'ธุรกิจ',
    labelEn: 'Business',
    titleTh: 'พื้นที่ทำธุรกิจ',
    titleEn: 'Business spaces',
    descriptionTh: 'พื้นที่ขายของ ล็อคในตลาด ออฟฟิศ และที่ดิน',
    descriptionEn: 'Shops, market stalls, offices, warehouses and event spaces',
    icon: Store,
    tone: 'bg-[#FFF2EC] text-[#E65A2F] dark:bg-[#351B14] dark:text-[#FFC2AD]',
    activeTone: 'bg-[#FFE7DC] dark:bg-[#351B14]',
    checkTone: 'text-[#E65A2F] dark:text-[#FFC2AD]',
    triggerTone: 'hover:border-[#F2A086] hover:bg-[#FFF2EC] dark:hover:border-[#754032]',
  },
] as const

const PropertySiteSwitcher = () => {
  const pathname = usePathname()
  const { locale } = usePreferences()
  const activeId =
    pathname.startsWith('/rooms') || pathname.startsWith('/rent')
      ? 'rooms'
      : pathname.startsWith('/business')
        ? 'business'
        : 'homes'
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
          {locale === 'th' ? <PropertyCategoryLabel label={activeSite.titleTh} /> : activeSite.titleEn}
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
          <p className="mt-0.5 font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
            {locale === 'th' ? 'เลือกสิ่งที่ต้องการค้นหาตามหมวด' : 'Choose what you want to find by category'}
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
                    {locale === 'th' ? <PropertyCategoryLabel label={site.titleTh} /> : site.titleEn}
                  </span>
                  <span className="mt-0.5 block font-sarabun text-xs/5 text-neutral-500 dark:text-neutral-400">
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
