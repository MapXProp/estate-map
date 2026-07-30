import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ค้นหาอสังหาริมทรัพย์สำหรับชีวิตและธุรกิจ',
  description:
    'ค้นหาบ้าน คอนโด ตึกแถว พื้นที่ค้าขาย สำนักงาน โกดัง โรงงาน และที่ดินทั่วประเทศไทย ตามทำเล ประเภท การใช้งาน และงบประมาณ',
}

export default function PropertyHomeLayout({ children }: { children: React.ReactNode }) {
  return children
}
