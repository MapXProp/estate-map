'use client'

import Footer2 from '@/components/Footer2'
import { usePathname } from 'next/navigation'
import PropertyFooterPrototype from './PropertyFooterPrototype'

const ListingsFooter = () => {
  const pathname = usePathname()

  if (pathname.startsWith('/real-estate-listings')) {
    return <PropertyFooterPrototype showListingCta={false} />
  }

  return <Footer2 />
}

export default ListingsFooter
