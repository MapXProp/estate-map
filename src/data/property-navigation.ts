import { Building2, Factory, House, LandPlot, Store, Warehouse } from 'lucide-react'

export const propertyGroups = [
  {
    value: 'residential',
    label: 'ที่อยู่อาศัย',
    labelEn: 'Residential',
    description: 'บ้าน คอนโด หอพัก',
    descriptionEn: 'Houses, condos and dorms',
    icon: House,
    types: [
      ['detached_house', 'บ้านเดี่ยว', 'Detached house'],
      ['semi_detached_house', 'บ้านแฝด', 'Semi-detached house'],
      ['townhouse', 'ทาวน์เฮาส์', 'Townhouse'],
      ['condo', 'คอนโด', 'Condo'],
      ['apartment', 'อพาร์ตเมนต์', 'Apartment'],
      ['dormitory', 'หอพัก', 'Dormitory'],
    ],
  },
  {
    value: 'mixed_use',
    label: 'อยู่และทำธุรกิจ',
    labelEn: 'Live + work',
    description: 'ตึกแถว โฮมออฟฟิศ',
    descriptionEn: 'Shophouses and home offices',
    icon: Building2,
    types: [
      ['shophouse', 'ตึกแถว / อาคารพาณิชย์', 'Shophouse / commercial building'],
      ['home_office', 'โฮมออฟฟิศ', 'Home office'],
    ],
  },
  {
    value: 'commercial',
    label: 'ธุรกิจและอุตสาหกรรม',
    labelEn: 'Business + industrial',
    description: 'ร้านค้า ออฟฟิศ โกดัง',
    descriptionEn: 'Retail, offices and warehouses',
    icon: Warehouse,
    types: [
      ['office', 'สำนักงาน / ออฟฟิศ', 'Office'],
      ['retail_space', 'พื้นที่ค้าขาย', 'Retail space'],
      ['warehouse', 'โกดัง / คลังสินค้า', 'Warehouse'],
      ['factory', 'โรงงาน', 'Factory'],
    ],
  },
  {
    value: 'land',
    label: 'ที่ดิน',
    labelEn: 'Land',
    description: 'เปล่า หรือพร้อมสิ่งปลูกสร้าง',
    descriptionEn: 'Vacant or with buildings',
    icon: LandPlot,
    types: [['land', 'ที่ดิน', 'Land']],
  },
] as const

export const propertyUseCases = [
  { value: 'residential', label: 'อยู่อาศัย', labelEn: 'Living', description: 'บ้านหรือพื้นที่สำหรับการพักอาศัย', descriptionEn: 'Homes and residential spaces', icon: House },
  { value: 'office', label: 'ทำสำนักงาน', labelEn: 'Office', description: 'ออฟฟิศและพื้นที่ทำงาน', descriptionEn: 'Offices and workspaces', icon: Building2 },
  { value: 'retail', label: 'เปิดร้านค้า', labelEn: 'Retail', description: 'ร้าน คีออส หรือล็อกขายของ', descriptionEn: 'Shops, kiosks and retail units', icon: Store },
  { value: 'food_service', label: 'ร้านอาหาร / คาเฟ่', labelEn: 'Food + café', description: 'พื้นที่ที่รองรับธุรกิจอาหาร', descriptionEn: 'Spaces suitable for food businesses', icon: Store },
  { value: 'storage', label: 'เก็บสินค้า', labelEn: 'Storage', description: 'โกดังและคลังสินค้า', descriptionEn: 'Warehouses and storage spaces', icon: Warehouse },
  { value: 'industrial', label: 'ผลิตสินค้า', labelEn: 'Manufacturing', description: 'โรงงานและงานอุตสาหกรรม', descriptionEn: 'Factories and industrial work', icon: Factory },
  { value: 'agriculture', label: 'เกษตรกรรม', labelEn: 'Agriculture', description: 'ที่ดินสำหรับทำการเกษตร', descriptionEn: 'Land for agricultural use', icon: LandPlot },
] as const
