// Bump only when the page's copy, links or structured data changes materially.
// Never use the build time as a sitemap modification date.
export const discoveryPageContentUpdatedAt = '2026-09-18'

export const discoveryPageSeo = {
  homes: {
    title: 'บ้าน คอนโด และที่อยู่อาศัย ขาย–เช่าทั่วไทย',
    description:
      'ค้นหาบ้าน คอนโด ทาวน์โฮม ตึกแถว และที่ดินสำหรับอยู่อาศัย พร้อมราคา รูปภาพ ทำเล และแผนที่ จากประกาศขายและให้เช่าทั่วประเทศไทย',
    path: '/homes',
    keywords: ['บ้านขาย', 'บ้านให้เช่า', 'คอนโดขาย', 'คอนโดให้เช่า', 'ทาวน์โฮม', 'ที่ดินสร้างบ้าน', 'อสังหาริมทรัพย์'],
    images: ['/images/channel-heroes/residential-house-daylight.jpg'],
  },
  rooms: {
    title: 'ห้องเช่า อพาร์ตเมนต์ หอพัก และที่พักรายเดือน',
    description:
      'ค้นหาห้องเช่า อพาร์ตเมนต์ หอพัก แฟลต คอนโดเช่า และโรงแรมรายเดือน ดูค่าเช่า รูปภาพ ทำเลและสถานีรถไฟฟ้า พร้อมติดต่อผู้ลงประกาศ',
    path: '/rooms',
    keywords: ['ห้องเช่า', 'หอพัก', 'อพาร์ตเมนต์', 'คอนโดเช่า', 'ที่พักรายเดือน', 'แฟลต', 'โรงแรมรายเดือน'],
    images: ['/images/channel-heroes/monthly-room-daylight.jpg'],
  },
  business: {
    title: 'พื้นที่ธุรกิจ ขายและให้เช่า ร้านค้า ออฟฟิศ โกดัง และบูธ',
    description:
      'ค้นหาร้านค้า ล็อกตลาด ออฟฟิศ โกดัง โรงงาน และพื้นที่ออกบูธ เปรียบเทียบราคา ขนาดพื้นที่ ทำเล และเงื่อนไขการใช้งานจากประกาศ',
    path: '/business',
    keywords: [
      'พื้นที่ให้เช่า',
      'ร้านค้าให้เช่า',
      'ล็อกตลาด',
      'ออฟฟิศให้เช่า',
      'โกดังให้เช่า',
      'โรงงานให้เช่า',
      'พื้นที่ออกบูธ',
    ],
    images: ['/images/business-hero/cafe-interior.jpg'],
  },
  buy: {
    title: 'ซื้อบ้าน คอนโด ทาวน์โฮม และที่ดินทั่วไทย',
    description:
      'รวมประกาศขายบ้าน คอนโด ทาวน์โฮม ตึกแถว และที่ดินสำหรับอยู่อาศัย ค้นหาตามทำเล ราคา และแผนที่ทั่วประเทศไทย',
    path: '/buy',
    keywords: ['ซื้อบ้าน', 'บ้านขาย', 'คอนโดขาย', 'ทาวน์โฮมขาย', 'ที่ดินขาย', 'ประกาศขายอสังหาริมทรัพย์'],
    images: ['/images/channel-heroes/residential-house-daylight.jpg'],
  },
}

// /rent shows the same monthly-rental inventory as /rooms. Keep the existing
// entry usable, but consolidate search indexing and sitemap links on /rooms.
export const rentalEntrySeo = {
  ...discoveryPageSeo.rooms,
  title: 'ค้นหาห้องเช่า คอนโดเช่า และที่พักรายเดือน',
}
