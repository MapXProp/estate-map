'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useInteractOutside } from '@/hooks/useInteractOutside'
import {
  clearPropertyRecentLocations,
  getPropertyRecentLocations,
  type PropertyRecentLocation,
} from '@/lib/propertyRecentLocations'
import {
  fetchLongdoPropertyLocationSuggestions,
  fetchPropertySearchSuggestions,
  type PropertySearchSuggestion,
} from '@/lib/propertySearch'
import * as Headless from '@headlessui/react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Location01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import { Clock3, Search } from 'lucide-react'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ClearDataButton } from './ClearDataButton'

type PropertyLocationSuggestion = {
  id: string
  name: string
  nameTh?: string
  nameEn?: string
  description?: string
  searchQuery?: string
  provider: 'local' | 'longdo' | 'manual'
  source: 'recent' | 'autocomplete' | 'longdo' | 'manual'
}

const locationTypeLabels: Record<string, { th: string; en: string }> = {
  country: { th: 'ประเทศ', en: 'Country' },
  province: { th: 'จังหวัด', en: 'Province' },
  district: { th: 'เขต / อำเภอ', en: 'District' },
  subdistrict: { th: 'แขวง / ตำบล', en: 'Subdistrict' },
  neighborhood: { th: 'ย่าน', en: 'Area' },
  transit: { th: 'สถานีรถไฟฟ้า', en: 'Transit station' },
  project: { th: 'โครงการ', en: 'Project' },
  building: { th: 'อาคาร', en: 'Building' },
  longdo: { th: 'สถานที่จาก Longdo Map', en: 'Place from Longdo Map' },
}

const externalLocationPattern =
  /(?:ถนน|ซอย|หมู่บ้าน|คอนโด|อาคาร|ตึก|โครงการ|ตลาด|ห้าง|โรงเรียน|มหาวิทยาลัย|โรงพยาบาล|สถานี|วัด|road|soi|village|condo|building|project|market|mall|school|university|hospital|station)/i

