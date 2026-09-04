'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import T from '@/utils/getT'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Check, ChevronDown, RotateCcw, X } from 'lucide-react'
import { FC, useMemo, useState } from 'react'
import { ClearDataButton } from './ClearDataButton'

type BudgetOfferType = 'sale' | 'rent'
type BudgetMode = 'all' | BudgetOfferType
type PriceContext = 'all' | 'homes' | 'rooms' | 'business'
type PriceSelection = { minPrice: string; maxPrice: string }
type PricePreset = PriceSelection
type PriceConfig = { presets: PricePreset[] }

const EMPTY_SELECTION: PriceSelection = { minPrice: '', maxPrice: '' }

const HOME_TYPES = new Set(['detached_house', 'semi_detached_house', 'townhouse', 'condo'])
const ROOM_ONLY_TYPES = new Set(['rental_room', 'apartment', 'dormitory', 'flat', 'monthly_hotel'])
const BUSINESS_TYPES = new Set([
  'shophouse',
  'home_office',
  'office',
  'retail_space',
  'warehouse',
  'factory',
  'hotel_resort',
  'land',
])

const getPriceContext = (context: PriceContext, selectedTypes: string[], selectedSpaceTypes: string[]) => {
  if (context !== 'all') return context
  if (selectedSpaceTypes.length || selectedTypes.some((type) => BUSINESS_TYPES.has(type))) return 'business'
  if (selectedTypes.length && selectedTypes.every((type) => ROOM_ONLY_TYPES.has(type))) return 'rooms'
  if (selectedTypes.length && selectedTypes.every((type) => HOME_TYPES.has(type))) return 'homes'
  return 'all'
}

const getPriceConfig = (context: PriceContext, offerType: BudgetOfferType): PriceConfig => {
  if (offerType === 'rent') {
    if (context === 'rooms') {
      return {
        presets: [
          { minPrice: '', maxPrice: '5000' },
          { minPrice: '5000', maxPrice: '10000' },
          { minPrice: '10000', maxPrice: '20000' },
          { minPrice: '20000', maxPrice: '' },
        ],
      }
    }
    if (context === 'business') {
      return {
        presets: [
          { minPrice: '', maxPrice: '20000' },
          { minPrice: '20000', maxPrice: '50000' },
          { minPrice: '50000', maxPrice: '200000' },
          { minPrice: '200000', maxPrice: '' },
        ],
      }
    }
    return {
      presets: [
        { minPrice: '', maxPrice: '10000' },
        { minPrice: '10000', maxPrice: '20000' },
        { minPrice: '20000', maxPrice: '50000' },
        { minPrice: '50000', maxPrice: '' },
      ],
    }
  }

  const useLargeScale = context === 'all' || context === 'business'
  return {
    presets: useLargeScale
      ? [
          { minPrice: '', maxPrice: '3000000' },
          { minPrice: '3000000', maxPrice: '10000000' },
          { minPrice: '10000000', maxPrice: '30000000' },
          { minPrice: '30000000', maxPrice: '' },
        ]
      : [
          { minPrice: '', maxPrice: '3000000' },
          { minPrice: '3000000', maxPrice: '5000000' },
          { minPrice: '5000000', maxPrice: '10000000' },
          { minPrice: '10000000', maxPrice: '' },
        ],
  }
}

const cleanAmount = (value: string) =>
  value
    .replace(/[^0-9]/g, '')
    .slice(0, 12)
    .replace(/^0+(?=\d)/, '')
const formatInputAmount = (value: string) => (value ? Number(value).toLocaleString('en-US') : '')

const BudgetInput = ({
  label,
  value,
  placeholder,
  symbol,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  symbol: string
  onChange: (value: string) => void
}) => (
  <label className="block min-w-0 flex-1">
    <span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="flex min-h-12 items-center rounded-2xl border border-neutral-200 bg-white px-3 transition focus-within:border-[#176b50] focus-within:ring-2 focus-within:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:border-emerald-400">
      <span className="text-sm font-semibold text-neutral-400">{symbol}</span>
      <input
        inputMode="numeric"
        value={formatInputAmount(value)}
        onChange={(event) => onChange(cleanAmount(event.target.value))}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2.5 text-sm font-medium text-neutral-900 placeholder:text-neutral-300 focus:ring-0 dark:text-white dark:placeholder:text-neutral-600"
      />
    </span>
  </label>
)

