import type { Metadata } from 'next'
import PropertyHomePrototype from '../property-home/page'

export const metadata: Metadata = {
  title: 'ห้องเช่า หอพัก และที่พักรายเดือน',
  description: 'ค้นหาห้องเช่า อพาร์ตเมนต์ หอพัก แฟลต เซอร์วิสอพาร์ตเมนต์ และโรงแรมรายเดือนทั่วประเทศไทยบน MapxProp',
}

export default function RoomsPage() {
  return <PropertyHomePrototype mode="rooms" />
}
