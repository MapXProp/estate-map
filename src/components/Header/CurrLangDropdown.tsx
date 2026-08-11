'use client'

import { AppCurrency, AppLocale, usePreferences } from '@/components/preferences/PreferencesProvider'
import { getCurrencies, getLanguages } from '@/data/navigation'
import { CloseButton, Popover, PopoverButton, PopoverPanel, PopoverPanelProps } from '@headlessui/react'
import { BanknotesIcon, CheckIcon, ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { FC } from 'react'

type Language = Awaited<ReturnType<typeof getLanguages>>[number]
type Currency = Awaited<ReturnType<typeof getCurrencies>>[number]

const languageMeta: Record<string, { code: string; nativeName: string; description: string }> = {
  English: {
    code: 'EN',
    nativeName: 'English',
    description: 'English language',
  },
  Thai: {
    code: 'TH',
    nativeName: 'ภาษาไทย',
    description: 'ภาษาไทย',
  },
}

const currencyMeta: Record<string, { symbol: string; description: string }> = {
  THB: {
    symbol: '฿',
    description: 'บาทไทย',
  },
  USD: {
    symbol: '$',
    description: 'ดอลลาร์สหรัฐ',
  },
}

interface Props {
  panelAnchor?: PopoverPanelProps['anchor']
  panelClassName?: PopoverPanelProps['className']
  className?: string
  currencies?: Currency[]
  languages?: Language[]
}

const defaultLanguages = [
  { id: 'English', name: 'English', description: 'US', href: '#' },
  { id: 'Thai', name: 'ภาษาไทย', description: 'TH', href: '#', active: true },
] as Language[]

const defaultCurrencies = [
  { id: 'USD', name: 'USD', href: '#', icon: '' },
  { id: 'THB', name: 'THB', href: '#', icon: '', active: true },
] as Currency[]

const CurrLangDropdown: FC<Props> = ({
  panelAnchor = {
    to: 'bottom end',
    gap: 14,
  },
  className,
  languages = defaultLanguages,
  currencies = defaultCurrencies,
  panelClassName,
}) => {
  const { locale, currency: selectedCurrency, setLocale, setCurrency } = usePreferences()
  const activeLanguage = languages.find((item) => item.active) ?? languages[0]
  const activeCurrency = currencies.find((item) => item.active) ?? currencies[0]
  const selectedLanguage = locale === 'en' ? 'English' : 'Thai'

  const languageCode = languageMeta[selectedLanguage]?.code ?? activeLanguage?.description ?? 'TH'
  const selectedCurrencyMeta = currencyMeta[selectedCurrency] ?? {
    symbol: selectedCurrency,
    description: selectedCurrency,
  }

  const selectLanguage = (language: Language) => {
    setLocale((language.id === 'English' ? 'en' : 'th') as AppLocale)
  }

  const selectCurrency = (currency: Currency) => {
    setCurrency((currency.id === 'USD' ? 'USD' : 'THB') as AppCurrency)
  }

  return (
    <Popover className={clsx('group relative', className)}>
      <PopoverButton
        aria-label={
          locale === 'th'
            ? `ภาษา ${languageCode} สกุลเงิน ${selectedCurrency}`
            : `Language ${languageCode}, currency ${selectedCurrency}`
        }
        className="flex h-10 items-center rounded-full border border-neutral-200 bg-white p-1.5 text-neutral-700 shadow-sm transition duration-200 group-data-open:border-emerald-300 group-data-open:bg-emerald-50 group-data-open:text-[#125640] hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-[#125640] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/30 min-[1200px]:h-11 min-[1200px]:px-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eaf5f0] text-[#176b50] min-[1200px]:size-8 dark:bg-emerald-900/50 dark:text-emerald-300">
          <GlobeAltIcon className="size-4.5" />
        </span>

        <span className="hidden items-center min-[1024px]:flex">
          <span className="px-1.5 text-[11px] font-semibold tracking-wide min-[1200px]:px-2 min-[1200px]:text-xs">
            {languageCode}
          </span>
          <span className="h-4 border-l border-neutral-200 dark:border-neutral-700" />
          <span className="flex items-center gap-1 px-1.5 text-[11px] font-semibold min-[1200px]:gap-1.5 min-[1200px]:px-2 min-[1200px]:text-xs">
            <span className="text-sm text-[#a65d12]">{selectedCurrencyMeta.symbol}</span>
            <span className="hidden min-[1200px]:inline">{selectedCurrency}</span>
          </span>
        </span>

        <ChevronDownIcon
          className="mx-0.5 hidden size-3.5 transition group-data-open:rotate-180 min-[1200px]:block"
          aria-hidden="true"
        />
      </PopoverButton>

      <PopoverPanel
        anchor={panelAnchor}
        transition
        className={clsx(
          'z-50 w-[calc(100vw-1rem)] max-w-[27rem] rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.32)] transition duration-200 ease-out min-[480px]:rounded-[28px] min-[480px]:p-5 min-[744px]:w-[34rem] min-[744px]:max-w-[34rem] min-[744px]:p-6 dark:border-neutral-700 dark:bg-neutral-900 data-closed:translate-y-2 data-closed:scale-[0.98] data-closed:opacity-0',
          panelClassName
        )}
      >
        <div className="flex items-start gap-3 border-b border-neutral-100 pb-5 dark:border-neutral-800">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#eaf5f0] text-[#176b50] dark:bg-emerald-900/40 dark:text-emerald-300">
            <GlobeAltIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-sarabun text-base font-semibold text-neutral-950 dark:text-white">
              {locale === 'th' ? 'ภาษาและสกุลเงิน' : 'Language and currency'}
            </h2>
            <p className="mt-0.5 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {locale === 'th'
                ? 'เลือกรูปแบบที่คุณสะดวกสำหรับการค้นหาอสังหา'
                : 'Choose how you want to browse properties'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 min-[744px]:gap-4">
          <section aria-labelledby="language-options-title" className="order-2 min-w-0">
            <div className="mb-2.5 flex items-center gap-2">
              <GlobeAltIcon className="size-4 text-neutral-400" />
              <h3
                id="language-options-title"
                className="font-sarabun text-xs font-semibold tracking-wide text-neutral-600 dark:text-neutral-300"
              >
                {locale === 'th' ? 'ภาษา' : 'Language'}
              </h3>
            </div>
            <div className="grid gap-2">
              {languages.map((language) => {
                const meta = languageMeta[language.id] ?? {
                  code: language.description,
                  nativeName: language.name,
                  description: language.description,
                }
                const isSelected = language.id === selectedLanguage

                return (
                  <button
                    key={language.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectLanguage(language)}
                    className={clsx(
                      'relative flex min-h-17 items-center gap-2.5 rounded-2xl border p-2.5 text-left transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/30 min-[400px]:min-h-18 min-[400px]:gap-3 min-[400px]:p-3',
                      isSelected
                        ? 'border-[#176b50] bg-[#f0f8f4] text-[#124e3c] shadow-sm dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30'
                    )}
                  >
                    <span
                      className={clsx(
                        'grid size-8 shrink-0 place-items-center rounded-xl text-[11px] font-bold tracking-wide min-[400px]:size-9 min-[400px]:text-xs',
                        isSelected
                          ? 'bg-[#176b50] text-white'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                      )}
                    >
                      {meta.code}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-sarabun text-xs font-semibold min-[400px]:text-sm">
                        {meta.nativeName}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-neutral-500 min-[400px]:text-[11px] dark:text-neutral-400">
                        {meta.description}
                      </span>
                    </span>
                    {isSelected ? (
                      <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-[#176b50] text-white">
                        <CheckIcon className="size-2.5 stroke-[2.5]" />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="currency-options-title" className="order-1 min-w-0">
            <div className="mb-2.5 flex items-center gap-2">
              <BanknotesIcon className="size-4 text-neutral-400" />
              <h3
                id="currency-options-title"
                className="font-sarabun text-xs font-semibold tracking-wide text-neutral-600 dark:text-neutral-300"
              >
                {locale === 'th' ? 'สกุลเงิน' : 'Currency'}
              </h3>
            </div>
            <div className="grid gap-2">
              {currencies.map((currency) => {
                const meta = currencyMeta[currency.id] ?? {
                  symbol: currency.name,
                  description: currency.name,
                }
                const isSelected = currency.id === selectedCurrency

                return (
                  <button
                    key={currency.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectCurrency(currency)}
                    className={clsx(
                      'relative flex min-h-16 items-center gap-2.5 rounded-2xl border p-2.5 text-left transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500/30 min-[400px]:gap-3 min-[400px]:p-3',
                      isSelected
                        ? 'border-orange-400 bg-orange-50 text-orange-950 shadow-sm dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-100'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-orange-300 hover:bg-orange-50/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-orange-800 dark:hover:bg-orange-950/20'
                    )}
                  >
                    <span
                      className={clsx(
                        'grid size-8 shrink-0 place-items-center rounded-xl text-sm font-semibold min-[400px]:size-9 min-[400px]:text-base',
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                      )}
                    >
                      {meta.symbol}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold min-[400px]:text-sm">{currency.name}</span>
                      <span className="mt-0.5 block font-sarabun text-[10px] text-neutral-500 min-[400px]:text-[11px] dark:text-neutral-400">
                        {meta.description}
                      </span>
                    </span>
                    {isSelected ? (
                      <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-orange-500 text-white">
                        <CheckIcon className="size-2.5 stroke-[2.5]" />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/70">
          <p className="font-sarabun text-[11px] font-light leading-4 text-neutral-400 dark:text-neutral-500">
            {locale === 'th' ? 'บันทึกตัวเลือกนี้ไว้ในอุปกรณ์' : 'Save these choices on this device'}
          </p>
          <CloseButton
            as="button"
            type="button"
            className="shrink-0 rounded-full bg-[#124e3c] px-5 py-2 font-sarabun text-xs font-semibold text-white transition hover:bg-[#0d3d2f] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/30"
          >
            {locale === 'th' ? 'เสร็จสิ้น' : 'Done'}
          </CloseButton>
        </div>
      </PopoverPanel>
    </Popover>
  )
}

export default CurrLangDropdown
