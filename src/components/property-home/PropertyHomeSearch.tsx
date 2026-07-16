'use client'

import * as Headless from '@headlessui/react'
import { Building2, ChevronDown, Factory, House, LandPlot, MapPin, Search, Store, Warehouse } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import PropertyPricePopover, { PropertyOfferType, PropertyPriceSelection } from './PropertyPricePopover'

type CategoryMode = 'property_type' | 'use_case'

const offerTypes: { value: PropertyOfferType; label: string }[] = [
  { value: 'sale', label: 'ซื้อ' },
  { value: 'rent', label: 'เช่า' },
  { value: 'business_transfer', label: 'เซ้ง' },
]

const propertyGroups = [
  {
    value: 'residential',
    label: 'ที่อยู่อาศัย',
    description: 'บ้าน คอนโด หอพัก',
    icon: House,
    types: [
      ['detached_house', 'บ้านเดี่ยว'],
      ['semi_detached_house', 'บ้านแฝด'],
      ['townhouse', 'ทาวน์เฮาส์'],
      ['condo', 'คอนโด'],
      ['apartment', 'อพาร์ตเมนต์'],
      ['dormitory', 'หอพัก'],
    ],
  },
  {
    value: 'mixed_use',
    label: 'อยู่และทำธุรกิจ',
    description: 'ตึกแถว โฮมออฟฟิศ',
    icon: Building2,
    types: [
      ['shophouse', 'ตึกแถว / อาคารพาณิชย์'],
      ['home_office', 'โฮมออฟฟิศ'],
    ],
  },
  {
    value: 'commercial',
    label: 'ธุรกิจและอุตสาหกรรม',
    description: 'ร้านค้า ออฟฟิศ โกดัง',
    icon: Warehouse,
    types: [
      ['office', 'สำนักงาน / ออฟฟิศ'],
      ['retail_space', 'พื้นที่ค้าขาย'],
      ['warehouse', 'โกดัง / คลังสินค้า'],
      ['factory', 'โรงงาน'],
    ],
  },
  {
    value: 'land',
    label: 'ที่ดิน',
    description: 'เปล่า หรือพร้อมสิ่งปลูกสร้าง',
    icon: LandPlot,
    types: [['land', 'ที่ดิน']],
  },
] as const

const useCases = [
  { value: 'residential', label: 'อยู่อาศัย', description: 'บ้านหรือพื้นที่สำหรับการพักอาศัย', icon: House },
  { value: 'office', label: 'ทำสำนักงาน', description: 'ออฟฟิศและพื้นที่ทำงาน', icon: Building2 },
  { value: 'retail', label: 'เปิดร้านค้า', description: 'ร้าน คีออส หรือล็อกขายของ', icon: Store },
  { value: 'food_service', label: 'ร้านอาหาร / คาเฟ่', description: 'พื้นที่ที่รองรับธุรกิจอาหาร', icon: Store },
  { value: 'storage', label: 'เก็บสินค้า', description: 'โกดังและคลังสินค้า', icon: Warehouse },
  { value: 'industrial', label: 'ผลิตสินค้า', description: 'โรงงานและงานอุตสาหกรรม', icon: Factory },
  { value: 'agriculture', label: 'เกษตรกรรม', description: 'ที่ดินสำหรับทำการเกษตร', icon: LandPlot },
] as const

const emptyPriceSelection: PropertyPriceSelection = { minPrice: '', maxPrice: '', monthlyRentMax: '' }

