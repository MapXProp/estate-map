'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  Banknote,
  BedDouble,
  Building,
  Building2,
  Check,
  ChevronRight,
  Factory,
  Hotel,
  House,
  LandPlot,
  MapPin,
  Search,
  Store,
  Tent,
  Warehouse,
  X,
} from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import Slider from 'rc-slider'
import { useMemo, useState, type SVGProps } from 'react'
import MobilePropertyBrandMark from './MobilePropertyBrandMark'
import PropertySearchOmnibox from './PropertySearchOmnibox'

type OfferType = '' | 'sale' | 'rent'

type PropertyGroup = 'homes' | 'rooms' | 'business'

const RowHouseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 20.5h19" />
    <path d="M3.5 20.5v-13L6 5l2.5 2.5v13M8.5 20.5v-13L11 5l2.5 2.5v13M13.5 20.5v-13L16 5l2.5 2.5v13M18.5 20.5V8.5h2v12" />
    <path d="M5 11h2M10 11h2M15 11h2M5.25 20.5v-5h1.5v5M10.25 20.5v-5h1.5v5M15.25 20.5v-5h1.5v5" />
  </svg>
)

const MallKioskIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 20.5v-16h16v16M2.5 20.5h19M7 8h10" />
    <path d="m7 8 1 3 2-3 2 3 2-3 2 3 1-3M8 11v6.5h8V11M8 15h8" />
  </svg>
)

type BudgetPreset = {
  label: string
  labelEn: string
  term: string
  termEn: string
  min: number
  max: number
}

type BudgetOfferType = Exclude<OfferType, ''>

type BudgetConfig = {
  min: number
  max: number
  priceScale: number[]
  presets: BudgetPreset[]
}

const buildPriceScale = (segments: Array<[number, number]>) => {
  const values = [0]
  for (const [end, step] of segments) {
    for (let value = values[values.length - 1] + step; value <= end; value += step) values.push(value)
  }
  return values
}

const salePriceScale = buildPriceScale([
  [5_000_000, 100_000],
  [10_000_000, 250_000],
  [20_000_000, 500_000],
  [50_000_000, 2_500_000],
  [100_000_000, 5_000_000],
])

const rentPriceScale = buildPriceScale([
  [20_000, 500],
  [50_000, 1_000],
  [100_000, 5_000],
  [300_000, 10_000],
])

const offerTypes: Array<{ value: OfferType; label: string; labelEn: string; term: string; termEn: string }> = [
  { value: '', label: 'ทั้งหมด', labelEn: 'All', term: '', termEn: '' },
  { value: 'rent', label: 'เช่า', labelEn: 'Rent', term: 'เช่า', termEn: 'rent' },
  { value: 'sale', label: 'ซื้อ', labelEn: 'Buy', term: 'ซื้อ', termEn: 'buy' },
]

const propertyGroups: Array<{ value: PropertyGroup; label: string; labelEn: string }> = [
  { value: 'homes', label: 'บ้าน คอนโด & ที่อยู่อาศัย', labelEn: 'Homes' },
  { value: 'rooms', label: 'ห้องเช่า & ที่พักรายเดือน', labelEn: 'Monthly rooms' },
  { value: 'business', label: 'พื้นที่ทำธุรกิจ', labelEn: 'Business' },
]

