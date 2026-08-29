'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  {
    titleTh: 'บัญชีของฉัน',
    titleEn: 'My account',
    href: '/account',
  },
  {
    titleTh: 'ประกาศของฉัน',
    titleEn: 'My listings',
    href: '/account-listings',
  },
  {
    titleTh: 'ประกาศที่บันทึก',
    titleEn: 'Saved listings',
    href: '/account-savelists',
  },
  {
    titleTh: 'รหัสผ่าน',
    titleEn: 'Password',
    href: '/account-password',
  },
  {
    titleTh: 'แพ็กเกจและการชำระเงิน',
    titleEn: 'Plan & billing',
    href: '/account-billing',
  },
]

export const PageNavigation = () => {
  const pathname = usePathname()
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  return (
    <div className="container">
      <div className="hidden-scrollbar flex gap-x-8 overflow-x-auto md:gap-x-14">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`block shrink-0 border-b-2 py-5 capitalize md:py-8 ${
                isActive ? 'border-primary-500 font-medium' : 'border-transparent'
              }`}
            >
              {isThai ? item.titleTh : item.titleEn}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
