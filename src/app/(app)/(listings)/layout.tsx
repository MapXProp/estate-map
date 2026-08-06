import SectionOurFeatures from '@/components/SectionOurFeatures'
import featuresImg from '@/images/our-features-2.png'
import { ReactNode } from 'react'
import { ApplicationLayout } from '../application-layout'
import ListingsHeader from './ListingsHeader'

const Layout = async ({ children }: { children: ReactNode }) => {
  return (
    <ApplicationLayout header={<ListingsHeader />}>
      <div>
        <div className="container">
          {children}
          <SectionOurFeatures rightImg={featuresImg} type="type2" className="py-24 lg:py-32" />
        </div>
      </div>
    </ApplicationLayout>
  )
}

export default Layout
