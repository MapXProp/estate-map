const assert = require('node:assert/strict')
const { test } = require('node:test')
const browse = require('./helpers/property-browse.cjs')
const plain = v => JSON.parse(JSON.stringify(v))
const params = value => new URLSearchParams(value)
const listing = (id, overrides = {}) => ({ id, slug: `listing-${id}`, title: 'Property', sale_price: id * 100000,
  published_at: '2026-09-25T00:00:00Z', ...overrides })

test('card and map URLs preserve categories, intent, budget and advanced filters', () => {
  const state = browse.parseBrowseState(params('q=A%26B&category=homes:condo&offer_type=rent&price_min=10000&price_max=50000&bedrooms=2&bathrooms=2&area_min=40&feature=verified&sort=price_low'))
  const list = new URL(browse.browseHref(state, 3), 'https://mapxprop.com')
  const map = new URL(browse.browseHref(state, 3, true), 'https://mapxprop.com')
  assert.equal(list.pathname, '/real-estate-categories/all')
  assert.equal(map.pathname, '/properties/map')
  assert.equal(list.searchParams.get('page'), '3')
  assert.equal(map.searchParams.has('page'), false)
  assert.deepEqual(plain(browse.parseBrowseState(map.searchParams)), plain(state))
  assert.equal(browse.asBrowseHref(map.pathname + map.search), list.pathname + map.search)
})

test('invalid URL values are ignored and raw channel/type filters normalize to map categories', () => {
  const state = browse.parseBrowseState(params('channel=homes&property_type=condo&offer_type=unknown&price_min=-1&price_max=Infinity&bedrooms=9&feature=nope&sort=nope&category=nope'))
  assert.deepEqual(plain(state.categories), ['homes:condo'])
  assert.deepEqual(plain(state.filters.offerTypes), ['sale', 'rent'])
  assert.equal(state.filters.minPrice + state.filters.maxPrice, '')
  assert.equal(state.filters.bedrooms, 4)
  assert.deepEqual(plain(state.filters.features), [])
  assert.equal(state.sort, 'newest')
  assert.equal(browse.browseHref(browse.parseBrowseState(params(''))), '/real-estate-categories/all')
})

test('price sorting uses the selected offer, puts unknown prices last and breaks ties consistently', () => {
  const rows = [listing(1, { rent_price_monthly: 3000 }), listing(2, { rent_price_monthly: 1000 }),
    listing(3, { price_on_request: true, rent_price_monthly: 500 }), listing(4, { rent_price_monthly: 1000 })]
  const ids = (sort, offers) => plain(browse.sortBrowseListings(rows, sort, offers).map(x => x.id))
  assert.deepEqual(ids('price_low', ['rent']), [4, 2, 1, 3])
  assert.deepEqual(ids('price_high', ['rent']), [1, 4, 2, 3])
  assert.deepEqual(ids('price_low', ['sale']), [1, 2, 4, 3])
  assert.deepEqual(ids('newest', ['sale']), [4, 3, 2, 1])
  assert.deepEqual(rows.map(x => x.id), [1, 2, 3, 4], 'does not mutate cached API data')
})

test('server sorts and applies advanced filters across every API page before returning 24 cards', async () => {
  const rows = Array.from({ length: 75 }, (_, i) => listing(75-i, { bedroom_count: i % 2 ? 1 : 3, is_verified: true }))
  const calls = []
  const api = browse.server(async href => {
    const p = new URL(href).searchParams
    calls.push(p)
    const offset = +p.get('offset')
    return { ok: true, json: async () => ({ listings: rows.slice(offset, offset+60), total: rows.length }) }
  })
  const q = params('offer_type=sale&sort=price_low&bedrooms=2&feature=verified')
  const first = await api.getBrowseResults(q)
  const second = await api.getBrowseResults(q, 2)
  assert.equal(first.total, 38)
  assert.equal(first.listings.length, 24)
  assert.equal(second.listings.length, 14)
  assert.deepEqual(plain([...first.listings, ...second.listings].map(x => x.id)), Array.from({ length: 38 }, (_, i) => i*2+1))
  assert.deepEqual(calls.map(p => p.get('offset')), ['0','60','0','60'])
  assert.equal(calls[0].get('view'), 'map')
  assert.equal(calls[0].get('search_mode'), 'keyword')
  assert.equal(calls[0].get('offer_type'), 'sale')
})

test('overlapping category groups deduplicate listings and transmit precise query filters', async () => {
  const calls = []
  const api = browse.server(async href => {
    const p = new URL(href).searchParams; calls.push(p)
    return { ok: true, json: async () => ({ listings: [listing(1)], total: 1 }) }
  })
  const result = await api.getBrowseResults(params('q=Town&category=homes:condo&category=business:office&price_max=5000000&offer_type=sale'))
  assert.equal(calls.length, 2)
  assert.equal(result.total, 1)
  assert.equal(calls[0].get('q'), 'Town')
  assert.equal(calls[0].get('price_max'), '5000000')
  assert.deepEqual(calls.map(p=>p.get('property_type')), ['condo', 'office'])
})

test('upstream failures and incomplete pages report an error rather than misleading empty results', async () => {
  await assert.rejects(browse.server(async () => ({ ok: false })).getBrowseResults(params('')), /unavailable/)
  await assert.rejects(browse.server(async () => ({ ok: true, json: async () => ({ listings: [listing(1)], total: 100 }) })).getBrowseResults(params('')), /Incomplete/)
  let fetched = false
  const empty = await browse.server(async () => { fetched = true }).getBrowseResults(params('price_min=10&price_max=5'))
  assert.equal(empty.total, 0)
  assert.equal(fetched, false)
})

test('all offers keeps transfer/sublease listings and sends keywords without inferred filters', async () => {
  let sent
  const api = browse.server(async href => {
    sent = new URL(href).searchParams
    return { ok: true, json: async () => ({ listings: [listing(1, { offer_type: 'business_transfer' })], total: 1 }) }
  })
  const query = 'คาเฟ่ ใกล้คอนโด 3 ห้องนอน'
  const result = await api.getBrowseResults(params({ q: query }))
  assert.equal(result.total, 1)
  assert.equal(sent.get('q'), query)
  assert.equal(sent.get('search_mode'), 'keyword')
  for (const key of ['offer_type', 'property_type', 'channel', 'bedrooms', 'price_max']) assert.equal(sent.has(key), false)
})
