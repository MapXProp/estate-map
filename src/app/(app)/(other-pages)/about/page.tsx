import JsonLd from '@/components/seo/JsonLd'
import { getRealEstateListingCount } from '@/data/listings'
import { discoveryChannels, propertyTypes } from '@/data/propertyTaxonomy'
import { absoluteUrl, createPageMetadata } from '@/lib/seo'
import AboutPageContent from './AboutPageContent'

const pageInfo = {
  title: 'เกี่ยวกับ MapxProp แพลตฟอร์มค้นหาอสังหาริมทรัพย์',
  description:
    'รู้จัก MapxProp แพลตฟอร์มค้นหาบ้าน ห้องเช่า ที่ดิน และพื้นที่ธุรกิจที่เชื่อมข้อมูลประกาศกับทำเลบนแผนที่ เพื่อช่วยให้ค้นหาได้ง่ายขึ้น',
  path: '/about',
  keywords: ['เกี่ยวกับ MapxProp', 'แพลตฟอร์มอสังหาริมทรัพย์', 'ค้นหาอสังหาริมทรัพย์บนแผนที่'],
}
export const metadata = createPageMetadata(pageInfo)

const PageAbout = async () => {
  const listingCount = await getRealEstateListingCount()

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          '@id': absoluteUrl('/about#webpage'),
          url: absoluteUrl(pageInfo.path),
          name: pageInfo.title,
          description: pageInfo.description,
          inLanguage: 'th-TH',
          isPartOf: { '@id': absoluteUrl('/#website') },
          mainEntity: { '@id': absoluteUrl('/#organization') },
        }}
      />
      <AboutPageContent
        listingCount={listingCount}
        discoveryChannelCount={discoveryChannels.length}
        propertyTypeCount={propertyTypes.length}
      />
    </>
  )
}

export default PageAbout
