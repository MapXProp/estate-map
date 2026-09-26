const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./helpers/property-prices.cjs')
const { listingPlaces, parseListingCoordinates, sameListingPoint } = load('src/lib/listingLocation.ts', {
  './transitStations': {
    getTransitStation: id => id === 'bts-ari' ? { id } : undefined,
    transitStationPlace: () => ({ lat: 13.7795, lon: 100.5446, address: 'พญาไท กรุงเทพฯ', zoom: 16 }),
  },
})
const place = (label, lat, lon, address = '') => ({ label, place: { lat, lon, address, zoom: 15 } })
test('homonymous places keep their own coordinates and address; text-only results cannot create an invented pin', () => {
  const rows = listingPlaces([place('บ้านสวน', 13.7, 100.5, 'กรุงเทพฯ'), place('บ้านสวน', 18.7, 98.9, 'เชียงใหม่'), place('บ้านสวน', 13.7, 100.5), { label: 'บ้านสวน' }])
  assert.equal(rows.length, 2)
  assert.equal(rows[1].point.lat, 18.7)
  assert.equal(rows[1].address, 'เชียงใหม่')
  assert.equal(rows[0].zoom, 18)
})
test('projects and transit keep exact identities; road/area suggestions retain their wider starting view', () => {
  const rows = listingPlaces([{ label: 'โครงการ', project: { latitude: 13.8, longitude: 100.6, district: 'บางเขน', province: 'กรุงเทพฯ' } }, { label: 'BTS อารีย์', stationId: 'bts-ari' }, { label: 'ถนน', place: { lat: 13.9, lon: 100.7, zoom: 14 } }])
  assert.equal(rows[0].point.lng, 100.6)
  assert.equal(rows[1].point.lat, 13.7795)
  assert.equal(rows[2].zoom, 14)
})
test('missing, nonfinite and out-of-country search coordinates never become selectable pins', () => {
  for (const lat of [undefined, null, NaN, Infinity, 0, 50]) assert.equal(listingPlaces([place('ผิด', lat, 100.5)]).length, 0)
  assert.equal(listingPlaces([{ label: 'โครงการไม่มีพิกัด', project: { latitude: null, longitude: null } }]).length, 0)
})
test('indistinguishable soi geometry results collapse and start wide enough to review the road', () => {
  const rows = listingPlaces([place('ซอยสุขุมวิท 39', 13.7, 100.5), place('ซอยสุขุมวิท 39', 13.71, 100.51), place('ซอยสุขุมวิท 39', 13.72, 100.52, 'อีกเขต')])
  assert.equal(rows.length, 2)
  assert.equal(rows[0].zoom, 16)
  assert.equal(rows[1].address, 'อีกเขต')
})
test('coordinate input preserves precision, rejects swapped/partial/out-of-country pairs, and does not coerce blank values', () => {
  assert.equal(parseListingCoordinates('13.73575135, 100.70620729').lat, 13.73575135)
  assert.equal(parseListingCoordinates(' 13.73575135，100.70620729 ').lng, 100.70620729)
  for (const value of ['', '13.7', '100.5, 13.7', '0,0', '13.7,Infinity', '13.7,100.5 trailing']) assert.equal(parseListingCoordinates(value), null)
  assert.ok(sameListingPoint({ lat: 13.7, lng: 100.5 }, { lat: 13.700000001, lng: 100.5 }))
  assert.ok(!sameListingPoint({ lat: 13.7, lng: 100.5 }, { lat: 13.7001, lng: 100.5 }))
})

test('publish validation cannot turn an unconfirmed or missing coordinate into zero', () => {
  const taxonomy = load('src/data/propertyTaxonomy.ts')
  const validation = load('src/lib/listingPublishValidation.ts', { '@/data/propertyTaxonomy': taxonomy })
  const draft = { discovery_channel_code: 'homes', property_group_code: 'residential', property_type_code: 'condo', listing_scope: 'single_unit', 'offerTypes[]': ['sale'], listingTitle: 'คอนโดทดสอบ', listingDescription: 'รายละเอียดทดสอบ', state: 'กรุงเทพมหานคร' }
  for (const pair of [{}, { latMapPosition: '', lngMapPosition: '' }, { latMapPosition: '13.7', lngMapPosition: '' }, { latMapPosition: ' ', lngMapPosition: '100.5' }]) {
    assert.equal(validation.validateListingDraftForPublish({ ...draft, ...pair }).code, 'location_required')
  }
  assert.notEqual(validation.validateListingDraftForPublish({ ...draft, latMapPosition: '13.73575135', lngMapPosition: '100.57620729' })?.code, 'location_required')
})
