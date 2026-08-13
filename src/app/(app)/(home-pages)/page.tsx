import PropertyHomePrototype from './property-home/page'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isPropertyZone, PROPERTY_ZONE_COOKIE } from '@/lib/propertyZone'
import PropertyZonePreferenceRedirect from '@/components/preferences/PropertyZonePreferenceRedirect'

export default async function HomePage() {
  const cookieStore = await cookies()
  const preferredZone = cookieStore.get(PROPERTY_ZONE_COOKIE)?.value

  if (isPropertyZone(preferredZone)) redirect(`/${preferredZone}`)

  return (
    <>
      <PropertyZonePreferenceRedirect />
      <PropertyHomePrototype mode="all" />
    </>
  )
}
