'use client'

import RequireAuth from '@/components/auth/RequireAuth'
import { isPublicAccountPage } from '@/lib/propertyNavigation'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export default function AccountAccessBoundary({ children }: { children: ReactNode }) {
  return isPublicAccountPage(usePathname()) ? children : <RequireAuth>{children}</RequireAuth>
}
