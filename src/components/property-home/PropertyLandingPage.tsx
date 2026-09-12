import PropertyHomePrototype from '@/app/(app)/(home-pages)/property-home/page'
import type { PropertyDiscoveryChannel } from '@/lib/propertySearch'
import { getPropertyLandingListings } from '@/lib/publishedProperties'
import PropertyBrowseLinks from './PropertyBrowseLinks'

export default async function PropertyLandingPage({
  channel,
  offerType,
}: {
  channel: PropertyDiscoveryChannel
  offerType?: 'sale' | 'rent'
}) {
  const initialListings = await getPropertyLandingListings(channel, offerType)
  return (
    <>
      <PropertyHomePrototype
        key={`${channel}:${offerType || 'all'}`}
        initialListings={initialListings}
        offerType={offerType}
      />
      <PropertyBrowseLinks />
    </>
  )
}