const propertyTypes = [
  {
    value: 'house',
    label: 'บ้าน',
    labelEn: 'House',
    term: 'บ้าน',
    termEn: 'house',
    icon: House,
    groups: ['homes'],
  },
  {
    value: 'condo',
    label: 'คอนโด',
    labelEn: 'Condo',
    term: 'คอนโด',
    termEn: 'condo',
    icon: Building2,
    groups: ['homes', 'rooms'],
  },
  {
    value: 'townhouse',
    label: 'ทาวน์โฮม',
    labelEn: 'Townhome',
    term: 'ทาวน์โฮม',
    termEn: 'townhome',
    icon: Building,
    groups: ['homes'],
  },
  {
    value: 'dormitory',
    label: 'หอพัก',
    labelEn: 'Dorm',
    term: 'หอพัก',
    termEn: 'dorm',
    icon: BedDouble,
    groups: ['rooms'],
  },
  {
    value: 'apartment',
    label: 'อพาร์ตเมนต์',
    labelEn: 'Apartment',
    term: 'อพาร์ตเมนต์',
    termEn: 'apartment',
    icon: Hotel,
    groups: ['rooms'],
  },
  {
    value: 'rental_room',
    label: 'ห้องเช่า',
    labelEn: 'Rental room',
    term: 'ห้องเช่า',
    termEn: 'rental room',
    icon: BedDouble,
    groups: ['rooms'],
  },
  {
    value: 'flat',
    label: 'แฟลต',
    labelEn: 'Flat',
    term: 'แฟลต',
    termEn: 'flat',
    icon: Building,
    groups: ['rooms'],
  },
  {
    value: 'serviced_apartment',
    label: 'เซอร์วิสอพาร์ตเมนต์',
    labelEn: 'Serviced apartment',
    term: 'เซอร์วิสอพาร์ตเมนต์',
    termEn: 'serviced apartment',
    icon: Hotel,
    groups: ['rooms'],
  },
  {
    value: 'monthly_hotel',
    label: 'โรงแรมรายเดือน',
    labelEn: 'Monthly hotel',
    term: 'โรงแรมรายเดือน',
    termEn: 'monthly hotel',
    icon: Hotel,
    groups: ['rooms'],
  },
  {
    value: 'shophouse',
    label: 'ตึกแถว',
    labelEn: 'Shophouse',
    term: 'ตึกแถว',
    termEn: 'shophouse',
    icon: RowHouseIcon,
    groups: ['homes', 'business'],
  },
  {
    value: 'retail_space',
    label: 'พื้นที่ค้าขาย',
    labelEn: 'Retail space',
    term: 'พื้นที่ค้าขาย',
    termEn: 'retail space',
    icon: Store,
    groups: ['business'],
  },
  {
    value: 'rowhouse_shop',
    label: 'ร้านค้าในตึกแถว',
    labelEn: 'Shophouse shop',
    term: 'ร้านค้าในตึกแถว',
    termEn: 'shop in shophouse',
    icon: RowHouseIcon,
    groups: ['business'],
  },
  {
    value: 'standalone_shop',
    label: 'ร้านค้า Standalone',
    labelEn: 'Standalone shop',
    term: 'ร้านค้า standalone',
    termEn: 'standalone shop',
    icon: Store,
    groups: ['business'],
  },
  {
    value: 'market_stall',
    label: 'ล็อคในตลาด',
    labelEn: 'Market stall',
    term: 'ล็อกในตลาด',
    termEn: 'market stall',
    icon: Tent,
    groups: ['business'],
  },
  {
    value: 'mall_kiosk',
    label: 'ล็อคในห้าง',
    labelEn: 'Mall kiosk',
    term: 'ล็อกในห้าง',
    termEn: 'mall kiosk',
    icon: MallKioskIcon,
    groups: ['commercial'],
  },
  {
    value: 'office',
    label: 'ออฟฟิศ',
    labelEn: 'Office',
    term: 'ออฟฟิศ',
    termEn: 'office',
    icon: Building2,
    groups: ['business'],
  },
  {
    value: 'warehouse',
    label: 'โกดัง',
    labelEn: 'Warehouse',
    term: 'โกดัง',
    termEn: 'warehouse',
    icon: Warehouse,
    groups: ['business'],
  },
  {
    value: 'factory',
    label: 'โรงงาน',
    labelEn: 'Factory',
    term: 'โรงงาน',
    termEn: 'factory',
    icon: Factory,
    groups: ['business'],
  },
  {
    value: 'land',
    label: 'ที่ดิน',
    labelEn: 'Land',
    term: 'ที่ดิน',
    termEn: 'land',
    icon: LandPlot,
    groups: ['homes', 'business'],
  },
] as const

