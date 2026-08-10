export async function getPropertyMapFilterOptions() {
  return [
    {
      label: 'พื้นที่ที่กำลังมองหา',
      name: 'discoveryChannel',
      tabUIType: 'checkbox',
      options: [
        {
          name: 'บ้านและที่อยู่อาศัย',
          value: 'homes',
          description: 'บ้าน คอนโด ทาวน์โฮม และที่ดินสำหรับอยู่อาศัย',
        },
        {
          name: 'ห้องเช่าและที่พักรายเดือน',
          value: 'rooms',
          description: 'อพาร์ตเมนต์ หอพัก แฟลต และห้องเช่าระยะยาว',
        },
        {
          name: 'พื้นที่ทำธุรกิจ',
          value: 'business',
          description: 'ร้านค้า ล็อคตลาด ออฟฟิศ โกดัง โรงงาน และพื้นที่ออกบูธ',
        },
      ],
    },
    {
      label: 'รูปแบบประกาศ',
      name: 'offerType',
      tabUIType: 'checkbox',
      options: [
        { name: 'ซื้อ', value: 'sale', description: 'ซื้อหรือรับโอนกรรมสิทธิ์' },
        { name: 'เช่า', value: 'rent', description: 'เช่ารายเดือนหรือเช่าระยะยาว' },
        { name: 'เซ้งสิทธิ์', value: 'sublease', description: 'รับช่วงสิทธิ์เช่าพื้นที่เดิม' },
        { name: 'รับโอนกิจการ', value: 'business_transfer', description: 'รับช่วงร้าน อุปกรณ์ หรือกิจการ' },
      ],
    },
    {
      label: 'ประเภทอสังหา',
      name: 'propertyType',
      tabUIType: 'checkbox',
      options: [
        { name: 'บ้าน', value: 'house' },
        { name: 'คอนโด', value: 'condo' },
        { name: 'ทาวน์โฮม', value: 'townhome' },
        { name: 'ตึกแถว', value: 'rowhouse' },
        { name: 'อพาร์ตเมนต์', value: 'apartment' },
        { name: 'หอพัก', value: 'dormitory' },
        { name: 'แฟลต', value: 'flat' },
        { name: 'ห้องเช่ารายเดือน', value: 'monthly_room' },
        { name: 'ที่ดิน', value: 'land' },
        { name: 'ร้านค้า Standalone', value: 'standalone_retail' },
        { name: 'ล็อคในตลาด', value: 'market_stall' },
        { name: 'ล็อคในห้าง / คีออส', value: 'mall_kiosk' },
        { name: 'ออฟฟิศ', value: 'office' },
        { name: 'Co-working space', value: 'coworking' },
        { name: 'โกดัง', value: 'warehouse' },
        { name: 'โรงงาน', value: 'factory' },
        { name: 'พื้นที่งานอีเวนต์ / ออกบูธ', value: 'event_space' },
      ],
    },
    {
      label: 'งบประมาณ',
      name: 'priceRange',
      tabUIType: 'price-range',
      min: 0,
      max: 50_000_000,
      step: 100_000,
      currency: 'THB' as const,
    },
    {
      label: 'ห้อง / ขนาด',
      name: 'roomsAndSize',
      tabUIType: 'select-number',
      options: [
        { name: 'ห้องนอน', max: 10 },
        { name: 'ห้องน้ำ', max: 10 },
        { name: 'ที่จอดรถ', max: 10 },
      ],
    },
    {
      label: 'ลักษณะประกาศ',
      name: 'listingFeatures',
      tabUIType: 'checkbox',
      options: [
        { name: 'เจ้าของลงเอง', value: 'owner_direct' },
        { name: 'ตรวจสอบแล้ว', value: 'verified' },
        { name: 'พร้อมเข้าอยู่', value: 'ready_to_move' },
        { name: 'ประกาศใหม่', value: 'new_listing' },
      ],
    },
    {
      label: 'สิ่งอำนวยความสะดวก',
      name: 'amenities',
      tabUIType: 'checkbox',
      options: [
        { name: 'ที่จอดรถ', value: 'parking' },
        { name: 'เลี้ยงสัตว์ได้', value: 'pets_allowed' },
        { name: 'ใกล้รถไฟฟ้า', value: 'near_transit' },
        { name: 'มีเฟอร์นิเจอร์', value: 'furnished' },
      ],
    },
  ]
}

export type TPropertyMapFilterOptions = Awaited<ReturnType<typeof getPropertyMapFilterOptions>>
