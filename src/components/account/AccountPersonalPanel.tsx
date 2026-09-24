'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { showAuthNotice } from '@/lib/authNotice'
import { ChevronRight, Globe2, HelpCircle, LogOut, Moon, ShieldCheck } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useState } from 'react'
import styles from './AccountDashboard.module.css'
import AccountProfileForm from './AccountProfileForm'

export default function AccountPersonalPanel() {
  const { locale, currency, setLocale, setCurrency } = usePreferences()
  const { user, logout, isLoading } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)
  const th = locale === 'th'
  const say = (thai: string, english: string) => (th ? thai : english)
  const name = [user?.name, user?.surname].filter(Boolean).join(' ') || say('สมาชิก MapxProp', 'MapxProp member')
  return (
    <div>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>YOUR MAPXPROP</span>
          <h1>{say('ข้อมูลส่วนตัว', 'Personal details')}</h1>
          <p>{say('ดูแลข้อมูลบัญชี และตั้งค่าให้ใช้งานในแบบของคุณ', 'Manage your details and make MapxProp yours.')}</p>
        </div>
      </header>
      <section className={styles.identity} aria-label={say('บัญชีของคุณ', 'Your account')}>
        <span aria-hidden="true">{Array.from(user?.name || 'M')[0]}</span>
        <div>
          <h2 id="account-title">{name}</h2>
          <p>{user?.email}</p>
        </div>
      </section>
      <div className={styles.personalGrid}>
        <section id="profile" className={styles.panel} aria-busy={isLoading}>
          <AccountProfileForm />
        </section>
        <div className={styles.stack}>
          <section className={styles.panel}>
            <h2>{say('ตั้งค่าการใช้งาน', 'Your preferences')}</h2>
            <div className={styles.settingsRows}>
              <label>
                <Globe2 size={18} />
                <span>{say('ภาษา', 'Language')}</span>
                <select value={locale} onChange={(event) => setLocale(event.target.value === 'en' ? 'en' : 'th')}>
                  <option value="th">ไทย</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>
                <span style={{ flex: 'none', width: 18, textAlign: 'center' }}>฿</span>
                <span>{say('สกุลเงิน', 'Currency')}</span>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value === 'USD' ? 'USD' : 'THB')}
                >
                  <option value="THB">THB · ฿</option>
                  <option value="USD">USD · $</option>
                </select>
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={resolvedTheme === 'dark'}
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              >
                <Moon size={18} />
                <span>{say('โหมดมืด', 'Dark mode')}</span>
                <span className={styles.switch} data-on={resolvedTheme === 'dark'}>
                  <i />
                </span>
              </button>
            </div>
          </section>
          <section className={styles.panel}>
            <h2>{say('ดูแลบัญชีของคุณ', 'Account essentials')}</h2>
            <div className={styles.settingsRows}>
              <Link href="/account-password">
                <ShieldCheck size={18} />
                <span>{say('รหัสผ่านและความปลอดภัย', 'Password & security')}</span>
                <ChevronRight size={16} />
              </Link>
              <Link href="/contact">
                <HelpCircle size={18} />
                <span>{say('ติดต่อทีมช่วยเหลือ', 'Contact support')}</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </section>
          <button
            type="button"
            className={styles.logout}
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true)
              setLogoutError(false)
              try {
                await logout()
                showAuthNotice('logout')
              } catch {
                setLogoutError(true)
              } finally {
                setLoggingOut(false)
              }
            }}
          >
            <LogOut size={17} />
            {loggingOut ? say('กำลังออกจากระบบ…', 'Signing out…') : say('ออกจากระบบ', 'Sign out')}
          </button>
          {logoutError ? (
            <p role="alert">{say('ออกจากระบบไม่สำเร็จ ลองอีกครั้งได้', 'Could not sign out. Please retry.')}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
