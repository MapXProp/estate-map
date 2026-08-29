import ButtonPrimary from '@/shared/ButtonPrimary'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'แพ็กเกจและการชำระเงิน | MapXProp',
  description: 'สถานะแพ็กเกจ MapXProp',
}

const AccountBilling = () => (
  <div className="max-w-2xl">
    <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <BanknotesIcon className="size-6" />
    </span>
    <h1 className="mt-4 font-sarabun text-3xl font-semibold text-neutral-900 dark:text-white">แพ็กเกจและการชำระเงิน</h1>
    <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
      ปัจจุบันการลงประกาศบน MapXProp ไม่มีค่าใช้จ่าย และระบบยังไม่มีการเรียกเก็บเงินหรือข้อมูลบัตรของคุณ
    </p>

    <section className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <p className="font-sarabun text-sm font-medium text-emerald-800 dark:text-emerald-200">แพ็กเกจปัจจุบัน</p>
      <p className="mt-2 font-sarabun text-xl font-semibold text-neutral-900 dark:text-white">ลงประกาศฟรี</p>
      <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        ส่งประกาศเพื่อให้ทีมงานตรวจสอบ แล้วติดตามสถานะได้จากหน้า “ประกาศของฉัน”
      </p>
      <ButtonPrimary href="/add-listing/1" className="mt-5 h-11">
        ลงประกาศใหม่
      </ButtonPrimary>
    </section>
  </div>
)

export default AccountBilling
