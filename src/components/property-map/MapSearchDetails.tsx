'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
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
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <DialogBackdrop className="fixed inset-0 bg-[#102b22]/45 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-5">
        <DialogPanel className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl font-semibold">
              {th ? 'งบประมาณและรายละเอียด' : 'Budget & details'}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={th ? 'ปิดตัวกรอง' : 'Close filters'}
              className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="size-5" />
            </button>
          </div>
          <fieldset className="mt-6">
            <legend className="font-semibold">{th ? 'ราคา (บาท)' : 'Price (THB)'}</legend>
            <p className="mt-1 text-xs text-neutral-500">
              {th ? 'ราคาขาย หรือค่าเช่าตามเงื่อนไขของประกาศ' : 'Sale price or rent for the listing’s billing period'}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(['minPrice', 'maxPrice'] as const).map((key, index) => (
                <label key={key} className="text-sm text-neutral-600 dark:text-neutral-300">
                  {th ? (index ? 'สูงสุด' : 'ต่ำสุด') : index ? 'Maximum' : 'Minimum'}
                  <input
                    inputMode="numeric"
                    value={value[key]}
                    onChange={(event) => update(key, event.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder={th ? 'ไม่จำกัด' : 'Any'}
                    className="mt-1.5 h-12 w-full rounded-xl border-neutral-200 bg-transparent focus:border-[#176b50] focus:ring-[#176b50] dark:border-neutral-700"
                  />
                </label>
              ))}
            </div>
            {value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice) && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {th ? 'ราคาต่ำสุดต้องไม่เกินราคาสูงสุด' : 'Minimum must not exceed maximum'}
              </p>
            )}
          </fieldset>
          <div className="mt-6 space-y-5 border-t border-neutral-100 pt-5 dark:border-neutral-800">
            {(['bedrooms', 'bathrooms'] as const).map((key) => (
              <fieldset key={key}>
                <legend className="mb-2 text-sm font-semibold">
                  {key === 'bedrooms'
                    ? th
                      ? 'ห้องนอนขั้นต่ำ'
                      : 'Minimum bedrooms'
                    : th
                      ? 'ห้องน้ำขั้นต่ำ'
                      : 'Minimum bathrooms'}
                </legend>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((number) => (
                    <button
                      key={number}
                      type="button"
                      aria-pressed={value[key] === number}
                      onClick={() => update(key, number)}
                      className={`min-h-11 flex-1 rounded-xl border text-sm ${value[key] === number ? 'border-[#176b50] bg-[#176b50] text-white' : 'border-neutral-200 dark:border-neutral-700'}`}
                    >
                      {number ? `${number}+` : th ? 'ทุกแบบ' : 'Any'}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            <label className="block text-sm font-semibold">
              {th ? 'พื้นที่ขั้นต่ำ (ตร.ม.)' : 'Minimum area (sq.m.)'}
              <input
                inputMode="numeric"
                value={value.minArea}
                onChange={(event) => update('minArea', event.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={th ? 'ไม่จำกัด' : 'Any'}
                className="mt-2 h-12 w-full rounded-xl border-neutral-200 bg-transparent focus:border-[#176b50] focus:ring-[#176b50] dark:border-neutral-700"
              />
            </label>
            {(
              [
                ['owner_direct', 'เจ้าของลงเอง', 'Owner direct'],
                ['verified', 'ยืนยันผู้ติดต่อแล้ว', 'Verified contact'],
                ['pets_allowed', 'เลี้ยงสัตว์ได้', 'Pet friendly'],
              ] as const
            ).map(([key, nameTh, nameEn]) => (
              <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
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
                  className="size-5 rounded border-neutral-300 text-[#176b50] focus:ring-[#176b50]"
                />
                {th ? nameTh : nameEn}
              </label>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-neutral-100 pt-5 dark:border-neutral-800">
            <button
              type="button"
              className="min-h-11 text-sm underline underline-offset-4"
              onClick={() => onChange({ ...emptyPropertyMapFilters, offerTypes: value.offerTypes })}
            >
              {th ? 'ล้างรายละเอียด' : 'Reset details'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl bg-[#176b50] px-6 font-semibold text-white"
            >
              {th ? 'ดูผลลัพธ์' : 'Show results'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
