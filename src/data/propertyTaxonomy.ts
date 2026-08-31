export type PropertyGroupCode = 'residential' | 'mixed_use' | 'commercial' | 'land'

export type PropertyTypeCode =
  | 'detached_house'
  | 'semi_detached_house'
  | 'townhouse'
  | 'condo'
  | 'apartment'
  | 'dormitory'
  | 'rental_room'
  | 'flat'
  | 'serviced_apartment'
  | 'monthly_hotel'
  | 'shophouse'
  | 'home_office'
  | 'office'
  | 'retail_space'
  | 'warehouse'
  | 'factory'
  | 'hotel_resort'
  | 'land'

export type UseCaseCode =
  | 'residential'
  | 'office'
  | 'retail'
  | 'food_service'
  | 'storage'
  | 'industrial'
  | 'hospitality'
  | 'agriculture'

export type ListingScopeCode = 'single_unit' | 'whole_property' | 'multi_unit' | 'land_plot' | 'space_slot'
export type OfferTypeCode = 'sale' | 'rent' | 'sublease' | 'business_transfer' | 'event_booking'
export type DiscoveryChannelCode = 'homes' | 'rooms' | 'business'
export type AccommodationModelCode = 'standard' | 'serviced'

export type TaxonomyOption<TCode extends string> = {
  code: TCode
  nameTh: string
  nameEn: string
  description: string
}

export type PropertyTypeDefinition = TaxonomyOption<PropertyTypeCode> & {
  groupCode: PropertyGroupCode
  aliases: string[]
  allowedUseCases: UseCaseCode[]
  defaultUseCases: UseCaseCode[]
  allowedScopes: ListingScopeCode[]
  defaultScope: ListingScopeCode
  allowedOffers: OfferTypeCode[]
  supportsBusinessSpaceType?: boolean
}

export type DiscoveryChannelDefinition = TaxonomyOption<DiscoveryChannelCode> & {
  route: `/${DiscoveryChannelCode}`
  propertyTypeCodes: PropertyTypeCode[]
  defaultPropertyTypeCode: PropertyTypeCode
}

export const discoveryChannels: DiscoveryChannelDefinition[] = [
  {
    code: 'homes',
    route: '/homes',
    nameTh: 'บ้าน คอนโด & ที่อยู่อาศัย',
    nameEn: 'Homes & residential',
    description: 'บ้าน คอนโด ทาวน์โฮม ตึกแถว และที่ดิน',
    propertyTypeCodes: [
      'detached_house',
      'semi_detached_house',
      'townhouse',
      'condo',
      'shophouse',
      'home_office',
      'land',
    ],
    defaultPropertyTypeCode: 'detached_house',
  },
  {
    code: 'rooms',
    route: '/rooms',
    nameTh: 'ห้องเช่า & ที่พักรายเดือน',
    nameEn: 'Rooms & monthly stays',
    description: 'ห้องแบ่งเช่า อพาร์ตเมนต์ แฟลต หอพัก คอนโด และที่พักระยะยาว',
    propertyTypeCodes: ['rental_room', 'apartment', 'flat', 'dormitory', 'condo', 'monthly_hotel'],
    defaultPropertyTypeCode: 'rental_room',
  },
  {
    code: 'business',
    route: '/business',
    nameTh: 'พื้นที่ทำธุรกิจ',
    nameEn: 'Business spaces',
    description: 'ตึกแถว ร้านค้า ออฟฟิศ โกดัง โรงงาน โรงแรม และที่ดิน',
    propertyTypeCodes: [
      'shophouse',
      'home_office',
      'office',
      'retail_space',
      'warehouse',
      'factory',
      'hotel_resort',
      'land',
    ],
    defaultPropertyTypeCode: 'retail_space',
  },
]

