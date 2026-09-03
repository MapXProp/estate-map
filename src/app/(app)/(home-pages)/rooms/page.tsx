import { createPageMetadata } from '@/lib/seo'
import PropertyHomePrototype from '../property-home/page'

export const metadata = createPageMetadata({
  title: 'ห้องเช่า อพาร์ตเมนต์ หอพัก และที่พักรายเดือน',
  description:
    'ค้นหาห้องเช่า อพาร์ตเมนต์ หอพัก แฟลต คอนโดเช่า เซอร์วิสอพาร์ตเมนต์ และโรงแรมรายเดือน เปรียบเทียบราคาและทำเลทั่วไทย',
  path: '/rooms',
  keywords: ['ห้องเช่า', 'หอพัก', 'อพาร์ตเมนต์', 'คอนโดเช่า', 'ที่พักรายเดือน', 'แฟลต', 'เซอร์วิสอพาร์ตเมนต์'],
})

export default function RoomsPage() {
  return <PropertyHomePrototype />
}
