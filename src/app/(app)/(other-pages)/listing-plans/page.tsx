import { createPageMetadata } from '@/lib/seo'
import { Check, Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata = createPageMetadata({
  title: 'ลงประกาศอสังหาฟรี',
  description:
    'ลงประกาศบ้าน คอนโด ที่ดิน ห้องเช่า และพื้นที่ธุรกิจบน MapxProp ฟรี ไม่ต้องใช้บัตรเครดิต พร้อมจัดการประกาศได้จากบัญชีของคุณ',
  path: '/listing-plans',
})

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
      <p className="text-sm font-medium text-[#176b50] dark:text-emerald-300">สำหรับเจ้าของทรัพย์และผู้ลงประกาศ</p>
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">มีพื้นที่ดี ๆ ให้คนได้ค้นพบ</h1>
      <p className="mt-4 text-base/7 text-neutral-600 dark:text-neutral-300">
        ลงประกาศอสังหาบน MapxProp เพื่อให้คนค้นหาทรัพย์และติดต่อคุณได้โดยตรง
      </p>
      <section className="mt-8 rounded-3xl border border-emerald-900/10 bg-[#f4f9f7] p-6 sm:p-8 dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="text-xl font-semibold text-[#145240] dark:text-emerald-300">ลงประกาศฟรี</h2>
        <p className="mt-2 text-sm/7 text-neutral-600 dark:text-neutral-300">
          ปัจจุบันไม่มีค่าลงประกาศ ไม่ต้องใส่บัตรเครดิต และไม่มีการเรียกเก็บเงินอัตโนมัติ
        </p>
        <ul className="my-6 space-y-4 text-sm">
          {[
            'เพิ่มรูป ราคา ทำเล และรายละเอียดทรัพย์',
            'ให้ผู้สนใจติดต่อผ่านช่องทางที่คุณระบุ',
            'แก้ไขและดูสถานะได้ในประกาศของฉัน',
          ].map((text) => (
            <li key={text} className="flex gap-3">
              <Check aria-hidden="true" className="size-5 shrink-0 text-[#176b50] dark:text-emerald-300" />
              {text}
            </li>
          ))}
        </ul>
        <Link
          href="/add-listing/1?new=1"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e75b18] px-6 py-3 text-sm font-semibold text-white hover:bg-[#cf4d12]"
        >
          <Plus className="size-5" />
          เริ่มลงประกาศฟรี
        </Link>
        <Link
          href="/account-listings"
          className="ml-5 inline-block py-4 text-sm font-medium text-[#176b50] underline-offset-4 hover:underline dark:text-emerald-300"
        >
          ประกาศของฉัน →
        </Link>
      </section>
      <p className="mt-6 text-sm/7 text-neutral-600 dark:text-neutral-300">
        หากมีบริการเสริมแบบเสียเงินในอนาคต เราจะแจ้งราคาและเงื่อนไขก่อนให้คุณเลือกใช้
        ราคาขายหรือค่าเช่าในประกาศเป็นราคาของทรัพย์ ไม่ใช่ค่าบริการเว็บไซต์
      </p>
      <nav
        aria-label="ข้อมูลการลงประกาศ"
        className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#176b50] dark:text-emerald-300"
      >
        <Link href="/terms" className="underline underline-offset-4">
          เงื่อนไขใช้งาน
        </Link>
        <Link href="/privacy" className="underline underline-offset-4">
          ความเป็นส่วนตัว
        </Link>
        <Link href="/contact?topic=listing" className="underline underline-offset-4">
          สอบถามการลงประกาศ
        </Link>
      </nav>
    </main>
  )
}
