// Refresh the checked-in public station catalog. Review the generated diff before publishing.
// Optional first argument: a directory containing stations.csv and operator-stations.json snapshots.
const fs = require('node:fs')
const path = require('node:path')
const { writeTransitCatalog } = require('./lib/transit-catalog.cjs')
const csvUrl =
  'https://drt.gdcatalog.go.th/dataset/0462230b-f87e-4335-a870-08b3d7559f9a/resource/1f03a45d-e3b5-4e37-95e6-092dcc75f6ba/download/drt2565_02-1.csv'
const operatorUrl = 'https://www.ebm.co.th/mobapi-routemap/api/RouteMap/StationList?lang=th'
const lines = {
  'Light green': ['bts-sukhumvit', 'BTS', 1],
  'Dark green': ['bts-silom', 'BTS', 2],
  Gold: ['gold', 'BTS', 3],
  Blue: ['blue', 'MRT'],
  Purple: ['purple', 'MRT'],
  Pink: ['pink', 'MRT', 5],
  Yellow: ['yellow', 'MRT', 4],
  ARL: ['arl', 'ARL'],
  'Red north': ['dark-red', 'SRT'],
  'Red west': ['light-red', 'SRT'],
}
function parseCsv(text) {
  const rows = []
  let row = [],
    field = '',
    quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"'
        i++
      } else quoted = !quoted
    } else if (ch === ',' && !quoted) {
      row.push(field.trim())
      field = ''
    } else if (ch === '\n' && !quoted) {
      row.push(field.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) {
    row.push(field.trim())
    rows.push(row)
  }
  const headers = rows.shift()
  return rows.map((values) => Object.fromEntries(headers.map((key, i) => [key, values[i]])))
}
async function download(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw Error(`Station source returned ${response.status}`)
  return response.text()
}
async function main() {
  const snapshot = process.argv[2]
  const [csv, operatorText] = snapshot
    ? ['stations.csv', 'operator-stations.json'].map((file) => fs.readFileSync(path.join(snapshot, file), 'utf8'))
    : await Promise.all([download(csvUrl), download(operatorUrl, { method: 'POST' })])
  const operator = JSON.parse(operatorText)
  if (!operator.IsSuccess || !Array.isArray(operator.data)) throw Error('Invalid operator catalog')
  const stations = new Map()
  for (const row of parseCsv(csv)) {
    if (row.Status !== '1') continue
    const line = lines[row.Line_Code]
    if (!line) throw Error(`Review newly opened line: ${row.Line_Code}`)
    const [lineId, system, operatorLine] = line
    const code = row.Station_Code
    const verified =
      operatorLine &&
      operator.data.find((item) => item.LineId === operatorLine)?.StationList.find((item) => item.StationKey === code)
    if (operatorLine && !verified) throw Error(`Missing operator station: ${row.Line_Code} ${code}`)
    const latitude = Number(verified ? verified.Latitude : row.Latitude)
    const longitude = Number(verified ? verified.Longitude : row.Longitude)
    if (!(latitude > 5 && latitude < 21 && longitude > 97 && longitude < 106))
      throw Error(`Missing coordinates: ${code}`)
    const id =
      system === 'SRT' && ['RN01', 'RW01'].includes(code)
        ? 'srt-krung-thep-aphiwat'
        : `${system.toLowerCase()}-${code.toLowerCase()}`
    const existing = stations.get(id)
    if (existing) {
      existing.lines.push(lineId)
      if (!existing.codes.includes(code)) existing.codes.push(code)
      continue
    }
    let nameTh = (verified ? verified.StationNameTH : row.Station_Name_TH).trim()
    let nameEn = (verified ? verified.StationNameEN : row.Station_Name_EN).trim()
    let aliases = []
    if (id === 'srt-krung-thep-aphiwat') {
      nameTh = 'กรุงเทพอภิวัฒน์'
      nameEn = 'Krung Thep Aphiwat'
      aliases = [
        'สถานีกลางกรุงเทพอภิวัฒน์',
        'Krung Thep Aphiwat Central Terminal',
        'Bang Sue Grand Station',
        'สถานีกลางบางซื่อ',
        'บางซื่อ',
      ]
    }
    if (code === 'BL19') nameTh = 'ศูนย์วัฒนธรรมแห่งประเทศไทย'
    if (code === 'BL23') {
      nameEn = 'Queen Sirikit National Convention Centre'
      aliases.push('QSNCC', 'ศูนย์ประชุมสิริกิติ์')
    }
    if (code === 'N5') aliases.push('Aree', 'อารี')
    if (code === 'BL20') aliases.push('Rama 9', 'Rama IX', 'Phra Ram IX', 'พระรามเก้า')
    if (code === 'E23') aliases.push('เคหะ', 'Kheha Samut Prakan')
    stations.set(id, {
      id,
      system,
      codes: [code],
      lines: [lineId],
      nameTh,
      nameEn,
      latitude,
      longitude,
      ...(aliases.length ? { aliases } : {}),
    })
  }
  const result = [...stations.values()].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  if (result.length < 193) throw Error('Operating station catalog unexpectedly shrank; review sources')
  writeTransitCatalog(result, process.env.TRANSIT_REVIEWED_AT || new Date().toISOString().slice(0, 10))
  console.log(
    `Wrote ${result.length} stations across ${new Set(result.flatMap((station) => station.lines)).size} lines`
  )
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
