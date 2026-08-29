import { getRealEstateListingCount } from '@/data/listings'
import { discoveryChannels, propertyTypes } from '@/data/propertyTaxonomy'
import { Metadata } from 'next'
import AboutPageContent from './AboutPageContent'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'About MapXProp and the published property listings on our platform.',
}

const PageAbout = async () => {
  const listingCount = await getRealEstateListingCount()

  return (
    <AboutPageContent
      listingCount={listingCount}
      discoveryChannelCount={discoveryChannels.length}
      propertyTypeCount={propertyTypes.length}
    />
  )
}

export default PageAbout
