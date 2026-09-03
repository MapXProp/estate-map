'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  discoveryChannels,
  offerTypes,
  propertyGroups,
  propertyTypes,
  type DiscoveryChannelCode,
  type OfferTypeCode,
  type PropertyTypeCode,
} from '@/data/propertyTaxonomy'
import * as Headless from '@headlessui/react'
import {
  BadgeCheck,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  Filter,
  House,
  KeyRound,
  MapPin,
  PawPrint,
  RotateCcw,
  SlidersHorizontal,
  UserRoundCheck,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

export type PropertyMapFeature = 'owner_direct' | 'verified' | 'pets_allowed'
export type PropertyMapSort = 'recommended' | 'newest' | 'price_low' | 'price_high' | 'area_large'

export type PropertyMapFilterState = {
  discoveryChannels: DiscoveryChannelCode[]
  offerTypes: OfferTypeCode[]
  propertyTypes: PropertyTypeCode[]
  minPrice: string
  maxPrice: string
  bedrooms: number
  bathrooms: number
  minArea: string
  features: PropertyMapFeature[]
}

export const emptyPropertyMapFilters: PropertyMapFilterState = {
  discoveryChannels: [],
  offerTypes: [],
  propertyTypes: [],
  minPrice: '',
  maxPrice: '',
  bedrooms: 0,
  bathrooms: 0,
  minArea: '',
  features: [],
}

const offerIcons: Partial<Record<OfferTypeCode, typeof House>> = {
  sale: House,
  rent: KeyRound,
  business_transfer: Building2,
  sublease: KeyRound,
}

const featureOptions: Array<{
  value: PropertyMapFeature
  label: string
  labelEn: string
  description: string
  descriptionEn: string
  icon: typeof BadgeCheck
}> = [
  {
    value: 'owner_direct',
    label: 'เจ้าของลงเอง',
    labelEn: 'Owner direct',
    description: 'คุยกับเจ้าของทรัพย์โดยตรง',
    descriptionEn: 'Contact the property owner directly',
    icon: UserRoundCheck,
  },
  {
    value: 'verified',
    label: 'ยืนยันผู้ติดต่อแล้ว',
    labelEn: 'Verified contact',
    description: 'ข้อมูลผู้ติดต่อตรวจสอบแล้ว',
    descriptionEn: 'The contact details have been checked',
    icon: BadgeCheck,
  },
  {
    value: 'pets_allowed',
    label: 'เลี้ยงสัตว์ได้',
    labelEn: 'Pet friendly',
    description: 'ประกาศระบุว่าสามารถเลี้ยงสัตว์ได้',
    descriptionEn: 'The listing explicitly allows pets',
    icon: PawPrint,
  },
]

const cleanNumber = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 12)
const formatInputNumber = (value: string) => (value ? Number(value).toLocaleString('en-US') : '')

const toggleValue = <T extends string>(values: T[], value: T) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

const SelectionButton = ({
  selected,
  onClick,
  children,
  className = '',
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`flex min-h-11 items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-start text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] ${
      selected
        ? 'border-[#176b50] bg-[#edf6f1] text-[#123f32] shadow-[inset_0_0_0_1px_rgba(23,107,80,0.08)] dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-100'
        : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#a8cbbb] hover:bg-[#f7faf8] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-800'
    } ${className}`}
  >
    {children}
  </button>
)

const NumberStepper = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-700">
    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{label}</span>
    <div className="flex items-center gap-2" aria-label={label}>
      {[0, 1, 2, 3, 4].map((count) => (
        <button
          key={count}
          type="button"
          aria-pressed={value === count}
          onClick={() => onChange(count)}
          className={`grid size-9 place-items-center rounded-full border text-sm font-semibold transition ${
            value === count
              ? 'border-[#176b50] bg-[#176b50] text-white'
              : 'border-neutral-200 text-neutral-600 hover:border-[#8eb8a5] dark:border-neutral-700 dark:text-neutral-300'
          }`}
        >
          {count === 0 ? 'ทุก' : count === 4 ? '4+' : count}
        </button>
      ))}
    </div>
  </div>
)

