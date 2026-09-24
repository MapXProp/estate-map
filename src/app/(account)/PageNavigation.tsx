'use client'

import styles from '@/components/account/AccountDashboard.module.css'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  Building,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Heart,
  ShieldCheck,
  UserCog,
  UserRound,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const primary = [
  { th: 'ข้อมูลส่วนตัว', en: 'Personal details', href: '/account', icon: UserRound },
  { th: 'ประกาศของฉัน', en: 'My listings', href: '/account-listings', icon: Building2 },
  { th: 'ประกาศที่บันทึกไว้', en: 'Saved listings', href: '/account-savelists', icon: Heart },
  { th: 'แพ็กเกจและการชำระเงิน', en: 'Plan & billing', href: '/account-billing', icon: CreditCard },
]
const settings = [
  { th: 'องค์กรและทีม', en: 'Organizations & teams', href: '/account-organizations', icon: Building },
  { th: 'ความปลอดภัย', en: 'Security', href: '/account-password', icon: ShieldCheck },
]
const admin = [
  { th: 'อนุมัติประกาศ', en: 'Listing approvals', href: '/account-approvals', icon: ClipboardCheck },
  { th: 'จัดการสิทธิ์', en: 'Role management', href: '/account-admin', icon: UserCog },
]

export const PageNavigation = () => {
  const pathname = usePathname()
  const { user } = useAuth()
  return user ? <AccountNavigation key={pathname} pathname={pathname} /> : null
}

function AccountNavigation({ pathname }: { pathname: string }) {
  const { locale } = usePreferences()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const th = locale === 'th'
  const groups = [
    { title: th ? 'พื้นที่ของฉัน' : 'My space', items: primary },
    { title: th ? 'การตั้งค่า' : 'Settings', items: settings },
    ...(user?.role_code === 'super_admin' ? [{ title: th ? 'สำหรับผู้ดูแล' : 'Administration', items: admin }] : []),
  ]
  const active = [...primary, ...settings, ...admin].find((item) => item.href === pathname)
  const CurrentIcon = active?.icon || UserRound
  const label = active ? (th ? active.th : active.en) : th ? 'บัญชีของฉัน' : 'My account'
  const links = (mobile = false) =>
    groups.map((group, index) => (
      <section key={group.title} className={styles.navGroup}>
        <h2>{group.title}</h2>
        <div className={mobile && index === 0 ? styles.mobileNavGrid : undefined}>
          {group.items.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={styles.navLink}
              onClick={() => setOpen(false)}
            >
              <span className={styles.navIcon}>
                <item.icon size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span>{th ? item.th : item.en}</span>
              {pathname === item.href ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <ChevronRight size={15} aria-hidden="true" />
              )}
            </Link>
          ))}
        </div>
      </section>
    ))
  return (
    <>
      <aside className={styles.sidebar}>
        <Link href="/account" className={styles.sidebarIdentity}>
          <span>{Array.from(user?.name || 'M')[0]}</span>
          <div>
            <strong>{user?.name || (th ? 'สมาชิก MapxProp' : 'MapxProp member')}</strong>
            <small>{th ? 'บัญชีของฉัน' : 'My account'}</small>
          </div>
        </Link>
        <nav aria-label={th ? 'เมนูบัญชี' : 'Account navigation'}>{links()}</nav>
      </aside>
      <button
        type="button"
        data-account-menu-trigger
        className={styles.mobileNavTrigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className={styles.navIcon}>
          <CurrentIcon size={20} aria-hidden="true" />
        </span>
        <span>
          <small>{th ? 'บัญชีของฉัน' : 'My account'}</small>
          <strong>{label}</strong>
        </span>
        <span className={styles.changePage}>{th ? 'เปลี่ยนหน้า' : 'Switch'}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-[100]">
        <DialogBackdrop className="fixed inset-0 bg-neutral-950/35 backdrop-blur-xs" />
        <div className={styles.menuPosition}>
          <DialogPanel className={styles.menuPanel}>
            <header>
              <DialogTitle>{th ? 'บัญชีของฉัน' : 'My account'}</DialogTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={th ? 'ปิดเมนูบัญชี' : 'Close account menu'}
              >
                <X size={20} />
              </button>
            </header>
            <nav aria-label={th ? 'เลือกหน้าบัญชี' : 'Choose account page'}>{links(true)}</nav>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
