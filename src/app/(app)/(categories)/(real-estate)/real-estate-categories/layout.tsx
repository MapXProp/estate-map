import { ApplicationLayout } from '@/app/(app)/application-layout'
import PropertyHeaderPrototype from '@/components/Header/PropertyHeaderPrototype'
import PropertyFooterPrototype from '@/components/property-home/PropertyFooterPrototype'
import { ReactNode } from 'react'

const Layout = ({ children }: { children: ReactNode }) => (
  <ApplicationLayout header={<PropertyHeaderPrototype />} footer={<PropertyFooterPrototype />}>
    {children}
  </ApplicationLayout>
)

export default Layout
