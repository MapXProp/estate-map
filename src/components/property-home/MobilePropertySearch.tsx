'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Search, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import PropertySearchOmnibox from './PropertySearchOmnibox'

const MobilePropertySearch = ({ className = '' }: { className?: string }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [open, setOpen] = useState(false)

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
            {isThai ? 'พิมพ์ได้เลย เช่น คอนโดอารีย์' : 'Try “condo in Ari”'}
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
                {isThai ? 'ไม่ต้องเลือกหมวด แค่พิมพ์สิ่งที่ต้องการ' : 'No forms—just describe what you need'}
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

          <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
            <PropertySearchOmnibox autoFocus onSubmitQuery={() => setOpen(false)} />
            <div className="mt-5 flex items-start gap-3 rounded-3xl bg-[#e8f2ed] p-4 text-[#123f32] dark:bg-emerald-950/50 dark:text-emerald-100">
              <Sparkles className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm/6">
                {isThai
                  ? 'ระบบเข้าใจทั้งทำเล ประเภท ราคา และความต้องการ เช่น “บ้านเชียงใหม่เลี้ยงสัตว์ได้”'
                  : 'Search naturally by location, property, budget and needs—for example “pet-friendly house Chiang Mai”.'}
              </p>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  )
}

export default MobilePropertySearch
