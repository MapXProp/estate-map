import Footer2 from '@/components/Footer2'
import FooterQuickNavigation from '@/components/FooterQuickNavigation'
import AvatarDropdown from '@/components/Header/AvatarDropdown'
import Header from '@/components/Header/Header'
import HeroSearchFormMobile from '@/components/HeroSearchFormMobile/HeroSearchFormMobile'
import Aside from '@/components/aside'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import 'rc-slider/assets/index.css'
import React, { ReactNode, Suspense } from 'react'

interface Props {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  compactMobileHeader?: boolean
  stickyDesktopHeader?: boolean
}

const ApplicationLayout: React.FC<Props> = ({
  children,
  header,
  footer,
  compactMobileHeader = false,
  stickyDesktopHeader = false,
}) => {
  return (
    <Aside.Provider>
      {/* Compact desktop header starts at iPad mini portrait width (744px). */}
      <div className={`${stickyDesktopHeader ? 'sticky top-0' : 'relative'} z-40 hidden min-[744px]:block`}>
        {header ? header : <Header />}
      </div>
      {/* Keep the mobile search header for phones only. */}
      <div className="sticky top-0 z-20 bg-white shadow-xs min-[744px]:hidden dark:bg-neutral-900">
        <div className={`container flex items-center ${compactMobileHeader ? 'h-14 gap-2 px-3' : 'h-16 gap-2.5'}`}>
          <div className="min-w-0 flex-1">
            <Suspense
              fallback={<div className="h-12 w-full animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />}
            >
              <HeroSearchFormMobile compactMapHeader={compactMobileHeader} />
            </Suspense>
          </div>
          <AvatarDropdown
            className="shrink-0"
            avatarClassName={`${compactMobileHeader ? 'size-8' : 'size-9'} shadow-[0_2px_8px_rgba(15,23,42,0.10)]`}
            buttonClassName={`flex cursor-pointer items-center justify-center rounded-full transition active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#176b50]/25 ${compactMobileHeader ? 'size-9' : 'size-10'}`}
            showGuestIcon
            showMobileActions
          />
        </div>
      </div>
      {/*  */}
      {children}
      {/*  */}
      {/* FooterQuickNavigation - Displays on mobile devices and is fixed at the bottom of the screen */}
      <FooterQuickNavigation />
      {/* Chose footer style here!!!! */}
      {footer ? footer : <Footer2 />}
      {/*  */}
      <AsideSidebarNavigation />
    </Aside.Provider>
  )
}

export { ApplicationLayout }
