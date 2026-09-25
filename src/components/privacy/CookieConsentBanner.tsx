'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  COOKIE_SETTINGS_EVENT,
  readCookieChoice,
  saveCookieChoice,
  type ConsentWindow,
} from '@/lib/analyticsConsent'
import { X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function CookieConsentBanner() {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [choice, setChoice] = useState<boolean | null>(null)
  const [opened, setOpened] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const sync = () => {
      setChoice(readCookieChoice()?.analytics ?? null)
      setReady(true)
    }
    const storage = (event: StorageEvent) => {
      if (event.key !== COOKIE_CONSENT_KEY && event.key !== null) return
      delete (window as ConsentWindow).__mapxpropCookieChoice
      sync()
    }
    const open = () => {
      opener.current = document.activeElement as HTMLElement
      setOpened(true)
    }
    sync()
    window.addEventListener(COOKIE_CONSENT_EVENT, sync)
    window.addEventListener(COOKIE_SETTINGS_EVENT, open)
    window.addEventListener('storage', storage)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, sync)
      window.removeEventListener(COOKIE_SETTINGS_EVENT, open)
      window.removeEventListener('storage', storage)
      window.removeEventListener('focus', sync)
    }
  }, [])
  useEffect(() => {
    if (opened) heading.current?.focus({ preventScroll: true })
  }, [opened])
  const close = () => {
    setOpened(false)
    opener.current?.focus({ preventScroll: true })
  }
  const save = (analytics: boolean) => {
    saveCookieChoice(analytics)
    close()
  }
  const readingPolicy = ['/privacy', '/terms', '/cookies'].includes(pathname)
  if (!ready || (!opened && (choice !== null || readingPolicy))) return null
  return (
    <section
      aria-labelledby="cookie-consent-title"
      role="region"
      data-cookie-banner
      onKeyDown={(event) => {
        if (event.key === 'Escape' && opened) close()
      }}
      className="fixed right-3 bottom-[calc(90px+env(safe-area-inset-bottom))] left-3 z-[80] max-h-[65dvh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl sm:right-6 sm:bottom-6 sm:left-auto sm:w-[440px] dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="cookie-consent-title" ref={heading} tabIndex={-1} className="text-base font-semibold outline-none">
          {th ? 'เลือกความเป็นส่วนตัวของคุณ' : 'Your privacy choices'}
        </h2>
        {opened && (
          <button
            type="button"
            onClick={close}
            aria-label={th ? 'ปิดการตั้งค่าคุกกี้' : 'Close cookie settings'}
            className="-mt-2 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
      <p className="mt-2 text-sm/6 text-neutral-600 dark:text-neutral-300">
        {th
          ? 'เราใช้ข้อมูลที่จำเป็นเพื่อให้เว็บทำงาน ส่วนคุกกี้วิเคราะห์ช่วยปรับปรุงบริการ คุณเลือกไม่ใช้ได้ และเปลี่ยนใจภายหลังได้เสมอ'
          : 'Essential storage keeps the site working. Analytics is optional and helps improve the service. You can change your choice anytime.'}
      </p>
      {choice !== null && (
        <p className="mt-2 text-xs text-neutral-500">
          {th
            ? `ปัจจุบัน: ${choice ? 'เปิดคุกกี้วิเคราะห์' : 'ใช้เฉพาะที่จำเป็น'}`
            : `Current: ${choice ? 'analytics enabled' : 'essential only'}`}
        </p>
      )}
      <Link
        href="/cookies"
        className="mt-2 inline-block text-sm text-[#176b50] underline underline-offset-4 dark:text-emerald-300"
        onClick={() => setOpened(false)}
      >
        {th ? 'อ่านรายละเอียดคุกกี้' : 'Read cookie policy'}
      </Link>
      <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        <button
          type="button"
          onClick={() => save(false)}
          className="min-h-11 rounded-xl border border-[#176b50] px-3 py-3 text-sm font-semibold text-[#176b50] hover:bg-emerald-50 dark:border-emerald-300 dark:text-emerald-300 dark:hover:bg-emerald-950"
        >
          {th ? 'เฉพาะที่จำเป็น' : 'Essential only'}
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          className="min-h-11 rounded-xl bg-[#176b50] px-3 py-3 text-sm font-semibold text-white hover:bg-[#125640]"
        >
          {th ? 'ยอมรับคุกกี้วิเคราะห์' : 'Allow analytics'}
        </button>
      </div>
    </section>
  )
}
