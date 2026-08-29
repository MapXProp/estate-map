'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { BanknotesIcon, CheckIcon, GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useState } from 'react'

const languages = [
  { value: 'en' as const, code: 'EN', name: 'English', description: 'English language' },
  { value: 'th' as const, code: 'TH', name: 'ภาษาไทย', description: 'ภาษาไทย' },
]

const currencies = [
  { value: 'USD' as const, symbol: '$', name: 'USD', description: 'ดอลลาร์สหรัฐ' },
  { value: 'THB' as const, symbol: '฿', name: 'THB', description: 'บาทไทย' },
]

const PropertyFooterPreferencesDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { locale, currency, setLocale, setCurrency } = usePreferences()
  const isThai = locale === 'th'

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        className="rounded-full border border-neutral-200 px-3 py-1.5 transition hover:border-[#176b50] hover:text-[#176b50] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/30 dark:border-neutral-800 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
      >
        {isThai ? 'ภาษาไทย' : 'English'} · {currency}
      </button>

      <Dialog open={isOpen} onClose={setIsOpen} className="relative z-[80]">
        <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
        <div className="fixed inset-0 flex justify-center overflow-y-auto px-2 pt-[max(1rem,8vh)] pb-8 min-[480px]:px-4">
          <DialogPanel
            transition
            className="self-start w-full max-w-[34rem] rounded-[28px] border border-neutral-200/80 bg-white p-4 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.32)] transition duration-200 ease-out min-[480px]:p-5 min-[744px]:p-6 dark:border-neutral-700 dark:bg-neutral-900 data-closed:-translate-y-3 data-closed:scale-[0.98] data-closed:opacity-0"
          >
            <div className="flex items-start gap-3 border-b border-neutral-100 pb-5 dark:border-neutral-800">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#eaf5f0] text-[#176b50] dark:bg-emerald-900/40 dark:text-emerald-300">
                <GlobeAltIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-sarabun text-base font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'ภาษาและสกุลเงิน' : 'Language and currency'}
                </DialogTitle>
                <p className="mt-0.5 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  {isThai ? 'เลือกรูปแบบที่คุณสะดวกสำหรับการค้นหาอสังหา' : 'Choose how you want to browse properties'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={isThai ? 'ปิด' : 'Close'}
                className="grid size-8 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/30 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 min-[744px]:gap-4">
              <section aria-labelledby="footer-language-options" className="min-w-0">
                <div className="mb-2.5 flex items-center gap-2">
                  <GlobeAltIcon className="size-4 text-neutral-400" />
                  <h3 id="footer-language-options" className="font-sarabun text-xs font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">
                    {isThai ? 'ภาษา' : 'Language'}
                  </h3>
                </div>
                <div className="grid gap-2">
                  {languages.map((language) => {
                    const selected = locale === language.value
                    return (
                      <button
                        key={language.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setLocale(language.value)}
                        className={clsx(
                          'relative flex min-h-18 items-center gap-2.5 rounded-2xl border p-2.5 text-left transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/30 min-[400px]:gap-3 min-[400px]:p-3',
                          selected
                            ? 'border-[#176b50] bg-[#f0f8f4] text-[#124e3c] shadow-sm dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30'
                        )}
                      >
                        <span className={clsx('grid size-8 shrink-0 place-items-center rounded-xl text-[11px] font-bold tracking-wide min-[400px]:size-9 min-[400px]:text-xs', selected ? 'bg-[#176b50] text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300')}>
                          {language.code}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-sarabun text-xs font-semibold min-[400px]:text-sm">{language.name}</span>
                          <span className="mt-0.5 block truncate text-[10px] text-neutral-500 min-[400px]:text-[11px] dark:text-neutral-400">{language.description}</span>
                        </span>
                        {selected && (
                          <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-[#176b50] text-white">
                            <CheckIcon className="size-2.5 stroke-[2.5]" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section aria-labelledby="footer-currency-options" className="min-w-0">
                <div className="mb-2.5 flex items-center gap-2">
                  <BanknotesIcon className="size-4 text-neutral-400" />
                  <h3 id="footer-currency-options" className="font-sarabun text-xs font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">
                    {isThai ? 'สกุลเงิน' : 'Currency'}
                  </h3>
                </div>
                <div className="grid gap-2">
                  {currencies.map((item) => {
                    const selected = currency === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setCurrency(item.value)}
                        className={clsx(
                          'relative flex min-h-18 items-center gap-2.5 rounded-2xl border p-2.5 text-left transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500/30 min-[400px]:gap-3 min-[400px]:p-3',
                          selected
                            ? 'border-orange-400 bg-orange-50 text-orange-950 shadow-sm dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-100'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-orange-300 hover:bg-orange-50/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-orange-800 dark:hover:bg-orange-950/20'
                        )}
                      >
                        <span className={clsx('grid size-8 shrink-0 place-items-center rounded-xl text-sm font-semibold min-[400px]:size-9 min-[400px]:text-base', selected ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300')}>
                          {item.symbol}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold min-[400px]:text-sm">{item.name}</span>
                          <span className="mt-0.5 block truncate font-sarabun text-[10px] text-neutral-500 min-[400px]:text-[11px] dark:text-neutral-400">{item.description}</span>
                        </span>
                        {selected && (
                          <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-orange-500 text-white">
                            <CheckIcon className="size-2.5 stroke-[2.5]" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/70">
              <p className="font-sarabun text-[11px] font-light leading-4 text-neutral-400 dark:text-neutral-500">
                {isThai ? 'บันทึกตัวเลือกนี้ไว้ในอุปกรณ์' : 'Save these choices on this device'}
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-full bg-[#124e3c] px-5 py-2 font-sarabun text-xs font-semibold text-white transition hover:bg-[#0d3d2f] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/30"
              >
                {isThai ? 'เสร็จสิ้น' : 'Done'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

export default PropertyFooterPreferencesDialog
