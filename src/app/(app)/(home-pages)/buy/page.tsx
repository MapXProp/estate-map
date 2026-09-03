import type { Metadata } from 'next'
import PropertyHomePrototype from '../property-home/page'

export const metadata: Metadata = {
  title: 'ซื้อบ้าน คอนโด และที่อยู่อาศัย',
  description: 'ค้นหาบ้าน คอนโด ทาวน์โฮม และที่ดินสำหรับอยู่อาศัยทั่วประเทศไทยบน MapxProp',
}

export default function BuyPage() {
  return <PropertyHomePrototype />
}
