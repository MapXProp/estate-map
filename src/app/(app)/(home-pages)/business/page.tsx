import type { Metadata } from 'next'
import PropertyHomePrototype from '../property-home/page'

export const metadata: Metadata = {
  title: 'พื้นที่ทำธุรกิจ ร้านค้า ออฟฟิศ และโกดัง',
  description: 'ค้นหาร้านค้า ล็อกตลาด ออฟฟิศ โกดัง โรงงาน และพื้นที่ออกบูธทั่วประเทศไทยบน MapxProp',
}

export default function BusinessPage() {
  return <PropertyHomePrototype />
}
