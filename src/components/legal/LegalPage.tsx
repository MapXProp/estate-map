import Link from 'next/link'
import type { ReactNode } from 'react'

export type LegalSection = { title: string; paragraphs: string[] }

export default function LegalPage({
  title,
  summary,
  sections,
  children,
  updated = '25 กันยายน 2569',
}: {
  title: string
  summary: string
  sections: LegalSection[]
  children?: ReactNode
  updated?: string
}) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <nav
        aria-label="ข้อมูลและนโยบาย"
        className="mb-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-neutral-600 dark:text-neutral-300"
      >
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          ความเป็นส่วนตัว
        </Link>
        <Link href="/terms" className="underline-offset-4 hover:underline">
          เงื่อนไขใช้งาน
        </Link>
        <Link href="/cookies" className="underline-offset-4 hover:underline">
          คุกกี้
        </Link>
      </nav>
      <p className="mb-3 text-sm font-medium text-[#176b50] dark:text-emerald-300">MapxProp · ข้อมูลสำหรับผู้ใช้งาน</p>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl dark:text-white">{title}</h1>
      <p className="mt-4 text-base/7 text-neutral-600 dark:text-neutral-300">{summary}</p>
      <p className="mt-3 text-xs text-neutral-500">มีผลและปรับปรุงล่าสุด: {updated}</p>
      {children}
      <nav
        aria-label="สารบัญ"
        className="my-8 rounded-2xl border border-emerald-900/10 bg-[#f4f9f7] p-5 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <p className="mb-3 text-sm font-semibold">เลือกอ่านหัวข้อ</p>
        <ol className="grid gap-3 text-sm sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.title}>
              <a
                className="leading-6 text-[#175d49] underline-offset-4 hover:underline dark:text-emerald-300"
                href={`#section-${index + 1}`}
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {sections.map((section, index) => (
          <section id={`section-${index + 1}`} key={section.title} className="scroll-mt-28 py-7">
            <h2 className="mb-3 text-lg font-semibold">
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm/7 text-neutral-600 sm:text-base/8 dark:text-neutral-300">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <aside className="mt-6 rounded-2xl border border-neutral-200 p-5 text-sm/7 dark:border-neutral-700">
        <h2 className="font-semibold">ติดต่อผู้ดำเนินการเว็บไซต์ MapxProp</h2>
        <a
          className="text-[#176b50] underline underline-offset-4 dark:text-emerald-300"
          href="mailto:mapxprop@gmail.com"
        >
          mapxprop@gmail.com
        </a>
        <p>
          โทร.{' '}
          <a href="tel:0945174626" className="underline underline-offset-4">
            094-517-4626
          </a>
        </p>
        <p className="text-neutral-600 dark:text-neutral-300">
          8 อาคารสมกิจ ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900
        </p>
        <Link
          href="/contact"
          className="mt-3 inline-block font-medium text-[#176b50] underline underline-offset-4 dark:text-emerald-300"
        >
          ช่องทางติดต่อทั้งหมด →
        </Link>
      </aside>
    </main>
  )
}
