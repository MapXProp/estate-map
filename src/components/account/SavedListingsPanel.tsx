'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { HeartIcon } from '@heroicons/react/24/outline'

const SavedListingsPanel = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  return (
    <div className="max-w-3xl">
      <div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
          <HeartIcon className="size-6" />
        </span>
        <h1 className="mt-4 font-sarabun text-3xl font-semibold text-neutral-900 dark:text-white">
          {isThai ? 'ประกาศที่บันทึก' : 'Saved listings'}
        </h1>
        <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {isThai
            ? 'ประกาศที่คุณกดหัวใจบันทึกไว้จะแสดงอยู่ในหน้านี้ เพื่อให้กลับมาเปรียบเทียบภายหลังได้ง่าย'
            : 'Listings you save with the heart button will appear here, making them easy to revisit and compare.'}
        </p>
      </div>

      <section className="mt-8 rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
        <HeartIcon className="mx-auto size-10 text-neutral-300 dark:text-neutral-600" />
        <h2 className="mt-4 font-sarabun text-lg font-semibold text-neutral-900 dark:text-white">
          {isThai ? 'ยังไม่มีประกาศที่บันทึกไว้' : 'No saved listings yet'}
        </h2>
        <p className="mx-auto mt-2 max-w-md font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {isThai
            ? 'กดไอคอนหัวใจบนประกาศที่สนใจ แล้วกลับมาดูรายการทั้งหมดได้จากหน้านี้'
            : 'Tap the heart on any listing you like, then return here to see all of your saved properties.'}
        </p>
        <ButtonPrimary href="/properties/map" className="mt-6 h-11">
          {isThai ? 'ค้นหาประกาศ' : 'Browse listings'}
        </ButtonPrimary>
      </section>
    </div>
  )
}

export default SavedListingsPanel
