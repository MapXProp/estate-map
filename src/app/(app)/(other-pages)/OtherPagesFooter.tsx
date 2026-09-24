'use client'

import Footer2 from '@/components/Footer2'
import PropertyFooterPrototype from '@/components/property-home/PropertyFooterPrototype'
import { isBlogPath } from '@/lib/propertyNavigation'
import { usePathname } from 'next/navigation'

const OtherPagesFooter = () => {
  const pathname = usePathname()

  if (pathname.startsWith('/about')) {
    return <PropertyFooterPrototype />
  }

  if (pathname.startsWith('/contact') || isBlogPath(pathname)) {
    return <PropertyFooterPrototype showListingCta={false} />
  }

  return <Footer2 />
}

export default OtherPagesFooter
