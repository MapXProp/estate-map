import type { PropertySearchListing } from './propertySearch'
import { absoluteUrl } from './seo'

export const CATALOG_PAGE_SIZE = 24
export const CATALOG_PATH = '/real-estate-categories/all'
export type PropertyCatalog = {
  slug: string
  title: string
  label: string
  description: string
  propertyTypes?: string[]
  province?: string
  offerType?: 'sale' | 'rent'
}

export const propertyCatalogs: PropertyCatalog[] = [
  {
    slug: 'for-sale',
    title: 'ประกาศขายอสังหาริมทรัพย์',
    label: 'ประกาศขาย',
    description:
      'เลือกซื้อบ้าน คอนโด ที่ดิน และอาคารสำหรับทำธุรกิจ เปรียบเทียบราคา ขนาดพื้นที่ รูปภาพ และติดต่อผู้ลงประกาศโดยตรง',
    offerType: 'sale',
  },
  {
    slug: 'for-rent',
    title: 'ประกาศให้เช่าอสังหาริมทรัพย์',
    label: 'ประกาศเช่า',
    description:
      'ค้นหาบ้าน ห้องพัก และพื้นที่ธุรกิจให้เช่า ตรวจสอบค่าเช่า ระยะสัญญา ทำเล และช่องทางติดต่อจากแต่ละประกาศ',
    offerType: 'rent',
  },
  {
    slug: 'houses',
    title: 'บ้านเดี่ยว บ้านแฝด และทาวน์โฮม ขายและให้เช่า',
    label: 'บ้านและทาวน์โฮม',
    description:
      'เปรียบเทียบบ้านเดี่ยว บ้านแฝด และทาวน์โฮมจากประกาศจริง ดูจำนวนห้อง ขนาดพื้นที่ ราคา และตำแหน่งบนแผนที่ก่อนนัดชม',
    propertyTypes: ['house', 'detached_house', 'semi_detached_house', 'townhouse'],
  },
  {
    slug: 'land',
    title: 'ที่ดินขายและให้เช่า',
    label: 'ที่ดิน',
    description:
      'ค้นหาที่ดินตามทำเลและราคา ดูขนาดแปลงเป็นตารางวา รูปภาพ และตำแหน่งบนแผนที่ พร้อมสอบถามรายละเอียดจากผู้ลงประกาศ',
    propertyTypes: ['land'],
  },
  {
    slug: 'condos',
    title: 'คอนโดขายและให้เช่า',
    label: 'คอนโด',
    description:
      'ดูประกาศคอนโดพร้อมราคา พื้นที่ใช้สอย ชื่อโครงการ และรูปภาพ เปรียบเทียบทำเลและติดต่อเพื่อนัดชมห้องที่สนใจ',
    propertyTypes: ['condo'],
  },
  {
    slug: 'shophouses',
    title: 'ตึกแถว อาคารพาณิชย์ และโฮมออฟฟิส',
    label: 'อาคารพาณิชย์',
    description:
      'ค้นหาอาคารพาณิชย์และโฮมออฟฟิสสำหรับอยู่อาศัยหรือทำธุรกิจ เปรียบเทียบจำนวนชั้น ขนาดพื้นที่ ราคา และทำเลจากประกาศ',
    propertyTypes: ['shophouse', 'home_office'],
  },
  {
    slug: 'warehouses-factories',
    title: 'โกดังและโรงงาน ขายและให้เช่า',
    label: 'โกดังและโรงงาน',
    description:
      'ดูประกาศโกดังและโรงงาน พร้อมพื้นที่ใช้สอย ขนาดที่ดิน ราคา และตำแหน่งจริงบนแผนที่ เพื่อเลือกพื้นที่ที่เหมาะกับกิจการ',
    propertyTypes: ['warehouse', 'factory'],
  },
  ...[
    ['bangkok', 'กรุงเทพมหานคร'],
    ['chon-buri', 'ชลบุรี'],
    ['chiang-mai', 'เชียงใหม่'],
    ['khon-kaen', 'ขอนแก่น'],
    ['surat-thani', 'สุราษฎร์ธานี'],
    ['phuket', 'ภูเก็ต'],
    ['nonthaburi', 'นนทบุรี'],
    ['chumphon', 'ชุมพร'],
  ].map(([slug, province]) => ({
    slug,
    province,
    label: province,
    title: `อสังหาริมทรัพย์${province} ขายและให้เช่า`,
    description: `รวมประกาศอสังหาริมทรัพย์ใน${province} เลือกดูบ้าน ที่ดิน และพื้นที่ธุรกิจที่มีประกาศจริง พร้อมราคา รูปภาพ ขนาดพื้นที่ และข้อมูลติดต่อในแต่ละทำเล`,
  })),
]

export const getPropertyCatalog = (slug: string) => propertyCatalogs.find((catalog) => catalog.slug === slug)
export const propertyCatalogPath = (catalog: PropertyCatalog) => `/properties/${catalog.slug}`
export const matchesPropertyCatalog = (listing: PropertySearchListing, catalog: PropertyCatalog) =>
  (!catalog.propertyTypes || catalog.propertyTypes.includes(listing.property_type_code)) &&
  (!catalog.province || listing.province === catalog.province) &&
  (!catalog.offerType ||
    (catalog.offerType === 'sale'
      ? listing.offer_type === 'sale' || Boolean(listing.sale_price)
      : ['rent', 'sublease'].includes(listing.offer_type || '') || Boolean(listing.rent_price_monthly)))

export const catalogPageNumber = (value?: string | string[]) => {
  if (value === undefined) return 1
  if (Array.isArray(value) || !/^[1-9]\d*$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) && page <= 10_000 ? page : null
}
export const catalogPagePath = (basePath: string, page: number) => (page === 1 ? basePath : `${basePath}?page=${page}`)
export const catalogStructuredData = (
  title: string,
  pagePath: string,
  listings: PropertySearchListing[],
  offset = 0
) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': absoluteUrl(pagePath),
  url: absoluteUrl(pagePath),
  name: title,
  inLanguage: 'th-TH',
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: listings.length,
    itemListElement: listings.map((listing, index) => ({
      '@type': 'ListItem',
      position: offset + index + 1,
      name: listing.title,
      url: absoluteUrl(`/real-estate-listings/${encodeURIComponent(listing.slug)}`),
    })),
  },
})

export const validModifiedDate = (listing: Pick<PropertySearchListing, 'updated_at' | 'published_at'>) => {
  for (const value of [listing.updated_at, listing.published_at]) {
    if (value && Number.isFinite(Date.parse(value))) return new Date(value)
  }
  return undefined
}
