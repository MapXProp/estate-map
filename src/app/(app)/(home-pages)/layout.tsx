import PropertyHeaderPrototype from '@/components/Header/PropertyHeaderPrototype'
import PropertyFooterPrototype from '@/components/property-home/PropertyFooterPrototype'
import { ApplicationLayout } from '../application-layout'

export default function Layout({ children, params }: { children: React.ReactNode; params: any }) {
  return (
    <ApplicationLayout header={<PropertyHeaderPrototype />} footer={<PropertyFooterPrototype />}>
      {children}
    </ApplicationLayout>
  )
}
