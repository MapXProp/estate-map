'use client'

import { getAuthApiUrl } from '@/lib/auth'
import ButtonPrimary from '@/shared/ButtonPrimary'
import Logo from '@/shared/Logo'
import { CheckCircle, MailCheck, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type VerifyEmailResponse = {
  success?: boolean
  error?: string
}

type VerifyStatus = 'loading' | 'success' | 'error'

const Page = () => {
  const [status, setStatus] = useState<VerifyStatus>('loading')
  const [message, setMessage] = useState('กำลังยืนยันอีเมลของคุณ...')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = new URLSearchParams(window.location.search).get('token') || ''
      if (!token) {
        setStatus('error')
        setMessage('ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว')
        return
      }

      try {
        const response = await fetch(getAuthApiUrl('email-verification/confirm'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const isJson = response.headers.get('content-type')?.includes('application/json')
        const data = (isJson ? await response.json() : null) as VerifyEmailResponse | null

        if (!response.ok) {
          throw new Error(data?.error || `Cannot verify email (${response.status})`)
        }

        setStatus('success')
        setMessage('ยืนยันอีเมลเรียบร้อยแล้ว บัญชีของคุณพร้อมใช้งาน')
        window.history.replaceState(null, '', window.location.pathname)
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'ไม่สามารถยืนยันอีเมลได้')
      }
    }

    void verifyEmail()
  }, [])

  const isSuccess = status === 'success'
  const isLoading = status === 'loading'

  return (
    <div className="container">
      <div className="mt-16 mb-10 flex justify-center">
        <Logo className="w-32" />
      </div>

      <div className="mx-auto max-w-lg space-y-7 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-neutral-800 dark:text-primary-300">
          {isLoading ? (
            <MailCheck className="size-7 animate-pulse" aria-hidden="true" />
          ) : isSuccess ? (
            <CheckCircle className="size-7 text-green-600" aria-hidden="true" />
          ) : (
            <XCircle className="size-7 text-red-500" aria-hidden="true" />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {isLoading ? 'กำลังยืนยันอีเมล' : isSuccess ? 'ยืนยันอีเมลสำเร็จ' : 'ยืนยันอีเมลไม่สำเร็จ'}
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">{message}</p>
        </div>

        <div className="grid gap-3">
          <ButtonPrimary href="/account" className="h-12 text-base font-semibold">
            ไปที่บัญชีของฉัน
          </ButtonPrimary>
          <Link href="/login" className="text-sm font-medium text-neutral-700 underline dark:text-neutral-300">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Page
