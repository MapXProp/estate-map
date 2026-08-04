export async function getPropertyMapFilterOptions() {
  return [
    {
      label: 'ซื้อ / เช่า',
      name: 'transactionType',
      tabUIType: 'checkbox',
      options: [
        {
          name: 'ซื้อ',
          value: 'buy',
          description: 'บ้าน คอนโด ที่ดิน และอสังหาสำหรับซื้อ',
          defaultChecked: true,
        },
        {
          name: 'เช่า',
          value: 'rent',
          description: 'บ้านเช่า คอนโด อพาร์ตเมนต์ และหอพัก',
        },
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
        { name: 'ที่ดิน', value: 'land' },
        { name: 'ร้านค้า / พื้นที่ขายของ', value: 'retail' },
        { name: 'ออฟฟิศ', value: 'office' },
        { name: 'โกดัง / โรงงาน', value: 'warehouse_factory' },
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
