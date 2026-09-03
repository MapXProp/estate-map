import { getRealEstateListingCount } from '@/data/listings'
import { discoveryChannels, propertyTypes } from '@/data/propertyTaxonomy'
import { createPageMetadata } from '@/lib/seo'
import AboutPageContent from './AboutPageContent'

export const metadata = createPageMetadata({
  title: 'เกี่ยวกับ MapxProp แพลตฟอร์มค้นหาอสังหาริมทรัพย์',
  description:
    'รู้จัก MapxProp แพลตฟอร์มค้นหาบ้าน ห้องเช่า ที่ดิน และพื้นที่ธุรกิจที่เชื่อมข้อมูลประกาศกับทำเลบนแผนที่ เพื่อช่วยให้ค้นหาได้ง่ายขึ้น',
  path: '/about',
  keywords: ['เกี่ยวกับ MapxProp', 'แพลตฟอร์มอสังหาริมทรัพย์', 'ค้นหาอสังหาริมทรัพย์บนแผนที่'],
})

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
