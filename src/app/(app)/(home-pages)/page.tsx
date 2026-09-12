import { isPropertyZone, PROPERTY_ZONE_COOKIE } from '@/lib/propertyZone'
import { cookies } from 'next/headers'
import { permanentRedirect, redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = await cookies()
  const savedZone = cookieStore.get(PROPERTY_ZONE_COOKIE)?.value

  // Cookie-driven routing stays temporary so a returning visitor can change
  // channels. Reading cookies also keeps this response private and uncached.
  if (isPropertyZone(savedZone) && savedZone !== 'homes') redirect(`/${savedZone}`)

  // The public home page permanently lives at /homes. A temporary redirect
  // here lets Google keep / as its canonical despite /homes' canonical tag.
  permanentRedirect('/homes')
}
