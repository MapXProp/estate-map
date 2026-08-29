'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getAuthApiUrl } from '@/lib/auth'
import ButtonPrimary from '@/shared/ButtonPrimary'
import Input from '@/shared/Input'
import { CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { FormEvent, useState } from 'react'

const ChangePasswordForm = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (newPassword !== confirmPassword) {
      setError(isThai ? 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน' : 'The new passwords do not match.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(getAuthApiUrl('me/password'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(data.error || 'Cannot update password right now')
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage(
        isThai
          ? 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว อุปกรณ์อื่นจะต้องเข้าสู่ระบบใหม่'
          : 'Password changed. Other signed-in devices will need to sign in again.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isThai
            ? 'ยังเปลี่ยนรหัสผ่านไม่ได้ กรุณาลองอีกครั้ง'
            : 'Unable to change your password. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6">
      <div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShieldCheckIcon className="size-6" />
        </span>
        <h1 className="mt-4 font-sarabun text-3xl font-semibold text-neutral-900 dark:text-white">
          {isThai ? 'เปลี่ยนรหัสผ่าน' : 'Change password'}
        </h1>
        <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {isThai
            ? 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร และมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ'
            : 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'}
        </p>
      </div>

      <PasswordField label={isThai ? 'รหัสผ่านปัจจุบัน' : 'Current password'} value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
      <PasswordField label={isThai ? 'รหัสผ่านใหม่' : 'New password'} value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
      <PasswordField label={isThai ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm new password'} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
      {message ? (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 font-sarabun text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircleIcon className="size-5 shrink-0" />
          {message}
        </p>
      ) : null}

      <ButtonPrimary type="submit" disabled={isSaving}>
        {isSaving ? (isThai ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'Updating password...') : isThai ? 'เปลี่ยนรหัสผ่าน' : 'Update password'}
      </ButtonPrimary>
    </form>
  )
}

const PasswordField = ({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) => (
  <label className="block">
    <span className="font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</span>
    <Input
      className="mt-2"
      type="password"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      required
    />
  </label>
)

export default ChangePasswordForm
