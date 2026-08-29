'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  {
    titleTh: 'ข้อมูลส่วนตัว',
    titleEn: 'Personal details',
    href: '/account',
  },
  {
    titleTh: 'ทรัพย์ของฉัน',
    titleEn: 'My properties',
    href: '/account-listings',
  },
  {
    titleTh: 'ที่บันทึกไว้',
    titleEn: 'Saved',
    href: '/account-savelists',
  },
  {
    titleTh: 'ความปลอดภัย',
    titleEn: 'Security',
    href: '/account-password',
  },
  {
    titleTh: 'แพ็กเกจและบิล',
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
