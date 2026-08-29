'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import T from '@/utils/getT'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { Check, RotateCcw } from 'lucide-react'
import Slider from 'rc-slider'
import clsx from 'clsx'
import { FC, useMemo, useState } from 'react'
import { ClearDataButton } from './ClearDataButton'

type BudgetOfferType = 'sale' | 'rent'
type PriceContext = 'all' | 'homes' | 'rooms' | 'business'
type PriceSelection = { minPrice: string; maxPrice: string }
type PricePreset = PriceSelection
type PriceConfig = { scale: number[]; presets: PricePreset[] }

const EMPTY_SELECTION: PriceSelection = { minPrice: '', maxPrice: '' }

const SALE_HOME_SCALE = [
  0, 500_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, 7_500_000, 10_000_000,
  15_000_000, 20_000_000, 30_000_000, 50_000_000, 75_000_000, 100_000_000,
]
const SALE_LARGE_SCALE = [...SALE_HOME_SCALE, 150_000_000, 200_000_000]
const RENT_ROOM_SCALE = [0, 2_000, 3_000, 5_000, 7_500, 10_000, 15_000, 20_000, 30_000, 50_000, 75_000, 100_000, 200_000]
const RENT_HOME_SCALE = [0, 5_000, 7_500, 10_000, 15_000, 20_000, 30_000, 50_000, 75_000, 100_000, 200_000, 500_000]
const RENT_BUSINESS_SCALE = [0, 5_000, 10_000, 20_000, 30_000, 50_000, 100_000, 200_000, 500_000, 1_000_000]

const HOME_TYPES = new Set(['house', 'condo', 'townhome', 'rowhouse', 'residential_land'])
const ROOM_TYPES = new Set(['monthly_room', 'apartment', 'dormitory', 'flat', 'rental_condo'])
const BUSINESS_TYPES = new Set([
  'retail',
  'office',
  'warehouse_factory',
  'land',
  'commercial_rowhouse',
  'standalone_retail',
  'stall_kiosk',
  'business_land',
  'event_space',
])

const getPriceContext = (context: PriceContext, selectedTypes: string[]) => {
  if (context === 'rooms' || selectedTypes.some((type) => ROOM_TYPES.has(type))) return 'rooms'
  if (context === 'business' || selectedTypes.some((type) => BUSINESS_TYPES.has(type))) return 'business'
  if (context === 'homes' || selectedTypes.some((type) => HOME_TYPES.has(type))) return 'homes'
  return 'all'
}

