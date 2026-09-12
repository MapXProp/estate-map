import PropertyLandingPage from '@/components/property-home/PropertyLandingPage'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'บ้าน คอนโด และที่อยู่อาศัย ขาย–เช่าทั่วไทย',
  description:
    'ค้นหาบ้าน คอนโด ทาวน์โฮม ตึกแถว และที่ดินสำหรับอยู่อาศัย พร้อมราคา รูปภาพ ทำเล และแผนที่ จากประกาศขายและให้เช่าทั่วประเทศไทย',
  path: '/homes',
  keywords: ['บ้านขาย', 'บ้านให้เช่า', 'คอนโดขาย', 'คอนโดให้เช่า', 'ทาวน์โฮม', 'ที่ดินสร้างบ้าน', 'อสังหาริมทรัพย์'],
})

export default function HomesPage() {
  return <PropertyLandingPage channel="homes" />
}