export const propertyGroups: TaxonomyOption<PropertyGroupCode>[] = [
  {
    code: 'residential',
    nameTh: 'ที่อยู่อาศัย',
    nameEn: 'Residential',
    description: 'บ้าน คอนโด ทาวน์เฮาส์ อพาร์ตเมนต์ และหอพัก',
  },
  {
    code: 'mixed_use',
    nameTh: 'อยู่อาศัยและทำธุรกิจ',
    nameEn: 'Mixed use',
    description: 'ตึกแถว อาคารพาณิชย์ และโฮมออฟฟิศ',
  },
  {
    code: 'commercial',
    nameTh: 'พื้นที่ธุรกิจ',
    nameEn: 'Commercial',
    description: 'สำนักงาน ร้านค้า โกดัง และโรงงาน',
  },
  {
    code: 'land',
    nameTh: 'ที่ดิน',
    nameEn: 'Land',
    description: 'ที่ดินเปล่าหรือที่ดินพร้อมสิ่งปลูกสร้าง',
  },
]

const commonPropertyOffers: OfferTypeCode[] = ['sale', 'rent', 'sublease']

export const propertyTypes: PropertyTypeDefinition[] = [
  {
    code: 'detached_house',
    groupCode: 'residential',
    nameTh: 'บ้านเดี่ยว',
    nameEn: 'Detached house',
    description: 'บ้านที่ไม่ใช้ผนังร่วมกับหลังข้างเคียง',
    aliases: ['house', 'single_house'],
    allowedUseCases: ['residential', 'office'],
    defaultUseCases: ['residential'],
    allowedScopes: ['whole_property'],
    defaultScope: 'whole_property',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'semi_detached_house',
    groupCode: 'residential',
    nameTh: 'บ้านแฝด',
    nameEn: 'Semi-detached house',
    description: 'บ้านสองหลังที่มีผนังหรือส่วนโครงสร้างเชื่อมกัน',
    aliases: ['twin_house', 'duplex_house'],
    allowedUseCases: ['residential', 'office'],
    defaultUseCases: ['residential'],
    allowedScopes: ['whole_property'],
    defaultScope: 'whole_property',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'townhouse',
    groupCode: 'residential',
    nameTh: 'ทาวน์เฮาส์ / ทาวน์โฮม',
    nameEn: 'Townhouse',
    description: 'บ้านแถวที่ใช้ผนังร่วมกับยูนิตข้างเคียง',
    aliases: ['townhome'],
    allowedUseCases: ['residential', 'office', 'retail'],
    defaultUseCases: ['residential'],
    allowedScopes: ['whole_property'],
    defaultScope: 'whole_property',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'condo',
    groupCode: 'residential',
    nameTh: 'คอนโด',
    nameEn: 'Condominium',
    description: 'ห้องชุดในอาคารที่มีกรรมสิทธิ์แยกเป็นยูนิต',
    aliases: ['condominium'],
    allowedUseCases: ['residential'],
    defaultUseCases: ['residential'],
    allowedScopes: ['single_unit'],
    defaultScope: 'single_unit',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'apartment',
    groupCode: 'residential',
    nameTh: 'อพาร์ตเมนต์',
    nameEn: 'Apartment',
    description: 'อาคารที่เจ้าของเดียวบริหารห้องเช่า รวมชื่อแบบ Court, Residence หรือ Mansion',
    aliases: ['apartment_building', 'court', 'residence', 'mansion', 'serviced_apartment', 'service_apartment'],
    allowedUseCases: ['residential'],
    defaultUseCases: ['residential'],
    allowedScopes: ['single_unit', 'multi_unit', 'whole_property'],
    defaultScope: 'single_unit',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'dormitory',
    groupCode: 'residential',
    nameTh: 'หอพัก',
    nameEn: 'Dormitory',
    description: 'หอพักนักเรียน นักศึกษา หรือคนทำงาน',
    aliases: ['student_accommodation', 'dorm'],
    allowedUseCases: ['residential'],
    defaultUseCases: ['residential'],
    allowedScopes: ['single_unit', 'multi_unit', 'whole_property'],
    defaultScope: 'multi_unit',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'rental_room',
    groupCode: 'residential',
    nameTh: 'ห้องแบ่งเช่า',
    nameEn: 'Room in a house or building',
    description: 'ห้องที่แบ่งให้เช่าภายในบ้าน ตึกแถว หรืออาคารทั่วไป และอาจใช้พื้นที่บางส่วนร่วมกัน',
    aliases: ['monthly_room', 'room_for_rent', 'shared_room', 'room_in_house'],
    allowedUseCases: ['residential'],
    defaultUseCases: ['residential'],
    allowedScopes: ['single_unit', 'multi_unit'],
    defaultScope: 'single_unit',
    allowedOffers: ['rent'],
  },
  {
    code: 'flat',
    groupCode: 'residential',
    nameTh: 'แฟลต',
    nameEn: 'Flat',
    description: 'อาคารพักอาศัยแบบแฟลต เช่น แฟลตดินแดง แฟลตการเคหะ หรือแฟลตของหน่วยงาน',
    aliases: ['housing_flat', 'public_housing_flat'],
    allowedUseCases: ['residential'],
    defaultUseCases: ['residential'],
    allowedScopes: ['single_unit', 'multi_unit'],
    defaultScope: 'single_unit',
    allowedOffers: ['rent'],
  },
  {
    code: 'serviced_apartment',
    groupCode: 'residential',
    nameTh: 'เซอร์วิสอพาร์ตเมนต์',
    nameEn: 'Serviced apartment',
    description: 'ที่พักรายเดือนพร้อมบริการส่วนกลาง',
    aliases: ['service_apartment', 'long_stay_apartment'],
    allowedUseCases: ['residential', 'hospitality'],
    defaultUseCases: ['residential', 'hospitality'],
    allowedScopes: ['single_unit', 'multi_unit'],
    defaultScope: 'single_unit',
    allowedOffers: ['rent'],
  },
  {
    code: 'monthly_hotel',
    groupCode: 'residential',
    nameTh: 'โรงแรมรายเดือน',
    nameEn: 'Monthly hotel',
    description: 'ห้องพักโรงแรมที่เปิดให้เช่าระยะยาวหรือรายเดือน',
    aliases: ['long_stay_hotel', 'hotel_monthly'],
    allowedUseCases: ['residential', 'hospitality'],
    defaultUseCases: ['hospitality'],
    allowedScopes: ['single_unit', 'multi_unit'],
    defaultScope: 'single_unit',
    allowedOffers: ['rent'],
  },
  {
    code: 'shophouse',
    groupCode: 'mixed_use',
    nameTh: 'ตึกแถว / อาคารพาณิชย์',
    nameEn: 'Shophouse',
    description: 'อาคารแถวที่ใช้พักอาศัยและประกอบธุรกิจได้',
    aliases: ['commercial_building', 'row_building'],
    allowedUseCases: ['residential', 'office', 'retail', 'food_service', 'storage'],
    defaultUseCases: ['residential', 'retail'],
    allowedScopes: ['whole_property'],
    defaultScope: 'whole_property',
    allowedOffers: [...commonPropertyOffers, 'business_transfer'],
  },
  {
    code: 'home_office',
    groupCode: 'mixed_use',
    nameTh: 'โฮมออฟฟิศ',
    nameEn: 'Home office',
    description: 'อาคารที่ออกแบบให้พักอาศัยและทำสำนักงาน',
    aliases: [],
    allowedUseCases: ['residential', 'office', 'retail'],
    defaultUseCases: ['residential', 'office'],
    allowedScopes: ['whole_property'],
    defaultScope: 'whole_property',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'office',
    groupCode: 'commercial',
    nameTh: 'สำนักงาน / ออฟฟิศ',
    nameEn: 'Office',
    description: 'ยูนิตสำนักงาน ชั้นสำนักงาน หรืออาคารสำนักงาน',
    aliases: ['office_unit'],
    allowedUseCases: ['office'],
    defaultUseCases: ['office'],
    allowedScopes: ['single_unit', 'whole_property'],
    defaultScope: 'single_unit',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'retail_space',
    groupCode: 'commercial',
    nameTh: 'พื้นที่ค้าขาย',
    nameEn: 'Retail space',
    description: 'ร้านค้า ล็อก คีออส เคาน์เตอร์ หรือพื้นที่ขายสินค้า',
    aliases: ['shop_space', 'kiosk', 'stall'],
    allowedUseCases: ['retail', 'food_service'],
    defaultUseCases: ['retail'],
    allowedScopes: ['space_slot', 'single_unit', 'whole_property'],
    defaultScope: 'space_slot',
    allowedOffers: ['rent', 'sublease', 'business_transfer', 'event_booking'],
    supportsBusinessSpaceType: true,
  },
  {
    code: 'warehouse',
    groupCode: 'commercial',
    nameTh: 'โกดัง / คลังสินค้า',
    nameEn: 'Warehouse',
    description: 'อาคารสำหรับเก็บสินค้าและงานโลจิสติกส์',
    aliases: ['storage_building'],
    allowedUseCases: ['storage', 'industrial'],
    defaultUseCases: ['storage'],
    allowedScopes: ['whole_property'],
    defaultScope: 'whole_property',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'factory',
    groupCode: 'commercial',
    nameTh: 'โรงงาน',
    nameEn: 'Factory',
    description: 'อาคารสำหรับการผลิตหรือกิจกรรมอุตสาหกรรม',
    aliases: ['industrial_building'],
    allowedUseCases: ['industrial', 'storage'],
    defaultUseCases: ['industrial'],
    allowedScopes: ['whole_property'],
    defaultScope: 'whole_property',
    allowedOffers: commonPropertyOffers,
  },
  {
    code: 'hotel_resort',
    groupCode: 'commercial',
    nameTh: 'โรงแรม / รีสอร์ต / กิจการที่พัก',
    nameEn: 'Hotel / resort property',
    description: 'ขายหรือให้เช่าทั้งอาคารและกิจการที่พัก ไม่ใช่การปล่อยห้องรายเดือน',
    aliases: ['hotel_property', 'resort_property', 'hostel_property', 'hospitality_property'],
    allowedUseCases: ['hospitality'],
    defaultUseCases: ['hospitality'],
    allowedScopes: ['whole_property'],
    defaultScope: 'whole_property',
    allowedOffers: [...commonPropertyOffers, 'business_transfer'],
  },
  {
    code: 'land',
    groupCode: 'land',
    nameTh: 'ที่ดิน',
    nameEn: 'Land',
    description: 'ที่ดินเปล่าหรือที่ดินพร้อมสิ่งปลูกสร้าง',
    aliases: ['land_plot'],
    allowedUseCases: [
      'residential',
      'office',
      'retail',
      'food_service',
      'storage',
      'industrial',
      'hospitality',
      'agriculture',
    ],
    defaultUseCases: [],
    allowedScopes: ['land_plot'],
    defaultScope: 'land_plot',
    allowedOffers: ['sale', 'rent', 'sublease'],
  },
]

