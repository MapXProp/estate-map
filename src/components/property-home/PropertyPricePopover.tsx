'use client'

import * as Headless from '@headlessui/react'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Banknote, Check, ChevronDown, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import PropertySearchBackdrop from './PropertySearchBackdrop'

export type PropertyOfferType = 'sale' | 'rent' | 'business_transfer'

export type PropertyPriceSelection = {
  minPrice: string
  maxPrice: string
  monthlyRentMax: string
}

type PricePreset = {
  minPrice: string
  maxPrice: string
}

const presets: Record<PropertyOfferType, PricePreset[]> = {
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

const offerContent: Record<
  PropertyOfferType,
  {
    fieldLabel: string
    fieldLabelEn: string
    description: string
    descriptionEn: string
    minPlaceholder: string
    maxPlaceholder: string
  }
> = {
  sale: {
    fieldLabel: 'งบซื้อรวม',
    fieldLabelEn: 'Purchase budget',
    description: 'ราคาขายรวมของทรัพย์',
    descriptionEn: 'Total property purchase price',
    minPlaceholder: 'เช่น 1,000,000',
    maxPlaceholder: 'เช่น 3,000,000',
  },
  rent: {
    fieldLabel: 'ค่าเช่าต่อเดือน',
    fieldLabelEn: 'Monthly rent',
    description: 'งบค่าเช่าที่จ่ายในแต่ละเดือน',
    descriptionEn: 'Monthly rental budget',
    minPlaceholder: 'เช่น 5,000',
    maxPlaceholder: 'เช่น 20,000',
  },
  business_transfer: {
    fieldLabel: 'ค่าเซ้งกิจการ',
    fieldLabelEn: 'Transfer budget',
    description: 'เงินก้อนที่จ่ายเพื่อรับช่วงกิจการหรือสิทธิการเช่า',
    descriptionEn: 'Upfront payment to take over a business or lease',
    minPlaceholder: 'เช่น 300,000',
    maxPlaceholder: 'เช่น 1,000,000',
  },
}

const cleanAmount = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 12)

const formatInputAmount = (value: string) => {
  if (!value) return ''
  return Number(value).toLocaleString('en-US')
}

export const getPriceSummary = (
  offerType: PropertyOfferType,
  selection: PropertyPriceSelection,
  formatAmount: (amount: number) => string = (amount) => `฿${amount.toLocaleString('en-US')}`,
  locale: 'th' | 'en' = 'th'
) => {
  const { minPrice, maxPrice, monthlyRentMax } = selection
  let mainSummary = ''
  const isThai = locale === 'th'

  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    return isThai ? 'ตรวจสอบช่วงราคา' : 'Check price range'
  }

  if (minPrice && maxPrice && minPrice === maxPrice) {
    mainSummary = formatAmount(Number(minPrice))
  } else if (minPrice && maxPrice) {
    mainSummary = `${formatAmount(Number(minPrice))}–${formatAmount(Number(maxPrice))}`
  } else if (maxPrice) {
    mainSummary = `${isThai ? 'ไม่เกิน' : 'Up to'} ${formatAmount(Number(maxPrice))}`
  } else if (minPrice) {
    mainSummary = `${isThai ? 'ตั้งแต่' : 'From'} ${formatAmount(Number(minPrice))}`
  }

  if (offerType === 'rent') {
    return mainSummary ? `${mainSummary}/${isThai ? 'เดือน' : 'month'}` : isThai ? 'ไม่จำกัดค่าเช่า' : 'Any rent'
  }

  if (offerType === 'business_transfer') {
    const transferSummary = mainSummary
      ? `${isThai ? 'ค่าเซ้ง' : 'Transfer'} ${mainSummary}`
      : isThai
        ? 'ไม่จำกัดค่าเซ้ง'
        : 'Any transfer price'
    return monthlyRentMax
      ? `${transferSummary} · ${isThai ? 'เช่า' : 'rent'} ≤ ${formatAmount(Number(monthlyRentMax))}/${isThai ? 'เดือน' : 'month'}`
      : transferSummary
  }

  return mainSummary || (isThai ? 'ไม่จำกัดงบซื้อ' : 'Any purchase price')
}

