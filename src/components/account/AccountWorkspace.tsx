'use client'

import { PageNavigation } from '@/app/(account)/PageNavigation'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'
import styles from './AccountDashboard.module.css'

export default function AccountWorkspace({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return (
    <div className={styles.workspace} data-member={Boolean(user)}>
      <PageNavigation />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
