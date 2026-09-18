const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const transit = require('./helpers/transit-stations.cjs')
const stations = require('../src/data/thailandTransitStations.json')
const lines = require('../src/data/thailandTransitLines.json')
const memberships = require('../src/data/thailandTransitLineStations.json')
const { normalizeTransitCatalog } = require('../scripts/lib/transit-catalog.cjs')
const plain = (value) => JSON.parse(JSON.stringify(value))

function load(relative, imports) {
  const filename = path.join(__dirname, '..', relative)
  const context = {
    exports: {},
    URLSearchParams,
    require: (id) => {
      if (!(id in imports)) throw Error(`Unexpected import ${id}`)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    context,
    { filename }
  )
  return context.exports
}
const directory = load('src/lib/transitDirectory.ts', { './transitStations': transit })

test('normalized storage has stable keys, valid coordinates, and unique referenced memberships', () => {
  assert.equal(lines.length, 10)
  assert.equal(stations.length, 193)
  assert.equal(memberships.length, 195)
  assert.equal(new Set(stations.map((s) => s.id)).size, stations.length)
  assert.equal(new Set(lines.map((line) => line.id)).size, lines.length)
  const primaryKeys = new Set(),
    positions = new Set(),
    codes = new Set()
  for (const stop of memberships) {
    const line = lines.find((line) => line.id === stop.lineId)
    const station = stations.find((station) => station.id === stop.stationId)
    assert.ok(line && station)
    assert.equal(line.system, station.system)
    if (stop.branchId !== 'main') assert.ok(line.branches.some((branch) => branch.id === stop.branchId))
    assert.ok(Number.isInteger(stop.position) && stop.position > 0)
    for (const [seen, key] of [
      [primaryKeys, `${stop.lineId}/${stop.stationId}`],
      [positions, `${stop.lineId}/${stop.branchId}/${stop.position}`],
      [codes, `${stop.lineId}/${stop.code}`],
    ]) {
      assert.ok(!seen.has(key), key)
      seen.add(key)
    }
  }
  for (const station of stations) {
    assert.equal(station.lines, undefined, 'line relationships are stored separately')
    assert.equal(station.codes, undefined, 'codes belong to station/line memberships')
    assert.ok(memberships.some((stop) => stop.stationId === station.id))
    assert.ok(station.latitude >= 5 && station.latitude <= 21)
    assert.ok(station.longitude >= 97 && station.longitude <= 106)
    assert.ok(station.coordinateSourceUrl.startsWith('https://'))
    assert.match(station.reviewedAt, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(station.status, 'operational')
  }
  for (const line of lines) {
    assert.match(line.color, /^#[\da-f]{6}$/i)
    for (const branch of line.branches)
      assert.ok(
        memberships.some(
          (stop) => stop.lineId === line.id && stop.stationId === branch.junctionStationId && stop.branchId === 'main'
        )
      )
  }
})

test('station order follows each line and keeps the Pink branch separate', () => {
  const codes = (id) => directory.getTransitDirectoryGroups('', id)[0].stops.map((stop) => stop.code)
  const sukhumvit = codes('bts-sukhumvit')
  assert.equal(sukhumvit[0], 'N24')
  assert.equal(sukhumvit.at(-1), 'E23')
  assert.deepEqual(plain(sukhumvit.slice(sukhumvit.indexOf('CEN') - 1, sukhumvit.indexOf('CEN') + 2)), [
    'N1',
    'CEN',
    'E1',
  ])
  assert.deepEqual(plain(codes('bts-silom').slice(0, 3)), ['W1', 'CEN', 'S1'])
  assert.deepEqual(plain(codes('pink').slice(-3)), ['PK30', 'MT01', 'MT02'])
  assert.equal(codes('dark-red')[0], 'RN01')
  assert.equal(codes('light-red')[0], 'RW01')
  assert.ok(
    !directory
      .getTransitDirectoryGroups('', 'pink')[0]
      .stops.filter((stop) => stop.code.startsWith('MT'))
      .some((stop) => stop.branchId === 'main')
  )
})

test('directory searches names, aliases, codes and systems while respecting the line filter', () => {
  for (const query of ['อารีย์', 'Aree', 'N5', 'BTS Ari']) {
    const groups = directory.getTransitDirectoryGroups(query)
    assert.equal(groups.length, 1)
    assert.equal(groups[0].stops[0].stationId, 'bts-n5')
  }
  assert.equal(directory.getTransitDirectoryGroups('อารีย์', 'blue').length, 0)
  assert.equal(directory.getTransitDirectoryGroups('not-a-station').length, 0)
  assert.equal(directory.getTransitDirectoryGroups().length, 10)
  assert.equal(
    new Set(directory.getTransitDirectoryGroups().flatMap((group) => group.stops.map((stop) => stop.stationId))).size,
    193
  )
  assert.equal(directory.getTransitDirectoryGroups('สีม่วง')[0].stops.length, 16)
  assert.equal(directory.getTransitDirectoryGroups('SRT').length, 2)
  assert.equal(
    directory.getTransitDirectoryGroups('ลาดพร้าว').length,
    3,
    'same-name locations in different systems remain separate'
  )
})

test('all directory map/sale/rent links round-trip to the exact station and preserve the offer', () => {
  for (const station of transit.transitStations)
    for (const offer of [undefined, 'sale', 'rent']) {
      const url = new URL(directory.getTransitDirectoryMapUrl(station.id, offer), 'https://mapxprop.com')
      assert.equal(url.pathname, '/properties/map')
      assert.equal(url.searchParams.get('station'), station.id)
      assert.equal(url.searchParams.get('offer_type'), offer || null)
      const destination = transit.findTransitStation(url.searchParams.get('q'))
      assert.equal(destination.id, station.id)
      assert.equal(destination.latitude, station.latitude)
      assert.equal(destination.longitude, station.longitude)
    }
})

test('refresh normalization reproduces all stored records and never invents membership codes', () => {
  const refreshed = normalizeTransitCatalog(plain(transit.transitStations), lines, '2026-09-18')
  assert.deepEqual(refreshed.stations, stations)
  assert.deepEqual(refreshed.memberships, memberships)
  assert.throws(
    () => normalizeTransitCatalog([{ id: 'unknown', lines: ['unreviewed'], codes: ['X1'] }], lines, '2026-09-18'),
    /Unreviewed/
  )
})

const baseImports = {
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  'lucide-react': require('lucide-react'),
  '@/lib/transitDirectory': directory,
  '@/lib/transitStations': transit,
  './TransitDirectory.module.css': { default: {} },
}
test('Thai and English directory HTML includes all lines, station destinations and accessible search', () => {
  for (const locale of ['th', 'en']) {
    const Component = load('src/components/transit/TransitDirectory.tsx', {
      ...baseImports,
      react: React,
      '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale }) },
    }).default
    const html = renderToStaticMarkup(React.createElement(Component))
    assert.equal((html.match(/<article/g) || []).length, 195)
    assert.ok(html.includes('id="transit-station-search"'))
    assert.ok(html.includes('for="transit-station-search"'))
    assert.ok(html.includes('aria-live="polite"'))
    assert.ok(html.includes('station=bts-n5'))
    assert.ok(html.includes(locale === 'th' ? 'ส่วนต่อขยายเมืองทองธานี' : 'Muang Thong Thani branch'))
    for (const line of lines) assert.ok(html.includes(`id="line-${line.id}"`))
  }
})

test('line controls, search, clear and empty-state reset update the actual directory', () => {
  let cursor = 0
  const state = []
  const Component = load('src/components/transit/TransitDirectory.tsx', {
    ...baseImports,
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'en' }) },
    react: {
      useMemo: (fn) => fn(),
      useState: (initial) => {
        const slot = cursor++
        if (!(slot in state)) state[slot] = initial
        return [
          state[slot],
          (next) => {
            state[slot] = typeof next === 'function' ? next(state[slot]) : next
          },
        ]
      },
    },
  }).default
  const nodes = (node) =>
    Array.isArray(node)
      ? node.flatMap(nodes)
      : node && typeof node === 'object'
        ? [node, ...nodes(node.props?.children)]
        : []
  const render = () => {
    cursor = 0
    return nodes(Component())
  }
  const pressLine = (key) =>
    render()
      .find((node) => node.type === 'button' && node.key === key)
      .props.onClick()
  pressLine('blue')
  assert.equal(render().filter((node) => node.type === 'article').length, 38)
  render()
    .find((node) => node.type === 'input')
    .props.onChange({ target: { value: 'N5' } })
  assert.equal(render().filter((node) => node.type === 'article').length, 0)
  render()
    .find((node) => node.type === 'button' && node.props.children === 'Clear filters and show all stations')
    .props.onClick()
  assert.equal(render().filter((node) => node.type === 'article').length, 195)
  render()
    .find((node) => node.type === 'input')
    .props.onChange({ target: { value: 'N5' } })
  assert.equal(render().filter((node) => node.type === 'article').length, 1)
  render()
    .find((node) => node.props['aria-label'] === 'Clear search')
    .props.onClick()
  assert.equal(render().filter((node) => node.type === 'article').length, 195)
})
