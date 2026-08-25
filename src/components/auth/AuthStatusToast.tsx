'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { AUTH_NOTICE_EVENT, isAuthNoticeAction, type AuthNoticeAction } from '@/lib/authNotice'
import SuccessToast from '@/shared/SuccessToast'
import { useEffect, useState } from 'react'

const messages = {
  th: {
    login: 'เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับ',
    signup: 'ลงทะเบียนสำเร็จ บัญชีของคุณพร้อมใช้งานแล้ว',
    logout: 'ออกจากระบบเรียบร้อยแล้ว',
    'reset-request': 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลแล้ว',
    'reset-password': 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว',
    'verify-email': 'ยืนยันอีเมลสำเร็จ บัญชีของคุณพร้อมใช้งานแล้ว',
  },
  en: {
    login: 'Signed in successfully. Welcome back.',
    signup: 'Account created successfully. You are ready to continue.',
    logout: 'You have signed out successfully.',
    'reset-request': 'A password reset link has been sent to your email.',
    'reset-password': 'Your password has been reset successfully.',
    'verify-email': 'Email verified successfully. Your account is ready to use.',
  },
} satisfies Record<'th' | 'en', Record<AuthNoticeAction, string>>

type Notice = {
  id: number
  action: AuthNoticeAction
}

export default function AuthStatusToast() {
  const { locale } = usePreferences()
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    const showNotice = (action: AuthNoticeAction) => {
      setNotice({ id: Date.now(), action })
    }

    const handleNotice = (event: Event) => {
      const action = (event as CustomEvent<AuthNoticeAction>).detail
      if (isAuthNoticeAction(action)) showNotice(action)
    }

    window.addEventListener(AUTH_NOTICE_EVENT, handleNotice)

    const url = new URL(window.location.href)
    if (url.searchParams.get('auth') === 'success') {
      const action = url.searchParams.get('auth_action')
      if (isAuthNoticeAction(action)) showNotice(action)
      url.searchParams.delete('auth')
      url.searchParams.delete('auth_action')
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    }

    return () => window.removeEventListener(AUTH_NOTICE_EVENT, handleNotice)
  }, [])

  if (!notice) return null

  return <SuccessToast key={notice.id} message={messages[locale][notice.action]} duration={4200} />
}
