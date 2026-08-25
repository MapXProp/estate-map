'use client'

import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { openAuthModal } = useAuthModal()
  const { isAuthenticated, isLoading, status } = useAuth()
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  useEffect(() => {
    if (status === 'guest') {
      openAuthModal({ mode: 'login', redirectPath: pathname })
    }
  }, [openAuthModal, pathname, status])

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {isThai ? 'กำลังตรวจสอบบัญชี...' : 'Checking account...'}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-md items-center justify-center px-5 py-16">
        <div className="w-full rounded-[28px] border border-neutral-200 bg-white p-7 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e8f3ee] text-[#12634b] dark:bg-emerald-950/50 dark:text-emerald-300">
            <LockClosedIcon className="size-6" />
          </span>
          <h1 className="mt-4 font-sarabun text-lg font-semibold">
            {isThai ? 'เข้าสู่ระบบเพื่อใช้งานส่วนนี้' : 'Sign in to continue'}
          </h1>
          <p className="mt-1.5 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
            {isThai ? 'หน้าปัจจุบันจะยังอยู่เหมือนเดิมหลังเข้าสู่ระบบ' : 'You will return here after signing in.'}
          </p>
          <button
            type="button"
            onClick={() => openAuthModal({ mode: 'login', redirectPath: pathname })}
            className="mt-5 h-11 rounded-full bg-[#124e3c] px-6 font-sarabun text-sm font-semibold text-white transition hover:bg-[#0d3d2f]"
          >
            {isThai ? 'เข้าสู่ระบบ' : 'Sign in'}
          </button>
        </div>
      </div>
    )
  }

  return children
}
