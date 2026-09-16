'use client'

import sheetStyles from '@/components/property-map/MobileSheet.module.css'
import { useSwipeDismiss } from '@/hooks/useMobileSheets'
import {
  appendMapPriceZeros,
  cleanMapPriceInput,
  formatMapPriceInput,
  formatMapPricePreset,
  getMapPricePresets,
} from '@/lib/propertyMapPriceInput'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  BadgeCheck,
  Banknote,
  Bath,
  BedDouble,
  House,
  ListChecks,
  PawPrint,
  RotateCcw,
  Ruler,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { usePreferences } from '../preferences/PreferencesProvider'
import { emptyPropertyMapFilters, type PropertyMapFilterState } from './PropertyMapFilterBar'

type Props = {
  open: boolean
  onClose: () => void
  value: PropertyMapFilterState
  onChange: (value: PropertyMapFilterState) => void
}

export default function MapSearchDetails(props: Props) {
  // Every opening gets fresh drag/timer state; filter values stay in the map page.
  return props.open ? <MapSearchDetailsSheet {...props} /> : null
}

export function MapSearchDetailsSheet({ onClose, value, onChange }: Props) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const { panelRef, backdropRef, dismiss } = useSwipeDismiss(onClose)
  const [activePrice, setActivePrice] = useState<'minPrice' | 'maxPrice'>('maxPrice')
  const [editingPrice, setEditingPrice] = useState<'minPrice' | 'maxPrice' | null>(null)
  const pricePresets = getMapPricePresets(value.offerTypes)
  const appendedPrice = appendMapPriceZeros(value[activePrice])
  const activePriceLabel = th
    ? activePrice === 'minPrice'
      ? 'ราคาต่ำสุด'
      : 'ราคาสูงสุด'
    : activePrice === 'minPrice'
      ? 'Minimum price'
      : 'Maximum price'
  const update = <K extends keyof PropertyMapFilterState>(key: K, next: PropertyMapFilterState[K]) =>
    onChange({ ...value, [key]: next })
  const inputClassName =
    'h-12 w-full rounded-2xl border-neutral-200 bg-neutral-50/70 text-base font-normal text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-700 focus:bg-white focus:ring-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-100 dark:focus:border-neutral-300 dark:focus:bg-neutral-800 dark:focus:ring-neutral-300'
  const sectionClassName = 'border-t border-neutral-200 pt-5 dark:border-neutral-700'
  const sectionHeaderClassName = 'mb-4 flex items-center gap-2.5'
  const sectionIconClassName =
    'grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100/80 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
  return (
    <Dialog open onClose={dismiss} className="relative z-[70]">
      <DialogBackdrop
        ref={backdropRef}
        className={`${sheetStyles.modalBackdrop} fixed inset-0 bg-neutral-950/40 backdrop-blur-sm`}
      />
      <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-5">
        <DialogPanel
          ref={panelRef}
          data-map-filter-sheet
          className={`${sheetStyles.modalPanel} flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white text-neutral-900 shadow-2xl sm:rounded-3xl dark:bg-neutral-900 dark:text-neutral-100`}
        >
          <header
            data-sheet-drag-handle
            className={`${sheetStyles.handle} flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-neutral-100 px-5 py-1.5 sm:px-6 dark:border-neutral-800`}
          >
            <span className={sheetStyles.grip} aria-hidden="true" />
            <DialogTitle className="text-base font-semibold">{th ? 'ปรับตัวกรอง' : 'Refine your search'}</DialogTitle>
            <button
              type="button"
              onClick={dismiss}
              aria-label={th ? 'ปิดตัวกรอง' : 'Close filters'}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-neutral-100/80 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
            >
              <X className="size-5" />
            </button>
          </header>
          <div
            data-sheet-scroll
            className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
          >
            <section aria-labelledby="map-filter-price-heading">
              <div className={sectionHeaderClassName}>
                <span className={sectionIconClassName}>
                  <Banknote className="size-5" aria-hidden="true" />
                </span>
                <h3 id="map-filter-price-heading" className="font-semibold">
                  {th ? 'ราคา' : 'Price'}
                </h3>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {(['minPrice', 'maxPrice'] as const).map((key, index) => (
                    <label key={key} className="block min-w-0 text-sm font-medium">
                      <span>
                        {th ? (index ? 'ราคาสูงสุด' : 'ราคาต่ำสุด') : index ? 'Maximum price' : 'Minimum price'}
                      </span>
                      <span className="relative mt-2.5 block">
                        <input
                          data-map-price-field={key}
                          inputMode="numeric"
                          value={editingPrice === key ? value[key] : formatMapPriceInput(value[key])}
                          onFocus={() => {
                            setActivePrice(key)
                            setEditingPrice(key)
                          }}
                          onBlur={() => setEditingPrice(null)}
                          onChange={(event) => update(key, cleanMapPriceInput(event.target.value))}
                          placeholder={th ? 'ไม่จำกัด' : 'Any'}
                          className={`${inputClassName} pe-12`}
                        />
                        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-normal text-neutral-500 dark:text-neutral-400">
                          {th ? 'บาท' : 'THB'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <div data-map-price-shortcuts data-sheet-no-drag className="mt-3">
                  <p className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    {th ? `ใส่เร็ว: ${activePriceLabel}` : `Quick fill: ${activePriceLabel}`}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pricePresets.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        data-map-price-preset={amount}
                        aria-label={`${activePriceLabel} ${formatMapPriceInput(String(amount))} ${th ? 'บาท' : 'THB'}`}
                        aria-pressed={value[activePrice] === String(amount)}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => update(activePrice, String(amount))}
                        className={`min-h-11 rounded-xl border px-2.5 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 ${value[activePrice] === String(amount) ? 'border-neutral-700 bg-white text-neutral-900 dark:border-neutral-300 dark:bg-neutral-800 dark:text-neutral-100' : 'border-neutral-200 bg-neutral-50/60 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                      >
                        {formatMapPricePreset(amount, th)}
                      </button>
                    ))}
                    <button
                      type="button"
                      data-map-price-zeros
                      disabled={appendedPrice === value[activePrice]}
                      aria-label={
                        th
                          ? `เติมศูนย์สามหลักใน${activePriceLabel}`
                          : `Append three zeros to ${activePriceLabel.toLowerCase()}`
                      }
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => update(activePrice, appendedPrice)}
                      className="min-h-11 rounded-xl border border-dashed border-neutral-300 px-2.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      {th ? 'เติม 000' : 'Add 000'}
                    </button>
                  </div>
                </div>
                {value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice) && (
                  <p role="alert" className="mt-2 text-sm text-red-600">
                    {th ? 'ราคาต่ำสุดต้องไม่เกินราคาสูงสุด' : 'Minimum must not exceed maximum'}
                  </p>
                )}
              </div>
            </section>
            <section aria-labelledby="map-filter-rooms-heading" className={sectionClassName}>
              <div className={sectionHeaderClassName}>
                <span className={sectionIconClassName}>
                  <House className="size-5" aria-hidden="true" />
                </span>
                <h3 id="map-filter-rooms-heading" className="font-semibold">
                  {th ? 'ห้องและพื้นที่' : 'Rooms & area'}
                </h3>
              </div>
              <div className="space-y-4">
                {(['bedrooms', 'bathrooms'] as const).map((key) => (
                  <fieldset key={key}>
                    <legend className="mb-2.5 text-sm font-medium">
                      <span className="flex items-center gap-2">
                        {key === 'bedrooms' ? (
                          <BedDouble className="size-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                        ) : (
                          <Bath className="size-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                        )}
                        {key === 'bedrooms'
                          ? th
                            ? 'ห้องนอนขั้นต่ำ'
                            : 'Minimum bedrooms'
                          : th
                            ? 'ห้องน้ำขั้นต่ำ'
                            : 'Minimum bathrooms'}
                      </span>
                    </legend>
                    <div className="flex gap-1.5 rounded-2xl bg-neutral-100/70 p-1 dark:bg-neutral-800/70">
                      {[0, 1, 2, 3, 4].map((number) => (
                        <button
                          key={number}
                          type="button"
                          aria-pressed={value[key] === number}
                          onClick={() => update(key, number)}
                          className={`min-h-11 min-w-0 flex-1 rounded-xl border text-sm transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 ${value[key] === number ? 'border-neutral-800 bg-white text-neutral-900 shadow-sm dark:border-neutral-300 dark:bg-neutral-900 dark:text-neutral-100' : 'border-transparent text-neutral-500 hover:bg-white/80 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white'}`}
                        >
                          {number ? `${number}+` : th ? 'ทุกแบบ' : 'Any'}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <label className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-4 text-sm font-medium dark:border-neutral-800">
                  <span className="flex items-center gap-2">
                    <Ruler className="size-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                    {th ? 'พื้นที่ขั้นต่ำ' : 'Minimum area'}
                  </span>
                  <span className="relative block w-36 shrink-0 sm:w-44">
                    <input
                      inputMode="numeric"
                      value={value.minArea}
                      onChange={(event) => update('minArea', event.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={th ? 'ไม่จำกัด' : 'Any'}
                      className={`${inputClassName} pe-16`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-normal text-neutral-500 dark:text-neutral-400">
                      {th ? 'ตร.ม.' : 'sq.m.'}
                    </span>
                  </span>
                </label>
              </div>
            </section>
            <section aria-labelledby="map-filter-features-heading" className={sectionClassName}>
              <div className={sectionHeaderClassName}>
                <span className={sectionIconClassName}>
                  <ListChecks className="size-5" aria-hidden="true" />
                </span>
                <h3 id="map-filter-features-heading" className="font-semibold">
                  {th ? 'เงื่อนไขเพิ่มเติม' : 'Preferences'}
                </h3>
              </div>
              <div className="space-y-2">
                {(
                  [
                    ['owner_direct', 'เจ้าของลงเอง', 'Owner direct', UserRound],
                    ['verified', 'ยืนยันผู้ติดต่อแล้ว', 'Verified contact', BadgeCheck],
                    ['pets_allowed', 'เลี้ยงสัตว์ได้', 'Pet friendly', PawPrint],
                  ] as const
                ).map(([key, nameTh, nameEn, Icon]) => (
                  <label
                    key={key}
                    className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-sm transition ${value.features.includes(key) ? 'border-neutral-400 bg-neutral-50 dark:border-neutral-500 dark:bg-neutral-800' : 'border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800'}`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className="size-[18px] shrink-0 text-neutral-500 dark:text-neutral-400"
                        aria-hidden="true"
                      />
                      {th ? nameTh : nameEn}
                    </span>
                    <input
                      type="checkbox"
                      checked={value.features.includes(key)}
                      onChange={() =>
                        update(
                          'features',
                          value.features.includes(key)
                            ? value.features.filter((item) => item !== key)
                            : [...value.features, key]
                        )
                      }
                      className="size-5 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 dark:border-neutral-600 dark:focus:ring-offset-neutral-900"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>
          <footer className="flex shrink-0 items-center justify-between gap-5 border-t border-neutral-200 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,0.025)] sm:px-6 dark:border-neutral-700 dark:bg-neutral-900">
            <button
              type="button"
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg text-sm text-neutral-500 transition hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:text-neutral-400 dark:hover:text-neutral-100"
              onClick={() => onChange({ ...emptyPropertyMapFilters, offerTypes: value.offerTypes })}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {th ? 'ล้างค่า' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 active:scale-[0.99] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              <Search className="size-4" aria-hidden="true" />
              {th ? 'ดูผลลัพธ์' : 'Show results'}
            </button>
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
