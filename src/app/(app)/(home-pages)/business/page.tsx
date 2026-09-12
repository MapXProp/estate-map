import PropertyLandingPage from '@/components/property-home/PropertyLandingPage'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'พื้นที่ธุรกิจ ขายและให้เช่า ร้านค้า ออฟฟิศ โกดัง และบูธ',
  description:
    'ค้นหาร้านค้า ล็อกตลาด ออฟฟิศ โกดัง โรงงาน พื้นที่ค้าขาย และพื้นที่ออกบูธ พร้อมราคา เงื่อนไข ทำเล และแผนที่ทั่วประเทศไทย',
  path: '/business',
  keywords: [
    'พื้นที่ให้เช่า',
    'ร้านค้าให้เช่า',
    'ล็อกตลาด',
    'ออฟฟิศให้เช่า',
    'โกดังให้เช่า',
    'โรงงานให้เช่า',
    'พื้นที่ออกบูธ',
  ],
})

export default function BusinessPage() {
  return <PropertyLandingPage channel="business" />
}