const budgetConfigs: Record<BudgetOfferType, BudgetConfig> = {
  sale: {
    min: 0,
    max: 100_000_000,
    priceScale: salePriceScale,
    presets: [
      {
        label: 'ไม่เกิน 2 ล้าน',
        labelEn: 'Up to ฿2M',
        term: 'ไม่เกิน 2 ล้าน',
        termEn: 'under 2m',
        min: 0,
        max: 2_000_000,
      },
      { label: '2–3 ล้าน', labelEn: '฿2–3M', term: '2-3 ล้าน', termEn: '2-3m', min: 2_000_000, max: 3_000_000 },
      { label: '3–5 ล้าน', labelEn: '฿3–5M', term: '3-5 ล้าน', termEn: '3-5m', min: 3_000_000, max: 5_000_000 },
      { label: '5–10 ล้าน', labelEn: '฿5–10M', term: '5-10 ล้าน', termEn: '5-10m', min: 5_000_000, max: 10_000_000 },
      {
        label: '10–20 ล้าน',
        labelEn: '฿10–20M',
        term: '10-20 ล้าน',
        termEn: '10-20m',
        min: 10_000_000,
        max: 20_000_000,
      },
      {
        label: '20 ล้านขึ้นไป',
        labelEn: '฿20M+',
        term: 'ตั้งแต่ 20 ล้าน',
        termEn: 'from 20m',
        min: 20_000_000,
        max: 100_000_000,
      },
    ],
  },
  rent: {
    min: 0,
    max: 300_000,
    priceScale: rentPriceScale,
    presets: [
      { label: 'ไม่เกิน 8,000', labelEn: 'Up to ฿8K', term: 'ไม่เกิน 8000', termEn: 'under 8k', min: 0, max: 8_000 },
      { label: '8,000–15,000', labelEn: '฿8–15K', term: '8000-15000', termEn: '8k-15k', min: 8_000, max: 15_000 },
      { label: '15,000–25,000', labelEn: '฿15–25K', term: '15000-25000', termEn: '15k-25k', min: 15_000, max: 25_000 },
      { label: '25,000–50,000', labelEn: '฿25–50K', term: '25000-50000', termEn: '25k-50k', min: 25_000, max: 50_000 },
      {
        label: '50,000–100,000',
        labelEn: '฿50–100K',
        term: '50000-100000',
        termEn: '50k-100k',
        min: 50_000,
        max: 100_000,
      },
      {
        label: '100,000 ขึ้นไป',
        labelEn: '฿100K+',
        term: 'ตั้งแต่ 100000',
        termEn: 'from 100k',
        min: 100_000,
        max: 300_000,
      },
    ],
  },
}

const formatPrice = (value: number, isThai: boolean) => {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return isThai
      ? `${millions.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ล้าน`
      : `฿${millions.toLocaleString('en-US', { maximumFractionDigits: 2 })}M`
  }
  if (!isThai && value >= 1_000) return `฿${(value / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`
  return isThai ? `${value.toLocaleString('th-TH')} บาท` : `฿${value.toLocaleString('en-US')}`
}