const getPriceConfig = (context: PriceContext, offerType: BudgetOfferType): PriceConfig => {
  if (offerType === 'rent') {
    if (context === 'rooms') {
      return {
        scale: RENT_ROOM_SCALE,
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
        scale: RENT_BUSINESS_SCALE,
        presets: [
          { minPrice: '', maxPrice: '20000' },
          { minPrice: '20000', maxPrice: '50000' },
          { minPrice: '50000', maxPrice: '200000' },
          { minPrice: '200000', maxPrice: '' },
        ],
      }
    }
    return {
      scale: RENT_HOME_SCALE,
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
    scale: useLargeScale ? SALE_LARGE_SCALE : SALE_HOME_SCALE,
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

const cleanAmount = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 12).replace(/^0+(?=\d)/, '')
const formatInputAmount = (value: string) => (value ? Number(value).toLocaleString('en-US') : '')

const closestScaleIndex = (scale: number[], rawValue: string, fallback: number) => {
  if (!rawValue) return fallback
  const value = Number(rawValue)
  return scale.reduce((bestIndex, current, index) =>
    Math.abs(current - value) < Math.abs(scale[bestIndex] - value) ? index : bestIndex
  , 0)
}

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
    base: 'absolute top-full z-10 mt-3 w-[31rem] transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 end-0 overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900',
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
}) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const resolvedContext = getPriceContext(priceContext, selectedPropertyTypes)
  const forcedRent = resolvedContext === 'rooms'
  const [selectedOfferType, setSelectedOfferType] = useState<BudgetOfferType>(forcedRent ? 'rent' : 'sale')
  const offerType: BudgetOfferType = forcedRent ? 'rent' : selectedOfferType
  const [selections, setSelections] = useState<Record<BudgetOfferType, PriceSelection>>({
    sale: EMPTY_SELECTION,
    rent: EMPTY_SELECTION,
  })
  const selection = selections[offerType]
  const config = useMemo(() => getPriceConfig(resolvedContext, offerType), [offerType, resolvedContext])
  const hasSelection = Boolean(selection.minPrice || selection.maxPrice)
  const hasInvalidRange = Boolean(
    selection.minPrice && selection.maxPrice && Number(selection.minPrice) > Number(selection.maxPrice)
  )
  const currencySymbol = currency === 'USD' ? '$' : '฿'

  const updateSelection = (next: Partial<PriceSelection>) => {
    setSelections((current) => ({ ...current, [offerType]: { ...current[offerType], ...next } }))
  }
  const clearSelection = () => {
    setSelections((current) => ({ ...current, [offerType]: EMPTY_SELECTION }))
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
    const minValue = selection.minPrice ? Number(selection.minPrice) : null
    const maxValue = selection.maxPrice ? Number(selection.maxPrice) : null
    const period = offerType === 'rent' ? (isThai ? '/เดือน' : '/month') : ''
    if (hasInvalidRange) return isThai ? 'ตรวจสอบช่วงราคา' : 'Check price range'
    if (minValue !== null && maxValue !== null) return `${formatPrice(minValue, true)}–${formatPrice(maxValue, true)}${period}`
    if (maxValue !== null) return `${isThai ? 'ไม่เกิน' : 'Up to'} ${formatPrice(maxValue, true)}${period}`
    if (minValue !== null) return `${isThai ? 'ตั้งแต่' : 'From'} ${formatPrice(minValue, true)}${period}`
    return offerType === 'rent'
      ? isThai
        ? 'ไม่จำกัดค่าเช่า'
        : 'Any monthly rent'
      : isThai
        ? 'ไม่จำกัดงบซื้อ'
        : 'Any purchase price'
  })()
  const sliderMinIndex = closestScaleIndex(config.scale, selection.minPrice, 0)
  const sliderMaxIndex = closestScaleIndex(config.scale, selection.maxPrice, config.scale.length - 1)
  const sliderValue: [number, number] = [
    Math.min(sliderMinIndex, sliderMaxIndex),
    Math.max(sliderMinIndex, sliderMaxIndex),
  ]
  const contextLabel = {
    all: isThai ? 'ทุกหมวดอสังหาริมทรัพย์' : 'all property categories',
    homes: isThai ? 'บ้าน คอนโด และที่อยู่อาศัย' : 'homes, condos and residential',
    rooms: isThai ? 'ห้องเช่าและที่พักรายเดือน' : 'rooms and monthly rentals',
    business: isThai ? 'พื้นที่ธุรกิจและที่ดิน' : 'business spaces and land',
  }[resolvedContext]
  const subDescription = offerType === 'rent' ? (isThai ? 'ค่าเช่าต่อเดือน' : 'Monthly rent') : isThai ? 'ราคาขายรวม' : 'Total purchase price'

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
                  {hasSelection ? subDescription : description}
                </span>
              </div>
            </PopoverButton>

            <ClearDataButton
              className={clsx(!hasSelection && 'sr-only', clearDataButtonClassName)}
              onClick={clearSelection}
            />

            <PopoverPanel
              transition
              className={clsx(panelClassName, styles.panel.base, styles.panel[fieldStyle], 'max-w-[calc(100vw-2rem)]')}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
                    {panelTitle ?? (isThai ? 'งบประมาณ' : 'Budget')}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {isThai ? `ช่วงแนะนำสำหรับ${contextLabel}` : `Suggested ranges for ${contextLabel}`}
                  </p>
                </div>
                {hasSelection && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    <RotateCcw className="size-3.5" /> {isThai ? 'ล้าง' : 'Clear'}
                  </button>
                )}
              </div>

              {!forcedRent && (
                <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
                  {(['sale', 'rent'] as const).map((offer) => {
                    const active = offerType === offer
                    return (
                      <button
                        key={offer}
                        type="button"
                        onClick={() => setSelectedOfferType(offer)}
                        className={clsx(
                          'min-h-10 rounded-xl px-3 text-sm font-semibold transition',
                          active
                            ? 'bg-white text-[#124e3c] shadow-sm dark:bg-neutral-900 dark:text-emerald-300'
                            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        )}
                      >
                        {offer === 'sale' ? (isThai ? 'ซื้อ' : 'Buy') : isThai ? 'เช่า' : 'Rent'}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {isThai ? 'ช่วงราคาแนะนำ' : 'Suggested ranges'}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subDescription}</p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-semibold text-[#176b50] dark:text-emerald-300"
                >
                  {isThai ? 'ไม่จำกัดงบ' : 'Any budget'}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {config.presets.map((preset) => {
                  const active = selection.minPrice === preset.minPrice && selection.maxPrice === preset.maxPrice
                  return (
                    <button
                      key={`${offerType}-${preset.minPrice}-${preset.maxPrice}`}
                      type="button"
                      onClick={() => updateSelection(preset)}
                      className={clsx(
                        'flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-2.5 text-sm font-semibold transition',
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

              <div className="mt-5 rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 pt-4 pb-5 dark:border-neutral-700 dark:bg-neutral-800/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {isThai ? 'กำหนดช่วงราคาเอง' : 'Set a custom range'}
                    </h4>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {isThai ? 'รูดเพื่อเลือก หรือพิมพ์ราคาได้โดยตรง' : 'Drag the handles or enter exact amounts'}
                    </p>
                  </div>
                  <span className="max-w-[52%] truncate rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#176b50] shadow-sm dark:bg-neutral-900 dark:text-emerald-300">
                    {summary}
                  </span>
                </div>

                <div className="px-2 pt-7 pb-2">
                  <Slider
                    range
                    allowCross={false}
                    min={0}
                    max={config.scale.length - 1}
                    step={1}
                    value={sliderValue}
                    onChange={(value) => {
                      const [minIndex, maxIndex] = value as [number, number]
                      updateSelection({
                        minPrice: minIndex === 0 ? '' : String(config.scale[minIndex]),
                        maxPrice: maxIndex === config.scale.length - 1 ? '' : String(config.scale[maxIndex]),
                      })
                    }}
                    styles={{
                      rail: { height: 6, backgroundColor: '#dfe5e2' },
                      track: { height: 6, backgroundColor: '#2a8063' },
                      handle: {
                        width: 22,
                        height: 22,
                        marginTop: -8,
                        border: '3px solid #2a8063',
                        backgroundColor: '#ffffff',
                        opacity: 1,
                        boxShadow: '0 3px 10px rgba(18, 78, 60, 0.18)',
                      },
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>{isThai ? 'ไม่กำหนดขั้นต่ำ' : 'No minimum'}</span>
                  <span>{isThai ? 'ไม่กำหนดสูงสุด' : 'No maximum'}</span>
                </div>

                <div className="mt-4 flex items-end gap-2.5">
                  <BudgetInput
                    label={minLabel ?? (isThai ? 'ราคาต่ำสุด' : 'Minimum')}
                    value={selection.minPrice}
                    placeholder={isThai ? 'ไม่กำหนด' : 'No minimum'}
                    symbol={currencySymbol}
                    onChange={(minPrice) => updateSelection({ minPrice })}
                  />
                  <span className="mb-3.5 text-neutral-300 dark:text-neutral-600">—</span>
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

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <p className="min-w-0 truncate text-sm font-medium text-neutral-600 dark:text-neutral-300">{summary}</p>
                <button
                  type="button"
                  onClick={() => close()}
                  disabled={hasInvalidRange}
                  className="shrink-0 rounded-full bg-[#123f32] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b3227] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-200 dark:text-emerald-950"
                >
                  {isThai ? 'ใช้ช่วงราคานี้' : 'Apply range'}
                </button>
              </div>
            </PopoverPanel>
          </>
        )}
      </Popover>

      <input type="hidden" name="offer_type" value={offerType} />
      <input type="hidden" name="price_min" value={selection.minPrice} />
      <input type="hidden" name="price_max" value={selection.maxPrice} />
    </>
  )
}
