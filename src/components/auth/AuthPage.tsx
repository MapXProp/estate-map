'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { safeAuthRedirect, type AuthMode } from '@/lib/authForm'
import { showAuthNotice } from '@/lib/authNotice'
import Logo from '@/shared/Logo'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AuthCard from './AuthCard'
import styles from './AuthCard.module.css'

type AuthPageProps = {
  initialMode: AuthMode
  redirectPath?: string
  providerError?: string
  status?: 'logout' | 'reset'
}

export default function AuthPage({ initialMode, redirectPath, providerError, status }: AuthPageProps) {
  const router = useRouter()
  const { locale } = usePreferences()
  const th = locale === 'th'
  const redirect = safeAuthRedirect(redirectPath)
  const notice =
    status === 'reset'
      ? th
        ? 'ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย'
        : 'Password reset. Sign in with your new password.'
      : status === 'logout'
        ? th
          ? 'ออกจากระบบแล้ว'
          : 'You have signed out.'
        : ''
  const provider = providerError?.split('_')[0]
  const error =
    provider && ['google', 'line', 'facebook'].includes(provider)
      ? th
        ? 'เชื่อมต่อบัญชีไม่สำเร็จ กรุณาลองอีกครั้งหรือเลือกวิธีอื่น'
        : 'Unable to connect your account. Try again or choose another method.'
      : ''

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Preserve callback notices while removing credentials and consumed status flags from the URL.
    let changed = false
    for (const key of ['email', 'password', 'reset', 'logout']) {
      if (params.has(key)) {
        params.delete(key)
        changed = true
      }
    }
    if (changed)
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${params.size ? `?${params}` : ''}${window.location.hash}`
      )
  }, [])

  return (
    <main className={styles.page}>
      <nav className={styles.pageNav} aria-label={th ? 'กลับไปเว็บไซต์' : 'Back to website'}>
        <Logo className="w-28" />
        <Link href="/homes">
          <ArrowLeft size={16} />
          {th ? 'กลับไปสำรวจ' : 'Back to explore'}
        </Link>
      </nav>
      <div className={styles.pageCard}>
        <AuthCard
          key={initialMode}
          initialMode={initialMode}
          redirectPath={redirect}
          headingLevel={1}
          notice={notice}
          initialError={error}
          onModeChange={(mode) =>
            router.push(`/${mode}${redirect !== '/account' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`)
          }
          onAuthenticated={(mode) => {
            showAuthNotice(mode)
            router.push(redirect)
            router.refresh()
          }}
        />
      </div>
    </main>
  )
}
