import { Metadata } from 'next'
import { ApplicationLayout } from '../application-layout'
import OtherPagesFooter from './OtherPagesFooter'
import OtherPagesHeader from './OtherPagesHeader'

export const metadata: Metadata = {
  title: {
    default: 'MapxProp',
    template: '%s | MapxProp',
  },
  description: 'บริการและข้อมูลสำหรับผู้ใช้งาน MapxProp',
  robots: { index: false, follow: false },
}

export default function Layout({ children, params }: { children: React.ReactNode; params: any }) {
  return (
    <ApplicationLayout header={<OtherPagesHeader />} footer={<OtherPagesFooter />}>
      {children}
    </ApplicationLayout>
  )
}