const PropertyHomeSearch = () => {
  const router = useRouter()
  const [offerType, setOfferType] = useState<PropertyOfferType>('sale')
  const [categoryMode, setCategoryMode] = useState<CategoryMode>('property_type')
  const [activeGroup, setActiveGroup] = useState<(typeof propertyGroups)[number]['value']>('residential')
  const [selectedCategory, setSelectedCategory] = useState({ value: '', label: 'ทุกประเภท', kind: 'property_type' })
  const [location, setLocation] = useState('')
  const [prices, setPrices] = useState<Record<PropertyOfferType, PropertyPriceSelection>>({
    sale: { ...emptyPriceSelection },
    rent: { ...emptyPriceSelection },
    business_transfer: { ...emptyPriceSelection },
  })

  const selectedGroup = useMemo(
    () => propertyGroups.find((group) => group.value === activeGroup) ?? propertyGroups[0],
    [activeGroup]
  )
  const currentPrice = prices[offerType]
  const hasInvalidPrice = Boolean(
    currentPrice.minPrice && currentPrice.maxPrice && Number(currentPrice.minPrice) > Number(currentPrice.maxPrice)
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()
    params.set('offer_type', offerType)
    if (location.trim()) params.set('location', location.trim())
    if (selectedCategory.value) params.set(selectedCategory.kind, selectedCategory.value)
    const price = prices[offerType]
    if (offerType === 'business_transfer') {
      if (price.minPrice) params.set('min_transfer_price', price.minPrice)
      if (price.maxPrice) params.set('max_transfer_price', price.maxPrice)
      if (price.monthlyRentMax) params.set('max_monthly_rent', price.monthlyRentMax)
    } else {
      if (price.minPrice) params.set('min_price', price.minPrice)
      if (price.maxPrice) params.set('max_price', price.maxPrice)
      params.set('price_unit', offerType === 'rent' ? 'month' : 'total')
    }
    router.push(`/real-estate-categories/all?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-[30px] border border-white/80 bg-white p-3 shadow-[0_24px_70px_-24px_rgba(15,76,58,0.35)] dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="mb-2 flex items-center gap-1.5 px-2 pt-1">
        {offerTypes.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setOfferType(item.value)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              offerType === item.value
                ? 'bg-[#123f32] text-white shadow-lg shadow-[#123f32]/20 dark:bg-emerald-100 dark:text-emerald-950'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 min-[744px]:grid-cols-[1.15fr_1.25fr_0.9fr_auto] min-[744px]:items-stretch">
        <label className="group flex min-h-20 items-center gap-3 rounded-2xl px-4 transition hover:bg-[#f3f7f5] dark:hover:bg-neutral-800">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e6f1ec] text-[#123f32] dark:bg-emerald-950 dark:text-emerald-200">
            <MapPin className="size-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-neutral-900 dark:text-white">ทำเลที่ตั้ง</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-neutral-500 placeholder:text-neutral-400 focus:ring-0 dark:text-neutral-300"
              placeholder="จังหวัด เขต หรือชื่อโครงการ"
            />
          </span>
        </label>

        <Headless.Popover className="relative min-w-0">
          {({ close }) => (
            <>
              <Headless.PopoverButton className="group flex min-h-20 w-full items-center gap-3 rounded-2xl px-4 text-left transition hover:bg-[#f3f7f5] focus:outline-none dark:hover:bg-neutral-800">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef0e6] text-[#5b6538] dark:bg-lime-950 dark:text-lime-200">
                  <Building2 className="size-5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-white">
                    ประเภทหรือการใช้งาน
                  </span>
                  <span className="mt-1 block truncate text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedCategory.label}
                  </span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-neutral-400" />
              </Headless.PopoverButton>

              <Headless.PopoverPanel
                transition
                className="absolute top-[calc(100%+14px)] left-0 z-50 w-[min(760px,calc(100vw-32px))] origin-top-left rounded-3xl border border-neutral-200 bg-white p-4 shadow-2xl transition duration-150 sm:p-6 dark:border-neutral-700 dark:bg-neutral-900 data-closed:-translate-y-2 data-closed:opacity-0"
              >
                <div className="mb-5 flex gap-2 border-b border-neutral-100 pb-4 dark:border-neutral-800">
                  {[
                    ['property_type', 'เลือกตามประเภททรัพย์'],
                    ['use_case', 'เลือกตามการใช้งาน'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategoryMode(value as CategoryMode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        categoryMode === value
                          ? 'bg-[#123f32] text-white dark:bg-emerald-100 dark:text-emerald-950'
                          : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {categoryMode === 'property_type' ? (
                  <div>
                    <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">กลุ่มอสังหาริมทรัพย์</p>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {propertyGroups.map((group) => {
                        const Icon = group.icon
                        const isActive = activeGroup === group.value
                        return (
                          <button
                            key={group.value}
                            type="button"
                            onClick={() => setActiveGroup(group.value)}
                            className={`rounded-2xl border p-3 text-left transition ${
                              isActive
                                ? 'border-[#123f32] bg-[#eff7f3] text-[#123f32] dark:border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-100'
                                : 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500'
                            }`}
                          >
                            <Icon className="mb-3 size-5" strokeWidth={1.7} />
                            <span className="block text-sm font-semibold">{group.label}</span>
                            <span className="mt-1 block text-xs opacity-65">{group.description}</span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-5 border-t border-neutral-100 pt-5 dark:border-neutral-800">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{selectedGroup.label}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory({
                              value: selectedGroup.value,
                              label: selectedGroup.label,
                              kind: 'property_group',
                            })
                            close()
                          }}
                          className="text-xs font-semibold text-[#176b50] hover:underline dark:text-emerald-300"
                        >
                          เลือกทั้งหมดในกลุ่ม
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedGroup.types.map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setSelectedCategory({ value, label, kind: 'property_type' })
                              close()
                            }}
                            className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition hover:border-[#176b50] hover:bg-[#eff7f3] hover:text-[#123f32] dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-emerald-400 dark:hover:bg-emerald-950"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {useCases.map((useCase) => {
                      const Icon = useCase.icon
                      return (
                        <button
                          key={useCase.value}
                          type="button"
                          onClick={() => {
                            setSelectedCategory({ value: useCase.value, label: useCase.label, kind: 'use_case' })
                            close()
                          }}
                          className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-left transition hover:border-[#176b50] hover:bg-[#eff7f3] dark:border-neutral-700 dark:hover:border-emerald-400 dark:hover:bg-emerald-950/50"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[#123f32] dark:bg-neutral-800 dark:text-emerald-200">
                            <Icon className="size-5" strokeWidth={1.7} />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-neutral-900 dark:text-white">
                              {useCase.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                              {useCase.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Headless.PopoverPanel>
            </>
          )}
        </Headless.Popover>

        <PropertyPricePopover
          offerType={offerType}
          value={prices[offerType]}
          onChange={(value) => setPrices((current) => ({ ...current, [offerType]: value }))}
        />

        <button
          type="submit"
          disabled={hasInvalidPrice}
          aria-label="ค้นหาอสังหาริมทรัพย์"
          className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-[#123f32] px-7 font-semibold text-white shadow-lg shadow-[#123f32]/20 transition hover:-translate-y-0.5 hover:bg-[#0b3227] disabled:cursor-not-allowed disabled:opacity-40 min-[744px]:m-2 min-[744px]:aspect-square min-[744px]:rounded-full min-[744px]:px-0 dark:bg-emerald-200 dark:text-emerald-950 dark:hover:bg-emerald-100"
        >
          <Search className="size-5" strokeWidth={2} />
          <span className="min-[744px]:sr-only">ค้นหา</span>
        </button>
      </div>
    </form>
  )
}

export default PropertyHomeSearch
