import MapNavigation from '@/components/property-map/MapNavigation'
import { ReactNode } from 'react'

const Layout = async ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
  return (
    <MapNavigation>
      {children}
      {modal}
    </MapNavigation>
  )
}

export default Layout
