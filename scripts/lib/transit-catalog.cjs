const fs = require('node:fs')
const path = require('node:path')

function stationCodeForLine(station, lineId) {
  const prefix = lineId === 'dark-red' ? 'RN' : lineId === 'light-red' ? 'RW' : ''
  const code = prefix ? station.codes.find((item) => item.startsWith(prefix)) : station.codes[0]
  if (!code) throw Error(`Missing station code: ${lineId}/${station.id}`)
  return code
}

function codeOrder(code) {
  if (code === 'CEN') return 0
  const number = Number(code.replace(/\D/g, ''))
  return /^[NW]\d/.test(code) ? -number : number
}

// Keep storage normalized; the app composes the legacy autocomplete shape from
// these station IDs and memberships. This same data can seed SQL tables later.
function normalizeTransitCatalog(stations, lines, reviewedAt) {
  const memberships = []
  for (const line of lines) {
    const stops = stations
      .filter((station) => station.lines.includes(line.id))
      .map((station) => {
        const code = stationCodeForLine(station, line.id)
        return {
          lineId: line.id,
          stationId: station.id,
          code,
          branchId: code.startsWith('MT') ? 'muang-thong-thani' : 'main',
        }
      })
    const branches = [...new Set(stops.map((stop) => stop.branchId))]
    for (const branchId of branches) {
      stops
        .filter((stop) => stop.branchId === branchId)
        .sort((a, b) => codeOrder(a.code) - codeOrder(b.code))
        .forEach((stop, index) => memberships.push({ ...stop, position: index + 1 }))
    }
  }
  for (const station of stations) {
    if (!station.lines.length || station.lines.some((id) => !lines.some((line) => line.id === id)))
      throw Error(`Unreviewed station line: ${station.id}`)
    if (!Number.isFinite(station.latitude) || !Number.isFinite(station.longitude))
      throw Error(`Missing coordinates: ${station.id}`)
  }
  return {
    stations: stations.map(({ codes, lines: lineIds, ...station }) => ({
      ...station,
      status: 'operational',
      coordinateSourceUrl: lineIds.some((id) => ['bts-sukhumvit', 'bts-silom', 'gold', 'yellow', 'pink'].includes(id))
        ? 'https://www.ebm.co.th/mobapi-routemap/api/RouteMap/StationList?lang=th'
        : 'https://drt.gdcatalog.go.th/dataset/0462230b-f87e-4335-a870-08b3d7559f9a/resource/1f03a45d-e3b5-4e37-95e6-092dcc75f6ba',
      reviewedAt,
    })),
    memberships,
  }
}

function writeTransitCatalog(stations, reviewedAt) {
  const dataPath = path.join(__dirname, '../../src/data')
  const lines = JSON.parse(fs.readFileSync(path.join(dataPath, 'thailandTransitLines.json'), 'utf8'))
  const normalized = normalizeTransitCatalog(stations, lines, reviewedAt)
  for (const [filename, data] of [
    ['thailandTransitStations.json', normalized.stations],
    ['thailandTransitLineStations.json', normalized.memberships],
  ])
    fs.writeFileSync(path.join(dataPath, filename), JSON.stringify(data, null, 2) + '\n')
  return normalized
}

module.exports = { normalizeTransitCatalog, writeTransitCatalog }
