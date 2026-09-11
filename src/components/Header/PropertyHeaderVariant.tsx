'use client'

import { getPropertyHeaderLayout } from '@/lib/propertyHeaderSearch'
import { useSearchParams } from 'next/navigation'
import PropertyHeaderContent from './PropertyHeaderContent'

export default function PropertyHeaderVariant() {
  const params = useSearchParams()
  return <PropertyHeaderContent layout={getPropertyHeaderLayout(params.get('header_ui'))} />
}
