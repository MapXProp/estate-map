import TransitDirectory from '@/components/transit/TransitDirectory'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'สายรถไฟฟ้าและสถานีทั้งหมด ค้นหาอสังหาฯ ใกล้รถไฟฟ้า',
  description:
    'เลือกสาย BTS, MRT, Airport Rail Link และรถไฟฟ้าสายสีแดง ค้นหาสถานีด้วยชื่อหรือรหัส พร้อมดูประกาศขายและให้เช่ารอบสถานีบนแผนที่',
  path: '/all-transits',
  keywords: ['อสังหาใกล้รถไฟฟ้า', 'สถานีรถไฟฟ้า', 'คอนโดใกล้ BTS', 'คอนโดใกล้ MRT', 'รถไฟฟ้าสายสีแดง'],
})

export default function AllTransitsPage() {
  return <TransitDirectory />
}
