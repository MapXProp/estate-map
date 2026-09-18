import PropertyHomePrototype from '@/app/(app)/(home-pages)/property-home/page'
import JsonLd from '@/components/seo/JsonLd'
import { discoveryPageSeo } from '@/lib/discoveryPageSeo'
import type { PropertyDiscoveryChannel } from '@/lib/propertySearch'
import { getPropertyLandingListings } from '@/lib/publishedProperties'
import { collectionPageStructuredData } from '@/lib/seo'
import PropertyBrowseLinks from './PropertyBrowseLinks'

export default async function PropertyLandingPage({
  channel,
  offerType,
}: {
  channel: PropertyDiscoveryChannel
  offerType?: 'sale' | 'rent'
}) {
  const initialListings = await getPropertyLandingListings(channel, offerType)
  const page = offerType === 'sale' ? discoveryPageSeo.buy : discoveryPageSeo[channel]
  return (
    <>
      <JsonLd data={collectionPageStructuredData(page)} />
      <PropertyHomePrototype
        key={`${channel}:${offerType || 'all'}`}
        initialListings={initialListings}
        offerType={offerType}
      />
      <PropertyBrowseLinks />
    </>
  )
}
