'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { Banknote, Bath, BedDouble, House, ListChecks, Ruler, X } from 'lucide-react'
import { usePreferences } from '../preferences/PreferencesProvider'
import { emptyPropertyMapFilters, type PropertyMapFilterState } from './PropertyMapFilterBar'

export default function MapSearchDetails({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean
  onClose: () => void
  value: PropertyMapFilterState
  onChange: (value: PropertyMapFilterState) => void
}) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const update = <K extends keyof PropertyMapFilterState>(key: K, next: PropertyMapFilterState[K]) =>
    onChange({ ...value, [key]: next })
  const inputClassName =
    'h-12 w-full rounded-xl border-neutral-300 bg-white text-base font-normal text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-neutral-900 sm:text-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-300 dark:focus:ring-neutral-300'
  const sectionClassName =
    'overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'
  const sectionHeaderClassName =
    'flex items-center gap-3 border-b border-neutral-200/80 px-4 py-3 dark:border-neutral-700'
  const sectionIconClassName =
    'grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <DialogBackdrop className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-5">
        <DialogPanel className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white text-neutral-900 shadow-2xl sm:rounded-3xl dark:bg-neutral-900 dark:text-neutral-100">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6 dark:border-neutral-700">
            <div>
              <DialogTitle className="text-lg font-semibold">{th ? 'ตัวกรองเพิ่มเติม' : 'More filters'}</DialogTitle>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {th ? 'ราคา ขนาด และเงื่อนไขที่ต้องการ' : 'Price, size and preferences'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={th ? 'ปิดตัวกรอง' : 'Close filters'}
              className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:hover:bg-neutral-800"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-neutral-50 p-4 sm:p-5 dark:bg-neutral-950/60">
            <section aria-labelledby="map-filter-price-heading" className={sectionClassName}>
              <div className={sectionHeaderClassName}>
                <span className={sectionIconClassName}>
                  <Banknote className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 id="map-filter-price-heading" className="font-semibold">
                    {th ? 'ราคา' : 'Price'}
                  </h3>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {th
                      ? 'ราคาขาย หรือค่าเช่าตามเงื่อนไขของประกาศ'
                      : 'Sale price or rent for the listing’s billing period'}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {(['minPrice', 'maxPrice'] as const).map((key, index) => (
                    <label key={key} className="text-sm text-neutral-600 dark:text-neutral-300">
                      {th ? (index ? 'ราคาสูงสุด' : 'ราคาต่ำสุด') : index ? 'Maximum price' : 'Minimum price'}
                      <span className="relative mt-2 block">
                        <input
                          inputMode="numeric"
                          value={value[key]}
                          onChange={(event) => update(key, event.target.value.replace(/\D/g, '').slice(0, 12))}
                          placeholder={th ? 'ไม่จำกัด' : 'Any'}
                          className={`${inputClassName} pe-12`}
                        />
                        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                          {th ? 'บาท' : 'THB'}
                        </span>
                      </span>
                    </label>
                  ))}
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
              <div className="space-y-4 p-4">
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
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4].map((number) => (
                        <button
                          key={number}
                          type="button"
                          aria-pressed={value[key] === number}
                          onClick={() => update(key, number)}
                          className={`min-h-11 flex-1 rounded-xl border text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 ${value[key] === number ? 'border-neutral-900 bg-transparent text-neutral-900 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-100 dark:hover:bg-neutral-800' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-800'}`}
                        >
                          {number ? `${number}+` : th ? 'ทุกแบบ' : 'Any'}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <label className="block border-t border-neutral-200 pt-4 text-sm font-medium dark:border-neutral-700">
                  <span className="flex items-center gap-2">
                    <Ruler className="size-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
                    {th ? 'พื้นที่ขั้นต่ำ' : 'Minimum area'}
                  </span>
                  <span className="relative mt-2.5 block">
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
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {(
                  [
                    ['owner_direct', 'เจ้าของลงเอง', 'Owner direct'],
                    ['verified', 'ยืนยันผู้ติดต่อแล้ว', 'Verified contact'],
                    ['pets_allowed', 'เลี้ยงสัตว์ได้', 'Pet friendly'],
                  ] as const
                ).map(([key, nameTh, nameEn]) => (
                  <label
                    key={key}
                    className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <span>{th ? nameTh : nameEn}</span>
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
          <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-neutral-200 bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4 dark:border-neutral-700 dark:bg-neutral-900">
            <button
              type="button"
              className="min-h-11 rounded text-sm underline underline-offset-4 hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:hover:text-neutral-300"
              onClick={() => onChange({ ...emptyPropertyMapFilters, offerTypes: value.offerTypes })}
            >
              {th ? 'ล้างรายละเอียด' : 'Reset details'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 min-w-36 rounded-xl bg-neutral-900 px-6 font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {th ? 'ดูผลลัพธ์' : 'Show results'}
            </button>
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
