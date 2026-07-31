'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertySearchUrl } from '@/lib/propertySearch'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  Banknote,
  Building2,
  Check,
  Factory,
  House,
  LandPlot,
  Search,
  Sparkles,
  Store,
  Warehouse,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import PropertySearchOmnibox from './PropertySearchOmnibox'

type OfferType = '' | 'sale' | 'rent' | 'business_transfer'

type BudgetPreset = {
  label: string
  labelEn: string
  term: string
  termEn: string
}

const offerTypes: Array<{ value: OfferType; label: string; labelEn: string; term: string; termEn: string }> = [
  { value: '', label: 'ทั้งหมด', labelEn: 'All', term: '', termEn: '' },
  { value: 'sale', label: 'ซื้อ', labelEn: 'Buy', term: 'ซื้อ', termEn: 'buy' },
  { value: 'rent', label: 'เช่า', labelEn: 'Rent', term: 'เช่า', termEn: 'rent' },
  {
    value: 'business_transfer',
    label: 'เซ้ง',
    labelEn: 'Transfer',
    term: 'เซ้ง',
    termEn: 'business transfer',
  },
]

const propertyTypes = [
  { value: 'house', label: 'บ้าน', labelEn: 'House', term: 'บ้าน', termEn: 'house', icon: House },
  { value: 'condo', label: 'คอนโด', labelEn: 'Condo', term: 'คอนโด', termEn: 'condo', icon: Building2 },
  {
    value: 'townhouse',
    label: 'ทาวน์โฮม',
    labelEn: 'Townhome',
    term: 'ทาวน์โฮม',
    termEn: 'townhome',
    icon: House,
  },
  { value: 'dormitory', label: 'หอพัก', labelEn: 'Dorm', term: 'หอพัก', termEn: 'dorm', icon: Building2 },
  { value: 'retail_space', label: 'ร้านค้า', labelEn: 'Shop', term: 'ร้านค้า', termEn: 'shop', icon: Store },
  { value: 'office', label: 'ออฟฟิศ', labelEn: 'Office', term: 'ออฟฟิศ', termEn: 'office', icon: Building2 },
  { value: 'warehouse', label: 'โกดัง', labelEn: 'Warehouse', term: 'โกดัง', termEn: 'warehouse', icon: Warehouse },
  { value: 'factory', label: 'โรงงาน', labelEn: 'Factory', term: 'โรงงาน', termEn: 'factory', icon: Factory },
  { value: 'land', label: 'ที่ดิน', labelEn: 'Land', term: 'ที่ดิน', termEn: 'land', icon: LandPlot },
] as const

const budgets: Record<Exclude<OfferType, ''>, BudgetPreset[]> = {
  sale: [
    { label: 'ไม่เกิน 3 ล้าน', labelEn: 'Up to 3M', term: 'ไม่เกิน 3 ล้าน', termEn: 'under 3m' },
    { label: '3–5 ล้าน', labelEn: '3–5M', term: '3-5 ล้าน', termEn: '3-5m' },
    { label: '5–10 ล้าน', labelEn: '5–10M', term: '5-10 ล้าน', termEn: '5-10m' },
    { label: '10 ล้านขึ้นไป', labelEn: '10M+', term: 'ตั้งแต่ 10 ล้าน', termEn: 'from 10m' },
  ],
  rent: [
    { label: 'ไม่เกิน 10,000', labelEn: 'Up to 10K', term: 'ไม่เกิน 10000', termEn: 'under 10k' },
    { label: '10,000–20,000', labelEn: '10–20K', term: '10000-20000', termEn: '10k-20k' },
    { label: '20,000–50,000', labelEn: '20–50K', term: '20000-50000', termEn: '20k-50k' },
    { label: '50,000 ขึ้นไป', labelEn: '50K+', term: 'ตั้งแต่ 50000', termEn: 'from 50k' },
  ],
  business_transfer: [
    { label: 'ไม่เกิน 3 แสน', labelEn: 'Up to 300K', term: 'ไม่เกิน 3 แสน', termEn: 'under 300k' },
    { label: '3–5 แสน', labelEn: '300–500K', term: '3-5 แสน', termEn: '300k-500k' },
    { label: '5 แสน–1 ล้าน', labelEn: '500K–1M', term: '0.5-1 ล้าน', termEn: '0.5-1m' },
    { label: '1 ล้านขึ้นไป', labelEn: '1M+', term: 'ตั้งแต่ 1 ล้าน', termEn: 'from 1m' },
  ],
}

