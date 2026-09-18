'use client'

import Header from '@/components/Header/Header'
import PropertyHeaderPrototype from '@/components/Header/PropertyHeaderPrototype'
import { isOrganizationPath } from '@/lib/propertyNavigation'
import { usePathname } from 'next/navigation'

const ListingsHeader = () => {
  const pathname = usePathname()

  if (pathname.startsWith('/real-estate-listings') || isOrganizationPath(pathname)) {
    return <PropertyHeaderPrototype />
  }

  return <Header hasBorderBottom={false} />
}

export default ListingsHeader