const MobilePropertySearch = ({ className = '' }: { className?: string }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMapResults = pathname === '/properties/map'
  const mapQuery = searchParams.get('q')?.trim() || ''
  const initialPropertyGroup: PropertyGroup =
    pathname.startsWith('/rooms') || pathname.startsWith('/rent')
      ? 'rooms'
      : pathname.startsWith('/business')
        ? 'business'
        : 'homes'
  const [open, setOpen] = useState(false)
  const [propertyGroup, setPropertyGroup] = useState<PropertyGroup>(initialPropertyGroup)
  const [offerType, setOfferType] = useState<OfferType>(initialPropertyGroup === 'rooms' ? 'rent' : '')
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<Array<(typeof propertyTypes)[number]>>([])
  const [budget, setBudget] = useState<BudgetPreset | null>(null)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetOfferType, setBudgetOfferType] = useState<OfferType>('')
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, budgetConfigs.sale.max])

  const selectedOffer = useMemo(() => offerTypes.find((item) => item.value === offerType) ?? offerTypes[0], [offerType])
  const visiblePropertyTypes = useMemo(
    () => propertyTypes.filter((property) => (property.groups as readonly PropertyGroup[]).includes(propertyGroup)),
    [propertyGroup]
  )

  const togglePropertyType = (property: (typeof propertyTypes)[number]) => {
    setSelectedPropertyTypes((current) =>
      current.some((item) => item.value === property.value)
        ? current.filter((item) => item.value !== property.value)
        : [...current, property]
    )
  }

  const openBudget = () => {
    const config = budgetConfigs[offerType || 'sale']
    setBudgetOfferType(offerType)
    setBudgetRange(budget && offerType ? [budget.min, budget.max] : [config.min, config.max])
    setBudgetOpen(true)
  }

  const chooseBudgetOffer = (value: OfferType) => {
    setBudgetOfferType(value)
    if (!value) {
      setBudgetRange([budgetConfigs.sale.min, budgetConfigs.sale.max])
      return
    }
    const config = budgetConfigs[value]
    setBudgetRange(offerType === value && budget ? [budget.min, budget.max] : [config.min, config.max])
  }

  const applyBudget = () => {
    if (!budgetOfferType) {
      setOfferType('')
      setBudget(null)
      setBudgetOpen(false)
      return
    }

    const config = budgetConfigs[budgetOfferType]
    const [min, max] = budgetRange
    const hasMin = min > config.min
    const hasMax = max < config.max
    let nextBudget: BudgetPreset | null = null

    if (hasMin || hasMax) {
      const label =
        hasMin && hasMax
          ? `${formatPrice(min, true)}–${formatPrice(max, true)}`
          : hasMin
            ? `ตั้งแต่ ${formatPrice(min, true)}`
            : `ไม่เกิน ${formatPrice(max, true)}`
      const labelEn =
        hasMin && hasMax
          ? `${formatPrice(min, false)}–${formatPrice(max, false)}`
          : hasMin
            ? `From ${formatPrice(min, false)}`
            : `Up to ${formatPrice(max, false)}`
      nextBudget = {
        label,
        labelEn,
        term: hasMin && hasMax ? `${min}-${max}` : hasMin ? `ตั้งแต่ ${min}` : `ไม่เกิน ${max}`,
        termEn: hasMin && hasMax ? `${min}-${max}` : hasMin ? `from ${min}` : `under ${max}`,
        min,
        max,
      }
    }

    setOfferType(budgetOfferType)
    setBudget(nextBudget)
    setBudgetOpen(false)
  }

  const composeQuery = (input: string) => {
    const cleanedInput = offerType
      ? input
          .replace(/(?:ให้เช่า|โอนกิจการ|ซื้อ|ขาย|เช่า|เซ้ง|\bbuy\b|\bsale\b|\brent\b|\btransfer\b)/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : input.trim()
    const terms = [
      propertyGroup === 'rooms'
        ? isThai
          ? 'ห้องเช่ารายเดือน'
          : 'monthly rental'
        : propertyGroup === 'business'
          ? isThai
            ? 'พื้นที่ทำธุรกิจ'
            : 'business space'
          : '',
      offerType ? (isThai ? selectedOffer.term : selectedOffer.termEn) : '',
      ...selectedPropertyTypes.map((property) => (isThai ? property.term : property.termEn)),
      budget ? (isThai ? budget.term : budget.termEn) : '',
      cleanedInput,
    ]
    return terms.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  }

  const hasQuickFilters = Boolean(offerType || selectedPropertyTypes.length || budget)
  const draftBudgetConfig = budgetConfigs[budgetOfferType || 'sale']
  const draftSliderValue: [number, number] = [
    Math.max(0, draftBudgetConfig.priceScale.indexOf(budgetRange[0])),
    Math.max(0, draftBudgetConfig.priceScale.indexOf(budgetRange[1])),
  ]
  const draftHasMin = budgetRange[0] > draftBudgetConfig.min
  const draftHasMax = budgetRange[1] < draftBudgetConfig.max
  const draftBudgetSummary =
    draftHasMin && draftHasMax
      ? `${formatPrice(budgetRange[0], isThai)} – ${formatPrice(budgetRange[1], isThai)}`
      : draftHasMin
        ? `${isThai ? 'ตั้งแต่' : 'From'} ${formatPrice(budgetRange[0], isThai)}`
        : draftHasMax
          ? `${isThai ? 'ไม่เกิน' : 'Up to'} ${formatPrice(budgetRange[1], isThai)}`
          : isThai
            ? 'ไม่จำกัดงบ'
            : 'Any budget'

  return (
    <div className={`relative z-10 w-full ${className}`}>
      <div className="flex w-full items-center gap-2.5">
        <MobilePropertyBrandMark />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-full border border-neutral-200 bg-white py-2 ps-3 pe-4 text-start shadow-[0_6px_22px_rgba(15,23,42,0.10)] transition active:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf4ef] text-[#123f32] dark:bg-emerald-950 dark:text-emerald-200">
            <Search className="size-4.5" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-neutral-950 dark:text-white">
              {isMapResults && mapQuery
                ? mapQuery
                : isThai
                  ? 'ค้นหาทำเลหรืออสังหาที่ต้องการ'
                  : 'Search location or property'}
            </span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
              {hasQuickFilters
                ? [
                    offerType ? (isThai ? selectedOffer.label : selectedOffer.labelEn) : null,
                    selectedPropertyTypes.length
                      ? selectedPropertyTypes.map((property) => (isThai ? property.label : property.labelEn)).join(', ')
                      : null,
                    budget ? (isThai ? budget.label : budget.labelEn) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : isThai
                  ? isMapResults
                    ? 'ทุกประเภท · ไม่จำกัดงบ'
                    : 'พิมพ์หรือแตะตัวเลือกได้เลย'
                  : isMapResults
                    ? 'All properties · Any budget'
                    : 'Type or tap a quick option'}
            </span>
          </span>
        </button>
      </div>

      <Dialog open={open} onClose={setOpen} className="relative z-[100] min-[744px]:hidden">
        <DialogPanel
          transition
          className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-[#f4f5f6] text-neutral-950 transition duration-200 dark:bg-neutral-950 dark:text-white data-closed:translate-y-8 data-closed:opacity-0"
        >
          <div className="flex items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {isThai ? 'วันนี้กำลังมองหาอะไร?' : 'What are you looking for today?'}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {isThai ? 'เลือกเส้นทาง ประเภท งบประมาณ และทำเล' : 'Choose a path, property type, budget, and location'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={isThai ? 'ปิด' : 'Close'}
              className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-28">
            <section>
              <div className="grid grid-cols-3 gap-1 rounded-2xl border border-[#d4e5de] bg-[#eaf3ef] p-1 dark:border-emerald-900 dark:bg-emerald-950/60">
                {propertyGroups.map((group) => {
                  const active = propertyGroup === group.value
                  const selectedCount = selectedPropertyTypes.filter((property) =>
                    (property.groups as readonly PropertyGroup[]).includes(group.value)
                  ).length

                  return (
                    <button
                      key={group.value}
                      type="button"
                      onClick={() => {
                        setPropertyGroup(group.value)
                        setSelectedPropertyTypes([])
                        setBudget(null)
                        setOfferType(group.value === 'rooms' ? 'rent' : '')
                      }}
                      aria-pressed={active}
                      className={`flex min-h-12 items-center justify-center gap-1 rounded-xl px-1 text-[10px] leading-tight font-semibold transition min-[390px]:text-[11px] ${
                        active
                          ? 'bg-[#176b50] text-white shadow-[0_3px_10px_rgba(23,107,80,0.20)] ring-1 ring-[#176b50] dark:bg-emerald-300 dark:text-emerald-950 dark:ring-emerald-300'
                          : 'text-[#426458] active:bg-white/70 dark:text-emerald-200/70 dark:active:bg-emerald-900/70'
                      }`}
                    >
                      <span className="text-center">
                        {isThai ? (
                          <PropertyCategoryLabel
                            label={group.label}
                            ampersandClassName={active ? 'text-white/75' : 'text-[#426458]/70'}
                          />
                        ) : (
                          group.labelEn
                        )}
                      </span>
                      {selectedCount > 0 && (
                        <span
                          className={`grid size-4 shrink-0 place-items-center rounded-full text-[9px] ${
                            active
                              ? 'bg-white/20 text-white ring-1 ring-white/30 dark:bg-emerald-950/15 dark:text-emerald-950 dark:ring-emerald-950/20'
                              : 'bg-[#cfe1d9] text-[#176b50] dark:bg-emerald-900 dark:text-emerald-200'
                          }`}
                        >
                          {selectedCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {isThai ? 'เลือกประเภทที่สนใจ' : 'Choose property types'}
                </h2>
                {hasQuickFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setPropertyGroup(initialPropertyGroup)
                      setOfferType(initialPropertyGroup === 'rooms' ? 'rent' : '')
                      setSelectedPropertyTypes([])
                      setBudget(null)
                    }}
                    className="text-xs font-semibold text-[#176b50] dark:text-emerald-300"
                  >
                    {isThai ? 'ล้างทั้งหมด' : 'Clear all'}
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 pt-1 pb-1">
                {visiblePropertyTypes.map((property) => {
                  const Icon = property.icon
                  const active = selectedPropertyTypes.some((item) => item.value === property.value)
                  return (
                    <button
                      key={property.value}
                      type="button"
                      onClick={() => togglePropertyType(property)}
                      aria-pressed={active}
                      className={`relative flex min-h-[78px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-2 text-[11px] leading-tight font-semibold transition ${
                        active
                          ? 'border-[#176b50] bg-[#e7f2ed] text-[#123f32] ring-1 ring-[#176b50] ring-inset dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-400'
                          : 'border-neutral-200 bg-white text-neutral-600 active:border-[#8ab6a7] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                      }`}
                    >
                      {active && (
                        <span className="absolute end-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-[#176b50] text-white dark:bg-emerald-300 dark:text-emerald-950">
                          <Check className="size-2.5" strokeWidth={3} />
                        </span>
                      )}
                      <span
                        className={`grid size-8 place-items-center rounded-full ${active ? 'bg-white/80 dark:bg-emerald-900' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                      >
                        <Icon className="size-[18px]" strokeWidth={1.8} />
                      </span>
                      <span className="line-clamp-2">{isThai ? property.label : property.labelEn}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="mt-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {isThai ? 'งบประมาณ' : 'Budget'}
              </h2>
              <button
                type="button"
                onClick={openBudget}
                className={`mt-2 flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-start transition ${
                  offerType || budget
                    ? 'border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100'
                    : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'
                }`}
              >
                <span className="grid size-9 place-items-center rounded-full bg-[#f7efe2] text-[#946728] dark:bg-amber-950/50 dark:text-amber-200">
                  <Banknote className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {isThai ? selectedOffer.label : selectedOffer.labelEn}
                    <span className="mx-1.5 text-neutral-300 dark:text-neutral-600">·</span>
                    {budget ? (isThai ? budget.label : budget.labelEn) : isThai ? 'ไม่จำกัดงบ' : 'Any budget'}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                    {isThai
                      ? 'เลือกทั้งหมด เช่า หรือซื้อ พร้อมกำหนดช่วงราคา'
                      : 'Choose all, rent, or buy and set a price range'}
                  </span>
                </span>
                {offerType || budget ? (
                  <Check className="size-5 shrink-0 text-[#176b50] dark:text-emerald-300" strokeWidth={2.5} />
                ) : (
                  <ChevronRight className="size-5 shrink-0 text-neutral-400" />
                )}
              </button>
            </section>

            <section className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                <MapPin className="size-4.5 text-[#176b50] dark:text-emerald-300" />
                {isThai ? 'ทำเลที่ต้องการ?' : 'Where do you want to look?'}
              </div>
              <PropertySearchOmnibox
                buildQuery={composeQuery}
                suggestionsMode="inline"
                showSuggestionsOnEmpty={false}
                placeholder={isThai ? 'จังหวัด เขต ย่าน หรือชื่อโครงการ' : 'Province, area, or project name'}
                onSubmitQuery={() => setOpen(false)}
              />
            </section>
          </div>

          {budgetOpen && (
            <div className="fixed inset-0 z-[120] flex items-end" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label={isThai ? 'ปิดงบประมาณ' : 'Close budget'}
                onClick={() => setBudgetOpen(false)}
                className="absolute inset-0 bg-neutral-950/30"
              />
              <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[30px] bg-[#fbfcfb] px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-neutral-900">
                <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{isThai ? 'งบประมาณ' : 'Budget'}</h2>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {isThai ? 'เลือกช่วงแนะนำ หรือเลื่อนราคาให้ตรงใจ' : 'Choose a range or fine-tune your own prices'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBudgetOpen(false)}
                    className="grid size-9 place-items-center rounded-full bg-neutral-100 dark:bg-neutral-800"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>

                <div
                  className={`mt-4 grid gap-1.5 rounded-[20px] border border-[#d6e4df] bg-[#f1f7f4] p-1.5 dark:border-emerald-900/70 dark:bg-emerald-950/25 ${propertyGroup === 'rooms' ? 'grid-cols-1' : 'grid-cols-3'}`}
                >
                  {offerTypes
                    .filter((offer) => propertyGroup !== 'rooms' || offer.value === 'rent')
                    .map((offer) => {
                      const active = budgetOfferType === offer.value
                      return (
                        <button
                          key={offer.value || 'all'}
                          type="button"
                          onClick={() => chooseBudgetOffer(offer.value)}
                          className={`min-h-11 rounded-2xl px-2 text-sm font-semibold transition ${
                            active
                              ? 'bg-[#176b50] text-white shadow-[0_7px_18px_rgba(23,107,80,0.18)] dark:bg-emerald-200 dark:text-emerald-950'
                              : 'text-neutral-500 active:bg-white/80 dark:text-neutral-400 dark:active:bg-neutral-800'
                          }`}
                        >
                          {isThai ? offer.label : offer.labelEn}
                        </button>
                      )
                    })}
                </div>

                {budgetOfferType ? (
                  <>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {isThai ? 'ช่วงราคาแนะนำ' : 'Suggested ranges'}
                        </h3>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {budgetOfferType === 'rent'
                            ? isThai
                              ? 'ราคาต่อเดือน'
                              : 'Monthly price'
                            : isThai
                              ? 'ราคาขายรวม'
                              : 'Total sale price'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBudgetRange([draftBudgetConfig.min, draftBudgetConfig.max])}
                        className="text-xs font-semibold text-[#176b50] dark:text-emerald-300"
                      >
                        {isThai ? 'ไม่จำกัดงบ' : 'Any budget'}
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {draftBudgetConfig.presets.map((preset) => {
                        const active = budgetRange[0] === preset.min && budgetRange[1] === preset.max
                        return (
                          <button
                            key={preset.term}
                            type="button"
                            onClick={() => setBudgetRange([preset.min, preset.max])}
                            className={`min-h-11 rounded-2xl border px-2.5 text-sm font-semibold transition ${
                              active
                                ? 'border-[#176b50] bg-[#f1f7f4] text-[#123f32] ring-1 ring-[#176b50] dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'border-neutral-200 bg-white text-neutral-600 active:border-[#9fc2b5] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                            }`}
                          >
                            {isThai ? preset.label : preset.labelEn}
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-5 rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 pt-4 pb-5 dark:border-neutral-700 dark:bg-neutral-800/70">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold">
                            {isThai ? 'กำหนดช่วงราคาเอง' : 'Set your own range'}
                          </h3>
                          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            {isThai
                              ? 'ลากจุดซ้ายและขวาเพื่อเลือกราคาต่ำสุด–สูงสุด'
                              : 'Drag both handles to set min–max'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#f1f7f4] px-3 py-1.5 text-xs font-semibold text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                          {draftBudgetSummary}
                        </span>
                      </div>

                      <div className="px-2 pt-7 pb-3">
                        <Slider
                          range
                          allowCross={false}
                          min={0}
                          max={draftBudgetConfig.priceScale.length - 1}
                          step={1}
                          value={draftSliderValue}
                          onChange={(value) => {
                            const [minIndex, maxIndex] = value as [number, number]
                            setBudgetRange([
                              draftBudgetConfig.priceScale[minIndex],
                              draftBudgetConfig.priceScale[maxIndex],
                            ])
                          }}
                          styles={{
                            rail: { height: 6, backgroundColor: '#e5e7eb' },
                            track: { height: 6, backgroundColor: '#2a8063' },
                            handle: {
                              width: 24,
                              height: 24,
                              marginTop: -9,
                              border: '3px solid #2a8063',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 3px 12px rgba(42,128,99,0.22)',
                              opacity: 1,
                            },
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white px-3 py-2.5 dark:bg-neutral-900">
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                            {isThai ? 'ราคาต่ำสุด' : 'Minimum'}
                          </span>
                          <span className="mt-0.5 block text-sm font-semibold">
                            {draftHasMin ? formatPrice(budgetRange[0], isThai) : isThai ? 'ไม่กำหนด' : 'No minimum'}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2.5 dark:bg-neutral-900">
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                            {isThai ? 'ราคาสูงสุด' : 'Maximum'}
                          </span>
                          <span className="mt-0.5 block text-sm font-semibold">
                            {draftHasMax ? formatPrice(budgetRange[1], isThai) : isThai ? 'ไม่กำหนด' : 'No maximum'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-5 rounded-[22px] border border-dashed border-[#b9d2c8] bg-[#f1f7f4] px-5 py-6 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-white text-[#176b50] shadow-sm dark:bg-neutral-900 dark:text-emerald-300">
                      <Check className="size-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold">
                      {isThai ? 'ดูประกาศทุกแบบ ทุกช่วงราคา' : 'See every offer and price'}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {isThai ? 'หากต้องการกำหนดงบ กรุณาเลือกซื้อหรือเช่า' : 'Choose Buy or Rent to set a budget'}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={applyBudget}
                  className="mt-5 min-h-13 w-full rounded-2xl bg-[#123f32] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(18,63,50,0.22)] transition active:scale-[0.99] dark:bg-emerald-200 dark:text-emerald-950"
                >
                  {isThai ? 'ใช้งบนี้' : 'Use this budget'}
                </button>
              </div>
            </div>
          )}
        </DialogPanel>
      </Dialog>
    </div>
  )
}

export default MobilePropertySearch
