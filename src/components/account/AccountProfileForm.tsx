'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { getAuthApiUrl, setStoredUser, type AuthUser } from '@/lib/auth'
import ButtonPrimary from '@/shared/ButtonPrimary'
import Input from '@/shared/Input'
import { CheckCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

const AccountProfileForm = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const { user, refresh } = useAuth()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setName(user?.name || '')
    setSurname(user?.surname || '')
  }, [user?.name, user?.surname])

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(getAuthApiUrl('me'), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, surname }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string; user?: AuthUser }
      if (!response.ok || !data.user) {
        throw new Error(data.error || 'Cannot update profile right now')
      }
      setStoredUser(data.user)
      await refresh()
      setMessage(isThai ? 'บันทึกข้อมูลบัญชีเรียบร้อยแล้ว' : 'Your account details have been saved.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isThai
            ? 'ยังบันทึกข้อมูลไม่ได้ กรุณาลองอีกครั้ง'
            : 'Unable to save your account details. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <form onSubmit={saveProfile} className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-sarabun text-3xl font-semibold text-neutral-900 dark:text-white">
            {isThai ? 'บัญชีของฉัน' : 'My account'}
          </h1>
          <p className="mt-2 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'จัดการชื่อที่แสดงใน MapXProp ข้อมูลอีเมลจะใช้สำหรับเข้าสู่ระบบและรับการแจ้งเตือน'
              : 'Manage the name shown on MapXProp. Your email is used for sign-in and important notifications.'}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {isThai ? 'ชื่อ' : 'First name'}
            </span>
            <Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
          </label>
          <label className="block">
            <span className="font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {isThai ? 'นามสกุล' : 'Last name'}
            </span>
            <Input className="mt-2" value={surname} onChange={(event) => setSurname(event.target.value)} maxLength={120} />
          </label>
        </div>

        <label className="block">
          <span className="font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">Email</span>
          <Input className="mt-2" value={user?.email || ''} readOnly aria-readonly="true" />
          <span className="mt-2 block font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
            {isThai ? 'หากต้องการเปลี่ยนอีเมล โปรดติดต่อทีมงานเพื่อยืนยันตัวตน' : 'Contact support to change your email securely.'}
          </span>
        </label>

        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
        {message ? (
          <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 font-sarabun text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircleIcon className="size-5 shrink-0" />
            {message}
          </p>
        ) : null}

        <ButtonPrimary type="submit" disabled={isSaving}>
          {isSaving ? (isThai ? 'กำลังบันทึก...' : 'Saving...') : isThai ? 'บันทึกข้อมูล' : 'Save details'}
        </ButtonPrimary>
      </form>

      <aside className="h-fit rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <ClipboardDocumentListIcon className="size-7 text-emerald-700 dark:text-emerald-300" />
        <h2 className="mt-4 font-sarabun text-lg font-semibold text-neutral-900 dark:text-white">
          {isThai ? 'ประกาศของคุณ' : 'Your listings'}
        </h2>
        <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {isThai
            ? 'ติดตามสถานะการตรวจสอบและดูประกาศที่คุณส่งเข้าระบบได้ในที่เดียว'
            : 'Track moderation status and see every listing you have submitted in one place.'}
        </p>
        <Link
          href="/account-listings"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-[#124e3c] px-5 font-sarabun text-sm font-semibold text-white transition hover:bg-[#0d3d2f]"
        >
          {isThai ? 'ดูประกาศของฉัน' : 'View my listings'}
        </Link>
      </aside>
    </div>
  )
}

export default AccountProfileForm
