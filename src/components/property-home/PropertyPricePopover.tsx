'use client'

import * as Headless from '@headlessui/react'
import { Banknote, Check, ChevronDown, RotateCcw } from 'lucide-react'

export type PropertyOfferType = 'sale' | 'rent' | 'business_transfer'

export type PropertyPriceSelection = {
  minPrice: string
  maxPrice: string
  monthlyRentMax: string
}

type PricePreset = {
  label: string
  minPrice: string
  maxPrice: string
}

const presets: Record<PropertyOfferType, PricePreset[]> = {
  sale: [
    { label: 'ไม่เกิน 1 ล้าน', minPrice: '', maxPrice: '1000000' },
    { label: 'ไม่เกิน 3 ล้าน', minPrice: '', maxPrice: '3000000' },
    { label: '3–5 ล้าน', minPrice: '3000000', maxPrice: '5000000' },
    { label: '5–10 ล้าน', minPrice: '5000000', maxPrice: '10000000' },
    { label: '10 ล้านบาทขึ้นไป', minPrice: '10000000', maxPrice: '' },
  ],
  rent: [
    { label: 'ไม่เกิน 5,000', minPrice: '', maxPrice: '5000' },
    { label: '5,000–10,000', minPrice: '5000', maxPrice: '10000' },
    { label: '10,000–20,000', minPrice: '10000', maxPrice: '20000' },
    { label: '20,000–50,000', minPrice: '20000', maxPrice: '50000' },
    { label: '50,000 ขึ้นไป', minPrice: '50000', maxPrice: '' },
  ],
  business_transfer: [
    { label: 'ไม่เกิน 300,000', minPrice: '', maxPrice: '300000' },
    { label: '300,000–500,000', minPrice: '300000', maxPrice: '500000' },
    { label: '500,000–1 ล้าน', minPrice: '500000', maxPrice: '1000000' },
    { label: '1–3 ล้าน', minPrice: '1000000', maxPrice: '3000000' },
    { label: '3 ล้านบาทขึ้นไป', minPrice: '3000000', maxPrice: '' },
  ],
}

const offerContent: Record<
  PropertyOfferType,
  { fieldLabel: string; description: string; minPlaceholder: string; maxPlaceholder: string }
> = {
  sale: {
    fieldLabel: 'งบซื้อรวม',
    description: 'ราคาขายรวมของทรัพย์',
    minPlaceholder: 'เช่น 1,000,000',
    maxPlaceholder: 'เช่น 3,000,000',
  },
  rent: {
    fieldLabel: 'ค่าเช่าต่อเดือน',
    description: 'งบค่าเช่าที่จ่ายในแต่ละเดือน',
    minPlaceholder: 'เช่น 5,000',
    maxPlaceholder: 'เช่น 20,000',
  },
  business_transfer: {
    fieldLabel: 'ค่าเซ้งกิจการ',
    description: 'เงินก้อนที่จ่ายเพื่อรับช่วงกิจการหรือสิทธิการเช่า',
    minPlaceholder: 'เช่น 300,000',
    maxPlaceholder: 'เช่น 1,000,000',
  },
}

const cleanAmount = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 12)

const formatInputAmount = (value: string) => {
  if (!value) return ''
  return Number(value).toLocaleString('en-US')
}

