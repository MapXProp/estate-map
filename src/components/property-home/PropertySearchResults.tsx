'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  fetchPropertySearch,
  getPropertySearchUrl,
  PropertySearchResponse,
} from '@/lib/propertySearch'
import { Bath, BedDouble, Building2, MapPin, Ruler, SearchX } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PropertySearchOmnibox from './PropertySearchOmnibox'

const offerRefinements = [
  ['', 'ทั้งหมด', 'All'],
  ['ซื้อ', 'ซื้อ', 'Buy'],
  ['เช่า', 'เช่า', 'Rent'],
  ['เซ้ง', 'เซ้ง', 'Transfer'],
] as const

const PropertySearchResults = ({ query }: { query: string }) => {
  const router = useRouter()
  const { locale, formatCurrency } = usePreferences()
  const isThai = locale === 'th'
  const [requestState, setRequestState] = useState<{
    query: string
    data: PropertySearchResponse | null
    error: boolean
  }>({ query, data: null, error: false })
  const data = requestState.query === query ? requestState.data : null
  const error = requestState.query === query && requestState.error

  useEffect(() => {
    const controller = new AbortController()
    fetchPropertySearch(query, controller.signal)
      .then((response) => setRequestState({ query, data: response, error: false }))
      .catch((requestError) => {
        if ((requestError as Error).name !== 'AbortError') {
          setRequestState({ query, data: null, error: true })
        }
      })
    return () => controller.abort()
  }, [query])

  const selectedOffer = data?.intent.offer_types?.[0]
  const selectedRefinement =
    selectedOffer === 'sale'
      ? 'ซื้อ'
      : selectedOffer === 'rent'
        ? 'เช่า'
        : selectedOffer === 'business_transfer'
          ? 'เซ้ง'
          : ''

  const refine = (term: string) => {
    const withoutOffer = query.replace(/(?:ซื้อ|ขาย|เช่า|ให้เช่า|เซ้ง|โอนกิจการ)/g, ' ').replace(/\s+/g, ' ').trim()
    router.push(getPropertySearchUrl([withoutOffer, term].filter(Boolean).join(' ')))
  }

  return (
    <main className="container pb-24 pt-8 sm:pt-10 lg:pt-14">
      <div className="mx-auto max-w-4xl">
        <PropertySearchOmnibox initialQuery={query} />
      </div>

      <section className="mt-10">
        <div className="flex flex-col justify-between gap-5 border-b border-neutral-200 pb-7 sm:flex-row sm:items-end dark:border-neutral-800">
          <div>
            <p className="text-sm font-semibold text-[#176b50] dark:text-emerald-300">
              {isThai ? 'ผลการค้นหาแบบเข้าใจภาษาคน' : 'Natural-language property search'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              {isThai ? `ค้นหา “${query}”` : `Results for “${query}”`}
            </h1>
            {data && (
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {isThai ? `พบ ${data.total.toLocaleString('th-TH')} ประกาศ` : `${data.total.toLocaleString()} listings found`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {offerRefinements.map(([term, label, labelEn]) => (
              <button
                key={term}
                type="button"
                onClick={() => refine(term)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedRefinement === term
                    ? 'border-[#123f32] bg-[#123f32] text-white dark:border-emerald-200 dark:bg-emerald-200 dark:text-emerald-950'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#8ab6a7] hover:text-[#176b50] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                }`}
              >
                {isThai ? label : labelEn}
              </button>
            ))}
          </div>
        </div>

        {data?.intent.chips && data.intent.chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-5">
            <span className="me-1 text-sm text-neutral-500 dark:text-neutral-400">
              {isThai ? 'ระบบเข้าใจว่า:' : 'Understood as:'}
            </span>
            {data.intent.chips.map((chip) => (
              <span
                key={`${chip.type}-${chip.value}`}
                className="rounded-full bg-[#e9f3ee] px-3 py-1.5 text-sm font-medium text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200"
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}

        {!data && !error && (
          <div className="grid gap-4 py-8 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-3xl bg-neutral-100 dark:bg-neutral-800" />
            ))}
          </div>
        )}

        {error && (
          <div className="my-10 rounded-3xl border border-orange-200 bg-orange-50 p-7 text-orange-900 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100">
            <p className="font-semibold">{isThai ? 'ระบบค้นหายังเชื่อมต่อไม่ได้' : 'Search is temporarily unavailable'}</p>
            <p className="mt-1 text-sm opacity-75">{isThai ? 'กรุณาลองใหม่อีกครั้งในสักครู่' : 'Please try again in a moment.'}</p>
          </div>
        )}

        {data && data.listings.length === 0 && (
          <div className="my-10 flex flex-col items-center rounded-[32px] border border-neutral-200 px-6 py-14 text-center dark:border-neutral-800">
            <span className="grid size-16 place-items-center rounded-full bg-[#e9f3ee] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
              <SearchX className="size-7" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-neutral-950 dark:text-white">
              {isThai ? 'ยังไม่มีประกาศที่ตรงทั้งหมด' : 'No exact listings yet'}
            </h2>
            <p className="mt-2 max-w-lg text-sm/6 text-neutral-500 dark:text-neutral-400">
              {isThai
                ? 'ลองพิมพ์ให้กว้างขึ้น เช่น ตัดราคา หรือรายละเอียดบางคำออก ระบบจะช่วยตีความใหม่ให้ทันที'
                : 'Try a broader phrase by removing a price or one of the details.'}
            </p>
          </div>
        )}

        {data && data.listings.length > 0 && (
          <div className="grid gap-5 py-8 md:grid-cols-2 xl:grid-cols-3">
            {data.listings.map((listing) => {
              const price = listing.sale_price ?? listing.rent_price_monthly
              return (
                <Link
                  key={listing.id}
                  href={`/real-estate-listings/${listing.slug}`}
                  className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-gradient-to-br from-[#dcece5] via-[#edf4f0] to-[#d9e1ec] text-[#176b50] dark:from-emerald-950 dark:via-neutral-900 dark:to-slate-900">
                    <Building2 className="size-12 opacity-50 transition group-hover:scale-110" strokeWidth={1.3} />
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-800 dark:bg-neutral-900/90 dark:text-white">
                      {listing.property_type_code.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="line-clamp-2 text-lg font-semibold text-neutral-950 dark:text-white">{listing.title}</h2>
                    <p className="mt-2 flex items-center gap-1.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
                      <MapPin className="size-4 shrink-0" />
                      {[listing.project_name, listing.district, listing.province, listing.address].filter(Boolean).join(', ')}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {listing.bedroom_count !== undefined && <span className="flex items-center gap-1"><BedDouble className="size-4" /> {listing.bedroom_count}</span>}
                      {listing.bathroom_count !== undefined && <span className="flex items-center gap-1"><Bath className="size-4" /> {listing.bathroom_count}</span>}
                      {listing.usable_area_sqm !== undefined && <span className="flex items-center gap-1"><Ruler className="size-4" /> {listing.usable_area_sqm} ตร.ม.</span>}
                    </div>
                    {price !== undefined && (
                      <p className="mt-5 border-t border-neutral-100 pt-4 text-lg font-semibold text-neutral-950 dark:border-neutral-800 dark:text-white">
                        {formatCurrency(price)}
                        {listing.rent_price_monthly !== undefined && listing.sale_price === undefined && (
                          <span className="ms-1 text-sm font-normal text-neutral-500">/{isThai ? 'เดือน' : 'month'}</span>
                        )}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default PropertySearchResults
