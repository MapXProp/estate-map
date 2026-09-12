import PropertyLandingPage from '@/components/property-home/PropertyLandingPage'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'ซื้อบ้าน คอนโด ทาวน์โฮม และที่ดินทั่วไทย',
  description:
    'รวมประกาศขายบ้าน คอนโด ทาวน์โฮม ตึกแถว และที่ดินสำหรับอยู่อาศัย ค้นหาตามทำเล ราคา และแผนที่ทั่วประเทศไทย',
  path: '/buy',
  keywords: ['ซื้อบ้าน', 'บ้านขาย', 'คอนโดขาย', 'ทาวน์โฮมขาย', 'ที่ดินขาย', 'ประกาศขายอสังหาริมทรัพย์'],
})

export default function BuyPage() {
  return <PropertyLandingPage channel="homes" offerType="sale" />
}
