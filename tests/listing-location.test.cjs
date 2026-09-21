const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { load } = require('./helpers/property-prices.cjs')
const presentation = load('src/lib/propertyDetailPresentation.ts')
const shared = { react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': require('lucide-react'), '@/lib/propertyDetailPresentation': presentation }
const Location = load('src/components/property-home/ListingLocationSection.tsx', { ...shared, '@/lib/propertyMapPreview': load('src/lib/propertyMapPreview.ts') }).default
const Description = load('src/components/PropertyDescription.tsx', shared).default
const listing = {
  address: 'ซอย กศน.บ้านคลองห้าร้อย', district: 'ไทรน้อย', province: 'นนทบุรี', latitude: 13.99566, longitude: 100.32616,
  description: 'รายละเอียดทรัพย์\n\nที่ดินสองแปลง\n\nทำเลและการเดินทาง\n\nเข้าจากซอย อบต.ไทรน้อยเก่า\n\nข้อควรทราบเกี่ยวกับทรัพย์\n\nตรวจสอบแนวเขตกับผู้ขาย',
  media: [{ url: '/cover.webp', title: 'ด้านหน้า', role_code: 'cover', media_type: 'image', is_primary: true }, { url: '/map.webp', title: 'แผนที่', role_code: 'map', media_type: 'image' }], nearby_places: [],
}
const render = (props = {}) => renderToStaticMarkup(React.createElement(Location, { listing, isThai: true, ...props }))
test('published map and human address replace coordinates, while Google links retain the exact stored point', () => {
  const html = render()
  const text = html.replace(/<[^>]*>/g, '')
  assert.ok(html.includes('src="/map.webp"'))
  assert.ok(!html.includes('src="/cover.webp"'))
  assert.ok(text.includes('ไทรน้อย') && text.includes('ซอย กศน.บ้านคลองห้าร้อย'))
  assert.ok(!text.includes('13.99566') && !text.includes('100.32616'))
  assert.ok(html.includes('query=13.99566%2C100.32616'))
  assert.ok(html.includes('destination=13.99566%2C100.32616'))
  assert.ok(text.includes('นำทางด้วย Google Maps'))
})
test('moving access information keeps each paragraph once and leaves property notes with the description', () => {
  const description = renderToStaticMarkup(React.createElement(Description, { text: listing.description, sectioned: true, separateLocation: true }))
  const location = render()
  assert.ok(!description.includes('เข้าจากซอย อบต.ไทรน้อยเก่า'))
  assert.ok(description.includes('ตรวจสอบแนวเขตกับผู้ขาย'))
  assert.ok(location.includes('เข้าจากซอย อบต.ไทรน้อยเก่า'))
  assert.ok(!/<details\b|<summary\b|<button\b/.test(location), 'travel information is always visible without folding controls')
  assert.ok(!location.includes('ตรวจสอบแนวเขตกับผู้ขาย'))
  const oldUse = renderToStaticMarkup(React.createElement(Description, { text: listing.description, sectioned: true }))
  assert.ok(oldUse.includes('เข้าจากซอย อบต.ไทรน้อยเก่า'), 'other consumers keep their complete descriptions')
})
test('missing and invalid coordinates never become an invented destination, and photos are labelled as photos', () => {
  for (const latitude of [undefined, NaN, 100]) {
    const html = render({ listing: { ...listing, latitude, media: listing.media.slice(0, 1) } })
    assert.ok(!html.includes('google.com/maps'))
    assert.ok(html.includes('src="/cover.webp"'))
    assert.ok(html.includes('ภาพสถานที่จากประกาศ'))
    assert.ok(html.includes('ไทรน้อย'))
  }
  assert.ok(render({ listing: { ...listing, latitude: 0, longitude: 0 } }).includes('destination=0%2C0'))
  assert.equal(render({ listing: { media: [], nearby_places: [], description: '' } }), '')
})
