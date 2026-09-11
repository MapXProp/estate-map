'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertyRecentLocations, savePropertyRecentLocation } from '@/lib/propertyRecentLocations'
import { getPropertyRecentSearches, savePropertyRecentSearch } from '@/lib/propertyRecentSearches'
import {
  fetchLongdoPropertyLocationSuggestions,
  fetchPropertySearchSuggestions,
  getPropertyMapSearchUrl,
  PropertySearchSuggestion,
} from '@/lib/propertySearch'
import { Building2, Clock3, FileText, MapPin, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import styles from './PropertySearchOmnibox.module.css'

type Props = {
  variant?: 'hero' | 'header'
  tone?: 'green' | 'mint' | 'commerce'
  autoFocus?: boolean
  initialQuery?: string
  onSubmitQuery?: (query: string) => void
  buildQuery?: (query: string) => string
  buildSearchUrl?: (query: string) => string
  allowEmptyQuery?: boolean
  showTypeLabels?: boolean
  suggestionsMode?: 'popover' | 'inline'
  showSuggestionsOnEmpty?: boolean
  placeholder?: string
  children?: ReactNode
}

const HEADER_SUGGESTION_LIMIT = 5

const externalLocationPattern =
  /(?:ถนน|ซอย|หมู่บ้าน|คอนโด|อาคาร|ตึก|โครงการ|ตลาด|ห้าง|โรงเรียน|มหาวิทยาลัย|โรงพยาบาล|สถานี|วัด|road|soi|village|condo|building|project|market|mall|school|university|hospital|station)/i

const locationTypeLabels: Record<string, { th: string; en: string }> = {
  location: { th: 'ทำเล', en: 'Location' },
  country: { th: 'ประเทศ', en: 'Country' },
  province: { th: 'จังหวัด', en: 'Province' },
  district: { th: 'เขต / อำเภอ', en: 'District' },
  subdistrict: { th: 'แขวง / ตำบล', en: 'Subdistrict' },
  neighborhood: { th: 'ย่าน', en: 'Area' },
  transit: { th: 'สถานีรถไฟฟ้า', en: 'Transit station' },
  project: { th: 'โครงการ', en: 'Project' },
  building: { th: 'อาคาร', en: 'Building' },
  longdo: { th: 'สถานที่', en: 'Place' },
  listing: { th: 'ประกาศ', en: 'Listing' },
  property_type: { th: 'ประเภทอสังหา', en: 'Property type' },
  property_group: { th: 'หมวดอสังหา', en: 'Property category' },
  discovery_channel: { th: 'หมวดค้นหา', en: 'Search category' },
  use_case: { th: 'รูปแบบการใช้งาน', en: 'Use case' },
  offer_type: { th: 'รูปแบบประกาศ', en: 'Listing type' },
  space_type: { th: 'ประเภทพื้นที่', en: 'Space type' },
  feature: { th: 'สิ่งอำนวยความสะดวก', en: 'Feature' },
  search: { th: 'คำค้น', en: 'Search' },
}

const normalizedSuggestionKey = (item: PropertySearchSuggestion) =>
  (item.query || item.label).trim().replace(/\s+/g, ' ').toLocaleLowerCase('th-TH')

const dedupeSuggestions = (items: PropertySearchSuggestion[], limit: number) => {
  const seen = new Set<string>()
  return items
    .filter((item) => {
      const key = normalizedSuggestionKey(item)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, limit)
}

const suggestionDescription = (item: PropertySearchSuggestion, isThai: boolean) => {
  if (item.type === 'recent') return item.description
  const label = locationTypeLabels[item.description] || locationTypeLabels[item.type]
  return label?.[isThai ? 'th' : 'en'] || item.description
}

const iconForSuggestion = (item: PropertySearchSuggestion) => {
  if (item.type === 'recent' || item.type === 'popular') return Clock3
  if (item.type === 'listing') return FileText
  if (item.type === 'longdo' || (item.type === 'location' && !['project', 'building'].includes(item.description))) {
    return MapPin
  }
  return Building2
}

const recentHeaderSuggestions = (isThai: boolean): PropertySearchSuggestion[] => {
  const recentLabel = isThai ? 'ค้นหาล่าสุด' : 'Recent search'
  const savedSearches = getPropertyRecentSearches().map((item) => ({
    searchedAt: item.searchedAt,
    suggestion: {
      type: 'recent',
      label: item.label,
      description: `${item.description || locationTypeLabels[item.type]?.[isThai ? 'th' : 'en'] || (isThai ? 'คำค้น' : 'Search')} · ${recentLabel}`,
      query: item.query,
    },
  }))
  const savedLocations = getPropertyRecentLocations().map((item) => ({
    searchedAt: item.searchedAt,
    suggestion: {
      type: 'recent',
      label: item.label || item.query,
      description: `${isThai ? 'ทำเล' : 'Location'} · ${recentLabel}`,
      query: item.query,
    },
  }))

  return dedupeSuggestions(
    [...savedSearches, ...savedLocations]
      .sort((first, second) => second.searchedAt - first.searchedAt)
      .map((item) => item.suggestion),
    HEADER_SUGGESTION_LIMIT
  )
}

const PropertySearchOmnibox = ({
  variant = 'hero',
  tone = 'green',
  autoFocus = false,
  initialQuery = '',
  onSubmitQuery,
  buildQuery,
  buildSearchUrl,
  allowEmptyQuery = false,
  showTypeLabels = false,
  suggestionsMode = 'popover',
  showSuggestionsOnEmpty = true,
  placeholder,
  children,
}: Props) => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const isHeader = variant === 'header'
  const integratedHeader = isHeader && Boolean(children)
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const longdoSuggestionCacheRef = useRef(new Map<string, PropertySearchSuggestion[]>())
  const [query, setQuery] = useState(initialQuery)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<PropertySearchSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const normalizedQuery = query.trim().replace(/\s+/g, ' ')

  useEffect(() => {
    if (!focused || (!showSuggestionsOnEmpty && !normalizedQuery)) return

    if (isHeader && !normalizedQuery) return

    const controller = new AbortController()
    const timer = window.setTimeout(
      async () => {
        setLoading(true)
        const localItems = await fetchPropertySearchSuggestions(normalizedQuery, controller.signal, {
          limit: isHeader ? 8 : undefined,
          scope: 'all',
        })
        if (controller.signal.aborted) return

        let items = localItems
        if (isHeader && Array.from(normalizedQuery).length >= 3) {
          const localLocationCount = localItems.filter((item) => item.type === 'location').length
          const shouldUseLongdo = localLocationCount < 3 || externalLocationPattern.test(normalizedQuery)

          if (shouldUseLongdo) {
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
            items = externalLocationPattern.test(normalizedQuery)
              ? [...(longdoItems || []), ...localItems]
              : [...localItems, ...(longdoItems || [])]
          }
        }

        setSuggestions(dedupeSuggestions(items, isHeader ? HEADER_SUGGESTION_LIMIT : 8))
        setLoading(false)
      },
      normalizedQuery ? 180 : 0
    )
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [focused, isHeader, isThai, normalizedQuery, showSuggestionsOnEmpty])

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setFocused(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const submit = (event?: FormEvent, selectedQuery = query, selectedSuggestion?: PropertySearchSuggestion) => {
    event?.preventDefault()
    const rawValue = selectedQuery.trim()
    const value = (buildQuery?.(rawValue) ?? rawValue).trim()
    if (!value && !allowEmptyQuery) {
      setFocused(true)
      return
    }
    if (isHeader && rawValue) {
      savePropertyRecentSearch(
        rawValue,
        selectedSuggestion?.label || rawValue,
        selectedSuggestion?.type === 'recent' ? 'search' : selectedSuggestion?.type || 'search',
        selectedSuggestion?.type === 'recent'
          ? isThai
            ? 'คำค้น'
            : 'Search'
          : selectedSuggestion
            ? suggestionDescription(selectedSuggestion, isThai)
            : isThai
              ? 'คำค้น'
              : 'Search'
      )
      if (selectedSuggestion?.type === 'location' || selectedSuggestion?.type === 'longdo') {
        savePropertyRecentLocation(
          rawValue,
          selectedSuggestion.label,
          selectedSuggestion.type === 'longdo' ? 'longdo' : 'local'
        )
      }
    }
    setFocused(false)
    setActiveIndex(-1)
    onSubmitQuery?.(value)
    router.push(buildSearchUrl?.(value) ?? getPropertyMapSearchUrl(value))
  }

  const selectSuggestion = (suggestion: PropertySearchSuggestion) => {
    setQuery(suggestion.query)
    submit(undefined, suggestion.query, suggestion)
  }

  const searchableItemCount = suggestions.length + (normalizedQuery ? 1 : 0)
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setFocused(false)
      setActiveIndex(-1)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!searchableItemCount) return
      event.preventDefault()
      setFocused(true)
      setActiveIndex((current) => {
        if (event.key === 'ArrowDown') return current >= searchableItemCount - 1 ? 0 : current + 1
        return current <= 0 ? searchableItemCount - 1 : current - 1
      })
      return
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      if (activeIndex < suggestions.length) selectSuggestion(suggestions[activeIndex])
      else submit(undefined, normalizedQuery)
    }
  }

  const theme = {
    green: {
      headerFocus:
        'focus-within:border-[#8ab6a7] focus-within:shadow-[0_5px_18px_rgba(18,63,50,0.10)] dark:focus-within:border-emerald-700',
      heroFocus: 'focus-within:border-[#a9c8bd] focus-within:shadow-[0_26px_75px_-18px_rgba(15,76,58,0.42)]',
      accent: 'text-[#176b50] dark:text-emerald-300',
      button:
        'bg-[#123f32] text-white shadow-[#123f32]/20 hover:bg-[#0b3227] dark:bg-emerald-200 dark:text-emerald-950',
      suggestion: 'hover:bg-[#f0f7f4] dark:hover:bg-emerald-950/40',
      suggestionIcon: 'bg-[#e9f3ee] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200',
    },
    mint: {
      headerFocus:
        'focus-within:border-[#9ED4ED] focus-within:shadow-[0_5px_18px_rgba(45,143,199,0.18)] dark:focus-within:border-[#356d89]',
      heroFocus: 'focus-within:border-[#9ED4ED] focus-within:shadow-[0_26px_75px_-18px_rgba(45,143,199,0.36)]',
      accent: 'text-[#2D8FC7] dark:text-[#8fd4f4]',
      button: 'bg-[#1676AE] text-white shadow-[#1676AE]/24 hover:bg-[#0D6398] dark:bg-[#8fd4f4] dark:text-[#102b3a]',
      suggestion: 'hover:bg-[#EFF8FD] dark:hover:bg-[#102b3a]',
      suggestionIcon: 'bg-[#EFF8FD] text-[#2D8FC7] dark:bg-[#102b3a] dark:text-[#8fd4f4]',
    },
    commerce: {
      headerFocus:
        'focus-within:border-[var(--business-selection-border)] focus-within:shadow-[0_5px_18px_var(--business-ring)]',
      heroFocus:
        'focus-within:border-[var(--business-selection-border)] focus-within:shadow-[0_26px_75px_-18px_var(--business-ring)]',
      accent: 'text-[color:var(--business-ink)]',
      button:
        'bg-[var(--business-action)] text-[color:var(--business-button-ink)] shadow-[var(--business-ring)] hover:bg-[var(--business-action-hover)]',
      suggestion: 'hover:bg-[var(--business-surface)]',
      suggestionIcon: 'bg-[var(--business-soft)] text-[color:var(--business-ink)]',
    },
  }[tone]

  return (
    <div ref={rootRef} className={integratedHeader ? styles.integratedRoot : 'relative w-full'}>
      <form
        data-property-search-form
        data-integrated-search={integratedHeader || undefined}
        onSubmit={submit}
        className={
          integratedHeader
            ? styles.integratedForm
            : isHeader
              ? `flex h-11 w-full items-center rounded-full border border-neutral-200 bg-neutral-50 ps-4 pe-1.5 transition focus-within:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:focus-within:bg-neutral-900 ${theme.headerFocus}`
              : `flex min-h-[72px] w-full items-center rounded-[26px] border border-white/80 bg-white ps-5 pe-2.5 shadow-[0_22px_65px_-20px_rgba(15,76,58,0.30)] transition min-[744px]:min-h-[86px] min-[744px]:ps-7 min-[744px]:pe-3 dark:border-neutral-700 dark:bg-neutral-900 ${theme.heroFocus}`
        }
      >
        {integratedHeader ? (
          children
        ) : (
          <Search className={`${isHeader ? 'size-4.5' : 'size-5.5'} shrink-0 ${theme.accent}`} strokeWidth={2} />
        )}
        <input
          autoFocus={autoFocus}
          value={query}
          onFocus={() => {
            setFocused(true)
            setActiveIndex(-1)
            if (isHeader && !normalizedQuery) {
              setSuggestions(recentHeaderSuggestions(isThai))
              setLoading(false)
            }
          }}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
            setActiveIndex(-1)
            if (isHeader) {
              if (nextQuery.trim()) {
                setSuggestions([])
                setLoading(true)
              } else {
                setSuggestions(recentHeaderSuggestions(isThai))
                setLoading(false)
              }
            }
          }}
          onKeyDown={handleInputKeyDown}
          aria-label={isThai ? 'ค้นหาอสังหาริมทรัพย์' : 'Search properties'}
          role="combobox"
          aria-expanded={focused}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          className={`min-w-0 flex-1 border-0 bg-transparent text-neutral-950 placeholder:text-neutral-400 focus:ring-0 dark:text-white dark:placeholder:text-neutral-500 ${
            integratedHeader
              ? styles.integratedInput
              : isHeader
                ? 'px-3 py-2 text-sm'
                : 'px-4 py-3 text-base min-[744px]:text-lg'
          }`}
          placeholder={
            placeholder ??
            (isHeader
              ? isThai
                ? 'ค้นหาทำเลหรืออสังหา'
                : 'Search location or property'
              : isThai
                ? 'ลองค้นหา “คอนโดอารีย์” หรือ “โกดังบางนา”'
                : 'Try “condo in Ari” or “warehouse Bang Na”')
          }
        />
        <button
          type="submit"
          aria-label={isThai ? 'ค้นหา' : 'Search'}
          className={
            integratedHeader
              ? styles.integratedSubmit
              : `shrink-0 font-semibold shadow-lg transition active:scale-[0.98] ${theme.button} ${
                  isHeader
                    ? 'grid size-8 place-items-center rounded-full'
                    : 'flex min-h-13 items-center gap-2 rounded-[20px] px-5 min-[744px]:min-h-16 min-[744px]:rounded-[22px] min-[744px]:px-7'
                }`
          }
        >
          <Search className={isHeader ? 'size-4' : 'size-5'} />
          {!isHeader && <span className="hidden sm:inline">{isThai ? 'ค้นหา' : 'Search'}</span>}
        </button>
      </form>

      {focused &&
        (showSuggestionsOnEmpty || Boolean(normalizedQuery)) &&
        (loading || suggestions.length > 0 || Boolean(normalizedQuery)) && (
          <div
            id={listboxId}
            role="listbox"
            className={`z-[80] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.25)] dark:border-neutral-700 dark:bg-neutral-900 ${
              suggestionsMode === 'inline'
                ? 'relative mt-3'
                : isHeader
                  ? 'absolute inset-x-0 top-[calc(100%+10px)] min-w-[360px] max-[743px]:right-auto max-[743px]:left-1/2 max-[743px]:w-[calc(100vw-24px)] max-[743px]:min-w-0 max-[743px]:-translate-x-1/2'
                  : 'absolute inset-x-0 top-[calc(100%+12px)]'
            }`}
          >
            <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3 text-xs font-semibold text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              {normalizedQuery ? (
                <Search className={`size-4 ${integratedHeader ? styles.accent : theme.accent}`} />
              ) : (
                <Clock3 className={`size-4 ${integratedHeader ? styles.accent : theme.accent}`} />
              )}
              {normalizedQuery
                ? isThai
                  ? 'ผลการค้นหา'
                  : 'Search suggestions'
                : isHeader
                  ? isThai
                    ? 'ค้นหาล่าสุด'
                    : 'Recent searches'
                  : isThai
                    ? 'ลองค้นหาแบบนี้'
                    : 'Try one of these searches'}
            </div>
            <div className="max-h-[min(360px,55vh)] overflow-y-auto p-2">
              {loading && suggestions.length === 0 ? (
                <div className="px-4 py-6 text-sm text-neutral-500">{isThai ? 'กำลังค้นหา…' : 'Searching…'}</div>
              ) : (
                <>
                  {suggestions.map((suggestion, index) => {
                    const Icon = iconForSuggestion(suggestion)
                    const isActive = activeIndex === index
                    const typeLabel = (locationTypeLabels[suggestion.description] ||
                      locationTypeLabels[suggestion.type])?.[isThai ? 'th' : 'en']
                    const description = suggestionDescription(suggestion, isThai)
                    return (
                      <button
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={isActive}
                        key={`${suggestion.type}-${suggestion.query}`}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => selectSuggestion(suggestion)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start transition ${integratedHeader ? styles.suggestion : theme.suggestion} ${
                          isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                        }`}
                      >
                        <span
                          className={`grid size-10 shrink-0 place-items-center rounded-full ${integratedHeader ? styles.suggestionIcon : theme.suggestionIcon}`}
                        >
                          <Icon className="size-4.5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">
                            {suggestion.label}
                          </span>
                          {(!showTypeLabels || description !== typeLabel) && (
                            <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                              {description}
                            </span>
                          )}
                        </span>
                        {showTypeLabels && typeLabel && (
                          <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            {typeLabel}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  {normalizedQuery && (
                    <button
                      id={`${listboxId}-option-${suggestions.length}`}
                      role="option"
                      aria-selected={activeIndex === suggestions.length}
                      type="button"
                      onMouseEnter={() => setActiveIndex(suggestions.length)}
                      onClick={() => submit(undefined, normalizedQuery)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-start transition ${integratedHeader ? styles.suggestion : theme.suggestion} ${
                        activeIndex === suggestions.length ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                      }`}
                    >
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-full ${integratedHeader ? styles.suggestionIcon : theme.suggestionIcon}`}
                      >
                        <Search className="size-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">
                          {isThai ? `ค้นหาด้วยคำว่า “${normalizedQuery}”` : `Search for “${normalizedQuery}”`}
                        </span>
                        <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                          {isThai ? 'ดูผลทั้งหมดบนแผนที่' : 'View all results on the map'}
                        </span>
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
    </div>
  )
}

export default PropertySearchOmnibox
