'use client'

import Footer2 from '@/components/Footer2'
import PropertyFooterPrototype from '@/components/property-home/PropertyFooterPrototype'
import { usePathname } from 'next/navigation'

const OtherPagesFooter = () => {
  const pathname = usePathname()

  if (pathname.startsWith('/contact')) {
    return <PropertyFooterPrototype showListingCta={false} />
  }

  return <Footer2 />
}

export default OtherPagesFooter
