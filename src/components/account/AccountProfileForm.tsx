'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { fetchWithAuthRetry, getAuthApiUrl, setStoredUser, type AuthUser } from '@/lib/auth'
import ButtonPrimary from '@/shared/ButtonPrimary'
import Input from '@/shared/Input'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import styles from './AccountDashboard.module.css'

const AccountProfileForm = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const { user, refresh, isAuthenticated } = useAuth()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const pending = useRef(false)
  const dirty = name.trim() !== (user?.name || '') || surname.trim() !== (user?.surname || '')

  useEffect(() => {
    setName(user?.name || '')
    setSurname(user?.surname || '')
  }, [user?.name, user?.surname])

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current || !isAuthenticated || !dirty) return
    pending.current = true
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetchWithAuthRetry(getAuthApiUrl('me'), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), surname: surname.trim() }),
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
      pending.current = false
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={saveProfile} method="post" className="space-y-5">
      <div>
        <h2>{isThai ? 'ข้อมูลบัญชี' : 'Account details'}</h2>
        <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {isThai
            ? 'แก้ไขชื่อและนามสกุล แล้วกดบันทึกเมื่อพร้อม'
            : 'Update your first and last name, then save when ready.'}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {isThai ? 'ชื่อ' : 'First name'}
          </span>
          <Input
            name="given-name"
            autoComplete="given-name"
            className="mt-2"
            fontClass="text-base"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setMessage('')
            }}
            maxLength={120}
            readOnly={isSaving || !isAuthenticated}
          />
        </label>
        <label className="block">
          <span className="font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {isThai ? 'นามสกุล' : 'Last name'}
          </span>
          <Input
            name="family-name"
            autoComplete="family-name"
            className="mt-2"
            fontClass="text-base"
            value={surname}
            onChange={(event) => {
              setSurname(event.target.value)
              setMessage('')
            }}
            maxLength={120}
            readOnly={isSaving || !isAuthenticated}
          />
        </label>
      </div>

      <label className="block">
        <span className="font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {isThai ? 'อีเมลบัญชี' : 'Account email'}
        </span>
        <Input
          className="mt-2 bg-neutral-50 dark:bg-neutral-800"
          fontClass="text-base"
          value={user?.email || ''}
          readOnly
          aria-readonly="true"
        />
        <span className="mt-2 block font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
          {isThai ? 'ต้องการเปลี่ยนอีเมล? ' : 'Need to change your email? '}
          <Link href="/contact" className="underline">
            {isThai ? 'ติดต่อทีมงาน' : 'Contact support'}
          </Link>
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 font-sarabun text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <CheckCircleIcon className="size-5 shrink-0" />
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-700">
        <ButtonPrimary
          type="submit"
          disabled={isSaving || !isAuthenticated || !dirty}
          aria-busy={isSaving}
          className="h-12 w-full bg-[#176b50]! text-white! hover:bg-[#125b44]! sm:w-auto"
        >
          {isSaving ? (isThai ? 'กำลังบันทึก...' : 'Saving...') : isThai ? 'บันทึกข้อมูล' : 'Save details'}
        </ButtonPrimary>
        {dirty ? (
          <button
            type="button"
            disabled={isSaving}
            className={styles.secondaryAction}
            onClick={() => {
              setName(user?.name || '')
              setSurname(user?.surname || '')
              setMessage('')
              setError('')
            }}
          >
            {isThai ? 'ยกเลิกการเปลี่ยนแปลง' : 'Discard changes'}
          </button>
        ) : null}
      </div>
    </form>
  )
}

export default AccountProfileForm
