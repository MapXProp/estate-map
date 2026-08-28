import { isPropertyZone, PROPERTY_ZONE_COOKIE } from '@/lib/propertyZone'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = await cookies()
  const savedZone = cookieStore.get(PROPERTY_ZONE_COOKIE)?.value

  // A first-time visitor starts in Homes. Returning visitors go directly to
  // the discovery channel they most recently selected.
  redirect(`/${isPropertyZone(savedZone) ? savedZone : 'homes'}`)
}
