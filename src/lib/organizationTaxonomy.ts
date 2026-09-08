import type { OrganizationSpecialtyCode } from './organizations'

export type OrganizationTypeCode =
  | 'agency'
  | 'developer'
  | 'bank_npa'
  | 'asset_manager'
  | 'property_company'
  | 'corporate'
  | 'team'
  | 'other'

export const organizationTypes: Array<{
  code: OrganizationTypeCode
  nameTh: string
  nameEn: string
}> = [
  { code: 'agency', nameTh: 'บริษัทนายหน้า', nameEn: 'Real estate agency' },
  { code: 'developer', nameTh: 'ผู้พัฒนาอสังหาริมทรัพย์', nameEn: 'Property developer' },
  { code: 'bank_npa', nameTh: 'ธนาคาร / ทรัพย์ NPA', nameEn: 'Bank / NPA' },
  { code: 'asset_manager', nameTh: 'บริษัทบริหารสินทรัพย์', nameEn: 'Asset manager' },
  { code: 'property_company', nameTh: 'บริษัทอสังหาริมทรัพย์', nameEn: 'Property company' },
  { code: 'corporate', nameTh: 'บริษัททั่วไป', nameEn: 'Corporate' },
  { code: 'team', nameTh: 'ทีมงาน', nameEn: 'Team' },
  { code: 'other', nameTh: 'อื่น ๆ', nameEn: 'Other' },
]

export const organizationSpecialties: Array<{
  code: OrganizationSpecialtyCode
  nameTh: string
  nameEn: string
  group: 'transaction' | 'property' | 'market'
}> = [
  { code: 'sale', nameTh: 'ขาย', nameEn: 'For sale', group: 'transaction' },
  { code: 'rent', nameTh: 'ให้เช่า', nameEn: 'For rent', group: 'transaction' },
  { code: 'condo', nameTh: 'คอนโด', nameEn: 'Condominium', group: 'property' },
  { code: 'house', nameTh: 'บ้าน', nameEn: 'House', group: 'property' },
  { code: 'land', nameTh: 'ที่ดิน', nameEn: 'Land', group: 'property' },
  { code: 'commercial', nameTh: 'อสังหาฯ เชิงพาณิชย์', nameEn: 'Commercial', group: 'property' },
  { code: 'warehouse_factory', nameTh: 'โกดังและโรงงาน', nameEn: 'Warehouse & factory', group: 'property' },
  { code: 'hotel_resort', nameTh: 'โรงแรมและรีสอร์ต', nameEn: 'Hotel & resort', group: 'property' },
  { code: 'npa', nameTh: 'ทรัพย์ NPA', nameEn: 'NPA properties', group: 'market' },
  { code: 'beachfront', nameTh: 'ทรัพย์ติดทะเล', nameEn: 'Beachfront', group: 'market' },
  { code: 'investment', nameTh: 'ทรัพย์เพื่อการลงทุน', nameEn: 'Investment', group: 'market' },
]

export const organizationTypeLabel = (code: string, isThai: boolean) => {
  const item = organizationTypes.find((type) => type.code === code)
  return item ? (isThai ? item.nameTh : item.nameEn) : code
}

export const organizationSpecialtyLabel = (code: string, isThai: boolean) => {
  const item = organizationSpecialties.find((specialty) => specialty.code === code)
  return item ? (isThai ? item.nameTh : item.nameEn) : code
}
