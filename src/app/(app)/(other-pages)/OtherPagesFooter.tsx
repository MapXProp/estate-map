'use client'

import Footer2 from '@/components/Footer2'
import PropertyFooterPrototype from '@/components/property-home/PropertyFooterPrototype'
import { isBlogPath } from '@/lib/propertyNavigation'
import { isPublicInformationPath } from '@/lib/publicInformationPages'
import { usePathname } from 'next/navigation'

const OtherPagesFooter = () => {
  const pathname = usePathname()

  if (pathname.startsWith('/about')) {
    return <PropertyFooterPrototype />
  }

  if (pathname.startsWith('/contact') || isBlogPath(pathname) || isPublicInformationPath(pathname)) {
    return <PropertyFooterPrototype showListingCta={false} />
  }

  return <Footer2 />
}

export default OtherPagesFooter
