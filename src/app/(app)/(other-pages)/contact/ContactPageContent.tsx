'use client'

import SocialMediaLinks from '@/components/SocialMediaLinks'
import { ArrowUpRight, Building2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import type { FormEvent } from 'react'

const contactEmail = 'mapxprop@gmail.com'
const contactPhone = '094-517-4626'
const lineId = 'mapxprop'
const lineUrl = 'https://line.me/ti/p/~mapxprop'
const mapUrl =
  'https://www.google.com/maps/search/?api=1&query=8%20Somkij%20Building%2C%20Vibhavadi%20Rangsit%20Road%2C%20Chomphon%2C%20Chatuchak%2C%20Bangkok%2010900'

const topicOptions = [
  { value: 'general', label: 'สอบถามทั่วไป' },
  { value: 'listing', label: 'สอบถามการลงประกาศ' },
  { value: 'report-listing', label: 'แจ้งประกาศไม่ถูกต้อง' },
  { value: 'partnership', label: 'ร่วมงานกับ MapxProp' },
] as const

const normalizeTopic = (topic?: string) =>
  topicOptions.some((option) => option.value === topic) ? topic : 'general'

const ContactPageContent = ({ initialTopic }: { initialTopic?: string }) => {
  const selectedTopic = normalizeTopic(initialTopic)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const replyEmail = String(formData.get('email') || '').trim()
    const topic = String(formData.get('topic') || 'general')
    const message = String(formData.get('message') || '').trim()
    const topicLabel = topicOptions.find((option) => option.value === topic)?.label || 'สอบถามทั่วไป'
    const subject = `[MapxProp] ${topicLabel}${name ? ` — ${name}` : ''}`
    const body = [`ชื่อ: ${name}`, `อีเมลติดต่อกลับ: ${replyEmail}`, '', message].join('\n')

    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <main className="bg-white pb-10 min-[744px]:pb-16 dark:bg-neutral-900">
      <div className="container pt-3 min-[744px]:pt-5 lg:pt-6">
        <section className="relative overflow-hidden rounded-[28px] bg-[#eaf5f0] px-5 py-8 min-[744px]:px-9 min-[744px]:py-10 lg:px-12 dark:bg-emerald-950/50">
          <div className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full border border-[#176b50]/10" />
          <div className="pointer-events-none absolute -right-10 -bottom-36 size-72 rounded-full bg-[#176b50]/5" />
          <div className="relative max-w-3xl">
            <div className="mb-4 hidden size-11 items-center justify-center rounded-2xl bg-white/80 text-[#176b50] shadow-sm min-[744px]:inline-flex dark:bg-neutral-900/70 dark:text-emerald-300">
              <Building2 className="size-5" strokeWidth={1.8} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <p className="pt-1 text-sm font-semibold text-[#176b50] min-[744px]:pt-0 dark:text-emerald-300">ติดต่อ MapxProp</p>
              <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[#176b50] shadow-sm min-[744px]:hidden dark:bg-neutral-900/70 dark:text-emerald-300">
                <Building2 className="size-5" strokeWidth={1.8} />
              </div>
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 min-[744px]:text-4xl lg:text-5xl dark:text-white">
              มีเรื่องพื้นที่ คุยกับเราได้เลย
            </h1>
            <p className="mt-3 max-w-2xl text-base/7 text-neutral-600 min-[744px]:text-lg/8 dark:text-neutral-300">
              สอบถามการค้นหาอสังหา การลงประกาศ หรือแจ้งข้อมูลที่ต้องการให้ทีมงานช่วยตรวจสอบ
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="space-y-4">
            <section className="rounded-[26px] border border-neutral-200 bg-white p-5 min-[744px]:p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f3] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-300">
                  <MapPin className="size-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">ที่อยู่</h2>
                  <address className="mt-3 space-y-2 text-sm/6 not-italic text-neutral-600 dark:text-neutral-300">
                    <p>8 อาคารสมกิจ ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กทม. 10900</p>
                    <p className="text-neutral-500 dark:text-neutral-400">
                      8 Somkij Building, Vibhavadi Rangsit Road, Chomphon, Chatuchak, Bangkok 10900
                    </p>
                  </address>
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#176b50] transition hover:text-[#123f32] dark:text-emerald-300 dark:hover:text-emerald-200"
                  >
                    เปิดแผนที่ <ArrowUpRight className="size-4" />
                  </a>
                </div>
              </div>
            </section>

            <div className="grid gap-3 min-[520px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a
                href={`tel:${contactPhone.replace(/-/g, '')}`}
                className="group rounded-[22px] border border-neutral-200 bg-white p-5 transition hover:border-[#176b50]/30 hover:bg-[#f5faf8] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
              >
                <Phone className="size-5 text-[#176b50] dark:text-emerald-300" strokeWidth={1.8} />
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">โทรศัพท์</p>
                <p className="mt-0.5 font-semibold text-neutral-950 group-hover:text-[#176b50] dark:text-white dark:group-hover:text-emerald-300">
                  {contactPhone}
                </p>
              </a>
              <a
                href={`mailto:${contactEmail}`}
                className="group min-w-0 rounded-[22px] border border-neutral-200 bg-white p-5 transition hover:border-[#176b50]/30 hover:bg-[#f5faf8] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
              >
                <Mail className="size-5 text-[#176b50] dark:text-emerald-300" strokeWidth={1.8} />
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">อีเมล</p>
                <p className="mt-0.5 truncate font-semibold text-neutral-950 group-hover:text-[#176b50] dark:text-white dark:group-hover:text-emerald-300">
                  {contactEmail}
                </p>
              </a>
              <a
                href={lineUrl}
                target="_blank"
                rel="noreferrer"
                className="group rounded-[22px] border border-neutral-200 bg-white p-5 transition hover:border-[#06c755]/30 hover:bg-[#f4fbf6] min-[520px]:col-span-2 lg:col-span-1 xl:col-span-2 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-[#06c755]/40 dark:hover:bg-[#06c755]/5"
              >
                <MessageCircle className="size-5 text-[#06a94a] dark:text-[#3adb7a]" strokeWidth={1.8} />
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">LINE ID</p>
                    <p className="mt-0.5 font-semibold text-neutral-950 group-hover:text-[#06a94a] dark:text-white dark:group-hover:text-[#3adb7a]">
                      {lineId}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-neutral-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#06a94a]" />
                </div>
              </a>
            </div>

            <section className="rounded-[22px] border border-neutral-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm font-semibold text-neutral-950 dark:text-white">ติดตาม MapxProp</p>
              <SocialMediaLinks className="mt-1" />
            </section>
          </div>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_20px_60px_rgba(18,63,50,0.07)] min-[744px]:p-8 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
            <div>
              <p className="text-sm font-semibold text-[#176b50] dark:text-emerald-300">ส่งข้อความถึงทีมงาน</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">ให้เราช่วยเรื่องอะไร?</h2>
            </div>
            <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 min-[600px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  ชื่อ
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="ชื่อผู้ติดต่อ"
                    className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-base font-normal text-neutral-950 outline-hidden transition placeholder:text-neutral-400 focus:border-[#176b50] focus:ring-4 focus:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  อีเมล
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-base font-normal text-neutral-950 outline-hidden transition placeholder:text-neutral-400 focus:border-[#176b50] focus:ring-4 focus:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                หัวข้อ
                <select
                  name="topic"
                  defaultValue={selectedTopic}
                  className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-base font-normal text-neutral-950 outline-hidden transition focus:border-[#176b50] focus:ring-4 focus:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                >
                  {topicOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                ข้อความ
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="เขียนรายละเอียดที่ต้องการให้เราช่วย..."
                  className="min-h-36 resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base font-normal text-neutral-950 outline-hidden transition placeholder:text-neutral-400 focus:border-[#176b50] focus:ring-4 focus:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                />
              </label>
              <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
                <p className="text-xs/5 text-neutral-500 dark:text-neutral-400">
                  ระบบจะเตรียมข้อความและเปิดแอปอีเมลให้คุณตรวจสอบก่อนส่ง
                </p>
                <button
                  type="submit"
                  className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#176b50] px-6 text-sm font-semibold text-white shadow-lg shadow-[#176b50]/15 transition hover:bg-[#123f32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]"
                >
                  เตรียมส่งข้อความ <Send className="size-4" />
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}

export default ContactPageContent
