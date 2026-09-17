import ListingsFooter from '@/components/property-home/ListingsFooter'
import { ReactNode } from 'react'
import { ApplicationLayout } from '../application-layout'
import ListingsHeader from './ListingsHeader'
import styles from './ListingsLayout.module.css'

const Layout = async ({ children }: { children: ReactNode }) => {
  return (
    <ApplicationLayout header={<ListingsHeader />} footer={<ListingsFooter />}>
      <div className={styles.canvas}>
        <div className="container">{children}</div>
      </div>
    </ApplicationLayout>
  )
}

export default Layout
