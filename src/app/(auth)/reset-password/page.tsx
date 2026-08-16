'use client'

import { getAuthApiUrl } from '@/lib/auth'
import AuthLoadingSpinner from '@/components/auth/AuthLoadingSpinner'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Logo from '@/shared/Logo'
import T from '@/utils/getT'
import { CheckCircle, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type PasswordResetResponse = {
  success?: boolean
  error?: string
}

const validatePassword = (password: string) => {
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  return password.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial
}

const Page = () => {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  useEffect(() => {
    const resetPendingState = () => setIsLoading(false)
    window.addEventListener('pageshow', resetPendingState)
    return () => window.removeEventListener('pageshow', resetPendingState)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setError(null)

    if (!token) {
      setError('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว')
      return
    }

    if (!validatePassword(password)) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร รวมตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ')
      return
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(getAuthApiUrl('password-reset/confirm'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = (isJson ? await response.json() : null) as PasswordResetResponse | null

      if (!response.ok) {
        throw new Error(data?.error || `Cannot reset password (${response.status})`)
      }

      setIsComplete(true)
      window.history.replaceState(null, '', window.location.pathname)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถตั้งรหัสผ่านใหม่ได้')
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
            {isComplete ? <CheckCircle className="size-6" aria-hidden="true" /> : <KeyRound className="size-6" aria-hidden="true" />}
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {isComplete ? 'ตั้งรหัสผ่านใหม่เรียบร้อย' : 'ตั้งรหัสผ่านใหม่'}
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
            {isComplete ? 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว' : 'กรอกรหัสผ่านใหม่ที่ปลอดภัยสำหรับบัญชีของคุณ'}
          </p>
        </div>

        {isComplete ? (
          <ButtonPrimary href="/login?reset=success" className="h-12 w-full text-base font-semibold">
            {T['login']['Sign in']}
          </ButtonPrimary>
        ) : (
          <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
            <Field className="block">
              <Label className="text-neutral-800 dark:text-neutral-200">รหัสผ่านใหม่</Label>
              <Input
                type="password"
                name="password"
                autoComplete="new-password"
                className="mt-1.5"
                sizeClass="h-12 px-5 py-3"
                fontClass="text-base font-normal sm:text-[15px]"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Field className="block">
              <Label className="text-neutral-800 dark:text-neutral-200">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                className="mt-1.5"
                sizeClass="h-12 px-5 py-3"
                fontClass="text-base font-normal sm:text-[15px]"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>

            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <ButtonPrimary type="submit" disabled={isLoading} aria-busy={isLoading} className="h-12 text-base font-semibold">
              {isLoading ? <AuthLoadingSpinner /> : null}
              {isLoading ? 'กำลังบันทึก…' : 'ตั้งรหัสผ่านใหม่'}
            </ButtonPrimary>
          </form>
        )}

        <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
          <Link href="/login" className="font-medium underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Page
