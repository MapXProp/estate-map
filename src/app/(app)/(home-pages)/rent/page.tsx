import { createPageMetadata } from '@/lib/seo'
import PropertyHomePrototype from '../property-home/page'

export const metadata = createPageMetadata({
  title: 'เช่าบ้าน คอนโด ห้องพัก และที่พักรายเดือน',
  description:
    'รวมประกาศบ้านเช่า คอนโดเช่า อพาร์ตเมนต์ ห้องพัก หอพัก และที่พักรายเดือน ค้นหาตามราคาและทำเลทั่วประเทศไทย',
  path: '/rent',
  keywords: ['เช่าบ้าน', 'บ้านเช่า', 'คอนโดเช่า', 'ห้องพัก', 'อพาร์ตเมนต์', 'หอพัก', 'ที่พักรายเดือน'],
})

export default function RentPage() {
  return <PropertyHomePrototype />
}
