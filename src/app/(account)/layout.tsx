import AccountAccessBoundary from '@/components/account/AccountAccessBoundary'
import PropertyHeaderPrototype from '@/components/Header/PropertyHeaderPrototype'
import PropertyFooterPrototype from '@/components/property-home/PropertyFooterPrototype'
import type { Metadata } from 'next'
import React, { FC } from 'react'
import { ApplicationLayout } from '../(app)/application-layout'
import { PageNavigation } from './PageNavigation'

interface Props {
  children?: React.ReactNode
}

export const metadata: Metadata = {
  title: 'บัญชีผู้ใช้',
  robots: { index: false, follow: false },
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <ApplicationLayout header={<PropertyHeaderPrototype />} footer={<PropertyFooterPrototype showListingCta={false} />}>
      <div className="bg-neutral-50 dark:bg-neutral-900">
        <PageNavigation />
        <div className="container pt-6 pb-10 min-[744px]:pt-10 lg:pb-16">
          <AccountAccessBoundary>{children}</AccountAccessBoundary>
        </div>
      </div>
    </ApplicationLayout>
  )
}

export default Layout
