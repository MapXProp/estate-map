import {
  findTransitStation,
  getTransitStation,
  getTransitStationMapUrl,
  searchTransitStations,
  transitLineCatalog,
  transitLineStations,
  transitStations,
} from './transitStations'

export function getTransitDirectoryGroups(query = '', lineId = '') {
  const exact = findTransitStation(query)
  const matches = query.trim()
    ? new Set((exact ? [exact] : searchTransitStations(query, transitStations.length)).map((station) => station.id))
    : null
  return transitLineCatalog
    .filter((line) => !lineId || line.id === lineId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((line) => ({
      line,
      stops: transitLineStations
        .filter((stop) => stop.lineId === line.id && (!matches || matches.has(stop.stationId)))
        .sort((a, b) => Number(a.branchId !== 'main') - Number(b.branchId !== 'main') || a.position - b.position)
        .flatMap((stop) => {
          const station = getTransitStation(stop.stationId)
          return station ? [{ ...stop, station }] : []
        }),
    }))
    .filter((group) => group.stops.length > 0)
}

export function getTransitDirectoryMapUrl(stationId: string, offer?: 'sale' | 'rent') {
  return getTransitStationMapUrl(`/properties/map${offer ? `?offer_type=${offer}` : ''}`, stationId)
}
