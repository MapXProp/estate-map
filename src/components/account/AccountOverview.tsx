'use client'

import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'
import { useAuth } from '@/hooks/useAuth'
import { showAuthNotice } from '@/lib/authNotice'
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Globe2,
  Heart,
  HelpCircle,
  LogOut,
  Map,
  Moon,
  Plus,
  ShieldCheck,
  TrainFront,
  UserRound,
  Users,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import styles from './AccountOverview.module.css'
import AccountPersonalPanel from './AccountPersonalPanel'
import AccountProfileForm from './AccountProfileForm'

export default function AccountOverview() {
  const { user } = useAuth()
  return user ? <AccountPersonalPanel /> : <GuestAccountOverview />
}

function GuestAccountOverview() {
  const { locale, currency, setLocale, setCurrency } = usePreferences()
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const { savedCount, isReady } = useSavedListings()
  const { openAuthModal } = useAuthModal()
  const { resolvedTheme, setTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)
  const th = locale === 'th'
  const say = (thai: string, english: string) => (th ? thai : english)
  const displayName = [user?.name, user?.surname].filter(Boolean).join(' ') || say('สมาชิก MapxProp', 'MapxProp member')
  const signIn = (mode: 'login' | 'signup') => openAuthModal({ mode, redirectPath: '/account' })

  return (
    <div className={styles.overview} data-member={Boolean(user) || undefined}>
      <header className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>YOUR MAPXPROP</span>
          <h1>
            {isAuthenticated
              ? say('พื้นที่ของคุณ', 'Your space')
              : say('เริ่มจากสิ่งที่คุณสนใจ', 'Make yourself at home')}
          </h1>
          <p>{say('ค้นหา เก็บไว้ หรือแบ่งปันพื้นที่ดี ๆ', 'Explore, save a favorite, or share your space.')}</p>
        </div>
        <Image
          src="/images/listing-cta/neighborhood.webp"
          width={280}
          height={210}
          sizes="180px"
          alt=""
          className={styles.heroArt}
        />
      </header>

      <div className={styles.columns}>
        <div className={styles.main}>
          <section className={styles.section} aria-labelledby="explore-title">
            <h2 id="explore-title">{say('กำลังมองหาพื้นที่แบบไหน?', 'What kind of space?')}</h2>
            <div className={styles.explore}>
              {[
                {
                  href: '/homes',
                  image: 'detached-house',
                  title: say('บ้าน / คอนโด', 'Homes'),
                  hint: say('ซื้อหรือเช่า', 'Buy or rent'),
                },
                {
                  href: '/rooms',
                  image: 'rental-room',
                  title: say('ห้องเช่า', 'Rooms'),
                  hint: say('พักรายเดือน', 'Monthly stays'),
                },
                {
                  href: '/business',
                  image: 'retail-space',
                  title: say('พื้นที่ธุรกิจ', 'Business'),
                  hint: say('เริ่มธุรกิจของคุณ', 'Your next venture'),
                },
              ].map((item) => (
                <Link href={item.href} key={item.href} className={styles.category}>
                  <Image
                    src={`/images/property-categories/${item.image}.png`}
                    width={160}
                    height={160}
                    sizes="120px"
                    alt=""
                  />
                  <strong>{item.title}</strong>
                  <span>{item.hint}</span>
                </Link>
              ))}
            </div>
            <div className={styles.quickLinks}>
              <Link href="/properties/map">
                <Map size={19} />
                <span>{say('ค้นหาบนแผนที่', 'Explore the map')}</span>
                <ChevronRight size={16} />
              </Link>
              <Link href="/all-transits">
                <TrainFront size={19} />
                <span>{say('ใกล้สถานีรถไฟฟ้า', 'Near transit stations')}</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </section>

          <Link href="/account-savelists" className={styles.saved}>
            <span className={styles.savedIcon}>
              <Heart size={23} />
            </span>
            <div>
              <h2>
                {say('ที่ที่คุณเก็บไว้', 'Your saved places')}
                {isReady && savedCount > 0 ? <span className={styles.count}>{savedCount}</span> : null}
              </h2>
              <p>
                {isAuthenticated
                  ? say('กลับมาดูประกาศที่สนใจได้ทุกเมื่อ', 'Pick up your search whenever you like.')
                  : say('กดหัวใจ เก็บไว้ดูต่อได้โดยไม่ต้องล็อกอิน', 'Tap a heart to save here. No sign-in needed.')}
              </p>
            </div>
            <ArrowRight size={18} />
          </Link>

          <section className={styles.listingCta}>
            <div>
              <span className={styles.eyebrow}>{say('สำหรับเจ้าของพื้นที่', 'HAVE A SPACE TO SHARE?')}</span>
              <h2>{say('มีพื้นที่ดี ๆ ให้คนได้ค้นพบ', 'Help someone find their next place')}</h2>
              <p>{say('บ้าน ห้องเช่า หรือพื้นที่ธุรกิจของคุณ', 'Your home, room, or business space.')}</p>
              <Link href="/add-listing/1?new=1">
                <Plus size={18} />
                {say('ลงประกาศฟรี', 'Post a free listing')}
                <ArrowRight size={17} />
              </Link>
            </div>
            <Image src="/images/listing-cta/neighborhood.webp" width={180} height={135} sizes="140px" alt="" />
          </section>

          {isAuthenticated ? (
            <section className={`${styles.section} ${styles.toolsSection}`} aria-labelledby="my-tools-title">
              <h2 id="my-tools-title">{say('จัดการพื้นที่ของคุณ', 'Manage your space')}</h2>
              <div className={styles.tools}>
                <Link href="/account-listings">
                  <Building2 size={20} />
                  <span>{say('ประกาศของฉัน', 'My listings')}</span>
                  <ChevronRight size={16} />
                </Link>
                <Link href="/account-organizations">
                  <Users size={20} />
                  <span>{say('องค์กรและทีม', 'Organizations & teams')}</span>
                  <ChevronRight size={16} />
                </Link>
                <Link href="/account-password">
                  <ShieldCheck size={20} />
                  <span>{say('รหัสผ่านและความปลอดภัย', 'Password & security')}</span>
                  <ChevronRight size={16} />
                </Link>
                <Link href="/account-billing">
                  <Building2 size={20} />
                  <span>{say('แพ็กเกจและบิล', 'Plan & billing')}</span>
                  <ChevronRight size={16} />
                </Link>
                {user?.role_code === 'super_admin' ? (
                  <>
                    <Link href="/account-approvals">
                      <ShieldCheck size={20} />
                      <span>{say('อนุมัติประกาศ', 'Listing approvals')}</span>
                      <ChevronRight size={16} />
                    </Link>
                    <Link href="/account-admin">
                      <Users size={20} />
                      <span>{say('จัดการสิทธิ์ผู้ใช้', 'Role management')}</span>
                      <ChevronRight size={16} />
                    </Link>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <aside className={styles.side}>
          <section className={`${styles.section} ${styles.account}`} aria-labelledby="account-title">
            <span className={styles.avatar}>
              <UserRound size={24} />
            </span>
            <div className={styles.accountHeading}>
              <h2 id="account-title">
                {isLoading
                  ? say('กำลังตรวจสอบบัญชี…', 'Checking your account…')
                  : isAuthenticated
                    ? displayName
                    : say('เก็บความสนใจไว้กับคุณ', 'Keep your favorites with you')}
              </h2>
              <p>
                {isAuthenticated
                  ? user?.email
                  : say(
                      'สมัครฟรี เพื่อเก็บรายการข้ามอุปกรณ์และจัดการประกาศ',
                      'Create a free account to sync favorites and manage listings.'
                    )}
              </p>
            </div>
            {!isLoading && !isAuthenticated ? (
              <div className={styles.authActions}>
                <button onClick={() => signIn('signup')}>
                  {say('สมัครสมาชิกฟรี', 'Create free account')}
                  <ArrowRight size={17} />
                </button>
                <button onClick={() => signIn('login')}>
                  {say('มีบัญชีแล้ว · เข้าสู่ระบบ', 'Already a member? Sign in')}
                </button>
              </div>
            ) : null}
            {user ? (
              <div id="profile" className={styles.profile} aria-busy={isLoading}>
                <AccountProfileForm />
              </div>
            ) : null}
          </section>

          <section className={`${styles.section} ${styles.settings}`} aria-labelledby="preferences-title">
            <h2 id="preferences-title">{say('ใช้งานในแบบของคุณ', 'Make it yours')}</h2>
            <div className={styles.preferences}>
              <label>
                <Globe2 size={19} />
                <span>{say('ภาษา', 'Language')}</span>
                <select
                  aria-label={say('ภาษา', 'Language')}
                  value={locale}
                  onChange={(event) => setLocale(event.target.value === 'en' ? 'en' : 'th')}
                >
                  <option value="th">ไทย</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>
                <span className={styles.currencyIcon}>฿</span>
                <span>{say('สกุลเงิน', 'Currency')}</span>
                <select
                  aria-label={say('สกุลเงิน', 'Currency')}
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value === 'USD' ? 'USD' : 'THB')}
                >
                  <option value="THB">THB · ฿</option>
                  <option value="USD">USD · $</option>
                </select>
              </label>
              <button
                role="switch"
                aria-checked={resolvedTheme === 'dark'}
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              >
                <Moon size={19} />
                <span>{say('โหมดมืด', 'Dark mode')}</span>
                <span className={styles.toggle} data-on={resolvedTheme === 'dark'}>
                  <i />
                </span>
              </button>
              <Link href="/contact">
                <HelpCircle size={19} />
                <span>{say('ช่วยเหลือ / ติดต่อเรา', 'Help / Contact us')}</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </section>
          {isAuthenticated ? (
            <button
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
          ) : null}
          {logoutError ? (
            <p role="alert">{say('ออกจากระบบไม่สำเร็จ ลองอีกครั้งได้', 'Could not sign out. Please retry.')}</p>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