const styles = {
  button: {
    base: 'relative z-10 shrink-0 w-full cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start',
    focused: 'rounded-full bg-transparent focus-visible:outline-hidden dark:bg-white/5 custom-shadow-1',
    default: 'px-7 py-4 xl:px-8 xl:py-6',
    small: 'py-3 px-7 xl:px-8',
  },
  mainText: {
    default: 'text-base xl:text-lg',
    small: 'text-base',
  },
  panel: {
    base: 'fixed inset-0 z-[60] flex h-dvh w-screen max-w-none flex-col overflow-hidden border-0 bg-white shadow-2xl transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 min-[744px]:absolute min-[744px]:inset-auto min-[744px]:end-0 min-[744px]:top-full min-[744px]:mt-3 min-[744px]:h-auto min-[744px]:max-h-[min(42rem,calc(100dvh-6rem))] min-[744px]:w-[29rem] min-[744px]:rounded-[28px] min-[744px]:border min-[744px]:border-neutral-200 dark:bg-neutral-900 min-[744px]:dark:border-neutral-700',
    default: '',
    small: '',
  },
}

interface Props {
  className?: string
  fieldStyle: 'default' | 'small'
  panelClassName?: string
  clearDataButtonClassName?: string
  currency?: 'USD' | 'THB'
  description?: string
  panelTitle?: string
  minLabel?: string
  maxLabel?: string
  priceContext?: PriceContext
  selectedPropertyTypes?: string[]
  selectedSpaceTypes?: string[]
}

