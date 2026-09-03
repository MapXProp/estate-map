import type { Metadata } from 'next'
import PropertyHomePrototype from '../property-home/page'

export const metadata: Metadata = {
  title: 'บ้านและที่อยู่อาศัย ซื้อหรือเช่า',
  description: 'ค้นหาบ้าน คอนโด ทาวน์โฮม ตึกแถว และที่ดิน ทั้งประกาศขายและให้เช่าทั่วประเทศไทยบน MapxProp',
}

export default function HomesPage() {
  return <PropertyHomePrototype />
}
