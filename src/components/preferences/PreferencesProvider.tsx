'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'

export type AppLocale = 'th' | 'en'
export type AppCurrency = 'THB' | 'USD'

type ExchangeRateResponse = {
  rate?: number
  date?: string
}

type PreferencesContextValue = {
  locale: AppLocale
  currency: AppCurrency
  usdPerThb: number
  rateDate: string
  setLocale: (locale: AppLocale) => void
  setCurrency: (currency: AppCurrency) => void
  formatCurrency: (amountInThb: number, options?: { compact?: boolean; approximate?: boolean }) => string
  convertFromThb: (amountInThb: number) => number
  convertToThb: (displayAmount: number) => number
}

const DEFAULT_USD_PER_THB = 0.029
const PREFERENCE_EVENT = 'mapxprop:preference-change'
const LANGUAGE_STORAGE_KEY = 'mapxprop_language'
const CURRENCY_STORAGE_KEY = 'mapxprop_currency'

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

const subscribeToPreferences = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(PREFERENCE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(PREFERENCE_EVENT, onStoreChange)
  }
}

const getStoredLocale = (): AppLocale => (window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'English' ? 'en' : 'th')
const getStoredCurrency = (): AppCurrency =>
  window.localStorage.getItem(CURRENCY_STORAGE_KEY) === 'USD' ? 'USD' : 'THB'
const getServerLocale = (): AppLocale => 'th'
const getServerCurrency = (): AppCurrency => 'THB'

const writeCookie = (name: string, value: string) => {
  window.document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`
}

const notifyPreferenceChange = () => {
  window.dispatchEvent(new Event(PREFERENCE_EVENT))
}

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const locale = useSyncExternalStore(subscribeToPreferences, getStoredLocale, getServerLocale)
  const currency = useSyncExternalStore(subscribeToPreferences, getStoredCurrency, getServerCurrency)
  const exchangeRateSnapshot = useSyncExternalStore(
    subscribeToPreferences,
    () => window.localStorage.getItem('mapxprop_usd_rate') ?? `${DEFAULT_USD_PER_THB}|`,
    () => `${DEFAULT_USD_PER_THB}|`
  )
  const [rateValue, rateDate = ''] = exchangeRateSnapshot.split('|')
  const parsedRate = Number(rateValue)
  const usdPerThb = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : DEFAULT_USD_PER_THB

  useEffect(() => {
    let active = true

    fetch('/api/exchange-rate')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load exchange rate')
        return response.json() as Promise<ExchangeRateResponse>
      })
      .then((data) => {
        if (!active || !data.rate || !Number.isFinite(data.rate)) return
        window.localStorage.setItem('mapxprop_usd_rate', `${data.rate}|${data.date ?? ''}`)
        notifyPreferenceChange()
      })
      .catch(() => {
        // The cached/fallback rate keeps currency display available when the rate service is unavailable.
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    window.document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((nextLocale: AppLocale) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale === 'en' ? 'English' : 'Thai')
    writeCookie('NEXT_LOCALE', nextLocale)
    notifyPreferenceChange()
  }, [])

  const setCurrency = useCallback((nextCurrency: AppCurrency) => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency)
    writeCookie('MAPX_CURRENCY', nextCurrency)
    notifyPreferenceChange()
  }, [])

  const convertFromThb = useCallback(
    (amountInThb: number) => (currency === 'USD' ? amountInThb * usdPerThb : amountInThb),
    [currency, usdPerThb]
  )

  const convertToThb = useCallback(
    (displayAmount: number) => (currency === 'USD' ? displayAmount / usdPerThb : displayAmount),
    [currency, usdPerThb]
  )

  const formatCurrency = useCallback(
    (amountInThb: number, options?: { compact?: boolean; approximate?: boolean }) => {
      const converted = currency === 'USD' ? amountInThb * usdPerThb : amountInThb
      const formatted = new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        notation: options?.compact ? 'compact' : 'standard',
        maximumFractionDigits: currency === 'USD' && converted < 100 ? 2 : 0,
      }).format(converted)

      return currency === 'USD' && options?.approximate !== false ? `≈ ${formatted}` : formatted
    },
    [currency, locale, usdPerThb]
  )

  const value = useMemo<PreferencesContextValue>(
    () => ({
      locale,
      currency,
      usdPerThb,
      rateDate,
      setLocale,
      setCurrency,
      formatCurrency,
      convertFromThb,
      convertToThb,
    }),
    [
      convertFromThb,
      convertToThb,
      currency,
      formatCurrency,
      locale,
      rateDate,
      setCurrency,
      setLocale,
      usdPerThb,
    ]
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export const usePreferences = () => {
  const context = useContext(PreferencesContext)

  if (!context) {
    throw new Error('usePreferences must be used inside PreferencesProvider')
  }

  return context
}
