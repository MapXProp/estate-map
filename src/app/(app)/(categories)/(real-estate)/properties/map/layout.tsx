import AvatarDropdown from '@/components/Header/AvatarDropdown'
import PropertyListingCta from '@/components/Header/PropertyListingCta'
import Logo from '@/shared/Logo'
import Link from 'next/link'
import { ReactNode } from 'react'

const Layout = async ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-900">
      <header className="relative z-40 flex h-14 shrink-0 items-center gap-4 border-b border-neutral-100 px-3 sm:px-6 dark:border-neutral-800">
        <Logo className="w-24 shrink-0 sm:w-28" />
        <nav
          aria-label="เมนูหลัก"
          className="ms-4 hidden items-center gap-5 text-xs font-medium text-neutral-500 md:flex"
        >
          <Link href="/homes" className="hover:text-[#176b50]">
            ที่อยู่อาศัย
          </Link>
          <Link href="/business" className="hover:text-[#176b50]">
            พื้นที่ธุรกิจ
          </Link>
          <Link href="/rooms" className="hover:text-[#176b50]">
            ห้องเช่ารายเดือน
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-3">
          <PropertyListingCta />
          <AvatarDropdown
            showGuestIcon
            showMobileActions
            showPreferencesAction
            avatarClassName="size-8"
            buttonClassName="flex size-9 items-center justify-center rounded-full"
          />
        </div>
      </header>
      {children}
      {modal}
    </div>
  )
}

export default Layout
