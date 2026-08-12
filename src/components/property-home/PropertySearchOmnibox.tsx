'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  fetchPropertySearchSuggestions,
  getPropertyMapSearchUrl,
  PropertySearchSuggestion,
} from '@/lib/propertySearch'
import { Building2, Clock3, MapPin, Search, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'

type Props = {
  variant?: 'hero' | 'header'
  tone?: 'green' | 'mint' | 'commerce'
  autoFocus?: boolean
  initialQuery?: string
  onSubmitQuery?: (query: string) => void
  buildQuery?: (query: string) => string
  suggestionsMode?: 'popover' | 'inline'
  showSuggestionsOnEmpty?: boolean
  placeholder?: string
}

const iconForSuggestion = (type: string) => {
  if (type === 'location') return MapPin
  if (type === 'popular') return Clock3
  return Building2
}

const PropertySearchOmnibox = ({
  variant = 'hero',
  tone = 'green',
  autoFocus = false,
  initialQuery = '',
  onSubmitQuery,
  buildQuery,
  suggestionsMode = 'popover',
  showSuggestionsOnEmpty = true,
  placeholder,
}: Props) => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<PropertySearchSuggestion[]>([])

  useEffect(() => {
    if (!focused || (!showSuggestionsOnEmpty && !query.trim())) return
    const controller = new AbortController()
    const timer = window.setTimeout(
      async () => {
        setLoading(true)
        const items = await fetchPropertySearchSuggestions(query, controller.signal)
        setSuggestions(items)
        setLoading(false)
      },
      query.trim() ? 160 : 0
    )
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [focused, query, showSuggestionsOnEmpty])

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setFocused(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const submit = (event?: FormEvent, selectedQuery = query) => {
    event?.preventDefault()
    const rawValue = selectedQuery.trim()
    const value = (buildQuery?.(rawValue) ?? rawValue).trim()
    if (!value) {
      setFocused(true)
      return
    }
    setFocused(false)
    onSubmitQuery?.(value)
    router.push(getPropertyMapSearchUrl(value))
  }

  const isHeader = variant === 'header'
  const theme = {
    green: {
      headerFocus:
        'focus-within:border-[#8ab6a7] focus-within:shadow-[0_5px_18px_rgba(18,63,50,0.10)] dark:focus-within:border-emerald-700',
      heroFocus: 'focus-within:border-[#a9c8bd] focus-within:shadow-[0_26px_75px_-18px_rgba(15,76,58,0.42)]',
      accent: 'text-[#176b50] dark:text-emerald-300',
      button: 'bg-[#123f32] shadow-[#123f32]/20 hover:bg-[#0b3227] dark:bg-emerald-200 dark:text-emerald-950',
      suggestion: 'hover:bg-[#f0f7f4] dark:hover:bg-emerald-950/40',
      suggestionIcon: 'bg-[#e9f3ee] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200',
    },
    mint: {
      headerFocus:
        'focus-within:border-[#9ED4ED] focus-within:shadow-[0_5px_18px_rgba(45,143,199,0.18)] dark:focus-within:border-[#356d89]',
      heroFocus: 'focus-within:border-[#9ED4ED] focus-within:shadow-[0_26px_75px_-18px_rgba(45,143,199,0.36)]',
      accent: 'text-[#2D8FC7] dark:text-[#8fd4f4]',
      button: 'bg-[#1676AE] shadow-[#1676AE]/24 hover:bg-[#0D6398] dark:bg-[#8fd4f4] dark:text-[#102b3a]',
      suggestion: 'hover:bg-[#EFF8FD] dark:hover:bg-[#102b3a]',
      suggestionIcon: 'bg-[#EFF8FD] text-[#2D8FC7] dark:bg-[#102b3a] dark:text-[#8fd4f4]',
    },
    commerce: {
      headerFocus:
        'focus-within:border-[#F2A086] focus-within:shadow-[0_5px_18px_rgba(230,90,47,0.18)] dark:focus-within:border-[#754032]',
      heroFocus: 'focus-within:border-[#F2A086] focus-within:shadow-[0_26px_75px_-18px_rgba(230,90,47,0.36)]',
      accent: 'text-[#E65A2F] dark:text-[#FFC2AD]',
      button: 'bg-[#D94A22] shadow-[#D94A22]/26 hover:bg-[#BE3E1B] dark:bg-[#FFC2AD] dark:text-[#351B14]',
      suggestion: 'hover:bg-[#FFF2EC] dark:hover:bg-[#351B14]',
      suggestionIcon: 'bg-[#FFF2EC] text-[#E65A2F] dark:bg-[#351B14] dark:text-[#FFC2AD]',
    },
  }[tone]

  return (
    <div ref={rootRef} className="relative w-full">
      <form
        onSubmit={submit}
        className={
          isHeader
            ? `flex h-11 w-full items-center rounded-full border border-neutral-200 bg-neutral-50 ps-4 pe-1.5 transition focus-within:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:focus-within:bg-neutral-900 ${theme.headerFocus}`
            : `flex min-h-[72px] w-full items-center rounded-[26px] border border-white/80 bg-white ps-5 pe-2.5 shadow-[0_22px_65px_-20px_rgba(15,76,58,0.30)] transition min-[744px]:min-h-[86px] min-[744px]:ps-7 min-[744px]:pe-3 dark:border-neutral-700 dark:bg-neutral-900 ${theme.heroFocus}`
        }
      >
        <Search className={`${isHeader ? 'size-4.5' : 'size-5.5'} shrink-0 ${theme.accent}`} strokeWidth={2} />
        <input
          autoFocus={autoFocus}
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={isThai ? 'ค้นหาอสังหาริมทรัพย์' : 'Search properties'}
          autoComplete="off"
          className={`min-w-0 flex-1 border-0 bg-transparent text-neutral-950 placeholder:text-neutral-400 focus:ring-0 dark:text-white dark:placeholder:text-neutral-500 ${
            isHeader ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base min-[744px]:text-lg'
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
          className={`shrink-0 font-semibold text-white shadow-lg transition active:scale-[0.98] ${theme.button} ${
            isHeader
              ? 'grid size-8 place-items-center rounded-full'
              : 'flex min-h-13 items-center gap-2 rounded-[20px] px-5 min-[744px]:min-h-16 min-[744px]:rounded-[22px] min-[744px]:px-7'
          }`}
        >
          <Search className={isHeader ? 'size-4' : 'size-5'} />
          {!isHeader && <span className="hidden sm:inline">{isThai ? 'ค้นหา' : 'Search'}</span>}
        </button>
      </form>

      {focused && (showSuggestionsOnEmpty || Boolean(query.trim())) && (
        <div
          className={`inset-x-0 z-[80] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.25)] dark:border-neutral-700 dark:bg-neutral-900 ${
            suggestionsMode === 'inline'
              ? 'relative mt-3'
              : isHeader
                ? 'absolute top-[calc(100%+10px)] min-w-[360px]'
                : 'absolute top-[calc(100%+12px)]'
          }`}
        >
          <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3 text-xs font-semibold text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <Sparkles className={`size-4 ${theme.accent}`} />
            {query.trim()
              ? isThai
                ? 'สิ่งที่น่าจะตรงกับคำค้น'
                : 'Matches for your search'
              : isThai
                ? 'ลองค้นหาแบบนี้'
                : 'Try one of these searches'}
          </div>
          <div className="max-h-[min(360px,55vh)] overflow-y-auto p-2">
            {loading && suggestions.length === 0 ? (
              <div className="px-4 py-6 text-sm text-neutral-500">{isThai ? 'กำลังค้นหา…' : 'Searching…'}</div>
            ) : suggestions.length ? (
              suggestions.map((suggestion) => {
                const Icon = iconForSuggestion(suggestion.type)
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.query}`}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion.query)
                      submit(undefined, suggestion.query)
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start transition ${theme.suggestion}`}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full ${theme.suggestionIcon}`}>
                      <Icon className="size-4.5" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {suggestion.label}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {suggestion.description}
                      </span>
                    </span>
                  </button>
                )
              })
            ) : (
              <button
                type="button"
                onClick={() => submit(undefined, query)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-4 text-start ${theme.suggestion}`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${theme.suggestionIcon}`}>
                  <Search className="size-4.5" />
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {isThai ? `ค้นหา “${query}”` : `Search for “${query}”`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertySearchOmnibox
