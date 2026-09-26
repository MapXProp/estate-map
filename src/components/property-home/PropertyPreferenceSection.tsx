'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import type { PropertyLandingMode } from '@/lib/propertyLandingRows'
import {
  buildPropertyInterests,
  fetchPropertyRecommendations,
  propertyRecommendationReason,
  type PropertyRecommendation,
} from '@/lib/propertyPreferences'
import {
  clearSearchHistory,
  getSearchHistoryEvents,
  historyFilterSummary,
  recordSearchHistory,
  subscribeSearchHistory,
} from '@/lib/propertySearchHistory'
import { ArrowUpRight, MapPin, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import RelatedPropertyCards from './RelatedPropertyCards'

const snapshot = () => JSON.stringify(getSearchHistoryEvents())
const serverSnapshot = () => '[]'

export default function PropertyPreferenceSection({
  mode,
  offerType,
}: {
  mode: PropertyLandingMode
  offerType?: 'sale' | 'rent'
}) {
  const { locale } = usePreferences(),
    th = locale === 'th'
  const history = useSyncExternalStore(subscribeSearchHistory, snapshot, serverSnapshot)
  const interests = useMemo(() => buildPropertyInterests(JSON.parse(history)), [history])
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; recommendations: PropertyRecommendation[]; failed: boolean }>()
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState(false)
  const requestKey = JSON.stringify([interests, mode, offerType, attempt])
  useEffect(() => {
    if (!interests.length) return
    const controller = new AbortController()
    void fetchPropertyRecommendations(interests, mode, offerType, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setResult({ ...value, key: requestKey })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key: requestKey, recommendations: [], failed: true })
      })
    return () => controller.abort()
  }, [interests, mode, offerType, requestKey])
  if (!interests.length) return null
  const current = result?.key === requestKey ? result : undefined
  const reset = async () => {
    setClearing(true)
    setClearError(false)
    try {
      await clearSearchHistory()
    } catch {
      setClearError(true)
    } finally {
      setClearing(false)
    }
  }
  return (
    <section
      className="container pt-6 pb-3 sm:pt-8"
      data-property-preferences
      aria-labelledby="property-preferences-title"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="property-preferences-title"
            className="text-xl font-semibold text-neutral-950 sm:text-2xl dark:text-white"
          >
            {th ? 'แนะนำจากการค้นหาของคุณ' : 'Based on your searches'}
          </h2>
          <p className="mt-1.5 text-sm text-neutral-500">
            {th
              ? 'อิงจากทำเลและตัวเลือกที่คุณค้นหาล่าสุดและค้นหาซ้ำ'
              : 'From places and choices you searched recently or often'}
          </p>
        </div>
        <details className="w-full text-sm sm:w-auto" data-preference-controls>
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[#176b50] dark:text-emerald-300">
            <SlidersHorizontal size={16} />
            {th ? 'ความสนใจของคุณ' : 'Your interests'}
          </summary>
          <div className="max-w-sm rounded-2xl border border-neutral-200 bg-white p-4 text-sm/6 dark:border-neutral-700 dark:bg-neutral-900">
            <p>
              {th
                ? 'ค้นหาในทำเลหรือเลือกตัวกรองใหม่ เพื่อปรับคำแนะนำ เริ่มใหม่จะล้างประวัติค้นหาและความสนใจที่เรียนรู้ทั้งหมด'
                : 'Search new places or filters to update suggestions. Starting over clears search history and learned interests.'}
            </p>
            <button
              type="button"
              data-reset-preferences
              disabled={clearing}
              onClick={() => void reset()}
              className="mt-2 min-h-11 font-semibold text-[#176b50] disabled:opacity-50 dark:text-emerald-300"
            >
              {th ? 'ล้างประวัติและเริ่มใหม่' : 'Clear history and start over'}
            </button>
            {clearError && (
              <p role="alert" className="text-red-600">
                {th ? 'ล้างไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Could not clear. Please try again.'}
              </p>
            )}
          </div>
        </details>
      </div>
      <div
        className="mb-5 flex gap-2 overflow-x-auto pb-1"
        aria-label={th ? 'ค้นหาต่อจากความสนใจ' : 'Continue a search'}
      >
        {interests.map((interest) => (
          <Link
            key={interest.id}
            href={interest.event.url}
            prefetch={false}
            data-preference-interest
            onClick={() =>
              recordSearchHistory({
                query: interest.event.query,
                label: interest.event.label,
                url: interest.event.url,
                source: 'hero',
              })
            }
            className="flex min-h-11 max-w-[290px] shrink-0 items-center gap-2 rounded-2xl border border-[#dbe8e1] bg-[#f6faf8] px-3 py-2 text-[#174d3d] transition hover:bg-[#eaf4ef] dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          >
            <MapPin size={16} className="shrink-0" />
            <span className="min-w-0 text-sm">
              <span className="block truncate font-medium">{interest.event.label}</span>
              {historyFilterSummary(interest.event) && (
                <span className="block truncate text-xs opacity-75">{historyFilterSummary(interest.event)}</span>
              )}
            </span>
            <ArrowUpRight size={15} className="shrink-0" />
          </Link>
        ))}
      </div>
      {!current ? (
        <p role="status" className="py-6 text-sm text-neutral-500">
          {th ? 'กำลังเลือกประกาศที่ตรงกับคุณ…' : 'Finding matching properties…'}
        </p>
      ) : current.recommendations.length ? (
        <RelatedPropertyCards
          heading={false}
          listings={current.recommendations.map((item) => item.listing)}
          recommendationDetails={Object.fromEntries(
            current.recommendations.map((item) => [
              item.listing.id,
              { reason: propertyRecommendationReason(item, th), offers: item.offers },
            ])
          )}
        />
      ) : (
        <div
          className="rounded-2xl border border-dashed border-neutral-200 px-4 py-5 text-sm text-neutral-500 dark:border-neutral-700"
          role="status"
        >
          {current.failed
            ? th
              ? 'โหลดคำแนะนำไม่สำเร็จ'
              : 'Suggestions could not load'
            : th
              ? 'ยังไม่พบประกาศตรงเงื่อนไขในหมวดนี้ เลือกทำเลด้านบนเพื่อค้นหาต่อบนแผนที่ได้เลย'
              : 'No matches in this category yet. Choose a search above to continue on the map.'}
          {current.failed && (
            <button
              type="button"
              className="ml-3 min-h-11 font-semibold text-[#176b50]"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {th ? 'ลองใหม่' : 'Retry'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
