'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { propertyGroups, propertyUseCases } from '@/data/property-navigation'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Banknote, Building2, Check, ChevronRight, MapPin, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import {
  getPriceSummary,
  PropertyOfferType,
  PropertyPriceSelection,
} from './PropertyPricePopover'

type SearchSection = 'location' | 'category' | 'budget'
type CategoryMode = 'property_type' | 'use_case'

type SelectedCategory = {
  value: string
  label: string
  labelEn: string
  kind: string
}

const offerTypes: { value: PropertyOfferType; label: string; labelEn: string }[] = [
  { value: 'sale', label: 'ซื้อ', labelEn: 'Buy' },
  { value: 'rent', label: 'เช่า', labelEn: 'Rent' },
  { value: 'business_transfer', label: 'เซ้ง', labelEn: 'Transfer' },
]

const pricePresets: Record<PropertyOfferType, { minPrice: string; maxPrice: string }[]> = {
  sale: [
    { minPrice: '', maxPrice: '1000000' },
    { minPrice: '', maxPrice: '3000000' },
    { minPrice: '3000000', maxPrice: '5000000' },
    { minPrice: '5000000', maxPrice: '10000000' },
    { minPrice: '10000000', maxPrice: '' },
  ],
  rent: [
    { minPrice: '', maxPrice: '5000' },
    { minPrice: '5000', maxPrice: '10000' },
    { minPrice: '10000', maxPrice: '20000' },
    { minPrice: '20000', maxPrice: '50000' },
    { minPrice: '50000', maxPrice: '' },
  ],
  business_transfer: [
    { minPrice: '', maxPrice: '300000' },
    { minPrice: '300000', maxPrice: '500000' },
    { minPrice: '500000', maxPrice: '1000000' },
    { minPrice: '1000000', maxPrice: '3000000' },
    { minPrice: '3000000', maxPrice: '' },
  ],
}

const popularLocations = [
  ['กรุงเทพมหานคร', 'Bangkok'],
  ['เชียงใหม่', 'Chiang Mai'],
  ['ชลบุรี', 'Chon Buri'],
  ['ภูเก็ต', 'Phuket'],
  ['ขอนแก่น', 'Khon Kaen'],
] as const

const emptyPrice: PropertyPriceSelection = {
  minPrice: '',
  maxPrice: '',
  monthlyRentMax: '',
}

const cleanAmount = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 12)