export const useCases: TaxonomyOption<UseCaseCode>[] = [
  { code: 'residential', nameTh: 'อยู่อาศัย', nameEn: 'Residential', description: 'พักอาศัยระยะสั้นหรือระยะยาว' },
  { code: 'office', nameTh: 'สำนักงาน', nameEn: 'Office', description: 'สำนักงาน บริษัท หรือพื้นที่ทำงาน' },
  { code: 'retail', nameTh: 'ร้านค้า', nameEn: 'Retail', description: 'ขายสินค้า หน้าร้าน หรือบริการลูกค้า' },
  {
    code: 'food_service',
    nameTh: 'ร้านอาหารและคาเฟ่',
    nameEn: 'Food service',
    description: 'อาหาร เครื่องดื่ม หรือครัวเชิงพาณิชย์',
  },
  { code: 'storage', nameTh: 'เก็บสินค้า', nameEn: 'Storage', description: 'คลังสินค้า สต๊อกสินค้า หรือโลจิสติกส์' },
  { code: 'industrial', nameTh: 'อุตสาหกรรม', nameEn: 'Industrial', description: 'ผลิต ประกอบ หรือกิจกรรมโรงงาน' },
  { code: 'hospitality', nameTh: 'ธุรกิจที่พัก', nameEn: 'Hospitality', description: 'โรงแรม โฮสเทล หรือบริการที่พัก' },
  {
    code: 'agriculture',
    nameTh: 'เกษตรกรรม',
    nameEn: 'Agriculture',
    description: 'เพาะปลูก เลี้ยงสัตว์ หรือกิจกรรมเกษตร',
  },
]

