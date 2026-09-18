import JsonLd from '@/components/seo/JsonLd'
import TransitDirectory from '@/components/transit/TransitDirectory'
import { collectionPageStructuredData, createPageMetadata } from '@/lib/seo'
import { transitLineCatalog, transitStations } from '@/lib/transitStations'

const page = {
  title: 'รวมสถานีรถไฟฟ้า BTS MRT และสายอื่น ๆ กรุงเทพฯ–ปริมณฑล',
  description: `รวม ${transitLineCatalog.length} สาย ${transitStations.length} สถานีรถไฟฟ้าในกรุงเทพฯ และปริมณฑล ค้นหา BTS, MRT, Airport Rail Link และสายสีแดง พร้อมพิกัดและประกาศขาย–เช่ารอบสถานี`,
  path: '/all-transits',
  keywords: ['อสังหาใกล้รถไฟฟ้า', 'สถานีรถไฟฟ้า', 'คอนโดใกล้ BTS', 'คอนโดใกล้ MRT', 'รถไฟฟ้าสายสีแดง'],
}

export const metadata = createPageMetadata(page)

export default function AllTransitsPage() {
  return (
    <>
      <JsonLd
        data={collectionPageStructuredData(
          page,
          transitLineCatalog.map((line) => ({
            name: `${line.system} ${line.nameTh}`,
            path: `/all-transits#line-${line.id}`,
          })),
          [
            { name: 'หน้าแรก', path: '/homes' },
            { name: 'อสังหาฯ ใกล้รถไฟฟ้า', path: page.path },
          ]
        )}
      />
      <TransitDirectory />
    </>
  )
}