const MobilePropertySearch = ({ className = '' }: { className?: string }) => {
  const router = useRouter()
  const {
    locale,
    currency,
    convertFromThb,
    convertToThb,
    formatCurrency,
  } = usePreferences()
  const isThai = locale === 'th'
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SearchSection>('location')
  const [offerType, setOfferType] = useState<PropertyOfferType>('sale')
  const [categoryMode, setCategoryMode] = useState<CategoryMode>('property_type')
  const [activeGroup, setActiveGroup] =
    useState<(typeof propertyGroups)[number]['value']>('residential')
  const [location, setLocation] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategory>({
    value: '',
    label: 'ทุกประเภท',
    labelEn: 'All types',
    kind: 'property_type',
  })
  const [prices, setPrices] = useState<Record<PropertyOfferType, PropertyPriceSelection>>({
    sale: { ...emptyPrice },
    rent: { ...emptyPrice },
    business_transfer: { ...emptyPrice },
  })

  const selectedGroup = useMemo(
    () => propertyGroups.find((group) => group.value === activeGroup) ?? propertyGroups[0],
    [activeGroup]
  )
  const currentPrice = prices[offerType]
  const compactCurrency = (amount: number) => formatCurrency(amount, { compact: true })
  const budgetSummary = getPriceSummary(offerType, currentPrice, compactCurrency, locale)
  const selectedOffer = offerTypes.find((item) => item.value === offerType) ?? offerTypes[0]
  const hasInvalidRange = Boolean(
    currentPrice.minPrice &&
      currentPrice.maxPrice &&
      Number(currentPrice.minPrice) > Number(currentPrice.maxPrice)
  )

  const setCurrentPrice = (next: Partial<PropertyPriceSelection>) => {
    setPrices((current) => ({
      ...current,
      [offerType]: { ...current[offerType], ...next },
    }))
  }

  const displayAmount = (value: string) => {
    if (!value) return ''
    return Math.round(convertFromThb(Number(value))).toLocaleString('en-US')
  }

  const updatePriceFromDisplay = (
    key: keyof PropertyPriceSelection,
    displayValue: string
  ) => {
    const cleaned = cleanAmount(displayValue)
    const value = cleaned ? String(Math.round(convertToThb(Number(cleaned)))) : ''
    setCurrentPrice({ [key]: value })
  }

  const presetLabel = (preset: { minPrice: string; maxPrice: string }) => {
    if (preset.maxPrice && !preset.minPrice) {
      return `${isThai ? 'ไม่เกิน' : 'Up to'} ${compactCurrency(Number(preset.maxPrice))}`
    }
    if (preset.minPrice && preset.maxPrice) {
      return `${compactCurrency(Number(preset.minPrice))}–${compactCurrency(Number(preset.maxPrice))}`
    }
    return `${compactCurrency(Number(preset.minPrice))}${isThai ? ' ขึ้นไป' : '+'}`
  }

  const resetSearch = () => {
    setOfferType('sale')
    setActiveSection('location')
    setCategoryMode('property_type')
    setActiveGroup('residential')
    setLocation('')
    setSelectedCategory({
      value: '',
      label: 'ทุกประเภท',
      labelEn: 'All types',
      kind: 'property_type',
    })
    setPrices({
      sale: { ...emptyPrice },
      rent: { ...emptyPrice },
      business_transfer: { ...emptyPrice },
    })
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (hasInvalidRange) return

    const params = new URLSearchParams()
    params.set('offer_type', offerType)
    if (location.trim()) params.set('location', location.trim())
    if (selectedCategory.value) {
      params.set(selectedCategory.kind, selectedCategory.value)
    }

    if (offerType === 'business_transfer') {
      if (currentPrice.minPrice) params.set('min_transfer_price', currentPrice.minPrice)
      if (currentPrice.maxPrice) params.set('max_transfer_price', currentPrice.maxPrice)
      if (currentPrice.monthlyRentMax) {
        params.set('max_monthly_rent', currentPrice.monthlyRentMax)
      }
    } else {
      if (currentPrice.minPrice) params.set('min_price', currentPrice.minPrice)
      if (currentPrice.maxPrice) params.set('max_price', currentPrice.maxPrice)
      params.set('price_unit', offerType === 'rent' ? 'month' : 'total')
    }

    setOpen(false)
    router.push(`/real-estate-categories/all?${params.toString()}`)
  }

  const triggerCategory = isThai ? selectedCategory.label : selectedCategory.labelEn
  const triggerOffer = isThai ? selectedOffer.label : selectedOffer.labelEn

  return (
    <div className={`relative z-10 w-full ${className}`}>
      <button
        type="button"
        onClick={() => {
          setActiveSection('location')
          setOpen(true)
        }}
        className="flex min-h-14 w-full items-center gap-3 rounded-full border border-neutral-200 bg-white py-2 ps-3 pe-4 text-start shadow-[0_6px_22px_rgba(15,23,42,0.10)] transition active:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf4ef] text-[#123f32] dark:bg-emerald-950 dark:text-emerald-200">
          <Search className="size-4.5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-neutral-950 dark:text-white">
            {location || (isThai ? 'ค้นหาทำเลหรือโครงการ' : 'Search location or project')}
          </span>
          <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
            {triggerOffer} · {triggerCategory} · {budgetSummary}
          </span>
        </span>
      </button>

      <Dialog open={open} onClose={setOpen} className="relative z-[100] min-[744px]:hidden">
        <DialogPanel
          transition
          className="fixed inset-0 flex h-[100dvh] flex-col bg-[#f4f5f6] text-neutral-950 transition duration-200 data-closed:translate-y-8 data-closed:opacity-0 dark:bg-neutral-950 dark:text-white"
        >
          <form onSubmit={submitSearch} className="flex min-h-0 flex-1 flex-col">
            <header className="shrink-0 border-b border-neutral-200/80 bg-white px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex min-h-10 items-center justify-between gap-3">
                <DialogTitle className="text-lg font-semibold">
                  {isThai ? 'ค้นหาอสังหา' : 'Find a property'}
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={isThai ? 'ปิดการค้นหา' : 'Close search'}
                  className="grid size-9 place-items-center rounded-full border border-neutral-200 text-neutral-600 transition active:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
                {offerTypes.map((offer) => {
                  const selected = offer.value === offerType
                  return (
                    <button
                      key={offer.value}
                      type="button"
                      onClick={() => setOfferType(offer.value)}
                      className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition ${
                        selected
                          ? 'bg-[#123f32] text-white shadow-sm dark:bg-emerald-200 dark:text-emerald-950'
                          : 'text-neutral-500 active:bg-white/70 dark:text-neutral-400 dark:active:bg-neutral-700'
                      }`}
                    >
                      {isThai ? offer.label : offer.labelEn}
                    </button>
                  )
                })}
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              <div className="mx-auto max-w-lg space-y-3">
                <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  {activeSection === 'location' ? (
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-[#176b50] dark:text-emerald-300">
                        <MapPin className="size-5" />
                        <h2 className="text-lg font-semibold">
                          {isThai ? 'ไปที่ไหนดี?' : 'Where do you want to go?'}
                        </h2>
                      </div>
                      <label className="mt-4 flex min-h-13 items-center gap-3 rounded-2xl border border-[#176b50] bg-white px-4 ring-3 ring-[#176b50]/10 dark:bg-neutral-950">
                        <Search className="size-5 shrink-0 text-neutral-500" />
                        <input
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          inputMode="search"
                          autoComplete="off"
                          placeholder={
                            isThai
                              ? 'จังหวัด เขต หรือชื่อโครงการ'
                              : 'Province, district or project'
                          }
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-neutral-950 placeholder:text-neutral-400 focus:ring-0 dark:text-white"
                        />
                      </label>

                      <p className="mt-6 text-sm font-semibold">
                        {isThai ? 'ทำเลยอดนิยม' : 'Popular locations'}
                      </p>
                      <div className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
                        {popularLocations.map(([name, nameEn]) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setLocation(isThai ? name : nameEn)
                              setActiveSection('category')
                            }}
                            className="flex min-h-12 w-full items-center gap-3 text-start text-sm transition active:text-[#176b50]"
                          >
                            <MapPin className="size-4.5 shrink-0 text-neutral-400" />
                            <span>{isThai ? name : nameEn}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSection('location')}
                      className="flex min-h-17 w-full items-center gap-3 px-4 text-start"
                    >
                      <MapPin className="size-5 shrink-0 text-[#176b50]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-neutral-400">
                          {isThai ? 'ทำเลที่ตั้ง' : 'Location'}
                        </span>
                        <span className="mt-1 block truncate text-sm font-semibold">
                          {location || (isThai ? 'เลือกทำเล' : 'Choose a location')}
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-neutral-300" />
                    </button>
                  )}
                </section>

                <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  {activeSection === 'category' ? (
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-[#176b50] dark:text-emerald-300">
                        <Building2 className="size-5" />
                        <h2 className="text-lg font-semibold">
                          {isThai ? 'ต้องการพื้นที่แบบไหน?' : 'What kind of space?'}
                        </h2>
                      </div>

                      <div className="mt-4 flex gap-2">
                        {[
                          ['property_type', isThai ? 'ตามประเภททรัพย์' : 'Property type'],
                          ['use_case', isThai ? 'ตามการใช้งาน' : 'By use'],
                        ].map(([mode, label]) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setCategoryMode(mode as CategoryMode)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${
                              categoryMode === mode
                                ? 'bg-orange-500 text-white'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {categoryMode === 'property_type' ? (
                        <>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {propertyGroups.map((group) => {
                              const Icon = group.icon
                              const selected = group.value === activeGroup
                              return (
                                <button
                                  key={group.value}
                                  type="button"
                                  onClick={() => setActiveGroup(group.value)}
                                  className={`rounded-2xl border p-3 text-start transition ${
                                    selected
                                      ? 'border-orange-400 bg-orange-50 text-orange-900 dark:bg-orange-950/35 dark:text-orange-100'
                                      : 'border-neutral-200 dark:border-neutral-700'
                                  }`}
                                >
                                  <Icon className="size-5" />
                                  <span className="mt-2 block text-sm font-semibold">
                                    {isThai ? group.label : group.labelEn}
                                  </span>
                                </button>
                              )
                            })}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory({
                                  value: selectedGroup.value,
                                  label: selectedGroup.label,
                                  labelEn: selectedGroup.labelEn,
                                  kind: 'property_group',
                                })
                                setActiveSection('budget')
                              }}
                              className="rounded-full border border-orange-300 bg-orange-50 px-3.5 py-2 text-sm font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-200"
                            >
                              {isThai ? 'ทั้งหมดในกลุ่ม' : 'Entire group'}
                            </button>
                            {selectedGroup.types.map(([value, label, labelEn]) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  setSelectedCategory({
                                    value,
                                    label,
                                    labelEn,
                                    kind: 'property_type',
                                  })
                                  setActiveSection('budget')
                                }}
                                className="rounded-full border border-neutral-200 px-3.5 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                              >
                                {isThai ? label : labelEn}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="mt-4 grid gap-2">
                          {propertyUseCases.map((useCase) => {
                            const Icon = useCase.icon
                            return (
                              <button
                                key={useCase.value}
                                type="button"
                                onClick={() => {
                                  setSelectedCategory({
                                    value: useCase.value,
                                    label: useCase.label,
                                    labelEn: useCase.labelEn,
                                    kind: 'use_case',
                                  })
                                  setActiveSection('budget')
                                }}
                                className="flex min-h-14 items-center gap-3 rounded-2xl border border-neutral-200 px-3 text-start dark:border-neutral-700"
                              >
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                                  <Icon className="size-4.5" />
                                </span>
                                <span>
                                  <span className="block text-sm font-semibold">
                                    {isThai ? useCase.label : useCase.labelEn}
                                  </span>
                                  <span className="mt-0.5 block text-xs text-neutral-500">
                                    {isThai ? useCase.description : useCase.descriptionEn}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSection('category')}
                      className="flex min-h-17 w-full items-center gap-3 px-4 text-start"
                    >
                      <Building2 className="size-5 shrink-0 text-[#66713e]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-neutral-400">
                          {isThai ? 'ประเภทหรือการใช้งาน' : 'Type or use'}
                        </span>
                        <span className="mt-1 block truncate text-sm font-semibold">
                          {triggerCategory}
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-neutral-300" />
                    </button>
                  )}
                </section>

                <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  {activeSection === 'budget' ? (
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-[#8b5a22] dark:text-amber-300">
                        <Banknote className="size-5" />
                        <h2 className="text-lg font-semibold">
                          {offerType === 'sale'
                            ? isThai
                              ? 'งบซื้อรวม'
                              : 'Purchase budget'
                            : offerType === 'rent'
                              ? isThai
                                ? 'ค่าเช่าต่อเดือน'
                                : 'Monthly rent'
                              : isThai
                                ? 'งบค่าเซ้ง'
                                : 'Transfer budget'}
                        </h2>
                      </div>

                      {currency === 'USD' && (
                        <p className="mt-1 text-xs text-orange-600 dark:text-orange-300">
                          {isThai
                            ? 'ราคา USD เป็นราคาอ้างอิงโดยประมาณ'
                            : 'USD amounts are approximate reference prices'}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {pricePresets[offerType].map((preset) => {
                          const selected =
                            currentPrice.minPrice === preset.minPrice &&
                            currentPrice.maxPrice === preset.maxPrice
                          return (
                            <button
                              key={`${preset.minPrice}-${preset.maxPrice}`}
                              type="button"
                              onClick={() =>
                                setCurrentPrice({
                                  minPrice: preset.minPrice,
                                  maxPrice: preset.maxPrice,
                                })
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm ${
                                selected
                                  ? 'border-[#176b50] bg-[#edf6f1] font-semibold text-[#123f32] dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-100'
                                  : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {selected && <Check className="size-3.5" />}
                              {presetLabel(preset)}
                            </button>
                          )
                        })}
                      </div>

                      <p className="mt-5 text-sm font-semibold">
                        {isThai ? 'กำหนดช่วงราคาเอง' : 'Custom price range'}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {[
                          ['minPrice', isThai ? 'ต่ำสุด' : 'Minimum'],
                          ['maxPrice', isThai ? 'สูงสุด' : 'Maximum'],
                        ].map(([key, label]) => (
                          <label
                            key={key}
                            className="rounded-2xl border border-neutral-200 px-3 py-2 dark:border-neutral-700"
                          >
                            <span className="block text-xs text-neutral-400">{label}</span>
                            <span className="mt-1 flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-neutral-400">
                                {currency === 'USD' ? '$' : '฿'}
                              </span>
                              <input
                                inputMode="numeric"
                                value={displayAmount(
                                  currentPrice[key as keyof PropertyPriceSelection]
                                )}
                                onChange={(event) =>
                                  updatePriceFromDisplay(
                                    key as keyof PropertyPriceSelection,
                                    event.target.value
                                  )
                                }
                                placeholder="0"
                                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-semibold focus:ring-0"
                              />
                            </span>
                          </label>
                        ))}
                      </div>

                      {offerType === 'business_transfer' && (
                        <label className="mt-2 block rounded-2xl border border-neutral-200 px-3 py-2 dark:border-neutral-700">
                          <span className="block text-xs text-neutral-400">
                            {isThai
                              ? 'ค่าเช่ารายเดือนหลังรับช่วง ไม่เกิน'
                              : 'Maximum monthly rent after transfer'}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-neutral-400">
                              {currency === 'USD' ? '$' : '฿'}
                            </span>
                            <input
                              inputMode="numeric"
                              value={displayAmount(currentPrice.monthlyRentMax)}
                              onChange={(event) =>
                                updatePriceFromDisplay(
                                  'monthlyRentMax',
                                  event.target.value
                                )
                              }
                              placeholder="0"
                              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-semibold focus:ring-0"
                            />
                          </span>
                        </label>
                      )}

                      {hasInvalidRange && (
                        <p className="mt-2 text-xs font-medium text-rose-600">
                          {isThai
                            ? 'ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด'
                            : 'Minimum cannot exceed maximum'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSection('budget')}
                      className="flex min-h-17 w-full items-center gap-3 px-4 text-start"
                    >
                      <Banknote className="size-5 shrink-0 text-[#8b5a22]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-neutral-400">
                          {isThai ? 'งบประมาณ' : 'Budget'}
                        </span>
                        <span className="mt-1 block truncate text-sm font-semibold">
                          {budgetSummary}
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-neutral-300" />
                    </button>
                  )}
                </section>
              </div>
            </main>

            <footer className="shrink-0 border-t border-neutral-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={resetSearch}
                  className="min-h-11 px-2 text-sm font-semibold text-neutral-600 underline decoration-neutral-300 underline-offset-4 dark:text-neutral-300"
                >
                  {isThai ? 'ล้างทั้งหมด' : 'Clear all'}
                </button>
                <button
                  type="submit"
                  disabled={hasInvalidRange}
                  className="inline-flex min-h-12 min-w-32 items-center justify-center gap-2 rounded-full bg-[#123f32] px-6 text-sm font-semibold text-white shadow-lg shadow-[#123f32]/20 disabled:opacity-40 dark:bg-emerald-200 dark:text-emerald-950"
                >
                  <Search className="size-4.5" />
                  {isThai ? 'ค้นหา' : 'Search'}
                </button>
              </div>
            </footer>
          </form>
        </DialogPanel>
      </Dialog>
    </div>
  )
}

export default MobilePropertySearch