const formatCompactAmount = (value: string) => {
  const amount = Number(value)
  if (!amount) return ''

  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} ล้าน`
  }

  return amount.toLocaleString('en-US')
}

export const getPriceSummary = (offerType: PropertyOfferType, selection: PropertyPriceSelection) => {
  const { minPrice, maxPrice, monthlyRentMax } = selection
  let mainSummary = ''

  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    return 'ตรวจสอบช่วงราคา'
  }

  if (minPrice && maxPrice && minPrice === maxPrice) {
    mainSummary = `฿${formatCompactAmount(minPrice)}`
  } else if (minPrice && maxPrice) {
    mainSummary = `฿${formatCompactAmount(minPrice)}–${formatCompactAmount(maxPrice)}`
  } else if (maxPrice) {
    mainSummary = `ไม่เกิน ฿${formatCompactAmount(maxPrice)}`
  } else if (minPrice) {
    mainSummary = `ตั้งแต่ ฿${formatCompactAmount(minPrice)}`
  }

  if (offerType === 'rent') {
    return mainSummary ? `${mainSummary}/เดือน` : 'ไม่จำกัดค่าเช่า'
  }

  if (offerType === 'business_transfer') {
    const transferSummary = mainSummary ? `ค่าเซ้ง ${mainSummary}` : 'ไม่จำกัดค่าเซ้ง'
    return monthlyRentMax
      ? `${transferSummary} · เช่า ≤ ฿${formatCompactAmount(monthlyRentMax)}/เดือน`
      : transferSummary
  }

  return mainSummary || 'ไม่จำกัดงบซื้อ'
}

const PriceInput = ({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) => (
  <label className="block min-w-0 flex-1">
    <span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="flex items-center rounded-2xl border border-neutral-200 bg-white px-3 transition focus-within:border-[#176b50] focus-within:ring-2 focus-within:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:border-emerald-400">
      <span className="text-sm font-semibold text-neutral-400">฿</span>
      <input
        inputMode="numeric"
        value={formatInputAmount(value)}
        onChange={(event) => onChange(cleanAmount(event.target.value))}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-3 text-sm font-medium text-neutral-900 placeholder:text-neutral-300 focus:ring-0 dark:text-white dark:placeholder:text-neutral-600"
      />
    </span>
  </label>
)

const PropertyPricePopover = ({
  offerType,
  value,
  onChange,
}: {
  offerType: PropertyOfferType
  value: PropertyPriceSelection
  onChange: (value: PropertyPriceSelection) => void
}) => {
  const content = offerContent[offerType]
  const summary = getPriceSummary(offerType, value)
  const hasInvalidRange = Boolean(value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice))

  const updateValue = (next: Partial<PropertyPriceSelection>) => onChange({ ...value, ...next })
  const clearValue = () => onChange({ minPrice: '', maxPrice: '', monthlyRentMax: '' })

  return (
    <Headless.Popover className="relative min-w-0">
      {({ close }) => (
        <>
          <Headless.PopoverButton className="flex min-h-20 w-full items-center gap-3 rounded-2xl px-4 text-left transition hover:bg-[#f3f7f5] focus:outline-none dark:hover:bg-neutral-800">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f7eee2] text-[#8b5a22] dark:bg-amber-950 dark:text-amber-200">
              <Banknote className="size-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-neutral-900 dark:text-white">{content.fieldLabel}</span>
              <span className="mt-1 block truncate text-sm text-neutral-500 dark:text-neutral-400">{summary}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-neutral-400" />
          </Headless.PopoverButton>

          <Headless.PopoverPanel
            transition
            className="absolute top-[calc(100%+14px)] right-0 z-50 w-[min(520px,calc(100vw-32px))] origin-top-right rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl transition duration-150 sm:p-6 dark:border-neutral-700 dark:bg-neutral-900 data-closed:-translate-y-2 data-closed:opacity-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">{content.fieldLabel}</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{content.description}</p>
              </div>
              {(value.minPrice || value.maxPrice || value.monthlyRentMax) && (
                <button
                  type="button"
                  onClick={clearValue}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  <RotateCcw className="size-3.5" /> ล้าง
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {presets[offerType].map((preset) => {
                const selected = value.minPrice === preset.minPrice && value.maxPrice === preset.maxPrice
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => updateValue({ minPrice: preset.minPrice, maxPrice: preset.maxPrice })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                      selected
                        ? 'border-[#176b50] bg-[#edf6f1] text-[#123f32] dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500'
                    }`}
                  >
                    {selected && <Check className="size-3.5" />}
                    {preset.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-neutral-800">
              <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">กำหนดช่วงราคาเอง</p>
              <div className="flex items-end gap-2.5">
                <PriceInput
                  label="ราคาต่ำสุด"
                  value={value.minPrice}
                  placeholder={content.minPlaceholder}
                  onChange={(minPrice) => updateValue({ minPrice })}
                />
                <span className="mb-3.5 text-neutral-300 dark:text-neutral-600">—</span>
                <PriceInput
                  label="ราคาสูงสุด"
                  value={value.maxPrice}
                  placeholder={content.maxPlaceholder}
                  onChange={(maxPrice) => updateValue({ maxPrice })}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                หากต้องการราคาเฉพาะ เช่น 3 ล้านบาท ให้กรอกขั้นต่ำและสูงสุดเท่ากัน
              </p>
              {hasInvalidRange && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                  ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด
                </p>
              )}
            </div>

            {offerType === 'business_transfer' && (
              <div className="mt-5 rounded-2xl bg-[#f7f3eb] p-4 dark:bg-amber-950/35">
                <PriceInput
                  label="ค่าเช่ารายเดือนหลังรับช่วง (ไม่เกิน)"
                  value={value.monthlyRentMax}
                  placeholder="เช่น 30,000"
                  onChange={(monthlyRentMax) => updateValue({ monthlyRentMax })}
                />
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  ค่าเซ้งเป็นเงินก้อน ส่วนค่าเช่ารายเดือนเป็นภาระที่ต้องจ่ายต่อเจ้าของพื้นที่
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <p className="min-w-0 truncate text-sm font-medium text-neutral-600 dark:text-neutral-300">{summary}</p>
              <button
                type="button"
                onClick={() => close()}
                disabled={hasInvalidRange}
                className="shrink-0 rounded-full bg-[#123f32] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b3227] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-200 dark:text-emerald-950"
              >
                ใช้งบนี้
              </button>
            </div>
          </Headless.PopoverPanel>
        </>
      )}
    </Headless.Popover>
  )
}

export default PropertyPricePopover
