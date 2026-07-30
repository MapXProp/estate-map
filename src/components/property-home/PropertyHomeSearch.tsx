'use client'

import { propertyGroups, propertyUseCases } from '@/data/property-navigation'
import * as Headless from '@headlessui/react'
import { Building2, ChevronDown, MapPin, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropertyPricePopover, { PropertyOfferType, PropertyPriceSelection } from './PropertyPricePopover'
import PropertySearchBackdrop from './PropertySearchBackdrop'

type CategoryMode = 'property_type' | 'use_case'

const offerTypes: { value: PropertyOfferType; label: string }[] = [
  { value: 'sale', label: 'ซื้อ' },
  { value: 'rent', label: 'เช่า' },
  { value: 'business_transfer', label: 'เซ้ง' },
]

const propertyCategoryStyles = {
  card: 'border-neutral-200 bg-white text-neutral-800 hover:border-orange-400 hover:bg-orange-50/50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-orange-700 dark:hover:bg-orange-950/30',
  active:
    'border-orange-500 bg-orange-50 text-orange-900 shadow-sm shadow-orange-500/10 ring-1 ring-orange-500 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-100 dark:ring-orange-500',
  action: 'text-orange-600 dark:text-orange-300',
  chip: 'hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800 dark:hover:border-orange-600 dark:hover:bg-orange-950/40 dark:hover:text-orange-100',
} as const

const emptyPriceSelection: PropertyPriceSelection = { minPrice: '', maxPrice: '', monthlyRentMax: '' }

const PropertyHomeSearch = () => {
  const router = useRouter()
  const categoryButtonRef = useRef<HTMLButtonElement>(null)
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
  const [desktopCategoryPopupPosition, setDesktopCategoryPopupPosition] = useState<{
    left: number
    bottom: number
  } | null>(null)

  const updateCategoryPopupPosition = useCallback(() => {
    if (window.innerWidth < 1100 || !categoryButtonRef.current) {
      setDesktopCategoryPopupPosition(null)
      return
    }

    const buttonRect = categoryButtonRef.current.getBoundingClientRect()
    setDesktopCategoryPopupPosition({
      left: buttonRect.left + buttonRect.width / 2,
      bottom: window.innerHeight - buttonRect.top + 14,
    })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateCategoryPopupPosition)
    window.addEventListener('scroll', updateCategoryPopupPosition, true)

    return () => {
      window.removeEventListener('resize', updateCategoryPopupPosition)
      window.removeEventListener('scroll', updateCategoryPopupPosition, true)
    }
  }, [updateCategoryPopupPosition])

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
      className="relative z-40 rounded-[30px] border border-white/80 bg-white p-3 shadow-[0_24px_70px_-24px_rgba(15,76,58,0.35)] dark:border-neutral-700 dark:bg-neutral-900"
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

      <div className="grid grid-cols-1 gap-2 min-[744px]:grid-cols-2 min-[744px]:items-stretch min-[1100px]:grid-cols-[1.15fr_1.25fr_0.9fr_auto]">
        <label className="group flex min-h-16 items-center gap-3 rounded-2xl px-4 transition hover:bg-[#f3f7f5] min-[744px]:min-h-20 dark:hover:bg-neutral-800">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e6f1ec] text-[#123f32] dark:bg-emerald-950 dark:text-emerald-200">
            <MapPin className="size-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-neutral-900 dark:text-white">ทำเลที่ตั้ง</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-1 w-full border-0 bg-transparent p-0 text-base text-neutral-500 placeholder:text-neutral-400 focus:ring-0 min-[744px]:text-sm dark:text-neutral-300"
              placeholder="จังหวัด เขต หรือชื่อโครงการ"
            />
          </span>
        </label>

        <Headless.Popover className="relative min-w-0">
          {({ close, open }) => (
            <>
              <PropertySearchBackdrop open={open} onClose={close} />
              <Headless.PopoverButton
                ref={categoryButtonRef}
                onClick={updateCategoryPopupPosition}
                className="group flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 text-left transition hover:bg-[#f3f7f5] focus:outline-none min-[744px]:min-h-20 dark:hover:bg-neutral-800"
              >
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
                portal
                transition
                style={desktopCategoryPopupPosition ?? undefined}
                className="fixed inset-x-3 bottom-20 z-50 max-h-[calc(100dvh-6.5rem)] w-auto origin-bottom overflow-y-auto overscroll-contain rounded-3xl border border-neutral-200 bg-white p-4 shadow-2xl transition duration-150 min-[1100px]:inset-x-auto min-[1100px]:top-auto min-[1100px]:max-h-[min(52vh,520px)] min-[1100px]:w-[min(760px,calc(100vw-32px))] min-[1100px]:-translate-x-1/2 min-[1100px]:shadow-[0_-24px_65px_-30px_rgba(18,63,50,0.38)] sm:inset-x-8 sm:p-6 dark:border-neutral-700 dark:bg-neutral-900 data-closed:translate-y-3 data-closed:opacity-0 min-[1100px]:data-closed:translate-y-2"
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
                      className={`rounded-full border border-transparent px-4 py-2 text-sm font-semibold transition ${
                        categoryMode === value
                          ? 'border-orange-200 bg-orange-50 text-orange-700 shadow-sm shadow-orange-500/10 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200'
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
                              isActive ? propertyCategoryStyles.active : propertyCategoryStyles.card
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
                          className={`text-xs font-semibold hover:underline ${propertyCategoryStyles.action}`}
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
                            className={`rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition dark:border-neutral-700 dark:text-neutral-300 ${propertyCategoryStyles.chip}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {propertyUseCases.map((useCase) => {
                      const Icon = useCase.icon
                      return (
                        <button
                          key={useCase.value}
                          type="button"
                          onClick={() => {
                            setSelectedCategory({ value: useCase.value, label: useCase.label, kind: 'use_case' })
                            close()
                          }}
                          className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left transition hover:border-orange-400 hover:bg-orange-50/50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-orange-700 dark:hover:bg-orange-950/30"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
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
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#123f32] px-7 font-semibold text-white shadow-lg shadow-[#123f32]/20 transition hover:-translate-y-0.5 hover:bg-[#0b3227] disabled:cursor-not-allowed disabled:opacity-40 min-[744px]:min-w-36 min-[744px]:self-center min-[744px]:justify-self-end min-[744px]:rounded-full min-[744px]:px-6 min-[1100px]:m-2 min-[1100px]:aspect-square min-[1100px]:min-h-16 min-[1100px]:min-w-0 min-[1100px]:self-stretch min-[1100px]:justify-self-stretch min-[1100px]:px-0 dark:bg-emerald-200 dark:text-emerald-950 dark:hover:bg-emerald-100"
        >
          <Search className="size-5" strokeWidth={2} />
          <span className="min-[1100px]:sr-only">ค้นหา</span>
        </button>
      </div>
    </form>
  )
}

export default PropertyHomeSearch
