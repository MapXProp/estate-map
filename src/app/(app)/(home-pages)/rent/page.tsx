import PropertyLandingPage from '@/components/property-home/PropertyLandingPage'
import { rentalEntrySeo } from '@/lib/discoveryPageSeo'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata(rentalEntrySeo)

export default function Page() {
  return <PropertyLandingPage channel="rooms" offerType="rent" />
}