export const listingScopes: TaxonomyOption<ListingScopeCode>[] = [
  {
    code: 'single_unit',
    nameTh: 'ห้องหรือยูนิตเดียว',
    nameEn: 'Single unit',
    description: 'ประกาศห้องหรือพื้นที่หนึ่งยูนิต',
  },
  {
    code: 'whole_property',
    nameTh: 'ทั้งหลังหรือทั้งอาคาร',
    nameEn: 'Whole property',
    description: 'ประกาศทรัพย์ทั้งหมดในรายการเดียว',
  },
  {
    code: 'multi_unit',
    nameTh: 'หลายห้องหรือหลายยูนิต',
    nameEn: 'Multiple units',
    description: 'มีหลายประเภทห้อง จำนวนห้อง และราคา',
  },
  {
    code: 'land_plot',
    nameTh: 'แปลงที่ดิน',
    nameEn: 'Land plot',
    description: 'ประกาศที่ดินหนึ่งแปลงหรือหลายแปลงติดกัน',
  },
  {
    code: 'space_slot',
    nameTh: 'พื้นที่ย่อย ล็อก หรือคีออส',
    nameEn: 'Space slot',
    description: 'พื้นที่ค้าขายภายในอาคาร ตลาด หรือโครงการ',
  },
]

export const offerTypes: TaxonomyOption<OfferTypeCode>[] = [
  { code: 'sale', nameTh: 'ขาย', nameEn: 'For sale', description: 'ขายกรรมสิทธิ์ในทรัพย์' },
  { code: 'rent', nameTh: 'ให้เช่า', nameEn: 'For rent', description: 'ให้เช่าตามรอบเดือนหรือระยะเวลาที่กำหนด' },
  {
    code: 'sublease',
    nameTh: 'ให้เช่าช่วง',
    nameEn: 'Sublease',
    description: 'ผู้เช่าปัจจุบันนำสิทธิการเช่ามาให้เช่าช่วง',
  },
  {
    code: 'business_transfer',
    nameTh: 'เซ้งกิจการ',
    nameEn: 'Business transfer',
    description: 'โอนสิทธิการเช่าหรือกิจการพร้อมอุปกรณ์',
  },
  {
    code: 'event_booking',
    nameTh: 'จองพื้นที่ตามรอบงาน',
    nameEn: 'Event booking',
    description: 'เปิดรับร้านค้าตามวันหรือรอบของงาน',
  },
]

