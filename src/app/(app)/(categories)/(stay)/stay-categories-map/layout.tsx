import { ApplicationLayout } from '@/app/(app)/application-layout'
import Header3 from '@/components/Header/Header3'
import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = { robots: { index: false, follow: true } }

const Layout = async ({ children }: { children: ReactNode }) => {
  return <ApplicationLayout header={<Header3 initSearchFormTab="Stays" />}>{children}</ApplicationLayout>
}

export default Layout
