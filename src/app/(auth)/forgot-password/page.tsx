'use client'

import { getAuthApiUrl } from '@/lib/auth'
import { showAuthNotice } from '@/lib/authNotice'
import AuthLoadingSpinner from '@/components/auth/AuthLoadingSpinner'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Logo from '@/shared/Logo'
import T from '@/utils/getT'
import { CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type PasswordResetResponse = {
  success?: boolean
  message?: string
  error?: string
}

const Page = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  useEffect(() => {
    const resetPendingState = () => setIsLoading(false)
    window.addEventListener('pageshow', resetPendingState)
    return () => window.removeEventListener('pageshow', resetPendingState)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setError(null)

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail.includes('@')) {
      setError('รูปแบบอีเมลไม่ถูกต้อง')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(getAuthApiUrl('password-reset/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = (isJson ? await response.json() : null) as PasswordResetResponse | null

      if (!response.ok) {
        throw new Error(data?.error || `Cannot send reset link (${response.status})`)
      }

      setIsSent(true)
      showAuthNotice('reset-request')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="mt-16 mb-10 flex justify-center">
        <Logo className="w-32" />
      </div>

      <div className="mx-auto max-w-lg space-y-7">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-neutral-800 dark:text-primary-300">
            <Mail className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">ลืมรหัสผ่าน?</h1>
          <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
            กรอกอีเมลของคุณ แล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
          </p>
        </div>

        {isSent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-950 shadow-sm dark:border-green-800 dark:bg-green-950 dark:text-green-50">
            <div className="flex gap-3">
              <CheckCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว</p>
                <p className="mt-1 text-sm">
                  ถ้ามีบัญชีนี้อยู่ในระบบ กรุณาเช็กกล่องจดหมายของ {email.trim().toLowerCase()} ลิงก์จะหมดอายุใน 30 นาที
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
            <Field className="block">
              <Label className="text-neutral-800 dark:text-neutral-200">{T['login']['Email address']}</Label>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="example@example.com"
                className="mt-1.5"
                sizeClass="h-12 px-5 py-3"
                fontClass="text-base font-normal sm:text-[15px]"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <ButtonPrimary type="submit" disabled={isLoading} aria-busy={isLoading} className="h-12 text-base font-semibold">
              {isLoading ? <AuthLoadingSpinner /> : null}
              {isLoading ? 'กำลังส่ง…' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </ButtonPrimary>
          </form>
        )}

        <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
          <Link href="/login" className="font-medium underline">
            {T['login']['Sign in']}
          </Link>
          {`  หรือ  `}
          <Link href="/signup" className="font-medium underline">
            {T['login']['Create an account']}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Page