const dedupeSuggestions = (items: PropertyLocationSuggestion[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = (item.searchQuery || item.name).trim().toLocaleLowerCase('th-TH')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const styles = {
  button: {
    base: 'relative z-10 flex w-full shrink-0 cursor-pointer items-center gap-x-3 text-start focus:outline-hidden',
    focused: 'rounded-full bg-transparent custom-shadow-1 focus-visible:outline-hidden dark:bg-white/5',
    default: 'px-7 py-4 xl:px-8 xl:py-6',
    small: 'px-7 py-3 xl:px-8',
  },
  input: {
    base: 'block w-full truncate border-none bg-transparent p-0 font-semibold placeholder-neutral-800 focus:placeholder-neutral-300 focus:ring-0 focus:outline-hidden dark:placeholder-neutral-200',
    default: 'text-base xl:text-lg',
    small: 'text-base',
  },
  panel: {
    base: 'absolute start-0 top-full z-40 mt-3 max-h-[min(32rem,65vh)] overflow-y-auto rounded-3xl border border-neutral-100 bg-white py-3 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.25)] transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 dark:border-neutral-700 dark:bg-neutral-800',
    default: 'w-lg sm:py-5',
    small: 'w-md sm:py-4',
  },
}

interface Props {
  placeholder: string
  description: string
  ariaLabel: string
  className?: string
  inputName?: string
  fieldStyle: 'default' | 'small'
  responsive?: boolean
}

const toAutocompleteSuggestion = (
  item: PropertySearchSuggestion,
  index: number,
  isThai: boolean
): PropertyLocationSuggestion => ({
  id: `autocomplete-${item.type}-${item.query}-${index}`,
  name: item.query || item.label,
  nameTh: item.label,
  nameEn: item.label,
  searchQuery: item.query || item.label,
  description: locationTypeLabels[item.description]?.[isThai ? 'th' : 'en'] || item.description,
  provider: 'local',
  source: 'autocomplete',
})

const toLongdoSuggestion = (item: PropertySearchSuggestion, index: number): PropertyLocationSuggestion => ({
  id: `longdo-${item.query}-${index}`,
  name: item.label || item.query,
  nameTh: item.label || item.query,
  nameEn: item.label || item.query,
  searchQuery: item.query || item.label,
  description: item.description,
  provider: 'longdo',
  source: 'longdo',
})

export const PropertyLocationInputField: FC<Props> = ({
  placeholder,
  description,
  ariaLabel,
  className = 'flex-1',
  inputName = 'location',
  fieldStyle,
  responsive = false,
}) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const longdoSuggestionCacheRef = useRef(new Map<string, PropertySearchSuggestion[]>())
  const [showPopover, setShowPopover] = useState(false)
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selected, setSelected] = useState<PropertyLocationSuggestion | null>(null)
  const [recentLocations, setRecentLocations] = useState<PropertyRecentLocation[]>([])
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<PropertyLocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const normalizedQuery = query.trim()

  const getSuggestionName = useCallback(
    (item?: PropertyLocationSuggestion | null) => {
      if (!item) return ''
      return locale === 'th' ? item.nameTh || item.name : item.nameEn || item.name
    },
    [locale]
  )

  const recentSuggestions = useMemo<PropertyLocationSuggestion[]>(
    () =>
      recentLocations.map((item, index) => ({
        id: `recent-${item.searchedAt}-${index}`,
        name: item.query,
        nameTh: item.label || item.query,
        nameEn: item.label || item.query,
        searchQuery: item.query,
        provider: item.source || 'manual',
        source: 'recent',
      })),
    [recentLocations]
  )

  const openPopover = useCallback(() => {
    setRecentLocations(getPropertyRecentLocations())
    setShowPopover(true)
  }, [])

  const closePopover = useCallback(() => setShowPopover(false), [])
  useInteractOutside(containerRef, closePopover)

  useEffect(() => {
    if (!showPopover) return
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(focusTimer)
  }, [showPopover])

  useEffect(() => {
    if (!showPopover || !normalizedQuery) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      const items = await fetchPropertySearchSuggestions(normalizedQuery, controller.signal, {
        limit: 10,
        scope: 'location',
      })
      if (controller.signal.aborted) return
      const localSuggestions = items
        .filter((item) => item.type === 'location')
        .slice(0, 7)
        .map((item, index) => toAutocompleteSuggestion(item, index, isThai))
      setAutocompleteSuggestions(localSuggestions)

      const shouldUseLongdo =
        Array.from(normalizedQuery).length >= 3 &&
        (localSuggestions.length < 5 || externalLocationPattern.test(normalizedQuery))
      if (!shouldUseLongdo) {
        setIsLoading(false)
        return
      }

      await new Promise((resolve) => window.setTimeout(resolve, 220))
      if (controller.signal.aborted) return
      const cacheKey = normalizedQuery.toLocaleLowerCase('th-TH')
      let longdoItems = longdoSuggestionCacheRef.current.get(cacheKey)
      if (!longdoItems) {
        longdoItems = await fetchLongdoPropertyLocationSuggestions(normalizedQuery, controller.signal)
        if (longdoItems.length) {
          longdoSuggestionCacheRef.current.set(cacheKey, longdoItems)
          if (longdoSuggestionCacheRef.current.size > 20) {
            const oldestKey = longdoSuggestionCacheRef.current.keys().next().value
            if (oldestKey) longdoSuggestionCacheRef.current.delete(oldestKey)
          }
        }
      }
      if (controller.signal.aborted) return
      const longdoSuggestions = longdoItems.map(toLongdoSuggestion)
      const combined = externalLocationPattern.test(normalizedQuery)
        ? [...longdoSuggestions, ...localSuggestions]
        : [...localSuggestions, ...longdoSuggestions]
      setAutocompleteSuggestions(dedupeSuggestions(combined).slice(0, 7))
      setIsLoading(false)
    }, 180)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isThai, normalizedQuery, showPopover])

  const selectSuggestion = (item: PropertyLocationSuggestion | null) => {
    if (!item) return
    const nextQuery = getSuggestionName(item)
    setSelected(item)
    setQuery(nextQuery)
    setSubmittedQuery(item.searchQuery || item.name)
    setIsLoading(false)
    setShowPopover(false)
    window.setTimeout(() => inputRef.current?.blur(), 50)
  }

  const clearInput = () => {
    setSelected(null)
    setQuery('')
    setSubmittedQuery('')
    setAutocompleteSuggestions([])
    setIsLoading(false)
    setShowPopover(true)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const clearRecent = () => {
    clearPropertyRecentLocations()
    setRecentLocations([])
    inputRef.current?.focus()
  }

  const manualSuggestion: PropertyLocationSuggestion = {
    id: `manual-${normalizedQuery}`,
    name: normalizedQuery,
    searchQuery: normalizedQuery,
    provider: 'manual',
    source: 'manual',
  }

  return (
    <div
      ref={containerRef}
      className={`group relative z-10 flex data-open:z-50 ${className}`}
      {...(showPopover && { 'data-open': 'true' })}
    >
      <Headless.Combobox value={selected} onChange={selectSuggestion}>
        <div
          onMouseDown={openPopover}
          onTouchStart={openPopover}
          className={clsx(styles.button.base, styles.button[fieldStyle], showPopover && styles.button.focused)}
        >
          {fieldStyle === 'default' && (
            <MapPinIcon className="size-5 text-neutral-300 lg:size-7 dark:text-neutral-400" />
          )}

          <div className="min-w-0 grow">
            <Headless.ComboboxInput
              ref={inputRef}
              value={query}
              aria-label={ariaLabel}
              className={clsx(styles.input.base, styles.input[fieldStyle])}
              placeholder={placeholder}
              autoComplete="off"
              onFocus={openPopover}
              onChange={(event) => {
                setQuery(event.target.value)
                setSubmittedQuery('')
                setSelected(null)
                setAutocompleteSuggestions([])
                setIsLoading(false)
                setShowPopover(true)
              }}
            />
            <input type="hidden" name={inputName} value={submittedQuery || query} />
            <input type="hidden" name={`${inputName}_label`} value={query} />
            <input type="hidden" name={`${inputName}_source`} value={selected?.provider || 'manual'} />
            <div className="mt-0.5 text-start text-sm font-light text-neutral-400">
              <span className="line-clamp-1">{description}</span>
            </div>

            <ClearDataButton
              className={clsx(!query && 'sr-only')}
              onClick={clearInput}
              ariaLabel={isThai ? 'ล้างข้อความค้นหาทำเล' : 'Clear location search'}
              touchFriendly
            />
          </div>
        </div>

        <Headless.Transition
          show={showPopover && (Boolean(normalizedQuery) || recentSuggestions.length > 0)}
          unmount={false}
        >
          <div className={clsx(styles.panel.base, styles.panel[fieldStyle], responsive && 'max-w-[calc(100vw-2rem)]')}>
            {!normalizedQuery ? (
              <Headless.ComboboxOptions static unmount={false}>
                {recentSuggestions.length > 0 && (
                  <section aria-labelledby="recent-location-searches-heading">
                    <div className="flex items-center justify-between gap-4 px-4 pb-2 sm:px-7">
                      <p
                        id="recent-location-searches-heading"
                        className="text-xs font-semibold text-neutral-700 dark:text-neutral-200"
                      >
                        {isThai ? 'ค้นหาล่าสุด' : 'Recent searches'}
                      </p>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={clearRecent}
                        className="rounded-full px-2 py-1 text-xs font-medium text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                      >
                        {isThai ? 'ล้างทั้งหมด' : 'Clear all'}
                      </button>
                    </div>
                    {recentSuggestions.map((item) => (
                      <Headless.ComboboxOption
                        key={item.id}
                        value={item}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 data-focus:bg-[#f0f7f4] sm:gap-4 sm:px-7 dark:data-focus:bg-emerald-950/35"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300">
                          <Clock3 className="size-4.5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                          {getSuggestionName(item)}
                        </span>
                      </Headless.ComboboxOption>
                    ))}
                  </section>
                )}
              </Headless.ComboboxOptions>
            ) : (
              <section aria-labelledby="location-autocomplete-heading">
                <div className="flex items-center gap-2 px-4 pb-2 sm:px-7">
                  <Search className="size-4 text-[#176b50] dark:text-emerald-300" />
                  <p
                    id="location-autocomplete-heading"
                    className="text-xs font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    {isThai ? 'ผลการค้นหาทำเล' : 'Location matches'}
                  </p>
                </div>
                <Headless.ComboboxOptions static unmount={false}>
                  {autocompleteSuggestions.map((item) => (
                    <Headless.ComboboxOption
                      key={item.id}
                      value={item}
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 data-focus:bg-[#f0f7f4] sm:gap-4 sm:px-7 dark:data-focus:bg-emerald-950/35"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e9f3ee] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                        <HugeiconsIcon icon={Location01Icon} className="size-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">
                          {getSuggestionName(item)}
                        </span>
                        {item.description && (
                          <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {locationTypeLabels[item.description]?.[isThai ? 'th' : 'en'] || item.description}
                          </span>
                        )}
                      </span>
                    </Headless.ComboboxOption>
                  ))}

                  {isLoading && autocompleteSuggestions.length === 0 && (
                    <div className="px-4 py-4 text-sm text-neutral-500 sm:px-7 dark:text-neutral-400">
                      {isThai ? 'กำลังค้นหาทำเล…' : 'Finding locations…'}
                    </div>
                  )}

                  {!isLoading && autocompleteSuggestions.length === 0 && (
                    <p className="px-4 pt-2 pb-1 text-xs text-neutral-400 sm:px-7">
                      {isThai ? 'ยังไม่พบชื่อทำเลที่ตรงกัน' : 'No matching location name found'}
                    </p>
                  )}

                  <Headless.ComboboxOption
                    value={manualSuggestion}
                    className="mx-2 mt-1 flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 data-focus:bg-[#f0f7f4] sm:mx-3 sm:px-4 dark:data-focus:bg-emerald-950/35"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300">
                      <Search className="size-4.5" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                      {isThai ? `ใช้คำค้น “${normalizedQuery}”` : `Use “${normalizedQuery}”`}
                    </span>
                  </Headless.ComboboxOption>
                </Headless.ComboboxOptions>
              </section>
            )}
          </div>
        </Headless.Transition>
      </Headless.Combobox>
    </div>
  )
}