const popularSearches = [
  ['คอนโดอารีย์', 'Condo in Ari'],
  ['โกดังบางนา', 'Warehouse in Bang Na'],
  ['ที่ดินเชียงใหม่', 'Land in Chiang Mai'],
  ['บ้านเลี้ยงสัตว์ได้', 'Pet-friendly house'],
] as const

const MobilePropertySearch = ({ className = '' }: { className?: string }) => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [open, setOpen] = useState(false)
  const [offerType, setOfferType] = useState<OfferType>('')
  const [propertyType, setPropertyType] = useState<(typeof propertyTypes)[number] | null>(null)
  const [budget, setBudget] = useState<BudgetPreset | null>(null)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetOfferType, setBudgetOfferType] = useState<Exclude<OfferType, ''>>('sale')

  const selectedOffer = useMemo(
    () => offerTypes.find((item) => item.value === offerType) ?? offerTypes[0],
    [offerType]
  )

  const chooseOffer = (value: OfferType) => {
    setOfferType(value)
    setBudget(null)
    if (value) setBudgetOfferType(value)
  }

  const composeQuery = (input: string) => {
    const cleanedInput = offerType
      ? input
          .replace(/(?:ให้เช่า|โอนกิจการ|ซื้อ|ขาย|เช่า|เซ้ง|\bbuy\b|\bsale\b|\brent\b|\btransfer\b)/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : input.trim()
    const terms = [
      offerType ? (isThai ? selectedOffer.term : selectedOffer.termEn) : '',
      propertyType ? (isThai ? propertyType.term : propertyType.termEn) : '',
      budget ? (isThai ? budget.term : budget.termEn) : '',
      cleanedInput,
    ]
    return terms.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  }

  const searchPopular = (query: string) => {
    const finalQuery = composeQuery(query)
    setOpen(false)
    router.push(getPropertySearchUrl(finalQuery))
  }

  const hasQuickFilters = Boolean(offerType || propertyType || budget)

  return (
    <div className={`relative z-10 w-full ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center gap-3 rounded-full border border-neutral-200 bg-white py-2 ps-3 pe-4 text-start shadow-[0_6px_22px_rgba(15,23,42,0.10)] transition active:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf4ef] text-[#123f32] dark:bg-emerald-950 dark:text-emerald-200">
          <Search className="size-4.5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-neutral-950 dark:text-white">
            {isThai ? 'ค้นหาทำเลหรืออสังหาที่ต้องการ' : 'Search location or property'}
          </span>
          <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
            {hasQuickFilters
              ? [
                  offerType ? (isThai ? selectedOffer.label : selectedOffer.labelEn) : null,
                  propertyType ? (isThai ? propertyType.label : propertyType.labelEn) : null,
                  budget ? (isThai ? budget.label : budget.labelEn) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : isThai
                ? 'พิมพ์หรือแตะตัวเลือกได้เลย'
                : 'Type or tap a quick option'}
          </span>
        </span>
      </button>

      <Dialog open={open} onClose={setOpen} className="relative z-[100] min-[744px]:hidden">
        <DialogPanel
          transition
          className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-[#f4f5f6] text-neutral-950 transition duration-200 data-closed:translate-y-8 data-closed:opacity-0 dark:bg-neutral-950 dark:text-white"
        >
          <div className="flex items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {isThai ? 'อยากได้พื้นที่แบบไหน?' : 'What space are you looking for?'}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {isThai ? 'พิมพ์เองหรือแตะตัวเลือกก็ได้' : 'Type naturally or use quick choices'}
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
            <PropertySearchOmnibox
              autoFocus
              buildQuery={composeQuery}
              suggestionsMode="inline"
              showSuggestionsOnEmpty={false}
              onSubmitQuery={() => setOpen(false)}
            />

            <section className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {isThai ? 'ต้องการแบบไหน' : 'Looking to'}
                </h2>
                {hasQuickFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setOfferType('')
                      setPropertyType(null)
                      setBudget(null)
                    }}
                    className="text-xs font-semibold text-[#176b50] dark:text-emerald-300"
                  >
                    {isThai ? 'ล้างตัวเลือก' : 'Clear'}
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 rounded-2xl bg-neutral-200/65 p-1.5 dark:bg-neutral-800">
                {offerTypes.map((offer) => {
                  const active = offerType === offer.value
                  return (
                    <button
                      key={offer.value || 'all'}
                      type="button"
                      onClick={() => chooseOffer(offer.value)}
                      className={`min-h-10 rounded-xl px-2 text-sm font-semibold transition ${
                        active
                          ? 'bg-[#123f32] text-white shadow-sm dark:bg-emerald-200 dark:text-emerald-950'
                          : 'text-neutral-500 active:bg-white/80 dark:text-neutral-400 dark:active:bg-neutral-700'
                      }`}
                    >
                      {isThai ? offer.label : offer.labelEn}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {isThai ? 'ประเภทยอดนิยม' : 'Popular property types'}
                </h2>
                <span className="text-[11px] text-neutral-400">{isThai ? 'เลื่อนดูเพิ่มเติม' : 'Swipe for more'}</span>
              </div>
              <div className="-mx-4 mt-2 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {propertyTypes.map((property) => {
                  const Icon = property.icon
                  const active = propertyType?.value === property.value
                  return (
                    <button
                      key={property.value}
                      type="button"
                      onClick={() => setPropertyType(active ? null : property)}
                      className={`flex min-w-[82px] snap-start flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition ${
                        active
                          ? 'border-[#176b50] bg-[#e7f2ed] text-[#123f32] ring-1 ring-[#176b50] dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-400'
                          : 'border-neutral-200 bg-white text-neutral-600 active:border-[#8ab6a7] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                      }`}
                    >
                      <span className={`grid size-9 place-items-center rounded-full ${active ? 'bg-white/80 dark:bg-emerald-900' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                        <Icon className="size-4.5" strokeWidth={1.8} />
                      </span>
                      {isThai ? property.label : property.labelEn}
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
                onClick={() => {
                  setBudgetOfferType(offerType || 'sale')
                  setBudgetOpen(true)
                }}
                className={`mt-2 flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-start transition ${
                  budget
                    ? 'border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100'
                    : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'
                }`}
              >
                <span className="grid size-9 place-items-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200">
                  <Banknote className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {budget ? (isThai ? budget.label : budget.labelEn) : isThai ? 'ไม่จำกัดงบ' : 'Any budget'}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                    {isThai ? 'แตะเพื่อเลือกช่วงราคา' : 'Tap to choose a price range'}
                  </span>
                </span>
                {budget && <Check className="size-5 text-orange-600 dark:text-orange-300" />}
              </button>
            </section>

            <section className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                <Sparkles className="size-4.5 text-[#176b50] dark:text-emerald-300" />
                {isThai ? 'คนกำลังค้นหา' : 'Popular searches'}
              </div>
              <div className="mt-2 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white px-4 dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                {popularSearches.map(([label, labelEn]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => searchPopular(isThai ? label : labelEn)}
                    className="flex min-h-12 w-full items-center gap-3 text-start text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <Search className="size-4 shrink-0 text-neutral-400" />
                    {isThai ? label : labelEn}
                  </button>
                ))}
              </div>
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
              <div className="relative z-10 w-full rounded-t-[30px] bg-white px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-neutral-900">
                <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{isThai ? 'เลือกงบประมาณ' : 'Choose your budget'}</h2>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {isThai ? 'ช่วงราคาจะเปลี่ยนตามรูปแบบประกาศ' : 'Ranges adapt to the offer type'}
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

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
                  {offerTypes.slice(1).map((offer) => {
                    const active = budgetOfferType === offer.value
                    return (
                      <button
                        key={offer.value}
                        type="button"
                        onClick={() => {
                          setBudgetOfferType(offer.value as Exclude<OfferType, ''>)
                          setBudget(null)
                        }}
                        className={`min-h-10 rounded-xl text-sm font-semibold ${
                          active ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {isThai ? offer.label : offer.labelEn}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {budgets[budgetOfferType].map((preset) => {
                    const active = budget?.term === preset.term && offerType === budgetOfferType
                    return (
                      <button
                        key={preset.term}
                        type="button"
                        onClick={() => {
                          setOfferType(budgetOfferType)
                          setBudget(preset)
                          setBudgetOpen(false)
                        }}
                        className={`min-h-13 rounded-2xl border px-3 text-sm font-semibold transition ${
                          active
                            ? 'border-orange-500 bg-orange-50 text-orange-800 ring-1 ring-orange-500 dark:bg-orange-950/40 dark:text-orange-100'
                            : 'border-neutral-200 text-neutral-600 active:border-orange-300 dark:border-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {isThai ? preset.label : preset.labelEn}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBudget(null)
                    setBudgetOpen(false)
                  }}
                  className="mt-3 min-h-12 w-full rounded-2xl text-sm font-semibold text-neutral-500"
                >
                  {isThai ? 'ไม่จำกัดงบประมาณ' : 'Any budget'}
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
