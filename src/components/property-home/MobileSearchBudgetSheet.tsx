'use client'

import sheetStyles from '@/components/property-map/MobileSheet.module.css'
import { useMobileSearchViewport } from '@/hooks/useMobileSearchViewport'
import { useSwipeDismiss } from '@/hooks/useMobileSheets'
import {
  appendMapPriceSuffix,
  cleanMapPriceInput,
  formatMapPriceInput,
  mapPriceSuffixes,
} from '@/lib/propertyMapPriceInput'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { RotateCcw, X } from 'lucide-react'
import { useState } from 'react'

export type SearchBudget = { minPrice: string; maxPrice: string }
export const emptySearchBudget: SearchBudget = { minPrice: '', maxPrice: '' }

export default function MobileSearchBudgetSheet({
  value: initialValue,
  onApply,
  onClose,
  offerType,
  rentalRooms,
  th,
}: {
  value: SearchBudget
  onApply: (value: SearchBudget) => void
  onClose: () => void
  offerType: '' | 'sale' | 'rent'
  rentalRooms: boolean
  th: boolean
}) {
  const [value, setValue] = useState(initialValue)
  const viewportRef = useMobileSearchViewport()
  const [activePrice, setActivePrice] = useState<keyof SearchBudget>('maxPrice')
  const [editingPrice, setEditingPrice] = useState<keyof SearchBudget | null>(null)
  const invalid = Boolean(value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice))
  const { panelRef, backdropRef, dismiss } = useSwipeDismiss(() => {
    onApply(value)
    onClose()
  }, !invalid)
  const close = () => {
    if (!invalid) dismiss()
  }
  const update = (key: keyof SearchBudget, next: string) => setValue((current) => ({ ...current, [key]: next }))
  const quickMaximums =
    offerType === 'sale'
      ? [1_000_000, 3_000_000, 5_000_000, 10_000_000]
      : rentalRooms
        ? [3_000, 5_000, 10_000, 20_000]
        : [10_000, 20_000, 30_000, 50_000]
  const boundLabel = (key: keyof SearchBudget) =>
    th ? (key === 'minPrice' ? 'ราคาต่ำสุด' : 'ราคาสูงสุด') : key === 'minPrice' ? 'Minimum price' : 'Maximum price'

  return (
    <Dialog open onClose={close} className="relative z-[120]">
      <DialogBackdrop ref={backdropRef} className={`${sheetStyles.modalBackdrop} fixed inset-0 bg-neutral-950/35`} />
      <div
        ref={viewportRef}
        className="fixed inset-x-0 top-[var(--search-viewport-top,0px)] flex h-[var(--search-viewport-height,100dvh)] items-end justify-center"
      >
        <DialogPanel
          ref={panelRef}
          data-mobile-budget-sheet
          className={`${sheetStyles.modalPanel} flex max-h-[95%] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white text-neutral-900 shadow-2xl dark:bg-neutral-900 dark:text-white`}
        >
          <header
            data-sheet-drag-handle
            className={`${sheetStyles.handle} grid min-h-16 shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-center border-b border-neutral-100 px-4 pt-2 dark:border-neutral-800`}
          >
            <span className={sheetStyles.grip} aria-hidden="true" />
            <DialogTitle className="col-start-2 row-start-1 text-center text-base font-semibold">
              {th ? 'งบประมาณ' : 'Budget'}
            </DialogTitle>
            <button
              type="button"
              onClick={close}
              aria-label={th ? 'ปิดงบประมาณ' : 'Close budget'}
              className="col-start-3 row-start-1 grid size-11 place-items-center rounded-full text-neutral-500"
            >
              <span className="grid size-8 place-items-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <X className="size-4.5" />
              </span>
            </button>
          </header>
          <div data-sheet-scroll className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5">
            <h3 className="mb-4 text-sm font-semibold">
              {th
                ? offerType === 'sale'
                  ? 'ราคาซื้อ (บาท)'
                  : offerType === 'rent'
                    ? 'ราคาเช่า (บาท)'
                    : 'ราคา (บาท)'
                : offerType === 'sale'
                  ? 'Purchase price (THB)'
                  : offerType === 'rent'
                    ? 'Rental price (THB)'
                    : 'Price (THB)'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(['minPrice', 'maxPrice'] as const).map((key) => (
                <label key={key} className="min-w-0 text-sm">
                  {boundLabel(key)}
                  <input
                    data-mobile-budget-price={key}
                    inputMode="numeric"
                    autoComplete="off"
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? 'mobile-budget-error' : undefined}
                    value={editingPrice === key ? value[key] : formatMapPriceInput(value[key])}
                    onFocus={() => {
                      setActivePrice(key)
                      setEditingPrice(key)
                    }}
                    onBlur={() => setEditingPrice(null)}
                    onChange={(event) => update(key, cleanMapPriceInput(event.target.value))}
                    placeholder={th ? 'ไม่จำกัด' : 'Any'}
                    className="mt-2 h-12 w-full rounded-2xl border border-neutral-800 bg-white px-3 text-base placeholder:text-neutral-400 focus:border-neutral-800 focus:ring-neutral-800 dark:border-neutral-300 dark:bg-neutral-900 dark:focus:ring-neutral-300"
                  />
                </label>
              ))}
            </div>
            {invalid && (
              <p id="mobile-budget-error" role="alert" className="mt-2 text-sm text-red-600">
                {th ? 'ราคาต่ำสุดต้องไม่เกินราคาสูงสุด' : 'Minimum must not exceed maximum'}
              </p>
            )}
            <div data-sheet-no-drag className="mt-3">
              <p className="mb-2 text-xs text-neutral-600 dark:text-neutral-300">
                {th ? `ใส่เร็ว: ${boundLabel(activePrice)}` : `Quick fill: ${boundLabel(activePrice)}`}
              </p>
              <div className="flex flex-wrap gap-2">
                {mapPriceSuffixes.map((suffix) => {
                  const next = appendMapPriceSuffix(value[activePrice], suffix)
                  return (
                    <button
                      key={suffix}
                      type="button"
                      data-mobile-budget-suffix={suffix}
                      disabled={next === value[activePrice]}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => update(activePrice, next)}
                      aria-label={
                        th
                          ? `เติม ${suffix} ต่อท้าย${boundLabel(activePrice)}`
                          : `Append ${suffix} to ${boundLabel(activePrice)}`
                      }
                      className="min-h-11 rounded-xl border border-dashed border-neutral-300 px-3 text-xs text-neutral-600 disabled:opacity-40 dark:border-neutral-600 dark:text-neutral-300"
                    >
                      {th ? `เติม ${suffix}` : `Add ${suffix}`}
                    </button>
                  )
                })}
              </div>
            </div>
            {offerType && (
              <section className="mt-5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <h3 className="mb-2 text-sm font-medium">{th ? 'ราคาไม่เกิน' : 'Up to'}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {quickMaximums.map((max) => (
                    <button
                      key={max}
                      type="button"
                      data-mobile-budget-maximum={max}
                      aria-pressed={!value.minPrice && value.maxPrice === String(max)}
                      onClick={() => setValue({ minPrice: '', maxPrice: String(max) })}
                      className="min-h-11 rounded-xl border border-neutral-200 px-1 text-xs aria-pressed:border-neutral-800 dark:border-neutral-700 dark:aria-pressed:border-neutral-300"
                    >
                      {max >= 1_000_000 ? `${max / 1_000_000}${th ? ' ล้าน' : 'M'}` : max.toLocaleString('en-US')}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
          <footer className="flex shrink-0 items-center justify-between border-t border-neutral-100 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setValue(emptySearchBudget)}
              data-mobile-budget-clear
              className="flex min-h-11 items-center gap-2 text-sm text-neutral-500"
            >
              <RotateCcw className="size-4" />
              {th ? 'ล้างราคา' : 'Clear prices'}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={invalid}
              data-mobile-budget-done
              className="min-h-11 rounded-xl border border-neutral-200 bg-neutral-50 px-5 text-sm font-medium disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800"
            >
              {th ? 'เสร็จ' : 'Done'}
            </button>
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
