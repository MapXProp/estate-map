export type PropertyMapLocationPreset = {
  slug: string
  nameTh: string
  nameEn: string
  latitude: number
  longitude: number
  zoom: number
}

// These presets make location links deterministic. They are intentionally kept
// separate from listing data: the map starts at the province centre even before
// its matching listings have finished loading from the API.
export const propertyMapLocationPresets: PropertyMapLocationPreset[] = [
  {
    slug: 'bangkok',
    nameTh: 'กรุงเทพมหานคร',
    nameEn: 'Bangkok',
    latitude: 13.7563,
    longitude: 100.5018,
    zoom: 11,
  },
  {
    slug: 'nonthaburi',
    nameTh: 'นนทบุรี',
    nameEn: 'Nonthaburi',
    latitude: 13.8591,
    longitude: 100.5217,
    zoom: 11,
  },
  {
    slug: 'pathum-thani',
    nameTh: 'ปทุมธานี',
    nameEn: 'Pathum Thani',
    latitude: 14.0208,
    longitude: 100.525,
    zoom: 10,
  },
  {
    slug: 'samut-prakan',
    nameTh: 'สมุทรปราการ',
    nameEn: 'Samut Prakan',
    latitude: 13.5991,
    longitude: 100.5998,
    zoom: 11,
  },
  {
    slug: 'chiang-mai',
    nameTh: 'เชียงใหม่',
    nameEn: 'Chiang Mai',
    latitude: 18.7883,
    longitude: 98.9853,
    zoom: 10,
  },
  {
    slug: 'khon-kaen',
    nameTh: 'ขอนแก่น',
    nameEn: 'Khon Kaen',
    latitude: 16.4419,
    longitude: 102.835,
    zoom: 11,
  },
  {
    slug: 'chon-buri',
    nameTh: 'ชลบุรี',
    nameEn: 'Chon Buri',
    latitude: 13.3611,
    longitude: 100.9847,
    zoom: 10,
  },
  {
    slug: 'rayong',
    nameTh: 'ระยอง',
    nameEn: 'Rayong',
    latitude: 12.6814,
    longitude: 101.2816,
    zoom: 10,
  },
  {
    slug: 'hua-hin',
    nameTh: 'หัวหิน',
    nameEn: 'Hua Hin',
    latitude: 12.5684,
    longitude: 99.9577,
    zoom: 11,
  },
  {
    slug: 'phuket',
    nameTh: 'ภูเก็ต',
    nameEn: 'Phuket',
    latitude: 7.8804,
    longitude: 98.3923,
    zoom: 11,
  },
  {
    slug: 'surat-thani',
    nameTh: 'สุราษฎร์ธานี',
    nameEn: 'Surat Thani',
    latitude: 9.1382,
    longitude: 99.3217,
    zoom: 10,
  },
  {
    slug: 'hat-yai',
    nameTh: 'หาดใหญ่',
    nameEn: 'Hat Yai',
    latitude: 7.0084,
    longitude: 100.4747,
    zoom: 11,
  },
]

const normaliseLocation = (value: string) => value.trim().toLocaleLowerCase('en-US')

export const getPropertyMapLocationPreset = (value?: string) => {
  if (!value) return undefined
  const location = normaliseLocation(value)

  return propertyMapLocationPresets.find((preset) =>
    [preset.slug, preset.nameTh, preset.nameEn].some((candidate) => normaliseLocation(candidate) === location)
  )
}

export const getPropertyMapLocationHref = (slug: string, channel?: 'homes' | 'rooms' | 'business') => {
  const searchParams = new URLSearchParams({ location: slug })
  if (channel) searchParams.set('channel', channel)
  return `/properties/map?${searchParams.toString()}`
}
