'use client'

import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { useWelcomeNotification } from '@/hooks/useWelcomeNotification'
import { showAuthNotice } from '@/lib/authNotice'
import { Link } from '@/shared/link'
import { CloseButton, Dialog, DialogPanel, DialogTitle, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BellIcon, CheckIcon, ChevronRightIcon, GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FavouriteIcon, Logout01Icon, Task01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  className?: string
  avatarClassName?: string
  buttonClassName?: string
  showGuestIcon?: boolean
  showMobileActions?: boolean
  showListingActionWhenCtaHidden?: boolean
  showPreferencesAction?: boolean
}

export default function AvatarDropdown({ avatarClassName = 'size-8', buttonClassName, className }: Props) {
  const router = useRouter()
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { openAuthModal } = useAuthModal()
  const { isAuthenticated, isLoading, logout, user } = useAuth()
  const { currency, locale, setCurrency, setLocale } = usePreferences()
  const welcomeNotification = useWelcomeNotification({
    isAuthenticated,
    locale,
    userId: user?.public_user_id || user?.email,
  })
  const displayName =
    [user?.name, user?.surname].filter(Boolean).join(' ') || user?.email || (locale === 'th' ? 'ผู้เยี่ยมชม' : 'Guest')

  const handleLogout = async () => {
    await logout()
    showAuthNotice('logout')
    router.refresh()
  }

  return (
    <div className={className}>
      <Popover>
        <PopoverButton
          className={
            buttonClassName ??
            '-m-1.5 flex cursor-pointer items-center justify-center rounded-full p-1.5 hover:bg-neutral-100 focus-visible:outline-hidden dark:hover:bg-neutral-800'
          }
        >
          <span
            className={`${avatarClassName} grid place-items-center rounded-full bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700`}
          >
            <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.7} />
          </span>
        </PopoverButton>

        <PopoverPanel
          transition
          anchor={{
            to: 'bottom end',
            gap: 16,
          }}
          className="z-40 max-h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-3xl shadow-lg ring-1 ring-black/5 transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0"
        >
          <div className="relative bg-white px-5 py-5 dark:bg-neutral-800">
            <div className="flex items-center gap-3 px-1">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-700">
                <HugeiconsIcon icon={UserIcon} size={22} strokeWidth={1.7} />
              </span>

              <div className="min-w-0 grow">
                <h4 className="truncate font-semibold">
                  {isLoading ? (locale === 'th' ? 'กำลังตรวจสอบบัญชี...' : 'Checking account...') : displayName}
                </h4>
                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {isAuthenticated
                    ? user?.email
                    : locale === 'th'
                      ? 'เข้าสู่ระบบเพื่อจัดการบัญชีของคุณ'
                      : 'Sign in to manage your account'}
                </p>
              </div>
            </div>

            {!isAuthenticated && !isLoading && (
              <section className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <div className="space-y-0.5">
                  <CloseButton
                    as="button"
                    type="button"
                    onClick={() => openAuthModal({ mode: 'login' })}
                    className="flex min-h-11 w-full items-center rounded-2xl px-2.5 py-1.5 text-start transition hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/35 dark:hover:bg-neutral-700"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
                      <HugeiconsIcon icon={UserIcon} size={21} strokeWidth={1.5} />
                    </span>
                    <span className="ms-3 text-sm font-medium">{locale === 'th' ? 'เข้าสู่ระบบ' : 'Sign in'}</span>
                  </CloseButton>

                  <CloseButton
                    as="button"
                    type="button"
                    onClick={() => openAuthModal({ mode: 'signup' })}
                    className="flex min-h-11 w-full items-center rounded-2xl px-2.5 py-1.5 text-start transition hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/35 dark:hover:bg-neutral-700"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
                      <HugeiconsIcon icon={Task01Icon} size={21} strokeWidth={1.5} />
                    </span>
                    <span className="ms-3 text-sm font-medium">
                      {locale === 'th' ? 'สร้างบัญชี' : 'Create account'}
                    </span>
                  </CloseButton>
                </div>
              </section>
            )}

            {isAuthenticated && (
              <section className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <div className="space-y-0.5">
                  <Link
                    href={'/account'}
                    className="flex min-h-11 items-center rounded-2xl px-2.5 py-1.5 transition hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-neutral-500/25 dark:hover:bg-neutral-700"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
                      <HugeiconsIcon icon={UserIcon} size={21} strokeWidth={1.5} />
                    </span>
                    <span className="ms-3 text-sm font-medium">
                      {locale === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal details'}
                    </span>
                  </Link>

                  <Link
                    href={'/account-listings'}
                    className="flex min-h-11 items-center rounded-2xl px-2.5 py-1.5 transition hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-neutral-500/25 dark:hover:bg-neutral-700"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
                      <HugeiconsIcon icon={Task01Icon} size={21} strokeWidth={1.5} />
                    </span>
                    <span className="ms-3 text-sm font-medium">{locale === 'th' ? 'ทรัพย์ของฉัน' : 'My listings'}</span>
                  </Link>

                  <Link
                    href={'/account-savelists'}
                    className="flex min-h-11 items-center rounded-2xl px-2.5 py-1.5 transition hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-neutral-500/25 dark:hover:bg-neutral-700"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
                      <HugeiconsIcon icon={FavouriteIcon} size={21} strokeWidth={1.5} />
                    </span>
                    <span className="ms-3 text-sm font-medium">{locale === 'th' ? 'ที่บันทึกไว้' : 'Saved'}</span>
                  </Link>
                </div>
              </section>
            )}

            <Link
              href="/add-listing/1?new=1"
              className="mt-3 flex min-h-14 items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-3.5 py-2.5 transition hover:border-orange-200 hover:bg-orange-100/70 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/35 dark:border-orange-900/50 dark:bg-orange-950/25 dark:hover:bg-orange-950/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/20">
                <HugeiconsIcon icon={Task01Icon} size={21} strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-orange-950 dark:text-orange-100">
                  {locale === 'th' ? 'ลงประกาศฟรี' : 'List for free'}
                </span>
                <span className="mt-0.5 block text-[11px] text-orange-700/75 dark:text-orange-300/75">
                  {locale === 'th' ? 'เริ่มสร้างรายการใหม่' : 'Create a new listing'}
                </span>
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-orange-400" />
            </Link>

            <section className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <div className="space-y-0.5">
                <CloseButton
                  as="button"
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  className="flex min-h-11 w-full items-center rounded-2xl px-2.5 py-1.5 text-start transition hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-blue-500/25 dark:hover:bg-neutral-700"
                >
                  <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    <BellIcon className="size-5" />
                    {welcomeNotification.isUnread && (
                      <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-neutral-800" />
                    )}
                  </span>
                  <span className="ms-3 min-w-0 flex-1">
                    <span className="block text-sm font-medium">{welcomeNotification.panelLabel}</span>
                    <span className="mt-0.5 block text-[11px] text-neutral-500 dark:text-neutral-400">
                      {welcomeNotification.unreadSummary}
                    </span>
                  </span>
                  {welcomeNotification.unreadCount > 0 && (
                    <span className="me-1 grid min-w-6 place-items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                      {welcomeNotification.unreadCount}
                    </span>
                  )}
                  <ChevronRightIcon className="size-4 shrink-0 text-neutral-400" />
                </CloseButton>

                <CloseButton
                  as="button"
                  type="button"
                  onClick={() => setPreferencesOpen(true)}
                  className="flex min-h-11 w-full items-center rounded-2xl px-2.5 py-1.5 text-start transition hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-emerald-600/25 dark:hover:bg-neutral-700"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#176b50] dark:bg-emerald-950/40 dark:text-emerald-300">
                    <GlobeAltIcon className="size-5" />
                  </span>
                  <span className="ms-3 min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {locale === 'th' ? 'ภาษา / สกุลเงิน' : 'Language / currency'}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-neutral-500 dark:text-neutral-400">
                      {locale === 'th' ? 'ไทย' : 'English'} · {currency}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-neutral-400" />
                </CloseButton>
              </div>
            </section>

            {isAuthenticated && (
              <div className="mt-3 border-t border-neutral-200 pt-2.5 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-11 w-full items-center rounded-2xl px-2.5 py-2 text-left text-neutral-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-red-500/25 dark:text-neutral-300 dark:hover:bg-red-950/25 dark:hover:text-red-300"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 dark:bg-neutral-700">
                    <HugeiconsIcon icon={Logout01Icon} size={21} strokeWidth={1.5} />
                  </span>
                  <span className="ms-3 text-sm font-medium">{locale === 'th' ? 'ออกจากระบบ' : 'Log out'}</span>
                </button>
              </div>
            )}
          </div>
        </PopoverPanel>
      </Popover>

      <Dialog open={notificationsOpen} onClose={setNotificationsOpen} className="relative z-[70]">
        <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end justify-center p-2 min-[744px]:items-center">
          <DialogPanel
            transition
            className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl transition duration-200 dark:bg-neutral-900 data-closed:translate-y-8 data-closed:opacity-0 min-[744px]:data-closed:translate-y-2"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <div>
                <DialogTitle className="text-lg font-semibold text-neutral-950 dark:text-white">
                  {welcomeNotification.panelLabel}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {welcomeNotification.sourceLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                aria-label={locale === 'th' ? 'ปิด' : 'Close'}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="px-4 py-4">
              <div className="flex gap-3 rounded-2xl bg-blue-50/70 px-4 py-4 dark:bg-blue-950/25">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200">
                  <BellIcon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {welcomeNotification.title}
                  </span>
                  <span className="mt-1 block text-xs/5 text-neutral-600 dark:text-neutral-400">
                    {welcomeNotification.detail}
                  </span>
                </span>
                {welcomeNotification.isUnread && <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />}
              </div>
            </div>

            <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  welcomeNotification.markAsRead()
                  setNotificationsOpen(false)
                }}
                className="min-h-11 w-full rounded-full bg-[#124e3c] px-4 text-sm font-semibold text-white transition hover:bg-[#0d3d2f] focus-visible:ring-3 focus-visible:ring-[#176b50]/30 focus-visible:outline-hidden"
              >
                {welcomeNotification.doneLabel}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={preferencesOpen} onClose={setPreferencesOpen} className="relative z-[70]">
        <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center px-2 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(12dvh,env(safe-area-inset-bottom))] min-[744px]:p-2">
          <DialogPanel
            transition
            className="hidden-scrollbar max-h-[calc(88dvh-1rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[28px] bg-white p-5 shadow-2xl transition duration-200 min-[744px]:max-h-[calc(100dvh-1rem)] min-[744px]:max-w-[36rem] min-[744px]:p-6 dark:bg-neutral-900 data-closed:translate-y-8 data-closed:opacity-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold text-neutral-950 dark:text-white">
                  {locale === 'th' ? 'ภาษาและสกุลเงิน' : 'Language and currency'}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {locale === 'th' ? 'เลือกให้เหมาะกับการค้นหาของคุณ' : 'Choose how you want to browse'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreferencesOpen(false)}
                aria-label={locale === 'th' ? 'ปิด' : 'Close'}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 min-[744px]:gap-4">
              <section className="order-1 min-w-0">
                <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  {locale === 'th' ? 'ภาษา' : 'Language'}
                </h3>
                <div className="mt-2 grid gap-2">
                  {[
                    { value: 'th' as const, label: 'ภาษาไทย', code: 'TH' },
                    { value: 'en' as const, label: 'English', code: 'EN' },
                  ].map((language) => {
                    const active = locale === language.value
                    return (
                      <button
                        key={language.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setLocale(language.value)}
                        className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-start transition ${
                          active
                            ? 'border-[#176b50] bg-[#eff7f3] text-[#124e3c] dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <span
                          className={`grid size-8 place-items-center rounded-xl text-xs font-bold ${active ? 'bg-[#176b50] text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                        >
                          {language.code}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{language.label}</span>
                        {active && <CheckIcon className="size-4 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="order-2 min-w-0">
                <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  {locale === 'th' ? 'สกุลเงิน' : 'Currency'}
                </h3>
                <div className="mt-2 grid gap-2">
                  {[
                    { value: 'THB' as const, label: 'บาทไทย', symbol: '฿' },
                    { value: 'USD' as const, label: 'US Dollar', symbol: '$' },
                  ].map((item) => {
                    const active = currency === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCurrency(item.value)}
                        className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-start transition ${
                          active
                            ? 'border-orange-400 bg-orange-50 text-orange-950 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-100'
                            : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <span
                          className={`grid size-8 place-items-center rounded-xl text-base font-semibold ${active ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'}`}
                        >
                          {item.symbol}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{item.value}</span>
                          <span className="block truncate text-[11px] opacity-70">{item.label}</span>
                        </span>
                        {active && <CheckIcon className="size-4 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/70">
              <p className="text-[11px] leading-4 font-light text-neutral-400 dark:text-neutral-500">
                {locale === 'th' ? 'บันทึกตัวเลือกนี้ไว้ในอุปกรณ์' : 'Save these choices on this device'}
              </p>
              <button
                type="button"
                onClick={() => setPreferencesOpen(false)}
                className="shrink-0 rounded-full bg-[#124e3c] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3d2f] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/30"
              >
                {locale === 'th' ? 'เสร็จสิ้น' : 'Done'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
