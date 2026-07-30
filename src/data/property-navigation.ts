import { Building2, Factory, House, LandPlot, Store, Warehouse } from 'lucide-react'

export const propertyGroups = [
  {
    value: 'residential',
    label: 'ที่อยู่อาศัย',
    description: 'บ้าน คอนโด หอพัก',
    icon: House,
    types: [
      ['detached_house', 'บ้านเดี่ยว'],
      ['semi_detached_house', 'บ้านแฝด'],
      ['townhouse', 'ทาวน์เฮาส์'],
      ['condo', 'คอนโด'],
      ['apartment', 'อพาร์ตเมนต์'],
      ['dormitory', 'หอพัก'],
    ],
  },
  {
    value: 'mixed_use',
    label: 'อยู่และทำธุรกิจ',
    description: 'ตึกแถว โฮมออฟฟิศ',
    icon: Building2,
    types: [
      ['shophouse', 'ตึกแถว / อาคารพาณิชย์'],
      ['home_office', 'โฮมออฟฟิศ'],
    ],
  },
  {
    value: 'commercial',
    label: 'ธุรกิจและอุตสาหกรรม',
    description: 'ร้านค้า ออฟฟิศ โกดัง',
    icon: Warehouse,
    types: [
      ['office', 'สำนักงาน / ออฟฟิศ'],
      ['retail_space', 'พื้นที่ค้าขาย'],
      ['warehouse', 'โกดัง / คลังสินค้า'],
      ['factory', 'โรงงาน'],
    ],
  },
  {
    value: 'land',
    label: 'ที่ดิน',
    description: 'เปล่า หรือพร้อมสิ่งปลูกสร้าง',
    icon: LandPlot,
    types: [['land', 'ที่ดิน']],
  },
] as const

export const propertyUseCases = [
  { value: 'residential', label: 'อยู่อาศัย', description: 'บ้านหรือพื้นที่สำหรับการพักอาศัย', icon: House },
  { value: 'office', label: 'ทำสำนักงาน', description: 'ออฟฟิศและพื้นที่ทำงาน', icon: Building2 },
  { value: 'retail', label: 'เปิดร้านค้า', description: 'ร้าน คีออส หรือล็อกขายของ', icon: Store },
  { value: 'food_service', label: 'ร้านอาหาร / คาเฟ่', description: 'พื้นที่ที่รองรับธุรกิจอาหาร', icon: Store },
  { value: 'storage', label: 'เก็บสินค้า', description: 'โกดังและคลังสินค้า', icon: Warehouse },
  { value: 'industrial', label: 'ผลิตสินค้า', description: 'โรงงานและงานอุตสาหกรรม', icon: Factory },
  { value: 'agriculture', label: 'เกษตรกรรม', description: 'ที่ดินสำหรับทำการเกษตร', icon: LandPlot },
] as const
