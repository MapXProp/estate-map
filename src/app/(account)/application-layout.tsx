import Footer2 from '@/components/Footer2'
import FooterQuickNavigation from '@/components/FooterQuickNavigation'
import Header from '@/components/Header/Header'
import HeroSearchFormMobile from '@/components/HeroSearchFormMobile/HeroSearchFormMobile'
import Aside from '@/components/aside'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import 'rc-slider/assets/index.css'
import React, { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const ApplicationLayout: React.FC<Props> = ({ children }) => {
  return (
    <Aside.Provider>
      {/* Compact desktop header starts at iPad mini portrait width (744px). */}
      <div className="hidden min-[744px]:block">
        <Header />
      </div>
      {/* Keep the mobile search header for phones only. */}
      <div className="sticky top-0 z-10 container flex h-20 items-center justify-center bg-white min-[744px]:hidden dark:bg-neutral-900">
        <HeroSearchFormMobile />
      </div>
      {/*  */}
      {children}
      {/*  */}
      {/* FooterQuickNavigation - Displays on mobile devices and is fixed at the bottom of the screen */}
      <FooterQuickNavigation />
      {/* Chose footer style here!!!! */}
      <Footer2 /> {/* <Footer /> or <Footer3 /> or <Footer4 />*/}
      {/*  */}
      <AsideSidebarNavigation />
    </Aside.Provider>
  )
}

export { ApplicationLayout }
