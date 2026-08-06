'use client'

import Header from '@/components/Header/Header'
import PropertyHeaderPrototype from '@/components/Header/PropertyHeaderPrototype'
import { usePathname } from 'next/navigation'

const OtherPagesHeader = () => {
  const pathname = usePathname()

  if (pathname.startsWith('/add-listing')) {
    return <PropertyHeaderPrototype />
  }

  return <Header hasBorderBottom />
}

export default OtherPagesHeader