const PropertyMapFilterBar = ({
  value,
  onChange,
  sort,
  onSortChange,
  resultCount,
  totalCount,
  query,
  loading = false,
}: {
  value: PropertyMapFilterState
  onChange: (value: PropertyMapFilterState) => void
  sort: PropertyMapSort
  onSortChange: (value: PropertyMapSort) => void
  resultCount: number
  totalCount: number
  query?: string
  loading?: boolean
}) => {
  const { locale, currency, convertFromThb, convertToThb, formatCurrency } = usePreferences()
  const isThai = locale === 'th'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const openFilters = () => setOpen(true)
    window.addEventListener('mapx:open-property-filters', openFilters)
    return () => window.removeEventListener('mapx:open-property-filters', openFilters)
  }, [])

  const activeFilterCount =
    value.discoveryChannels.length +
    value.offerTypes.length +
    value.propertyTypes.length +
    Number(Boolean(value.minPrice || value.maxPrice)) +
    Number(value.bedrooms > 0) +
    Number(value.bathrooms > 0) +
    Number(Boolean(value.minArea)) +
    value.features.length

  const priceLabel = useMemo(() => {
    const min = Number(value.minPrice)
    const max = Number(value.maxPrice)
    if (min && max) return `${formatCurrency(min, { compact: true })}–${formatCurrency(max, { compact: true })}`
    if (max) return `${isThai ? 'ไม่เกิน' : 'Up to'} ${formatCurrency(max, { compact: true })}`
    if (min) return `${isThai ? 'ตั้งแต่' : 'From'} ${formatCurrency(min, { compact: true })}`
    return isThai ? 'งบประมาณ' : 'Budget'
  }, [formatCurrency, isThai, value.maxPrice, value.minPrice])

  const update = <K extends keyof PropertyMapFilterState>(key: K, nextValue: PropertyMapFilterState[K]) =>
    onChange({ ...value, [key]: nextValue })

  const reset = () => onChange(emptyPropertyMapFilters)

  const selectedPropertyLabels = value.propertyTypes
    .map((code) => propertyTypes.find((item) => item.code === code))
    .filter(Boolean)
    .map((item) => (isThai ? item!.nameTh : item!.nameEn))

  return (
    <>
      <section className="sticky top-14 z-30 -mx-4 border-y border-[#e3ece8] bg-white/96 px-4 py-3 shadow-[0_8px_24px_-22px_rgba(18,63,50,0.7)] backdrop-blur-xl min-[744px]:top-16 lg:-mx-0 lg:me-5 lg:rounded-2xl lg:border lg:px-4 xl:me-0 dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-[#173f34] dark:text-neutral-100">
                {query
                  ? isThai
                    ? `ผลการค้นหา “${query}”`
                    : `Results for “${query}”`
                  : isThai
                    ? 'อสังหาในบริเวณนี้'
                    : 'Properties in this area'}
              </h1>
              {loading && (
                <span
                  className="size-2 animate-pulse rounded-full bg-[#176b50]"
                  aria-label={isThai ? 'กำลังค้นหา' : 'Searching'}
                />
              )}
            </div>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
              {isThai
                ? `พบ ${resultCount.toLocaleString('th-TH')} จาก ${totalCount.toLocaleString('th-TH')} รายการ`
                : `${resultCount.toLocaleString()} of ${totalCount.toLocaleString()} listings`}
            </p>
          </div>

          <label className="relative shrink-0">
            <span className="sr-only">{isThai ? 'เรียงผลลัพธ์' : 'Sort results'}</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as PropertyMapSort)}
              className="h-10 appearance-none rounded-full border border-neutral-200 bg-white py-0 ps-3 pe-8 text-xs font-semibold text-neutral-700 shadow-none focus:border-[#176b50] focus:ring-[#176b50]/15 min-[500px]:text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <option value="recommended">{isThai ? 'แนะนำ' : 'Recommended'}</option>
              <option value="newest">{isThai ? 'ใหม่ล่าสุด' : 'Newest'}</option>
              <option value="price_low">{isThai ? 'ราคาต่ำก่อน' : 'Lowest price'}</option>
              <option value="price_high">{isThai ? 'ราคาสูงก่อน' : 'Highest price'}</option>
              <option value="area_large">{isThai ? 'พื้นที่มากก่อน' : 'Largest area'}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          </label>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => update('offerTypes', [])}
            className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
              value.offerTypes.length === 0
                ? 'border-[#176b50] bg-[#176b50] text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#9fc4b2] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
          >
            {isThai ? 'ทุกแบบ' : 'All offers'}
          </button>
          {(['sale', 'rent', 'business_transfer'] as OfferTypeCode[]).map((code) => {
            const offer = offerTypes.find((item) => item.code === code)!
            const selected = value.offerTypes.includes(code)
            const Icon = offerIcons[code] || Building2
            return (
              <button
                key={code}
                type="button"
                aria-pressed={selected}
                onClick={() => update('offerTypes', toggleValue(value.offerTypes, code))}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition ${
                  selected
                    ? 'border-[#176b50] bg-[#edf6f1] text-[#123f32] dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-100'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#9fc4b2] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                }`}
              >
                <Icon className="size-4" /> {isThai ? offer.nameTh : offer.nameEn}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition ${
              value.propertyTypes.length
                ? 'border-[#176b50] bg-[#edf6f1] text-[#123f32] dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-100'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#9fc4b2] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
          >
            <Building2 className="size-4" />
            {value.propertyTypes.length
              ? isThai
                ? `ประเภททรัพย์ ${value.propertyTypes.length}`
                : `${value.propertyTypes.length} types`
              : isThai
                ? 'ประเภททรัพย์'
                : 'Property type'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition ${
              value.minPrice || value.maxPrice
                ? 'border-[#176b50] bg-[#edf6f1] text-[#123f32] dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-100'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#9fc4b2] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
          >
            <Banknote className="size-4" /> {priceLabel}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`relative flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition ${
              activeFilterCount
                ? 'border-[#176b50] bg-[#123f32] text-white dark:border-emerald-500 dark:bg-emerald-800'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#9fc4b2] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'
            }`}
          >
            <SlidersHorizontal className="size-4" /> {isThai ? 'ตัวกรอง' : 'Filters'}
            {activeFilterCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-white/18 text-[11px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {(selectedPropertyLabels.length > 0 ||
          value.features.length > 0 ||
          value.bedrooms > 0 ||
          value.bathrooms > 0 ||
          value.minArea) && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selectedPropertyLabels.slice(0, 3).map((label, index) => {
              const code = value.propertyTypes[index]
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() =>
                    update(
                      'propertyTypes',
                      value.propertyTypes.filter((item) => item !== code)
                    )
                  }
                  className="flex shrink-0 items-center gap-1 rounded-full bg-[#f1f6f3] px-2.5 py-1 text-xs font-medium text-[#31594e] hover:bg-[#e6f1eb] dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  {label} <X className="size-3" />
                </button>
              )
            })}
            {value.propertyTypes.length > 3 && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 text-xs font-semibold text-[#176b50]"
              >
                +{value.propertyTypes.length - 3}
              </button>
            )}
            {(value.features.length > 0 || value.bedrooms > 0 || value.bathrooms > 0 || value.minArea) && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 text-xs font-semibold text-[#176b50]"
              >
                {isThai ? 'ดูเงื่อนไขอื่น' : 'More conditions'}
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="ms-auto shrink-0 text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              {isThai ? 'ล้าง' : 'Clear'}
            </button>
          </div>
        )}
      </section>

      <Headless.Dialog open={open} onClose={setOpen} className="relative z-[70]">
        <Headless.DialogBackdrop
          transition
          className="fixed inset-0 bg-[#071a14]/45 backdrop-blur-[2px] transition duration-200 data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex items-end justify-center overflow-hidden sm:items-center sm:p-5">
          <Headless.DialogPanel
            transition
            className="flex max-h-[94dvh] w-full max-w-4xl origin-bottom flex-col overflow-hidden rounded-t-[28px] border border-neutral-200 bg-white shadow-2xl transition duration-200 sm:max-h-[min(880px,92dvh)] sm:origin-center sm:rounded-[30px] dark:border-neutral-700 dark:bg-neutral-950 data-closed:translate-y-8 data-closed:opacity-0 sm:data-closed:translate-y-2"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-7 sm:py-5 dark:border-neutral-800">
              <div>
                <Headless.DialogTitle className="text-xl font-semibold text-[#173f34] dark:text-white">
                  {isThai ? 'เลือกอสังหาที่ตรงกับคุณ' : 'Find the right property'}
                </Headless.DialogTitle>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {isThai
                    ? 'ผลลัพธ์จะอัปเดตทันทีเมื่อเปลี่ยนตัวเลือก'
                    : 'Results update instantly as you change filters'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={isThai ? 'ปิดตัวกรอง' : 'Close filters'}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 grow overflow-y-auto overscroll-contain px-5 sm:px-7">
              <section className="border-b border-neutral-100 py-6 sm:py-7 dark:border-neutral-800">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                      {isThai ? 'ต้องการทำอะไร' : 'What do you want to do?'}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {isThai ? 'เลือกได้มากกว่าหนึ่งแบบ' : 'You can choose more than one'}
                    </p>
                  </div>
                  {value.offerTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => update('offerTypes', [])}
                      className="text-sm font-semibold text-[#176b50]"
                    >
                      {isThai ? 'ทุกแบบ' : 'Any offer'}
                    </button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                  {offerTypes.map((offer) => {
                    const Icon = offerIcons[offer.code] || Building2
                    return (
                      <SelectionButton
                        key={offer.code}
                        selected={value.offerTypes.includes(offer.code)}
                        onClick={() => update('offerTypes', toggleValue(value.offerTypes, offer.code))}
                      >
                        <Icon className="size-4.5 shrink-0" /> {isThai ? offer.nameTh : offer.nameEn}
                      </SelectionButton>
                    )
                  })}
                </div>
              </section>

              <section className="border-b border-neutral-100 py-6 sm:py-7 dark:border-neutral-800">
                <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'กลุ่มการใช้งาน' : 'Property collection'}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {isThai ? 'เริ่มจากกลุ่มใหญ่เพื่อย่นรายการประเภททรัพย์' : 'Start broad, then refine by property type'}
                </p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {discoveryChannels.map((channel) => (
                    <SelectionButton
                      key={channel.code}
                      selected={value.discoveryChannels.includes(channel.code)}
                      onClick={() => update('discoveryChannels', toggleValue(value.discoveryChannels, channel.code))}
                      className="items-start"
                    >
                      <MapPin className="mt-0.5 size-4.5 shrink-0" />
                      <span>
                        <span className="block">{isThai ? channel.nameTh : channel.nameEn}</span>
                        <span className="mt-0.5 block text-xs font-normal opacity-70">
                          {channel.propertyTypeCodes.length} {isThai ? 'ประเภท' : 'types'}
                        </span>
                      </span>
                    </SelectionButton>
                  ))}
                </div>
              </section>

              <section className="border-b border-neutral-100 py-6 sm:py-7 dark:border-neutral-800">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                      {isThai ? 'ประเภทอสังหา' : 'Property type'}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {isThai
                        ? `เลือกเฉพาะที่ต้องการจาก ${propertyTypes.length} ประเภท`
                        : `Choose from ${propertyTypes.length} property types`}
                    </p>
                  </div>
                  {value.propertyTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => update('propertyTypes', [])}
                      className="shrink-0 text-sm font-semibold text-[#176b50]"
                    >
                      {isThai ? 'ทุกประเภท' : 'All types'}
                    </button>
                  )}
                </div>
                <div className="mt-5 space-y-6">
                  {propertyGroups.map((group) => {
                    const types = propertyTypes.filter((item) => item.groupCode === group.code)
                    return (
                      <div key={group.code}>
                        <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                          {isThai ? group.nameTh : group.nameEn}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {types.map((propertyType) => {
                            const selected = value.propertyTypes.includes(propertyType.code)
                            return (
                              <SelectionButton
                                key={propertyType.code}
                                selected={selected}
                                onClick={() =>
                                  update('propertyTypes', toggleValue(value.propertyTypes, propertyType.code))
                                }
                                className="relative pe-8"
                              >
                                <span className="line-clamp-2">
                                  {isThai ? propertyType.nameTh : propertyType.nameEn}
                                </span>
                                {selected && <Check className="absolute end-3 top-1/2 size-4 -translate-y-1/2" />}
                              </SelectionButton>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="border-b border-neutral-100 py-6 sm:py-7 dark:border-neutral-800">
                <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'งบประมาณ' : 'Budget'}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {isThai ? 'ระบบเทียบกับราคาของรูปแบบประกาศที่เลือก' : 'Matched against the selected offer types'}
                </p>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2.5">
                  {(
                    [
                      ['minPrice', isThai ? 'ราคาต่ำสุด' : 'Minimum'],
                      ['maxPrice', isThai ? 'ราคาสูงสุด' : 'Maximum'],
                    ] as const
                  ).map(([key, label], index) => (
                    <div key={key} className={index === 1 ? 'col-start-3' : ''}>
                      <label className="mb-1.5 block text-xs font-medium text-neutral-500">{label}</label>
                      <div className="flex h-12 items-center rounded-2xl border border-neutral-200 bg-white px-3 focus-within:border-[#176b50] focus-within:ring-2 focus-within:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-900">
                        <span className="text-sm font-semibold text-neutral-400">{currency === 'USD' ? '$' : '฿'}</span>
                        <input
                          inputMode="numeric"
                          value={
                            value[key] ? formatInputNumber(String(Math.round(convertFromThb(Number(value[key]))))) : ''
                          }
                          onChange={(event) => {
                            const displayValue = cleanNumber(event.target.value)
                            update(key, displayValue ? String(Math.round(convertToThb(Number(displayValue)))) : '')
                          }}
                          placeholder={
                            index === 0 ? '0' : formatInputNumber(String(Math.round(convertFromThb(5_000_000))))
                          }
                          className="min-w-0 flex-1 border-0 bg-transparent px-2 py-0 text-base font-semibold text-neutral-900 placeholder:text-neutral-300 focus:ring-0 dark:text-white dark:placeholder:text-neutral-600"
                        />
                      </div>
                    </div>
                  ))}
                  <span className="col-start-2 row-start-1 mb-4 text-neutral-300">—</span>
                </div>
                {value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice) && (
                  <p className="mt-2 text-sm font-medium text-rose-600">
                    {isThai ? 'ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด' : 'Minimum price cannot exceed maximum price'}
                  </p>
                )}
              </section>

              <section className="border-b border-neutral-100 py-6 sm:py-7 dark:border-neutral-800">
                <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'ห้องและขนาด' : 'Rooms and size'}
                </h2>
                <div className="mt-4 space-y-2.5">
                  <NumberStepper
                    label={isThai ? 'ห้องนอนขั้นต่ำ' : 'Minimum bedrooms'}
                    value={value.bedrooms}
                    onChange={(bedrooms) => update('bedrooms', bedrooms)}
                  />
                  <NumberStepper
                    label={isThai ? 'ห้องน้ำขั้นต่ำ' : 'Minimum bathrooms'}
                    value={value.bathrooms}
                    onChange={(bathrooms) => update('bathrooms', bathrooms)}
                  />
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-700">
                    <span>
                      <span className="block text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        {isThai ? 'พื้นที่ขั้นต่ำ' : 'Minimum area'}
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-400">
                        {isThai ? 'ใช้ได้กับอาคารและที่ดิน' : 'For buildings and land'}
                      </span>
                    </span>
                    <span className="flex h-10 w-36 items-center rounded-xl bg-neutral-50 px-3 dark:bg-neutral-900">
                      <input
                        inputMode="numeric"
                        value={formatInputNumber(value.minArea)}
                        onChange={(event) => update('minArea', cleanNumber(event.target.value))}
                        placeholder="0"
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-end text-sm font-semibold focus:ring-0"
                      />
                      <span className="ms-2 text-xs text-neutral-400">ตร.ม.</span>
                    </span>
                  </label>
                </div>
              </section>

              <section className="py-6 sm:py-7">
                <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'เงื่อนไขที่ช่วยตัดสินใจ' : 'Decision helpers'}
                </h2>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {featureOptions.map((feature) => {
                    const Icon = feature.icon
                    const selected = value.features.includes(feature.value)
                    return (
                      <SelectionButton
                        key={feature.value}
                        selected={selected}
                        onClick={() => update('features', toggleValue(value.features, feature.value))}
                        className="items-start"
                      >
                        <Icon className="mt-0.5 size-4.5 shrink-0" />
                        <span>
                          <span className="block">{isThai ? feature.label : feature.labelEn}</span>
                          <span className="mt-0.5 block text-xs font-normal opacity-70">
                            {isThai ? feature.description : feature.descriptionEn}
                          </span>
                        </span>
                      </SelectionButton>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-white/96 px-5 py-4 backdrop-blur sm:px-7 dark:border-neutral-800 dark:bg-neutral-950/96">
              <button
                type="button"
                onClick={reset}
                disabled={activeFilterCount === 0}
                className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-default disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <RotateCcw className="size-4" /> {isThai ? 'ล้างทั้งหมด' : 'Clear all'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={Boolean(value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice))}
                className="flex min-h-12 items-center gap-2 rounded-full bg-[#123f32] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(18,63,50,0.7)] transition hover:bg-[#0d3429] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                <Filter className="size-4" />
                {isThai
                  ? `ดู ${resultCount.toLocaleString('th-TH')} รายการ`
                  : `Show ${resultCount.toLocaleString()} listings`}
              </button>
            </div>
          </Headless.DialogPanel>
        </div>
      </Headless.Dialog>
    </>
  )
}

export default PropertyMapFilterBar
