import NotifyDropdown from '@/components/Header/NotifyDropdown'
import PropertyHeaderPrototype from '@/components/Header/PropertyHeaderPrototype'
import Aside from '@/components/aside'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import MobileNavigationPrototype from '@/components/property-home/MobileNavigationPrototype'
import MobilePropertySearch from '@/components/property-home/MobilePropertySearch'
import PropertyFooterPrototype from '@/components/property-home/PropertyFooterPrototype'
import 'rc-slider/assets/index.css'
import { Suspense } from 'react'

export default function Homes2Layout({ children }: { children: React.ReactNode }) {
  return (
    <Aside.Provider>
      <div className="relative z-40 hidden min-[744px]:block">
        <PropertyHeaderPrototype />
      </div>

      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 shadow-[0_4px_18px_rgba(15,23,42,0.055)] backdrop-blur-xl min-[744px]:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="container flex h-16 items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-full bg-neutral-100" />}>
              <MobilePropertySearch />
            </Suspense>
          </div>
          <NotifyDropdown className="mx-0.5 shrink-0" />
        </div>
      </header>

      <div className="pb-[calc(66px+env(safe-area-inset-bottom))] min-[744px]:pb-0">{children}</div>

      <MobileNavigationPrototype />
      <PropertyFooterPrototype />
      <AsideSidebarNavigation />
    </Aside.Provider>
  )
}
