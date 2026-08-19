import { ApplicationLayout } from '@/app/(app)/application-layout'
import Header3 from '@/components/Header/Header3'
import PropertyFooterPrototype from '@/components/property-home/PropertyFooterPrototype'
import { ReactNode } from 'react'

const Layout = async ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
  return (
    <ApplicationLayout
      header={<Header3 initSearchFormTab="RealEstates" />}
      footer={<PropertyFooterPrototype showListingCta={false} />}
      compactMobileHeader
      stickyDesktopHeader
    >
      {children}
      {modal}
    </ApplicationLayout>
  )
}

export default Layout
