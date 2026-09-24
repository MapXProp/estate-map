'use client'

import PropertyCard from '@/components/PropertyCard'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'
import { toRealEstateListing } from '@/data/listings'
import { useAuth } from '@/hooks/useAuth'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { HeartIcon } from '@heroicons/react/24/outline'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

const SavedListingsPanel = () => {
  const { locale } = usePreferences()
  const { listings, savedCount, isReady, error, refresh } = useSavedListings()
  const { isAuthenticated, status } = useAuth()
  const { openAuthModal } = useAuthModal()
  const isThai = locale === 'th'
  const cards = useMemo(() => listings.map(toRealEstateListing), [listings])

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-300">
            <HeartIcon className="size-6" />
          </span>
          <h1 className="mt-4 font-sarabun text-3xl font-semibold text-neutral-900 dark:text-white">
            {isThai ? 'ประกาศที่บันทึกไว้' : 'Saved listings'}
          </h1>
          <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'รวมประกาศที่คุณสนใจไว้กลับมาดูและเปรียบเทียบได้ง่าย'
              : 'Revisit and compare the listings you are interested in.'}
          </p>
        </div>
        {cards.length ? (
          <p className="font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
            {isThai ? `${cards.length} ประกาศ` : `${cards.length} listings`}
          </p>
        ) : null}
      </div>

      {status === 'guest' ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-[#edf5ef] p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div>
            <p className="text-sm font-semibold text-[#245a3d] dark:text-emerald-200">
              {isThai ? 'รายการของคุณในเครื่องนี้' : 'Saved on this device'}
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
              {isThai
                ? 'ดูต่อได้เลย สมัครเมื่อต้องการเก็บรายการข้ามอุปกรณ์'
                : 'Keep browsing. Create an account when you want to sync across devices.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal({ mode: 'signup', redirectPath: '/account-savelists' })}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#176b50] shadow-sm dark:bg-neutral-900 dark:text-emerald-300"
          >
            {isThai ? 'เก็บไว้ในบัญชี' : 'Save to an account'}
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}

      {error && isReady ? (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-11 items-center gap-2 font-semibold"
          >
            <RefreshCw size={16} />
            {isThai ? 'ลองอีกครั้ง' : 'Retry'}
          </button>
        </div>
      ) : null}

      {!isReady ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label={isThai ? 'กำลังโหลด' : 'Loading'}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="animate-pulse overflow-hidden rounded-2xl bg-white dark:bg-neutral-800">
              <div className="aspect-4/3 bg-neutral-200 dark:bg-neutral-700" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-700" />
                <div className="h-5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            </div>
          ))}
        </div>
      ) : cards.length ? (
        <section className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((listing) => (
            <PropertyCard key={listing.id} data={listing} openInNewTab />
          ))}
        </section>
      ) : !error ? (
        <section className="mt-8 rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <HeartIcon className="mx-auto size-10 text-neutral-300 dark:text-neutral-600" />
          <h2 className="mt-4 font-sarabun text-lg font-semibold text-neutral-900 dark:text-white">
            {savedCount > 0
              ? isThai
                ? 'ประกาศที่เก็บไว้ยังไม่เปิดให้ดูในขณะนี้'
                : 'Your saved listings are currently unavailable'
              : isThai
                ? 'เริ่มเก็บที่ที่คุณชอบ'
                : 'Start saving places you like'}
          </h2>
          <p className="mx-auto mt-2 max-w-md font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {savedCount > 0
              ? isThai
                ? 'รายการยังอยู่ อาจถูกพักหรือปิดประกาศ ลองกลับมาดูอีกครั้งได้'
                : 'Your favorites are kept. Listings may be paused or unpublished; check back later.'
              : isThai
                ? `กดหัวใจบนประกาศที่สนใจ แล้วกลับมาดูจากหน้านี้${isAuthenticated ? '' : 'ได้เลย ไม่ต้องสมัครก่อน'}`
                : 'Tap a heart on a listing and come back here. You can start without an account.'}
          </p>
          <ButtonPrimary href="/properties/map" className="mt-6 h-11">
            {isThai ? 'ค้นหาประกาศ' : 'Browse listings'}
          </ButtonPrimary>
        </section>
      ) : null}
    </div>
  )
}

export default SavedListingsPanel
