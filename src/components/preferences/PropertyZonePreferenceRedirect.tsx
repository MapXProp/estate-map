'use client'

import { isPropertyZone, PROPERTY_ZONE_STORAGE_KEY } from '@/lib/propertyZone'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const PropertyZonePreferenceRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    const storedZone = window.localStorage.getItem(PROPERTY_ZONE_STORAGE_KEY)
    if (isPropertyZone(storedZone)) router.replace(`/${storedZone}`)
  }, [router])

  return null
}

export default PropertyZonePreferenceRedirect
