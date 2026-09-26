const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  ts = require('typescript')
const browse = require('./helpers/property-browse.cjs')
function load(file, imports = {}, globals = {}) {
  const context = {
    exports: {},
    URL,
    URLSearchParams,
    Date,
    AbortSignal,
    ...globals,
    require: (id) => {
      if (!(id in imports)) throw Error('Unexpected import ' + id)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context
  )
  return context.exports
}
function model(fetch) {
  return load(
    'src/lib/propertyPreferences.ts',
    {
      './auth': { getAuthApiUrl: (route) => 'https://api.test/' + route },
      './propertyBrowse': browse,
      './propertyMapSearch': browse.map,
      '@/data/propertyTaxonomy': load('src/data/propertyTaxonomy.ts'),
      './propertyPrices': load('src/lib/propertyPrices.ts'),
      './transitStations': require('./helpers/transit-stations.cjs'),
    },
    { fetch }
  )
}
const now = Date.parse('2026-09-26T06:00:00Z'),
  day = 86400000
const event = (url = '/properties/map?category=homes:condo&offer_type=rent&price_max=20000', extra = {}) => ({
  id: 'test',
  url,
  query: '',
  label: 'ค้นหาทุกทำเล',
  source: 'sheet',
  searchedAt: now,
  ...extra,
})
const listing = (extra = {}) => ({
  id: 1,
  slug: 'condo-one',
  property_type_code: 'condo',
  rent_price_monthly: 18000,
  sale_price: 3000000,
  currency: 'THB',
  bedroom_count: 2,
  bathroom_count: 1,
  latitude: 13.7,
  longitude: 100.6,
  ...extra,
})

test('only meaningful recent searches become preferences; a broad empty submission and old history do not', () => {
  const m = model()
  assert.equal(m.buildPropertyInterests([]).length, 0)
  assert.equal(
    m.buildPropertyInterests([event('/properties/map?channel=homes&offer_type=sale&offer_type=rent')], now).length,
    0
  )
  assert.equal(m.buildPropertyInterests([event(undefined, { searchedAt: now - 91 * day })], now).length, 0)
  assert.equal(m.buildPropertyInterests([event()], now)[0].state.filters.maxPrice, '20000')
  assert.equal(m.buildPropertyInterests([event('/properties/map?price_min=100&price_max=10')], now).length, 0)
})

test('frequency is bounded per day, recency decays and separate budgets stay separate', () => {
  const m = model()
  const repeated = m.buildPropertyInterests(
    Array.from({ length: 100 }, (_, i) => event(undefined, { searchedAt: now - i * 1000 })),
    now
  )
  assert.equal(repeated.length, 1)
  assert.ok(repeated[0].weight <= 3)
  const older = event(undefined, { searchedAt: now - 28 * day })
  const recent = event('/properties/map?category=homes:condo&offer_type=rent&price_max=30000')
  const interests = m.buildPropertyInterests([older, recent], now)
  assert.equal(interests.length, 2)
  assert.equal(interests[0].state.filters.maxPrice, '30000')
})

test('geographic requests use actual bounds, preserve filters and do not turn a place into a title keyword', () => {
  const m = model(),
    interest = m.buildPropertyInterests(
      [
        event(
          '/properties/map?q=บางนา&lat=13.7&lon=100.6&zoom=13&category=homes:condo&offer_type=rent&price_max=20000'
        ),
      ],
      now
    )[0]
  const query = new URLSearchParams(m.preferenceCandidateRequests(interest, 'homes')[0])
  assert.equal(query.has('q'), false)
  assert.equal(query.get('price_max'), '20000')
  assert.ok(Number(query.get('min_lat')) < 13.7)
  assert.ok(Number(query.get('max_lat')) > 13.7)
  assert.equal(query.get('property_type'), 'condo')
  assert.equal(query.get('offer_type'), 'rent')
  assert.equal(m.preferenceCandidateRequests(interest, 'homes', 'sale').length, 0)
})

test('station and project identities are retained and projects cannot recommend unrelated properties', () => {
  const m = model(),
    stations = require('./helpers/transit-stations.cjs').getTransitSearchSuggestions('BTS อารีย์')
  assert.ok(stations.length)
  const station = m.buildPropertyInterests([event('/properties/map?station=' + stations[0].stationId)], now)[0]
  assert.equal(station.radiusKm, 2)
  assert.ok(station.center)
  const project = m.buildPropertyInterests([event('/properties/map?project=known-project')], now)[0]
  assert.equal(new URLSearchParams(m.preferenceCandidateRequests(project, 'all')[0]).get('project'), 'known-project')
  assert.equal(m.matchPropertyInterest(listing(), project), null)
  assert.ok(m.matchPropertyInterest(listing({ project_slug: 'known-project' }), project))
})

test('rental budgets never match sale prices, unknown amounts, daily prices or different currencies', () => {
  const m = model(),
    interest = m.buildPropertyInterests([event()], now)[0]
  const match = m.matchPropertyInterest(listing(), interest)
  assert.deepEqual([...match.offers], ['rent'])
  for (const property of [
    listing({ rent_price_monthly: 25000, sale_price: 18000 }),
    listing({ rent_price_monthly: undefined, sale_price: 18000 }),
    listing({ price_on_request: true, offer_type: 'rent' }),
    listing({
      rent_price_monthly: undefined,
      sale_price: undefined,
      offer_type: 'rent',
      offer_amount: 1000,
      offer_price_unit: 'day',
    }),
    listing({ currency: 'USD' }),
  ])
    assert.equal(m.matchPropertyInterest(property, interest), null)
})

test('type, amenities and geographic radius are enforced, with honest distance reasons', () => {
  const m = model(),
    interest = m.buildPropertyInterests(
      [event('/properties/map?lat=13.7&lon=100.6&zoom=15&category=homes:condo&offer_type=rent&feature=pets_allowed')],
      now
    )[0]
  assert.equal(m.matchPropertyInterest(listing(), interest), null)
  assert.equal(m.matchPropertyInterest(listing({ pet_allowed: true, property_type_code: 'land' }), interest), null)
  assert.equal(m.matchPropertyInterest(listing({ pet_allowed: true, latitude: 18.8 }), interest), null)
  const match = m.matchPropertyInterest(listing({ pet_allowed: true, latitude: 13.71 }), interest)
  assert.ok(match.distanceKm > 1 && match.distanceKm < 2)
  assert.match(m.propertyRecommendationReason(match, true), /1\.1 กม\./)
})

test('recommendations deduplicate candidates, bound the result and tolerate a failed public source', async () => {
  const queries = []
  const m = model(async (url) => {
    queries.push(url)
    const params = new URL(url).searchParams
    if (params.get('price_max') === '30000') throw Error('temporary failure')
    return {
      ok: true,
      json: async () => ({
        listings: [...Array.from({ length: 6 }, (_, id) => listing({ id, slug: 'condo-' + id })), listing({ id: 0 })],
      }),
    }
  })
  const interests = m.buildPropertyInterests(
    [event(), event('/properties/map?category=homes:condo&offer_type=rent&price_max=30000')],
    now
  )
  const result = await m.fetchPropertyRecommendations(interests, 'homes', undefined, new AbortController().signal)
  assert.equal(result.recommendations.length, 4)
  assert.equal(new Set(result.recommendations.map((x) => x.listing.id)).size, 4)
  assert.equal(result.failed, true)
  assert.equal(queries.length, 2)
})

test('cleared interests issue no candidate requests, and cancelled work never yields a recommendation', async () => {
  let calls = 0
  const m = model(async () => {
    calls++
    return { ok: true, json: async () => ({ listings: [listing()] }) }
  })
  const empty = await m.fetchPropertyRecommendations([], 'homes', undefined, new AbortController().signal)
  assert.equal(empty.recommendations.length, 0)
  assert.equal(calls, 0)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    m.fetchPropertyRecommendations(m.buildPropertyInterests([event()], now), 'homes', undefined, controller.signal)
  )
})
