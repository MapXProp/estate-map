import lineData from '@/data/thailandTransitLines.json'
import lineStationData from '@/data/thailandTransitLineStations.json'
import stationData from '@/data/thailandTransitStations.json'

export type TransitStation = {
  id: string
  system: string
  codes: string[]
  lines: string[]
  nameTh: string
  nameEn: string
  latitude: number
  longitude: number
  aliases?: string[]
}
export const transitLineCatalog = lineData.filter((line) => line.status === 'operational')
const activeLineIds = new Set(transitLineCatalog.map((line) => line.id))
export const transitLineStations = lineStationData.filter((stop) => activeLineIds.has(stop.lineId))
export const transitCatalogReviewedAt = stationData
  .map((station) => station.reviewedAt)
  .sort()
  .at(-1)
export type TransitLine = (typeof lineData)[number]
export type TransitLineStation = (typeof lineStationData)[number]
export const transitStations: readonly TransitStation[] = stationData
  .filter(
    (station) => station.status === 'operational' && transitLineStations.some((stop) => stop.stationId === station.id)
  )
  .map((station) => {
    const memberships = transitLineStations.filter((item) => item.stationId === station.id)
    return {
      ...station,
      lines: memberships.map((item) => item.lineId),
      codes: [...new Set(memberships.map((item) => item.code))],
    }
  })
export const transitLines: Record<string, { th: string; en: string; aliases: string[] }> = Object.fromEntries(
  transitLineCatalog.map((line) => [line.id, { th: line.nameTh, en: line.nameEn, aliases: line.aliases }])
)
const normalize = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]/gu, '')
const withoutStationPrefix = (value: string) =>
  normalize(value)
    .replace(/สถานีรถไฟฟ้า|สถานี|รถไฟฟ้า|station|skytrain/g, '')
    .replace(/บีทีเอส/g, 'bts')
    .replace(/เอ็มอาร์ที/g, 'mrt')
export const transitStationLabel = (station: TransitStation, th = true) =>
  `${station.system} ${th ? station.nameTh : station.nameEn} (${station.codes.join('/')})`
const index = transitStations.map((station) => ({
  station,
  names: [
    ...new Set(
      [
        station.nameTh,
        station.nameEn,
        ...(station.aliases || []),
        ...station.codes,
        transitStationLabel(station),
        transitStationLabel(station, false),
        ...[station.nameTh, station.nameEn, ...(station.aliases || [])].flatMap((name) => [
          `${station.system} ${name}`,
          `${name} ${station.system}`,
        ]),
      ].map(withoutStationPrefix)
    ),
  ],
}))
export const getTransitStation = (id?: string) =>
  id ? transitStations.find((station) => station.id === id) : undefined
// Shared names must be disambiguated by selecting a system/code, never by array order.
export function findTransitStation(query: string) {
  const key = withoutStationPrefix(query)
  if (!key) return undefined
  const matches = index.filter((item) => item.names.includes(key))
  return matches.length === 1 ? matches[0].station : undefined
}
export function searchTransitStations(query: string, limit = 8) {
  const original = withoutStationPrefix(query)
  if (!original) return /สถานี|รถไฟฟ้า|station|skytrain/i.test(query) ? transitStations.slice(0, limit) : []
  let term = original
  const systemNames: Array<[string, string[]]> = [
    ['BTS', ['bts', 'บีทีเอส']],
    ['MRT', ['mrt', 'เอ็มอาร์ที']],
    ['ARL', ['arl']],
    ['SRT', ['srt', 'สายสีแดง', 'redline']],
  ]
  const line = Object.entries(transitLines).find(([, value]) =>
    value.aliases.some((alias) => term.includes(normalize(alias)))
  )
  if (line) for (const alias of line[1].aliases) term = term.replace(normalize(alias), '')
  const system = systemNames.find(([, names]) => names.some((name) => term.includes(name)))
  if (system) for (const name of system[1]) term = term.replace(name, '')
  return index
    .flatMap((item) => {
      if (line && !item.station.lines.includes(line[0])) return []
      if (system && item.station.system !== system[0]) return []
      const score = item.names.includes(original)
        ? 100
        : !term
          ? 10
          : item.names.includes(term)
            ? 90
            : item.names.some((name) => name.startsWith(term))
              ? 70
              : item.names.some((name) => name.includes(term))
                ? 50
                : 0
      return score ? [{ station: item.station, score }] : []
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.station)
}
export const getTransitSearchSuggestions = (query: string, limit = 8) => {
  const th = /[ก-๙]/.test(query)
  return searchTransitStations(query, limit).map((station) => ({
    type: 'location',
    description: 'transit',
    stationId: station.id,
    label: transitStationLabel(station, th),
    query: transitStationLabel(station),
    detail: station.lines.map((line) => transitLines[line][th ? 'th' : 'en']).join(' / '),
  }))
}
export function getTransitStationMapUrl(url: string, stationId?: string) {
  const station = getTransitStation(stationId)
  if (!station) return url
  const [pathname, search = ''] = url.split('?')
  const params = new URLSearchParams(search)
  for (const key of ['location', 'lat', 'lon', 'zoom', 'project']) params.delete(key)
  params.set('q', transitStationLabel(station))
  params.set('station', station.id)
  return `${pathname}?${params}`
}
export const transitStationPlace = (station: TransitStation, th = true) => ({
  name: transitStationLabel(station, th),
  address: station.lines.map((line) => transitLines[line][th ? 'th' : 'en']).join(' / '),
  lat: station.latitude,
  lon: station.longitude,
  zoom: 16,
})
