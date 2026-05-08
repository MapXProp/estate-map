'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, status } = useAuth()

  useEffect(() => {
    if (status === 'guest') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [pathname, router, status])

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">Checking account...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}