export const PriceRangeInputField: FC<Props> = ({
  className = 'flex-1',
  fieldStyle = 'default',
  panelClassName,
  clearDataButtonClassName,
  currency = 'THB',
  description = T['HeroSearchForm']['Choose price range'],
  panelTitle,
  minLabel,
  maxLabel,
  priceContext = 'all',
  selectedPropertyTypes = [],
  selectedSpaceTypes = [],
}) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const resolvedContext = getPriceContext(priceContext, selectedPropertyTypes, selectedSpaceTypes)
  const forcedRent = resolvedContext === 'rooms'
  const [selectedOfferType, setSelectedOfferType] = useState<BudgetMode>(forcedRent ? 'rent' : 'all')
  const offerType: BudgetMode = forcedRent ? 'rent' : selectedOfferType
  const [selections, setSelections] = useState<Record<BudgetOfferType, PriceSelection>>({
    sale: EMPTY_SELECTION,
    rent: EMPTY_SELECTION,
  })
  const [showCustomRange, setShowCustomRange] = useState(false)
  const selection = offerType === 'all' ? EMPTY_SELECTION : selections[offerType]
  const config = useMemo(
    () => (offerType === 'all' ? null : getPriceConfig(resolvedContext, offerType)),
    [offerType, resolvedContext]
  )
  const hasPriceSelection = Boolean(selection.minPrice || selection.maxPrice)
  const hasSelection = hasPriceSelection || (!forcedRent && offerType !== 'all')
  const hasInvalidRange = Boolean(
    selection.minPrice && selection.maxPrice && Number(selection.minPrice) > Number(selection.maxPrice)
  )
  const currencySymbol = currency === 'USD' ? '$' : '฿'

  const updateSelection = (next: Partial<PriceSelection>) => {
    if (offerType === 'all') return
    setSelections((current) => ({ ...current, [offerType]: { ...current[offerType], ...next } }))
  }
  const clearSelection = () => {
    setSelectedOfferType(forcedRent ? 'rent' : 'all')
    setSelections({ sale: EMPTY_SELECTION, rent: EMPTY_SELECTION })
    setShowCustomRange(false)
  }
  const clearCurrentPrice = () => {
    if (offerType === 'all') {
      clearSelection()
      return
    }
    setSelections((current) => ({ ...current, [offerType]: EMPTY_SELECTION }))
    setShowCustomRange(false)
  }
  const formatPrice = (value: number, compact = false) => {
    if (currency === 'USD') return compact ? `$${value.toLocaleString('en-US')}` : `$${value.toLocaleString('en-US')}`
    if (compact && value >= 1_000_000) {
      const millions = value / 1_000_000
      return `฿${millions.toLocaleString(isThai ? 'th-TH' : 'en-US', { maximumFractionDigits: 1 })}${isThai ? ' ล้าน' : 'M'}`
    }
    if (compact && value >= 1_000) return `฿${(value / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`
    return `฿${value.toLocaleString(isThai ? 'th-TH' : 'en-US')}`
  }
  const summary = (() => {
    if (offerType === 'all') return isThai ? 'ไม่จำกัดราคา' : 'Any price'
    const minValue = selection.minPrice ? Number(selection.minPrice) : null
    const maxValue = selection.maxPrice ? Number(selection.maxPrice) : null
    const period = offerType === 'rent' ? (isThai ? '/เดือน' : '/month') : ''
    const offerLabel = offerType === 'rent' ? (isThai ? 'เช่า' : 'Rent') : isThai ? 'ซื้อ' : 'Buy'
    if (hasInvalidRange) return isThai ? 'ตรวจสอบช่วงราคา' : 'Check price range'
    if (minValue !== null && maxValue !== null)
      return `${offerLabel} · ${formatPrice(minValue, true)}–${formatPrice(maxValue, true)}${period}`
    if (maxValue !== null)
      return `${offerLabel} · ${isThai ? 'ไม่เกิน' : 'Up to'} ${formatPrice(maxValue, true)}${period}`
    if (minValue !== null)
      return `${offerLabel} · ${isThai ? 'ตั้งแต่' : 'From'} ${formatPrice(minValue, true)}${period}`
    return `${offerLabel} · ${isThai ? 'ไม่จำกัดราคา' : 'Any price'}`
  })()
  const contextLabel = {
    all: isThai ? 'ทุกหมวดอสังหาริมทรัพย์' : 'all property categories',
    homes: isThai ? 'บ้าน คอนโด และที่อยู่อาศัย' : 'homes, condos and residential',
    rooms: isThai ? 'ห้องเช่าและที่พักรายเดือน' : 'rooms and monthly rentals',
    business: isThai ? 'พื้นที่ธุรกิจและที่ดิน' : 'business spaces and land',
  }[resolvedContext]
  const subDescription =
    offerType === 'all'
      ? isThai
        ? 'เลือกซื้อหรือเช่าก่อนกำหนดงบ'
        : 'Choose buy or rent to set a budget'
      : offerType === 'rent'
        ? isThai
          ? 'ค่าเช่าต่อเดือน'
          : 'Monthly rent'
        : isThai
          ? 'ราคาขายรวม'
          : 'Total purchase price'

  const presetLabel = (preset: PricePreset) => {
    if (!preset.minPrice && preset.maxPrice) {
      return `${isThai ? 'ไม่เกิน' : 'Up to'} ${formatPrice(Number(preset.maxPrice), true)}`
    }
    if (preset.minPrice && preset.maxPrice) {
      return `${formatPrice(Number(preset.minPrice), true)}–${formatPrice(Number(preset.maxPrice), true)}`
    }
    return `${formatPrice(Number(preset.minPrice), true)}${isThai ? ' ขึ้นไป' : '+'}`
  }

  return (
    <>
      <Popover className={`group relative z-10 flex data-open:z-50 ${className}`}>
        {({ close, open: showPopover }) => (
          <>
            <PopoverButton
              className={clsx(styles.button.base, styles.button[fieldStyle], showPopover && styles.button.focused)}
            >
              {fieldStyle === 'default' && (
                <CurrencyDollarIcon className="size-5 text-neutral-300 lg:size-7 dark:text-neutral-400" />
              )}

              <div className="min-w-0 flex-1 text-start">
                <span className={clsx('block truncate font-semibold', styles.mainText[fieldStyle])}>{summary}</span>
                <span className="mt-1 block text-sm leading-none font-light text-neutral-400">
                  {forcedRent || hasSelection ? subDescription : description}
                </span>
              </div>
            </PopoverButton>

            <ClearDataButton
              className={clsx(!hasSelection && 'sr-only', clearDataButtonClassName)}
              onClick={clearSelection}
            />

            {showPopover && (
              <button
                type="button"
                aria-label={isThai ? 'ปิดหน้าต่างงบประมาณ' : 'Close budget window'}
                onClick={() => close()}
                className="fixed inset-0 z-[55] block bg-neutral-950/35 min-[744px]:hidden"
              />
            )}

            <PopoverPanel transition className={clsx(panelClassName, styles.panel.base, styles.panel[fieldStyle])}>
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-100 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 min-[744px]:px-5 min-[744px]:pt-5 dark:border-neutral-800">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
                    {panelTitle ?? (isThai ? 'งบประมาณ' : 'Budget')}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {isThai ? `เลือกงบสำหรับ${contextLabel}` : `Choose a budget for ${contextLabel}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {hasSelection && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                    >
                      <RotateCcw className="size-3.5" /> {isThai ? 'ล้าง' : 'Clear'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => close()}
                    aria-label={isThai ? 'ปิด' : 'Close'}
                    className="grid size-10 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 min-[744px]:hidden dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 min-[744px]:px-5">
                {!forcedRent ? (
                  <div
                    className="grid grid-cols-3 gap-1 rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800"
                    role="tablist"
                  >
                    {(['all', 'sale', 'rent'] as const).map((offer) => {
                      const active = offerType === offer
                      const label =
                        offer === 'all'
                          ? isThai
                            ? 'ทั้งหมด'
                            : 'All'
                          : offer === 'sale'
                            ? isThai
                              ? 'ซื้อ'
                              : 'Buy'
                            : isThai
                              ? 'เช่า'
                              : 'Rent'
                      return (
                        <button
                          key={offer}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => {
                            setSelectedOfferType(offer)
                            setShowCustomRange(false)
                          }}
                          className={clsx(
                            'min-h-11 rounded-xl px-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
                            active
                              ? 'bg-white text-[#124e3c] shadow-sm dark:bg-neutral-900 dark:text-emerald-300'
                              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#eef7f3] px-4 py-3 text-sm font-semibold text-[#176b50] dark:bg-emerald-950/35 dark:text-emerald-200">
                    {isThai ? 'ค่าเช่าต่อเดือน' : 'Monthly rent'}
                  </div>
                )}

                {offerType === 'all' ? (
                  <div className="mt-5">
                    <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#176b50] bg-[#eef7f3] px-4 py-3 text-[#123f32] dark:border-emerald-500 dark:bg-emerald-950/35 dark:text-emerald-100">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#176b50] text-white">
                        <Check className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {isThai ? 'ทุกประกาศ · ไม่จำกัดราคา' : 'All listings · Any price'}
                        </span>
                        <span className="mt-0.5 block text-xs font-normal text-neutral-500 dark:text-neutral-400">
                          {isThai ? 'ระบบจะไม่ตัดประกาศเช่าหรือประกาศขายออก' : 'Includes both rental and sale listings'}
                        </span>
                      </span>
                    </div>
                    <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      {isThai
                        ? 'เลือก “ซื้อ” หรือ “เช่า” ด้านบนเมื่อต้องการกำหนดงบ'
                        : 'Choose Buy or Rent above to set a budget'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {isThai ? 'เลือกงบได้ทันที' : 'Quick budget'}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subDescription}</p>
                    </div>

                    <button
                      type="button"
                      aria-pressed={!hasPriceSelection}
                      onClick={clearCurrentPrice}
                      className={clsx(
                        'mt-3 flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-start text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
                        !hasPriceSelection
                          ? 'border-[#176b50] bg-[#eef7f3] text-[#123f32] dark:border-emerald-500 dark:bg-emerald-950/35 dark:text-emerald-100'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#9fc2b5] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'
                      )}
                    >
                      <span
                        className={clsx(
                          'grid size-6 shrink-0 place-items-center rounded-full border',
                          !hasPriceSelection
                            ? 'border-[#176b50] bg-[#176b50] text-white'
                            : 'border-neutral-300 text-transparent dark:border-neutral-600'
                        )}
                      >
                        <Check className="size-3.5" />
                      </span>
                      {offerType === 'rent'
                        ? isThai
                          ? 'ไม่จำกัดค่าเช่า'
                          : 'Any monthly rent'
                        : isThai
                          ? 'ไม่จำกัดราคาซื้อ'
                          : 'Any purchase price'}
                    </button>

                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      {config?.presets.map((preset) => {
                        const active = selection.minPrice === preset.minPrice && selection.maxPrice === preset.maxPrice
                        return (
                          <button
                            key={`${offerType}-${preset.minPrice}-${preset.maxPrice}`}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              updateSelection(preset)
                              setShowCustomRange(false)
                            }}
                            className={clsx(
                              'flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border px-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
                              active
                                ? 'border-[#176b50] bg-[#eef7f3] text-[#123f32] ring-1 ring-[#176b50] dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#9fc2b5] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                            )}
                          >
                            {active && <Check className="size-3.5" />}
                            {presetLabel(preset)}
                          </button>
                        )
                      })}
                    </div>

                    <div
                      className={clsx(
                        'mt-4 overflow-hidden rounded-[22px] border transition',
                        showCustomRange
                          ? 'border-[#9fc2b5] bg-neutral-50 dark:border-emerald-800 dark:bg-neutral-800/70'
                          : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'
                      )}
                    >
                      <button
                        type="button"
                        aria-expanded={showCustomRange}
                        onClick={() => setShowCustomRange((current) => !current)}
                        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-start"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-neutral-900 dark:text-white">
                            {isThai ? 'กำหนดราคาเอง' : 'Set a custom range'}
                          </span>
                          <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                            {isThai ? 'กรอกราคาต่ำสุดหรือราคาสูงสุด' : 'Enter a minimum or maximum price'}
                          </span>
                        </span>
                        <ChevronDown
                          className={clsx(
                            'size-5 shrink-0 text-neutral-400 transition-transform',
                            showCustomRange && 'rotate-180'
                          )}
                        />
                      </button>

                      {showCustomRange && (
                        <div className="border-t border-neutral-200 px-4 pt-4 pb-5 dark:border-neutral-700">
                          <div className="grid gap-3 min-[420px]:grid-cols-[1fr_auto_1fr] min-[420px]:items-end">
                            <BudgetInput
                              label={minLabel ?? (isThai ? 'ราคาต่ำสุด' : 'Minimum')}
                              value={selection.minPrice}
                              placeholder={isThai ? 'ไม่กำหนด' : 'No minimum'}
                              symbol={currencySymbol}
                              onChange={(minPrice) => updateSelection({ minPrice })}
                            />
                            <span className="mb-3.5 hidden text-neutral-300 min-[420px]:block dark:text-neutral-600">
                              —
                            </span>
                            <BudgetInput
                              label={maxLabel ?? (isThai ? 'ราคาสูงสุด' : 'Maximum')}
                              value={selection.maxPrice}
                              placeholder={isThai ? 'ไม่กำหนด' : 'No maximum'}
                              symbol={currencySymbol}
                              onChange={(maxPrice) => updateSelection({ maxPrice })}
                            />
                          </div>
                          {hasInvalidRange && (
                            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                              {isThai ? 'ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด' : 'Minimum cannot exceed maximum'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-3 border-t border-neutral-100 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] min-[744px]:flex-row min-[744px]:items-center min-[744px]:justify-between min-[744px]:px-5 min-[744px]:pb-4 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="min-w-0 truncate text-center text-sm font-medium text-neutral-600 min-[744px]:text-start dark:text-neutral-300">
                  {summary}
                </p>
                <button
                  type="button"
                  onClick={() => close()}
                  disabled={hasInvalidRange}
                  className="min-h-12 w-full shrink-0 rounded-full bg-[#123f32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3227] disabled:cursor-not-allowed disabled:opacity-40 min-[744px]:min-h-10 min-[744px]:w-auto min-[744px]:py-2.5 dark:bg-emerald-200 dark:text-emerald-950"
                >
                  {isThai ? 'ใช้ตัวกรองนี้' : 'Apply filter'}
                </button>
              </div>
            </PopoverPanel>
          </>
        )}
      </Popover>

      <input type="hidden" name="offer_type" value={offerType === 'all' ? '' : offerType} />
      <input type="hidden" name="price_min" value={selection.minPrice} />
      <input type="hidden" name="price_max" value={selection.maxPrice} />
    </>
  )
}
