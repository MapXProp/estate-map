export type MapArea = { province: string; district: string; subdistrict: string }

export function readMapArea(value: unknown): MapArea | null {
  if (!value || typeof value !== 'object' || 'error' in value) return null
  const source = value as Record<string, unknown>
  const label = (key: string) =>
    typeof source[key] === 'string' ? source[key].trim().replace(/\s+/g, ' ').slice(0, 120) : ''
  const area = { province: label('province'), district: label('district'), subdistrict: label('subdistrict') }
  return Object.values(area).some(Boolean) ? area : null
}

export function formatMapArea(area: MapArea | null, zoom: number, locale: 'th' | 'en') {
  if (!area) return ''
  const district = locale === 'th' ? area.district.replace(/^(เขต|อำเภอ)\s*/, '') : area.district
  const local = zoom >= 13 ? district || area.subdistrict : ''
  return [...new Set([local, area.province].filter(Boolean))].join(' · ')
}

export function mapAreaQuery(center: { lat: number; lon: number } | undefined, locale: 'th' | 'en') {
  if (
    !center ||
    !Number.isFinite(center.lat) ||
    !Number.isFinite(center.lon) ||
    center.lat < 5 ||
    center.lat > 21 ||
    center.lon < 97 ||
    center.lon > 106
  )
    return ''
  // An approximate district label, cached on a ~100 m grid, not a street address.
  return new URLSearchParams({ lat: center.lat.toFixed(3), lon: center.lon.toFixed(3), locale }).toString()
}
