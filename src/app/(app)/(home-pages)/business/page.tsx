import PropertyLandingPage from '@/components/property-home/PropertyLandingPage'
import { discoveryPageSeo } from '@/lib/discoveryPageSeo'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata(discoveryPageSeo.business)

export default function Page() {
  return <PropertyLandingPage channel="business" />
}
