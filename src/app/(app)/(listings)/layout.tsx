import ListingsFooter from '@/components/property-home/ListingsFooter'
import { ReactNode } from 'react'
import { ApplicationLayout } from '../application-layout'
import ListingsHeader from './ListingsHeader'

const Layout = async ({ children }: { children: ReactNode }) => {
  return (
    <ApplicationLayout header={<ListingsHeader />} footer={<ListingsFooter />}>
      <div>
        <div className="container">{children}</div>
      </div>
    </ApplicationLayout>
  )
}

export default Layout