const PriceInput = ({
  label,
  value,
  placeholder,
  symbol,
  displayValue,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  symbol: string
  displayValue: (value: string) => string
  onChange: (value: string) => void
}) => (
  <label className="block min-w-0 flex-1">
    <span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="flex items-center rounded-2xl border border-neutral-200 bg-white px-3 transition focus-within:border-[#176b50] focus-within:ring-2 focus-within:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:border-emerald-400">
      <span className="text-sm font-semibold text-neutral-400">{symbol}</span>
      <input
        inputMode="numeric"
        value={formatInputAmount(displayValue(value))}
        onChange={(event) => onChange(cleanAmount(event.target.value))}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-3 text-base font-medium text-neutral-900 placeholder:text-neutral-300 focus:ring-0 min-[744px]:text-sm dark:text-white dark:placeholder:text-neutral-600"
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
  const { locale, currency, convertFromThb, convertToThb, formatCurrency } = usePreferences()
  const isThai = locale === 'th'
  const priceButtonRef = useRef<HTMLButtonElement>(null)
  const content = offerContent[offerType]
  const compactCurrency = useCallback(
    (amount: number) => formatCurrency(amount, { compact: true }),
    [formatCurrency]
  )
  const summary = getPriceSummary(offerType, value, compactCurrency, locale)
  const displayValue = useCallback(
    (rawValue: string) => (rawValue ? String(Math.round(convertFromThb(Number(rawValue)))) : ''),
    [convertFromThb]
  )
  const updateFromDisplayValue = useCallback(
    (rawValue: string) => (rawValue ? String(Math.round(convertToThb(Number(rawValue)))) : ''),
    [convertToThb]
  )
  const currencySymbol = currency === 'USD' ? '$' : '฿'
  const fieldLabel = isThai ? content.fieldLabel : content.fieldLabelEn
  const hasInvalidRange = Boolean(value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice))

  const updateValue = (next: Partial<PropertyPriceSelection>) => onChange({ ...value, ...next })
  const clearValue = () => onChange({ minPrice: '', maxPrice: '', monthlyRentMax: '' })
  const [desktopPricePopupPosition, setDesktopPricePopupPosition] = useState<{
    right: number
    bottom: number
  } | null>(null)

  const updatePricePopupPosition = useCallback(() => {
    if (window.innerWidth < 1100 || !priceButtonRef.current) {
      setDesktopPricePopupPosition(null)
      return
    }

    const buttonRect = priceButtonRef.current.getBoundingClientRect()
    setDesktopPricePopupPosition({
      right: window.innerWidth - buttonRect.right,
      bottom: window.innerHeight - buttonRect.top + 14,
    })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updatePricePopupPosition)
    window.addEventListener('scroll', updatePricePopupPosition, true)

    return () => {
      window.removeEventListener('resize', updatePricePopupPosition)
      window.removeEventListener('scroll', updatePricePopupPosition, true)
    }
  }, [updatePricePopupPosition])

  return (
    <Headless.Popover className="relative min-w-0">
      {({ close, open }) => (
        <>
          <PropertySearchBackdrop open={open} onClose={close} />
          <Headless.PopoverButton
            ref={priceButtonRef}
            onClick={updatePricePopupPosition}
            className="flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 text-left transition hover:bg-[#f3f7f5] focus:outline-none min-[744px]:min-h-20 dark:hover:bg-neutral-800"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f7eee2] text-[#8b5a22] dark:bg-amber-950 dark:text-amber-200">
              <Banknote className="size-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-neutral-900 dark:text-white">{fieldLabel}</span>
              <span className="mt-1 block truncate text-sm text-neutral-500 dark:text-neutral-400">{summary}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-neutral-400" />
          </Headless.PopoverButton>

          <Headless.PopoverPanel
            portal
            transition
            style={desktopPricePopupPosition ? { left: 'auto', top: 'auto', ...desktopPricePopupPosition } : undefined}
            className="fixed inset-x-3 bottom-20 z-50 max-h-[calc(100dvh-6.5rem)] w-auto origin-bottom overflow-y-auto overscroll-contain rounded-3xl border border-neutral-200 bg-white p-4 shadow-2xl transition duration-150 min-[1100px]:inset-x-auto min-[1100px]:top-auto min-[1100px]:max-h-[min(52vh,520px)] min-[1100px]:w-[min(520px,calc(100vw-32px))] min-[1100px]:origin-bottom-right min-[1100px]:shadow-[0_-24px_65px_-30px_rgba(18,63,50,0.38)] sm:inset-x-8 sm:p-6 dark:border-neutral-700 dark:bg-neutral-900 data-closed:translate-y-3 data-closed:opacity-0 min-[1100px]:data-closed:translate-y-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">{fieldLabel}</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {isThai ? content.description : content.descriptionEn}
                </p>
                {currency === 'USD' && (
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-300">
                    {isThai ? 'ราคา USD เป็นราคาอ้างอิงโดยประมาณ' : 'USD amounts are approximate reference prices'}
                  </p>
                )}
              </div>
              {(value.minPrice || value.maxPrice || value.monthlyRentMax) && (
                <button
                  type="button"
                  onClick={clearValue}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  <RotateCcw className="size-3.5" /> {isThai ? 'ล้าง' : 'Clear'}
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {presets[offerType].map((preset) => {
                const selected = value.minPrice === preset.minPrice && value.maxPrice === preset.maxPrice
                const presetLabel = preset.maxPrice && !preset.minPrice
                  ? `${isThai ? 'ไม่เกิน' : 'Up to'} ${compactCurrency(Number(preset.maxPrice))}`
                  : preset.minPrice && preset.maxPrice
                    ? `${compactCurrency(Number(preset.minPrice))}–${compactCurrency(Number(preset.maxPrice))}`
                    : `${compactCurrency(Number(preset.minPrice))}${isThai ? ' ขึ้นไป' : '+'}`
                return (
                  <button
                    key={`${preset.minPrice}-${preset.maxPrice}`}
                    type="button"
                    onClick={() => updateValue({ minPrice: preset.minPrice, maxPrice: preset.maxPrice })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                      selected
                        ? 'border-[#176b50] bg-[#edf6f1] text-[#123f32] dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500'
                    }`}
                  >
                    {selected && <Check className="size-3.5" />}
                    {presetLabel}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-neutral-800">
              <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
                {isThai ? 'กำหนดช่วงราคาเอง' : 'Set a custom range'}
              </p>
              <div className="flex items-end gap-2.5">
                <PriceInput
                  label={isThai ? 'ราคาต่ำสุด' : 'Minimum'}
                  value={value.minPrice}
                  placeholder={formatInputAmount(displayValue(content.minPlaceholder.replace(/[^0-9]/g, '')))}
                  symbol={currencySymbol}
                  displayValue={displayValue}
                  onChange={(minPrice) => updateValue({ minPrice: updateFromDisplayValue(minPrice) })}
                />
                <span className="mb-3.5 text-neutral-300 dark:text-neutral-600">—</span>
                <PriceInput
                  label={isThai ? 'ราคาสูงสุด' : 'Maximum'}
                  value={value.maxPrice}
                  placeholder={formatInputAmount(displayValue(content.maxPlaceholder.replace(/[^0-9]/g, '')))}
                  symbol={currencySymbol}
                  displayValue={displayValue}
                  onChange={(maxPrice) => updateValue({ maxPrice: updateFromDisplayValue(maxPrice) })}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                {isThai
                  ? 'หากต้องการราคาเฉพาะ เช่น 3 ล้านบาท ให้กรอกขั้นต่ำและสูงสุดเท่ากัน'
                  : 'For an exact price, enter the same minimum and maximum.'}
              </p>
              {hasInvalidRange && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {isThai ? 'ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด' : 'Minimum cannot exceed maximum'}
                </p>
              )}
            </div>

            {offerType === 'business_transfer' && (
              <div className="mt-5 rounded-2xl bg-[#f7f3eb] p-4 dark:bg-amber-950/35">
                <PriceInput
                  label={
                    isThai ? 'ค่าเช่ารายเดือนหลังรับช่วง (ไม่เกิน)' : 'Monthly rent after transfer (maximum)'
                  }
                  value={value.monthlyRentMax}
                  placeholder={formatInputAmount(displayValue('30000'))}
                  symbol={currencySymbol}
                  displayValue={displayValue}
                  onChange={(monthlyRentMax) =>
                    updateValue({ monthlyRentMax: updateFromDisplayValue(monthlyRentMax) })
                  }
                />
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {isThai
                    ? 'ค่าเซ้งเป็นเงินก้อน ส่วนค่าเช่ารายเดือนเป็นภาระที่ต้องจ่ายต่อเจ้าของพื้นที่'
                    : 'The transfer fee is upfront; monthly rent remains payable to the property owner.'}
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
                {isThai ? 'ใช้งบนี้' : 'Apply budget'}
              </button>
            </div>
          </Headless.PopoverPanel>
        </>
      )}
    </Headless.Popover>
  )
}

export default PropertyPricePopover
