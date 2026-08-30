'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { BanknotesIcon } from '@heroicons/react/24/outline'

const AccountBillingPanel = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  return (
    <div className="max-w-2xl">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <BanknotesIcon className="size-6" />
      </span>
      <h1 className="mt-4 font-sarabun text-3xl font-semibold text-neutral-900 dark:text-white">
        {isThai ? 'แพ็กเกจและการชำระเงิน' : 'Plan & billing'}
      </h1>
      <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
        {isThai
          ? 'ปัจจุบันการลงประกาศบน MapXProp ไม่มีค่าใช้จ่าย และระบบยังไม่มีการเรียกเก็บเงินหรือข้อมูลบัตรของคุณ'
          : 'Listing on MapXProp is currently free. We do not charge you or store payment card details.'}
      </p>

      <section className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <p className="font-sarabun text-sm font-medium text-emerald-800 dark:text-emerald-200">
          {isThai ? 'แพ็กเกจปัจจุบัน' : 'Current plan'}
        </p>
        <p className="mt-2 font-sarabun text-xl font-semibold text-neutral-900 dark:text-white">
          {isThai ? 'ลงประกาศฟรี' : 'Free listings'}
        </p>
        <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {isThai
            ? 'ส่งประกาศเพื่อให้ทีมงานตรวจสอบ แล้วติดตามสถานะได้จากหน้า “ประกาศของฉัน”'
            : 'Submit a listing for review, then track its status from My listings.'}
        </p>
        <ButtonPrimary href="/add-listing/1?new=1" className="mt-5 h-11">
          {isThai ? 'ลงประกาศใหม่' : 'Create listing'}
        </ButtonPrimary>
      </section>
    </div>
  )
}

export default AccountBillingPanel
