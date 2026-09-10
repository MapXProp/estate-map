'use client'

import AvatarDropdown from '@/components/Header/AvatarDropdown'
import PropertyListingCta from '@/components/Header/PropertyListingCta'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import Logo from '@/shared/Logo'
import { CloseButton, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ChevronDown, Menu, X } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function MapNavigationToggle() {
  const { locale } = usePreferences()
  return (
    <PopoverButton
      data-map-navigation-toggle
      className="flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-600 transition hover:border-[#a7c8b6] hover:bg-[#f1f7f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] sm:px-3 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      aria-label={locale === 'th' ? 'เปิดเมนูหลัก' : 'Open main menu'}
    >
      <Menu className="size-4" />
      <span className="hidden sm:inline">{locale === 'th' ? 'เมนู' : 'Menu'}</span>
      <ChevronDown className="hidden size-3 sm:block" />
    </PopoverButton>
  )
}

export default function MapNavigation({ children }: { children: ReactNode }) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  return (
    <Popover as="div" className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-900">
      <PopoverPanel
        focus
        transition
        aria-label={th ? 'เมนูหลัก' : 'Main navigation'}
        className="fixed inset-x-0 top-0 z-40 border-b border-[#dbe7df] bg-white shadow-[0_10px_30px_rgba(18,63,50,0.14)] transition-[top,opacity] duration-200 ease-out motion-reduce:transition-none dark:border-neutral-700 dark:bg-neutral-900 data-closed:-top-16 data-closed:opacity-0"
      >
        <header className="flex h-14 items-center gap-2 px-3 sm:gap-4 sm:px-6">
          <Logo className="w-20 shrink-0 sm:w-28" />
          <nav
            aria-label={th ? 'สำรวจอสังหาริมทรัพย์' : 'Explore properties'}
            className="ms-4 hidden items-center gap-5 text-xs font-medium text-neutral-500 md:flex"
          >
            <Link href="/homes" className="hover:text-[#176b50]">
              {th ? 'ที่อยู่อาศัย' : 'Homes'}
            </Link>
            <Link href="/rooms" className="hover:text-[#176b50]">
              {th ? 'ห้องเช่ารายเดือน' : 'Monthly stays'}
            </Link>
            <Link href="/business" className="hover:text-[#176b50]">
              {th ? 'ธุรกิจ' : 'Business'}
            </Link>
          </nav>
          <div className="ms-auto flex items-center gap-2 sm:gap-3">
            <PropertyListingCta
              label={th ? 'ลงประกาศ' : 'List property'}
              freeLabel={th ? 'ฟรี' : 'Free'}
              className="max-sm:min-h-9 max-sm:ps-3 max-sm:pe-3 [&>span:last-child]:max-sm:hidden"
            />
            <AvatarDropdown
              showGuestIcon
              showMobileActions
              showPreferencesAction
              avatarClassName="size-8"
              buttonClassName="flex size-9 items-center justify-center rounded-full"
            />
            <CloseButton
              aria-label={th ? 'ซ่อนเมนูหลัก' : 'Hide main menu'}
              className="grid size-10 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-[#176b50] dark:hover:bg-neutral-800"
            >
              <X className="size-4" />
            </CloseButton>
          </div>
        </header>
      </PopoverPanel>
      {children}
    </Popover>
  )
}
