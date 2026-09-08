'use client'

import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import {
  acceptOrganizationInvitation,
  getOrganizationInvitation,
  type OrganizationInvitationPreview,
} from '@/lib/organizations'
import { BadgeCheck, Building2, CircleAlert, Mail, RefreshCw } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function OrganizationInvitationPage() {
  const params = useParams<{ token: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const { locale } = usePreferences()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { openAuthModal } = useAuthModal()
  const isThai = locale === 'th'
  const token = typeof params.token === 'string' ? params.token : ''
  const [invitation, setInvitation] = useState<OrganizationInvitationPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    getOrganizationInvitation(token)
      .then(setInvitation)
      .catch((err) => setError(err instanceof Error ? err.message : 'Cannot load invitation'))
      .finally(() => setLoading(false))
  }, [token])

  const acceptWithSession = async () => {
    setAccepting(true)
    setError('')
    try {
      await acceptOrganizationInvitation(token)
      router.push('/account-organizations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const acceptInvitation = () => {
    if (!isAuthenticated) {
      openAuthModal({ mode: 'login', redirectPath: pathname, onAuthenticated: acceptWithSession })
      return
    }
    void acceptWithSession()
  }

  return (
    <main className="min-h-[70vh] bg-neutral-50 px-4 py-16 font-sarabun dark:bg-neutral-950">
      <section className="mx-auto max-w-lg rounded-[28px] border border-neutral-200 bg-white p-7 text-center shadow-sm sm:p-10 dark:border-neutral-800 dark:bg-neutral-900">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-[#176b50] dark:bg-emerald-950/50 dark:text-emerald-300">
          <Building2 className="size-7" />
        </span>
        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-neutral-500">
            <RefreshCw className="size-4 animate-spin" />
            {isThai ? 'กำลังตรวจสอบคำเชิญ...' : 'Checking invitation...'}
          </div>
        ) : invitation ? (
          <>
            <h1 className="mt-6 text-2xl font-semibold text-neutral-950 dark:text-white">
              {isThai ? `เข้าร่วม ${invitation.organization_name}` : `Join ${invitation.organization_name}`}
            </h1>
            <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-left text-sm dark:bg-neutral-800/60">
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-neutral-400" />
                {invitation.email}
              </p>
              <p className="mt-2 flex items-center gap-2">
                <BadgeCheck className="size-4 text-[#176b50]" />
                {isThai ? `สิทธิ์: ${invitation.role_code}` : `Role: ${invitation.role_code}`}
              </p>
            </div>
            {invitation.status === 'pending' ? (
              <button
                type="button"
                onClick={acceptInvitation}
                disabled={accepting || authLoading}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#124e3c] px-6 text-sm font-semibold text-white transition hover:bg-[#0d3d2f] disabled:opacity-60"
              >
                {accepting ? <RefreshCw className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                {isAuthenticated
                  ? isThai
                    ? 'ตอบรับคำเชิญ'
                    : 'Accept invitation'
                  : isThai
                    ? 'เข้าสู่ระบบและตอบรับ'
                    : 'Sign in and accept'}
              </button>
            ) : (
              <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                {isThai ? 'คำเชิญนี้ไม่สามารถใช้งานได้แล้ว' : 'This invitation is no longer available.'}
              </p>
            )}
          </>
        ) : null}
        {error ? (
          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-left text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </section>
    </main>
  )
}