export const businessSpaceTypes = [
  {
    code: 'market_stall',
    nameTh: 'ล็อกในตลาด / ตลาดนัด',
    nameEn: 'Market stall',
    description: 'พื้นที่ประจำในตลาดหรือตลาดนัด',
  },
  {
    code: 'mall_kiosk',
    nameTh: 'ล็อกหรือคีออสในห้าง',
    nameEn: 'Mall kiosk',
    description: 'คีออส เคาน์เตอร์ หรือพื้นที่กลางห้าง',
  },
  {
    code: 'standalone_shop',
    nameTh: 'ร้านค้า / พื้นที่หน้าร้าน',
    nameEn: 'Standalone shop',
    description: 'ร้านเดี่ยวที่มีพื้นที่และทางเข้าของตัวเอง',
  },
  {
    code: 'shophouse_ground_floor',
    nameTh: 'ร้านค้าใต้ตึกแถว',
    nameEn: 'Shophouse ground-floor shop',
    description: 'พื้นที่ร้านค้าด้านล่างของตึกแถวหรืออาคารพาณิชย์',
  },
  {
    code: 'event_booth',
    nameTh: 'บูธอีเวนต์ / พื้นที่ชั่วคราว',
    nameEn: 'Event booth',
    description: 'พื้นที่ออกบูธตามรอบงานหรือช่วงเวลาที่กำหนด',
  },
  {
    code: 'mall_shop',
    nameTh: 'ร้านภายในห้าง',
    nameEn: 'Mall shop',
    description: 'ยูนิตร้านค้าแบบมีหน้าร้านภายในศูนย์การค้า',
  },
  {
    code: 'food_court_counter',
    nameTh: 'เคาน์เตอร์ศูนย์อาหาร',
    nameEn: 'Food court counter',
    description: 'เคาน์เตอร์ขายอาหารหรือเครื่องดื่มในศูนย์อาหาร',
  },
  {
    code: 'school_canteen',
    nameTh: 'พื้นที่ในโรงเรียน',
    nameEn: 'School canteen',
    description: 'พื้นที่ขายสินค้าและอาหารภายในสถานศึกษา',
  },
  {
    code: 'office_canteen',
    nameTh: 'พื้นที่ในสำนักงาน',
    nameEn: 'Office canteen',
    description: 'พื้นที่ขายสินค้าและอาหารในอาคารสำนักงาน',
  },
  {
    code: 'dormitory_shop',
    nameTh: 'ร้านค้าในหอพัก',
    nameEn: 'Dormitory shop',
    description: 'พื้นที่ร้านค้าที่อยู่ภายในหรือใต้หอพัก',
  },
  {
    code: 'street_food_space',
    nameTh: 'พื้นที่ขายอาหารริมทาง',
    nameEn: 'Street food space',
    description: 'จุดขายอาหารริมทางหรือพื้นที่เปิด',
  },
] as const

