'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import avatarImage from '@/images/avatars/Image-1-small.webp'
import Avatar from '@/shared/Avatar'
import { Divider } from '@/shared/divider'
import { Link } from '@/shared/link'
import SwitchDarkMode2 from '@/shared/SwitchDarkMode2'
import { CloseButton, Dialog, DialogPanel, DialogTitle, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BellIcon, CheckIcon, ChevronRightIcon, GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline'
import {
  BulbChargingIcon,
  FavouriteIcon,
  Idea01Icon,
  Logout01Icon,
  Task01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
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

export default function AvatarDropdown({
  avatarClassName = 'size-8',
  buttonClassName,
  className,
  showGuestIcon = false,
  showMobileActions = false,
  showListingActionWhenCtaHidden = false,
  showPreferencesAction = false,
}: Props) {
  const router = useRouter()
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { isAuthenticated, isLoading, logout, user } = useAuth()
  const { currency, locale, setCurrency, setLocale } = usePreferences()
  const showPreferences = showMobileActions || showPreferencesAction
  const displayName =
    [user?.name, user?.surname].filter(Boolean).join(' ') || user?.email || (locale === 'th' ? 'ผู้เยี่ยมชม' : 'Guest')

  const handleLogout = async () => {
    await logout()
    router.replace('/login?logout=success')
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
          {showGuestIcon && !isAuthenticated ? (
            <span
              className={`${avatarClassName} grid place-items-center rounded-full bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700`}
            >
              <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.7} />
            </span>
          ) : (
            <Avatar src={avatarImage.src} className={avatarClassName} />
          )}
        </PopoverButton>

        <PopoverPanel
          transition
          anchor={{
            to: 'bottom end',
            gap: 16,
          }}
          className="z-40 max-h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-3xl shadow-lg ring-1 ring-black/5 transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0"
        >
          <div
            className={`relative grid grid-cols-1 bg-white dark:bg-neutral-800 ${
              showPreferences ? 'gap-5 px-5 py-6' : 'gap-6 px-6 py-7'
            }`}
          >
            <div className="flex items-center space-x-3">
              {showMobileActions && !isAuthenticated ? (
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-700">
                  <HugeiconsIcon icon={UserIcon} size={22} strokeWidth={1.7} />
                </span>
              ) : (
                <Avatar src={avatarImage.src} className="size-12" />
              )}

              <div className="grow">
                <h4 className="font-semibold">
                  {isLoading ? (locale === 'th' ? 'กำลังตรวจสอบบัญชี...' : 'Checking account...') : displayName}
                </h4>
                <p className="mt-0.5 text-xs">
                  {isAuthenticated
                    ? user?.email
                    : locale === 'th'
                      ? 'เข้าสู่ระบบเพื่อจัดการบัญชีของคุณ'
                      : 'Sign in to manage your account'}
                </p>
              </div>
            </div>

            <Divider />

            {!isAuthenticated && !isLoading && (
              <>
                <Link
                  href={'/login'}
                  className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                    <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 text-sm font-medium">{locale === 'th' ? 'เข้าสู่ระบบ' : 'Sign in'}</p>
                </Link>

                <Link
                  href={'/signup'}
                  className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                    <HugeiconsIcon icon={Task01Icon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 text-sm font-medium">{locale === 'th' ? 'สร้างบัญชี' : 'Create account'}</p>
                </Link>

                <Divider />
              </>
            )}

            {isAuthenticated && (
              <>
                {/* ------------------ 1 --------------------- */}
                <Link
                  href={'/account'}
                  className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                    <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 text-sm font-medium">{locale === 'th' ? 'บัญชีของฉัน' : 'My Account'}</p>
                </Link>

                {/* ------------------ 2 --------------------- */}
                <Link
                  href={'/add-listing/1'}
                  className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                    <HugeiconsIcon icon={Task01Icon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 text-sm font-medium">{locale === 'th' ? 'ประกาศของฉัน' : 'My Listings'}</p>
                </Link>

                {/* ------------------ 2 --------------------- */}
                <Link
                  href={'/account-savelists'}
                  className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                    <HugeiconsIcon icon={FavouriteIcon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 text-sm font-medium">{locale === 'th' ? 'รายการที่บันทึก' : 'Wishlist'}</p>
                </Link>

                <Divider />
              </>
            )}

            <CloseButton
              as="button"
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="-m-3 flex items-center rounded-lg p-2 text-start transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-emerald-600/30 dark:hover:bg-neutral-700"
            >
              <div className="relative flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <BellIcon className="size-6" />
                <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-neutral-800" />
              </div>
              <div className="ms-4 min-w-0 flex-1">
                <p className="text-sm font-medium">{locale === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {locale === 'th' ? 'มี 3 รายการใหม่' : '3 new updates'}
                </p>
              </div>
              <span className="me-2 grid min-w-6 place-items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                3
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-neutral-400" />
            </CloseButton>

            <Divider />

            {(showMobileActions || showListingActionWhenCtaHidden) && (
              <>
                <Link
                  href="/add-listing/1"
                  className={`-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-orange-50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/40 dark:hover:bg-orange-950/20 ${
                    showListingActionWhenCtaHidden ? 'min-[1100px]:hidden' : ''
                  }`}
                >
                  <div className="flex shrink-0 items-center justify-center text-orange-600 dark:text-orange-300">
                    <HugeiconsIcon icon={Task01Icon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 flex-1 text-sm font-medium">{locale === 'th' ? 'ลงประกาศ' : 'List property'}</p>
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:bg-orange-950/50 dark:text-orange-200">
                    {locale === 'th' ? 'ฟรี' : 'Free'}
                  </span>
                </Link>
              </>
            )}

            {showPreferences && (
              <>
                <CloseButton
                  as="button"
                  type="button"
                  onClick={() => setPreferencesOpen(true)}
                  className="-m-3 flex items-center rounded-lg p-2 text-start transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-emerald-600/30 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-[#176b50] dark:text-emerald-300">
                    <GlobeAltIcon className="size-6" />
                  </div>
                  <div className="ms-4 min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {locale === 'th' ? 'ภาษาและสกุลเงิน' : 'Language and currency'}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {locale === 'th' ? 'ภาษาไทย' : 'English'} · {currency}
                    </p>
                  </div>
                  <ChevronRightIcon className="size-4 shrink-0 text-neutral-400" />
                </CloseButton>

                <Divider />
              </>
            )}

            {/* ------------------ 2 --------------------- */}
            <div className="focus-visible:ring-opacity-50 -m-3 flex items-center justify-between rounded-lg p-2 hover:bg-neutral-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 dark:hover:bg-neutral-700">
              <div className="flex items-center">
                <div className="flex flex-shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                  <HugeiconsIcon icon={Idea01Icon} size={24} strokeWidth={1.5} />
                </div>
                <p className="ms-4 text-sm font-medium">{locale === 'th' ? 'ธีมมืด' : 'Dark theme'}</p>
              </div>
              <SwitchDarkMode2 />
            </div>

            {/* ------------------ 2 --------------------- */}

            <Link
              href={'#'}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={BulbChargingIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">{locale === 'th' ? 'ช่วยเหลือ' : 'Help'}</p>
            </Link>

            {/* ------------------ 2 --------------------- */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="-m-3 flex items-center rounded-lg p-2 text-left transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
              >
                <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                  <HugeiconsIcon icon={Logout01Icon} size={24} strokeWidth={1.5} />
                </div>
                <p className="ms-4 text-sm font-medium">{locale === 'th' ? 'ออกจากระบบ' : 'Log out'}</p>
              </button>
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
                  {locale === 'th' ? 'การแจ้งเตือน' : 'Notifications'}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {locale === 'th' ? 'อัปเดตการค้นหาและประกาศของคุณ' : 'Updates about your searches and listings'}
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

            <div className="divide-y divide-neutral-100 px-3 dark:divide-neutral-800">
              {[
                {
                  title: locale === 'th' ? 'มีประกาศใหม่ตรงกับการค้นหาของคุณ' : 'New listings match your search',
                  detail: locale === 'th' ? 'คอนโดอารีย์ · 5 นาทีที่แล้ว' : 'Ari condos · 5 minutes ago',
                  tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200',
                },
                {
                  title: locale === 'th' ? 'มีผู้สนใจบันทึกประกาศของคุณ' : 'Someone saved your listing',
                  detail: locale === 'th' ? 'ประกาศบ้านเดี่ยว · 2 ชั่วโมงที่แล้ว' : 'Detached house listing · 2 hours ago',
                  tone: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-200',
                },
                {
                  title: locale === 'th' ? 'ระบบตรวจสอบประกาศเรียบร้อยแล้ว' : 'Your listing review is complete',
                  detail: locale === 'th' ? 'พร้อมแสดงผลบน MapxProp' : 'Ready to appear on MapxProp',
                  tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200',
                },
              ].map((notification) => (
                <button
                  key={notification.title}
                  type="button"
                  className="flex w-full gap-3 rounded-2xl px-2 py-4 text-start transition hover:bg-neutral-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#176b50]/25 dark:hover:bg-neutral-800/70"
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full ${notification.tone}`}>
                    <BellIcon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">
                      {notification.detail}
                    </span>
                  </span>
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />
                </button>
              ))}
            </div>

            <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="min-h-11 w-full rounded-full bg-[#124e3c] px-4 text-sm font-semibold text-white transition hover:bg-[#0d3d2f] focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-[#176b50]/30"
              >
                {locale === 'th' ? 'รับทราบ' : 'Done'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {showPreferences && (
        <Dialog open={preferencesOpen} onClose={setPreferencesOpen} className="relative z-[70]">
          <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
          <div className="fixed inset-0 flex items-end justify-center p-2 min-[744px]:items-center">
            <DialogPanel
              transition
              className="hidden-scrollbar max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[28px] bg-white p-5 shadow-2xl transition duration-200 min-[744px]:max-w-[36rem] min-[744px]:p-6 dark:bg-neutral-900 data-closed:translate-y-8 data-closed:opacity-0"
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
                <p className="text-[11px] font-light leading-4 text-neutral-400 dark:text-neutral-500">
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
      )}
    </div>
  )
}
