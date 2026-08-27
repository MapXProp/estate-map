/**
 * Archive index for the original real-estate UI-kit mock listings.
 *
 * The complete frozen records remain available through
 * `getArchivedMockRealEstateListings` in `src/data/listings.ts` for design and
 * regression testing. Nothing in the public application imports this index.
 */
export const legacyPropertyMockArchive = [
  'best-western-cedars-hotel',
  'bell-by-greene-king-inns',
  'half-moon-sherborne-by-marstons-inns',
  'white-horse-hotel-by-greene-king-inns',
  'ship-and-castle-hotel',
  'the-windmill-family-and-commercial-hotel',
  'unicorn-gunthorpe-by-marstons-inns',
  'holiday-inn-express-ramsgate-minster-an-ihg-hotel',
] as const

/**
 * Homepage showcase cards removed from the public experience on 2026-08-27.
 * Kept as a compact design reference only; these are not published inventory.
 */
export const legacyPropertyHomeCardArchive = [
  { id: 1, type: 'บ้านเดี่ยว', title: 'บ้านโมเดิร์น พร้อมสวนส่วนตัว ใกล้เมือง' },
  { id: 2, type: 'คอนโด', title: 'คอนโดแต่งครบ เดิน 4 นาทีถึง BTS อารีย์' },
  { id: 3, type: 'อาคารพาณิชย์', title: 'ตึกแถวริมถนนใหญ่ ชั้นล่างเปิดร้านได้' },
  { id: 4, type: 'สำนักงาน', title: 'สำนักงานพร้อมใช้ ใจกลางย่านธุรกิจ' },
  { id: 5, type: 'หอพัก', title: 'หอพักใกล้มหาวิทยาลัย มีห้องว่างหลายแบบ' },
  { id: 6, type: 'โกดัง', title: 'โกดังเพดานสูง รถสิบล้อเข้าได้ตลอดวัน' },
  { id: 7, type: 'ที่ดิน', title: 'ที่ดินถมแล้ว วิวเขา เหมาะสร้างบ้านหรือรีสอร์ต' },
  { id: 8, type: 'โฮมออฟฟิศ', title: 'โฮมออฟฟิศ 3 ชั้น แยกพื้นที่งานและที่พัก' },
] as const
