import type { Metadata } from 'next'
import PropertyHomePrototype from '../property-home/page'

export const metadata: Metadata = {
  title: 'เช่าบ้าน คอนโด และที่พักรายเดือน',
  description: 'ค้นหาบ้านเช่า คอนโด อพาร์ตเมนต์ ห้องพัก และโรงแรมรายเดือนทั่วประเทศไทยบน MapxProp',
}

export default function RentPage() {
  return <PropertyHomePrototype mode="rooms" />
}