export const primaryBusinessSpaceTypeCodes = [
  'standalone_shop',
  'market_stall',
  'event_booth',
  'mall_kiosk',
  'mall_shop',
  'food_court_counter',
  'school_canteen',
  'office_canteen',
  'dormitory_shop',
  'street_food_space',
  'shophouse_ground_floor',
] as const

export type BusinessSpaceTypeCode = (typeof businessSpaceTypes)[number]['code']

export const getPropertyType = (code: string) => propertyTypes.find((item) => item.code === code)
export const getPropertyGroup = (code: string) => propertyGroups.find((item) => item.code === code)
export const getUseCase = (code: string) => useCases.find((item) => item.code === code)
export const getListingScope = (code: string) => listingScopes.find((item) => item.code === code)
export const getOfferType = (code: string) => offerTypes.find((item) => item.code === code)
export const getBusinessSpaceType = (code: string) => businessSpaceTypes.find((item) => item.code === code)
export const getDiscoveryChannel = (code: string) => discoveryChannels.find((item) => item.code === code)
export const getPropertyTypesForGroup = (groupCode: PropertyGroupCode) =>
  propertyTypes.filter((item) => item.groupCode === groupCode)
export const getPropertyTypesForDiscoveryChannel = (channelCode: DiscoveryChannelCode) => {
  const channel = getDiscoveryChannel(channelCode)
  return channel
    ? channel.propertyTypeCodes
        .map((code) => getPropertyType(code))
        .filter((item): item is PropertyTypeDefinition => Boolean(item))
    : []
}

export const normalizeLegacyPropertyType = (code: string): PropertyTypeCode => {
  if (code === 'house') return 'detached_house'
  if (code === 'commercial_building') return 'shophouse'
  if (code === 'serviced_apartment') return 'apartment'
  if (propertyTypes.some((item) => item.code === code)) return code as PropertyTypeCode
  return 'detached_house'
}

export const mapUseCasesToLegacyUsage = (codes: UseCaseCode[]) => {
  const hasResidential = codes.includes('residential')
  const hasBusiness = codes.some((code) => code !== 'residential')
  if (hasResidential && hasBusiness) return 'mixed'
  return hasBusiness ? 'business' : 'residence'
}

export const offersToLegacyListingType = (codes: OfferTypeCode[]) => {
  if (codes.includes('sale') && codes.includes('rent')) return 'sale_and_rent'
  if (codes.includes('sale')) return 'sale'
  if (codes.includes('rent')) return 'rent'
  if (codes.includes('sublease')) return 'sublease'
  if (codes.includes('business_transfer')) return 'business_transfer'
  if (codes.includes('event_booking')) return 'event_booking'
  return 'rent'
}
