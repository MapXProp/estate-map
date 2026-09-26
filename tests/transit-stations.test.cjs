const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const transit = require('./helpers/transit-stations.cjs')
const plain = (value) => JSON.parse(JSON.stringify(value))
function load(relative, imports, globals = {}) {
  const filename = path.join(__dirname, '..', relative)
  const context = {
    exports: {},
    URLSearchParams,
    AbortSignal,
    ...globals,
    require: (id) => {
      if (!(id in imports)) throw Error(`Unexpected import ${id}`)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
    { filename }
  )
  return context.exports
}
const locations = load('src/lib/propertyMapLocations.ts', {})

test('catalog covers all operating line memberships, with physical shared stations merged and planned stations excluded', () => {
  assert.equal(transit.transitStations.length, 193)
  assert.equal(new Set(transit.transitStations.map((s) => s.id)).size, 193)
  const counts = Object.fromEntries(
    Object.keys(transit.transitLines).map((line) => [
      line,
      transit.transitStations.filter((s) => s.lines.includes(line)).length,
    ])
  )
  assert.deepEqual(counts, {
    'bts-sukhumvit': 47,
    'bts-silom': 14,
    gold: 3,
    blue: 38,
    purple: 16,
    pink: 32,
    yellow: 23,
    arl: 8,
    'dark-red': 10,
    'light-red': 4,
  })
  for (const station of transit.transitStations) {
    assert.ok(
      station.latitude > 5 && station.latitude < 21 && station.longitude > 97 && station.longitude < 106,
      station.id
    )
    assert.ok(station.nameTh && station.nameEn && station.codes.length)
  }
  assert.equal(transit.findTransitStation('OR01'), undefined)
  assert.equal(transit.findTransitStation('N6'), undefined)
  assert.deepEqual(plain(transit.getTransitStation('bts-cen').lines).sort(), ['bts-silom', 'bts-sukhumvit'])
  assert.deepEqual(plain(transit.getTransitStation('srt-krung-thep-aphiwat').codes), ['RN01', 'RW01'])
})

test('every station can be found by Thai name, English name and code, and its full label round-trips exactly', () => {
  for (const station of transit.transitStations) {
    for (const query of [station.nameTh, station.nameEn, ...station.codes]) {
      assert.ok(
        transit.searchTransitStations(query).some((s) => s.id === station.id),
        `${query}: ${station.id}`
      )
    }
    for (const th of [true, false]) {
      assert.equal(transit.findTransitStation(transit.transitStationLabel(station, th))?.id, station.id)
    }
  }
})

test('aliases, systems and line names narrow station suggestions without confusing interchange platforms', () => {
  for (const query of ['BTS อารีย์', 'สถานีบีทีเอสอารีย์', 'Aree', 'N5']) {
    assert.equal(transit.findTransitStation(query)?.id, 'bts-n5')
  }
  assert.equal(transit.searchTransitStations('สีม่วง บางใหญ่')[0].id, 'mrt-pp02')
  assert.ok(transit.searchTransitStations('MRT ลาดพร้าว').every((s) => s.system === 'MRT'))
  assert.equal(transit.findTransitStation('ลาดพร้าว'), undefined)
  assert.equal(transit.findTransitStation('พญาไท'), undefined)
  assert.equal(transit.findTransitStation('MRT ลาดพร้าว (YL01)')?.id, 'mrt-yl01')
  assert.equal(transit.findTransitStation('MRT ลาดพร้าว (BL15)')?.id, 'mrt-bl15')
  assert.equal(transit.searchTransitStations('อิมแพ็ค')[0].id, 'mrt-mt01')
  assert.equal(transit.searchTransitStations('MT02')[0].id, 'mrt-mt02')
  assert.equal(transit.searchTransitStations('Airport Rail Link สุวรรณภูมิ')[0].id, 'arl-a1')
  assert.equal(transit.searchTransitStations('สายสีแดง รังสิต')[0].id, 'srt-rn10')
  assert.equal(transit.searchTransitStations('สถานีรถไฟฟ้า').length, 8)
})

test('station permalinks retain search filters and carry a stable identity with a canonical station name', () => {
  for (const station of transit.transitStations) {
    const url = new URL(
      transit.getTransitStationMapUrl('/properties/map?channel=rooms&offer_type=rent&q=old', station.id),
      'https://mapxprop.com'
    )
    assert.equal(url.searchParams.get('channel'), 'rooms')
    assert.equal(url.searchParams.get('offer_type'), 'rent')
    assert.equal(url.searchParams.get('station'), station.id)
    assert.equal(transit.findTransitStation(url.searchParams.get('q'))?.id, station.id)
  }
  assert.equal(transit.getTransitStationMapUrl('/properties/map?q=area', 'invalid'), '/properties/map?q=area')
  const changed = new URL(
    transit.getTransitStationMapUrl(
      '/properties/map?lat=18&lon=98&location=chiang-mai&zoom=10&project=old&channel=homes',
      'bts-n5'
    ),
    'https://mapxprop.com'
  )
  for (const key of ['lat', 'lon', 'location', 'zoom', 'project']) assert.equal(changed.searchParams.has(key), false)
  assert.equal(changed.searchParams.get('channel'), 'homes')
})

test('known landmarks and all station selections resolve without external geocoding or listing data', async () => {
  const model = load(
    'src/lib/propertyMapLocationSearch.ts',
    {
      './auth': { getAuthApiUrl: (value) => value },
      './propertyMapLocations': locations,
      './placeAutocomplete': load('src/lib/placeAutocomplete.ts'),
      './locationSearch': require('./helpers/location-search.cjs')().location,
      './transitStations': transit,
    },
    {
      fetch: () => {
        throw Error('External geocoding must not run')
      },
    }
  )
  for (const station of transit.transitStations) {
    const place = await model.resolveMapSearchPlace(
      transit.transitStationLabel(station),
      '',
      true,
      new AbortController().signal
    )
    assert.equal(place.lat, station.latitude)
    assert.equal(place.lon, station.longitude)
    assert.equal(place.zoom, 16)
  }
  for (const query of ['อารีย์', 'ซอยอารีย์', 'ซอยอารีย์ (พหลโยธิน 7)', 'Ari']) {
    const place = await model.resolveMapSearchPlace(query, '', true, new AbortController().signal)
    assert.equal(place.lat, 13.780953470242196)
    assert.equal(place.lon, 100.54483583660047)
    assert.ok(place.name.includes(query === 'Ari' ? 'Ari' : 'ซอยอารีย์'))
  }
  for (const query of ['พระราม 9', 'Rama 9', 'แยกพระราม 9–รัชดาภิเษก']) {
    const place = await model.resolveMapSearchPlace(query, '', true, new AbortController().signal)
    assert.equal(place.lat, 13.7560737133026)
    assert.equal(place.lon, 100.565071105957)
  }
  assert.notEqual(
    locations.getPropertyMapLocationPreset('พระราม 9').latitude,
    transit.getTransitStation('mrt-bl20').latitude
  )
})

test('legacy station lookup remains available but the shared autocomplete does not inject local stations on provider failure', async () => {
  const fetch = async () => {
    throw Error('Search service unavailable')
  }
  const model = load(
    'src/lib/propertySearch.ts',
    { './auth': { getAuthApiUrl: (value) => value }, './transitStations': transit },
    { fetch }
  )
  for (const scope of ['all', 'location']) {
    const suggestions = await model.fetchPropertySearchSuggestions('MT01', undefined, { scope })
    assert.equal(suggestions[0].stationId, 'mrt-mt01')
    assert.equal(suggestions[0].description, 'transit')
  }
  const map = load(
    'src/lib/propertyMapLocationSearch.ts',
    {
      './auth': { getAuthApiUrl: (value) => value },
      './propertyMapLocations': locations,
      './placeAutocomplete': load('src/lib/placeAutocomplete.ts'),
      './locationSearch': require('./helpers/location-search.cjs')(fetch).location,
      './transitStations': transit,
    },
    { fetch }
  )
  const suggestions = await map.fetchMapSearchSuggestions('MT02', 'listings', '', new AbortController().signal)
  assert.equal(suggestions.length, 0)
})

test('public location APIs serve known stations and corrected landmarks before provider keys or quota are needed', async () => {
  const imports = {
    '@/lib/placeAutocomplete': load('src/lib/placeAutocomplete.ts'),
    '@/lib/transitStations': transit,
    '@/lib/propertyMapLocations': locations,
    '@/lib/server/longdoQuota': {
      longdoNoStoreHeaders: {},
      getLongdoApiKey: () => {
        throw Error('No external key needed')
      },
      takeLongdoQuota: () => {
        throw Error('No quota needed')
      },
    },
    'next/server': { NextResponse: { json: (data, options) => ({ data, ...options }) } },
  }
  const request = (query) => ({ nextUrl: new URL('https://mapxprop.com/api/test?' + new URLSearchParams(query)) })
  const search = load('src/app/api/location-search/route.ts', imports)
  const suggest = load('src/app/api/location-suggestions/route.ts', imports)
  for (const station of transit.transitStations) {
    const result = await search.GET(request({ station: station.id }))
    assert.equal(result.data.place.lat, station.latitude)
    assert.equal(result.data.place.lon, station.longitude)
  }
  assert.equal((await search.GET(request({ q: 'ซอยอารีย์' }))).data.place.lat, 13.780953470242196)
  assert.equal((await suggest.GET(request({ q: 'N5' }))).data.suggestions[0].stationId, 'bts-n5')
  assert.equal((await suggest.GET(request({ q: 'BL20' }))).data.suggestions[0].stationId, 'mrt-bl20')
})
