'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import { getPropertyZoneFromPathname } from '@/lib/propertyZone'
import { CloseButton, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BedDouble, Check, House, Store } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mobileSites = [
  {
    id: 'homes',
    href: '/homes',
    titleTh: 'บ้าน คอนโด & ที่อยู่อาศัย',
    titleEn: 'Homes & residential',
    descriptionTh: 'บ้าน คอนโด ทาวน์โฮม และที่ดิน ทั้งซื้อและเช่า',
    descriptionEn: 'Homes, condos and land, for sale or rent',
    icon: House,
    iconTone: 'bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200',
    activeTone: 'border-transparent bg-[#f2f8f5] dark:border-transparent dark:bg-emerald-950/35',
    checkTone: 'bg-[#176b50] text-white dark:bg-emerald-200 dark:text-emerald-950',
    dotTone: 'bg-[#176b50]',
  },
  {
    id: 'rooms',
    href: '/rooms',
    titleTh: 'ห้องเช่า & ที่พักรายเดือน',
    titleEn: 'Rooms & monthly stays',
    descriptionTh: 'อพาร์ตเมนต์ หอพัก แฟลต และที่พักระยะยาว',
    descriptionEn: 'Apartments, dorms, flats and long-stay rooms',
    icon: BedDouble,
    iconTone: 'bg-[#EFF8FD] text-[#2D8FC7] dark:bg-[#102b3a] dark:text-[#8fd4f4]',
    activeTone: 'border-transparent bg-[#E0F2FC] dark:border-transparent dark:bg-[#102b3a]',
    checkTone: 'bg-[#2D8FC7] text-white dark:bg-[#8fd4f4] dark:text-[#102b3a]',
    dotTone: 'bg-[#2D8FC7]',
  },
  {
    id: 'business',
    href: '/business',
    titleTh: 'พื้นที่ทำธุรกิจ',
    titleEn: 'Business spaces',
    descriptionTh: 'พื้นที่ขายของ ล็อคในตลาด ออฟฟิศ และที่ดิน',
    descriptionEn: 'Shops, stalls, offices, warehouses and event spaces',
    icon: Store,
    iconTone: 'bg-[#FFF2EC] text-[#E65A2F] dark:bg-[#351B14] dark:text-[#FFC2AD]',
    activeTone: 'border-transparent bg-[#FFE7DC] dark:border-transparent dark:bg-[#351B14]',
    checkTone: 'bg-[#E65A2F] text-white dark:bg-[#FFC2AD] dark:text-[#351B14]',
    dotTone: 'bg-[#E65A2F]',
  },
] as const

const MobilePropertyBrandMark = () => {
  const pathname = usePathname()
  const { locale, propertyZone, setPropertyZone } = usePreferences()
  const activeId = getPropertyZoneFromPathname(pathname) ?? propertyZone
  const activeSite = mobileSites.find((site) => site.id === activeId) ?? mobileSites[0]

  return (
    <Popover className="group relative shrink-0">
      <PopoverButton
        aria-label={locale === 'th' ? 'เลือกส่วนของเว็บไซต์' : 'Choose site section'}
        className="relative grid size-9 shrink-0 place-items-center rounded-[13px] transition duration-200 focus-visible:ring-3 focus-visible:ring-[#176b50]/25 focus-visible:outline-none active:scale-95 data-open:shadow-[0_7px_20px_rgba(18,63,50,0.20)] data-open:ring-4 data-open:ring-[#176b50]/10"
      >
        <span className="grid size-9 place-items-center overflow-hidden rounded-[13px] border border-[#0d352a]/90 bg-[#123f32] shadow-[0_5px_14px_rgba(18,63,50,0.18)]">
          <Image
            src="/mapxprop-mobile-mark.png"
            alt=""
            width={34}
            height={34}
            sizes="34px"
            className="size-[34px] translate-x-[0.5px] -translate-y-[0.5px] object-contain"
            priority
          />
        </span>
        <span
          aria-hidden="true"
          className={`absolute end-1 top-1 size-[7px] rounded-full shadow-sm ring-2 ring-[#F2EDE2] ${activeSite.dotTone}`}
        />
      </PopoverButton>

      <PopoverPanel
        transition
        anchor={{ to: 'bottom', gap: 7, padding: 8 }}
        className="z-[80] w-[calc(100vw-1rem)] max-w-none! origin-top-left overflow-visible! rounded-[26px] border border-neutral-200 bg-white p-2 shadow-[0_22px_65px_-18px_rgba(15,23,42,0.32)] transition duration-200 ease-out dark:border-neutral-700 dark:bg-neutral-900 data-closed:-translate-y-1.5 data-closed:scale-[0.98] data-closed:opacity-0"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-[5px] left-[20px] z-20 size-[10px] rotate-45 border-t border-l border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
        />

        <div className="relative px-3 pt-2 pb-2">
          <p className="text-sm font-semibold text-neutral-950 dark:text-white">
            {locale === 'th' ? 'ท่านกำลังมองหา?' : 'What are you looking for?'}
          </p>
          <p className="mt-0.5 font-sarabun text-xs text-neutral-400 dark:text-neutral-500">
            {locale === 'th' ? 'เลือกสิ่งที่ต้องการค้นหาตามหมวด' : 'Choose what you want to find by category'}
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
                onClick={() => setPropertyZone(site.id)}
                className={`flex min-h-[72px] items-center gap-3 rounded-[19px] border px-3 py-2.5 text-start transition duration-150 active:scale-[0.99] ${
                  isActive
                    ? site.activeTone
                    : 'border-neutral-100 bg-white hover:border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800'
                }`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${site.iconTone}`}>
                  <Icon className="size-[18px]" strokeWidth={1.9} />
                </span>
                <span className="w-0 min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-950 dark:text-white">
                    {locale === 'th' ? <PropertyCategoryLabel label={site.titleTh} /> : site.titleEn}
                  </span>
                  <span className="mt-0.5 block max-w-full font-sarabun text-xs leading-4 [overflow-wrap:anywhere] break-words [word-break:break-word] whitespace-normal text-neutral-500 dark:text-neutral-400">
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
