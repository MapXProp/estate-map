'use client'

import PropertyCard from '@/components/PropertyCard'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'
import { toRealEstateListing } from '@/data/listings'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { HeartIcon } from '@heroicons/react/24/outline'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

const SavedListingsPanel = () => {
  const { locale } = usePreferences()
  const { listings, isReady, error, refresh } = useSavedListings()
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
            {isThai ? 'รวมประกาศที่คุณสนใจไว้กลับมาดูและเปรียบเทียบได้ง่าย' : 'Revisit and compare the listings you are interested in.'}
          </p>
        </div>
        {cards.length ? (
          <p className="font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
            {isThai ? `${cards.length} ประกาศ` : `${cards.length} listings`}
          </p>
        ) : null}
      </div>

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
      ) : error ? (
        <section className="mt-8 rounded-3xl border border-neutral-200 bg-white px-6 py-10 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <p className="font-sarabun text-neutral-600 dark:text-neutral-300">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-neutral-300 px-5 font-sarabun text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-700"
          >
            <RefreshCw className="size-4" /> {isThai ? 'ลองอีกครั้ง' : 'Try again'}
          </button>
        </section>
      ) : cards.length ? (
        <section className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((listing) => (
            <PropertyCard key={listing.id} data={listing} openInNewTab />
          ))}
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <HeartIcon className="mx-auto size-10 text-neutral-300 dark:text-neutral-600" />
          <h2 className="mt-4 font-sarabun text-lg font-semibold text-neutral-900 dark:text-white">
            {isThai ? 'ยังไม่มีประกาศที่บันทึกไว้' : 'No saved listings yet'}
          </h2>
          <p className="mx-auto mt-2 max-w-md font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {isThai ? 'กดหัวใจบนประกาศที่สนใจ แล้วกลับมาดูทั้งหมดได้จากหน้านี้' : 'Tap the heart on a listing, then return here to see it.'}
          </p>
          <ButtonPrimary href="/properties/map" className="mt-6 h-11">
            {isThai ? 'ค้นหาประกาศ' : 'Browse listings'}
          </ButtonPrimary>
        </section>
      )}
    </div>
  )
}

export default SavedListingsPanel
