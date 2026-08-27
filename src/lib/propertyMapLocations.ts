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
    slug: 'chiang-mai',
    nameTh: 'เชียงใหม่',
    nameEn: 'Chiang Mai',
    latitude: 18.7883,
    longitude: 98.9853,
    zoom: 10,
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
    slug: 'phuket',
    nameTh: 'ภูเก็ต',
    nameEn: 'Phuket',
    latitude: 7.8804,
    longitude: 98.3923,
    zoom: 11,
  },
]

const normaliseLocation = (value: string) => value.trim().toLocaleLowerCase('en-US')

export const getPropertyMapLocationPreset = (value?: string) => {
  if (!value) return undefined
  const location = normaliseLocation(value)

  return propertyMapLocationPresets.find(
    (preset) =>
      [preset.slug, preset.nameTh, preset.nameEn].some((candidate) => normaliseLocation(candidate) === location)
  )
}

export const getPropertyMapLocationHref = (slug: string) =>
  `/properties/map?location=${encodeURIComponent(slug)}`
