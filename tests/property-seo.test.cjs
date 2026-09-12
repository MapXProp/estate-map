const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports = {}, globals = {}) {
  const context = { exports: {}, process: { env: {} }, ...globals, require: name => {
    if (!(name in imports)) throw Error(`Unexpected import: ${name}`)
    return imports[name]
  } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context)
  return context.exports
}
const seo = load('src/lib/seo.ts')
const taxonomy = load('src/data/propertyTaxonomy.ts')
const catalog = load('src/lib/propertyCatalog.ts', { './seo': seo })
const sitemap = load('src/lib/propertySitemap.ts', { './seo': seo, './propertyCatalog': catalog })
const detailSeo = load('src/lib/propertyListingSeo.ts', { './seo': seo, './propertyCatalog': catalog, '@/data/propertyTaxonomy': taxonomy })
const plain = value => JSON.parse(JSON.stringify(value))
const inventory = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1, slug: `land-${index + 1}`, title: `ที่ดิน ${index + 1}`, property_type_code: 'land',
  province: index < 97 ? 'กรุงเทพมหานคร' : 'ภูเก็ต', offer_type: 'sale', sale_price: 1000000,
  primary_image_url: '/uploads/land.jpg', image_urls: ['/uploads/land.jpg', '/uploads/side.jpg'],
  published_at: '2026-08-01T08:00:00Z', updated_at: '2026-09-11T09:00:00Z',
}))

test('all 100 listings have distinct crawlable pagination URLs and no listings are lost', () => {
  const urls = [], ids = []
  for (let page = 1; page <= Math.ceil(inventory.length / catalog.CATALOG_PAGE_SIZE); page++) {
    urls.push(catalog.catalogPagePath(catalog.CATALOG_PATH, page))
    ids.push(...inventory.slice((page - 1) * catalog.CATALOG_PAGE_SIZE, page * catalog.CATALOG_PAGE_SIZE).map(row => row.id))
  }
  assert.equal(urls[0], '/real-estate-categories/all')
  assert.equal(urls[4], '/real-estate-categories/all?page=5')
  assert.equal(new Set(ids).size, 100)
  for (const invalid of ['0', '-1', '2x', '1.5', '10000000000', ['2', '3'], '']) assert.equal(catalog.catalogPageNumber(invalid), null)
  assert.equal(catalog.catalogPageNumber(undefined), 1)
})

test('type, province and transaction pages show their actual matching inventory', () => {
  const sale = catalog.getPropertyCatalog('for-sale'), rent = catalog.getPropertyCatalog('for-rent')
  assert.equal(catalog.matchesPropertyCatalog(inventory[0], sale), true)
  assert.equal(catalog.matchesPropertyCatalog(inventory[0], rent), false)
  assert.equal(catalog.matchesPropertyCatalog({ ...inventory[0], sale_price: undefined, offer_type: 'rent' }, sale), false)
  assert.equal(catalog.matchesPropertyCatalog({ ...inventory[0], rent_price_monthly: 15000 }, rent), true)
  assert.equal(inventory.filter(row => catalog.matchesPropertyCatalog(row, catalog.getPropertyCatalog('phuket'))).length, 3)
  assert.equal(catalog.matchesPropertyCatalog(inventory[0], catalog.getPropertyCatalog('condos')), false)
})

test('sitemap includes all published permalinks, real modification dates, photos and paginated collections', () => {
  const result = sitemap.buildPropertySitemap(inventory, [{ slug: 'real-company', public_organization_id: 'ORG-1' }])
  const listingEntries = result.filter(entry => entry.url.includes('/real-estate-listings/'))
  assert.equal(listingEntries.length, 100)
  assert.equal(listingEntries[0].lastModified.toISOString(), '2026-09-11T09:00:00.000Z')
  assert.equal(listingEntries[0].images.length, 2)
  assert.ok(result.some(entry => entry.url.endsWith('/real-estate-categories/all?page=5')))
  assert.ok(result.some(entry => entry.url.endsWith('/organizations/real-company')))
  assert.ok(!result.some(entry => entry.url.endsWith('/properties/condos')), 'no empty invented landing pages')
  assert.ok(!result.find(entry => entry.url.endsWith('/homes')).lastModified, 'static pages do not pretend to change each day')
  assert.equal(catalog.validModifiedDate({ published_at: 'not-a-date' }), undefined)
})

function publicReader(responseForOffset) {
  const requested = []
  const api = load('src/lib/publishedProperties.ts', { 'server-only': {}, react: { cache: fn => fn }, './auth': { getAuthApiUrl: path => `https://example.invalid/${path}` } }, {
    URLSearchParams, AbortSignal,
    fetch: async (url) => { const offset = Number(new URL(url).searchParams.get('offset')); requested.push(offset); return responseForOffset(offset) },
  })
  return { ...api, requested }
}
test('public catalogue follows the API page limit past the original 60 records', async () => {
  const api = publicReader(offset => ({ ok: true, json: async () => ({ listings: inventory.slice(offset, offset + 60), total: 100 }) }))
  assert.equal((await api.getPublishedProperties()).length, 100)
  assert.deepEqual(api.requested, [0, 60])
})
test('failed, truncated or repeated API pages throw instead of publishing an incomplete sitemap', async () => {
  await assert.rejects(publicReader(() => ({ ok: false })).getPublishedProperties(), /temporarily unavailable/)
  await assert.rejects(publicReader(() => ({ ok: true, json: async () => ({ listings: inventory.slice(0, 60), total: 100 }) })).getPublishedProperties(), /Incomplete/)
  await assert.rejects(publicReader(() => ({ ok: true, json: async () => ({ listings: inventory.slice(0, 4), total: 100 }) })).getPublishedProperties(), /Incomplete/)
})

const listing = {
  id: 1, public_listing_id: 'property-1', slug: 'real-home', title: 'บ้านใกล้สวน', description: 'บ้าน 2 ชั้น',
  property_type_code: 'detached_house', offer_type: 'sale', offer_amount: 3200000, currency: 'THB',
  price_unit: 'total', province: 'กรุงเทพมหานคร', district: 'บางเขน', address: 'บ้านเลขที่ 12',
  latitude: 13.8, longitude: 100.6, bedroom_count: 0, bathroom_count: 0, land_area_sqm: 200, usable_area_sqm: 120,
  category_details: {}, published_at: '2026-08-01T08:00:00Z', updated_at: '2026-09-11T09:00:00Z',
  media: [{ media_type: 'image', url: '/uploads/home.jpg', is_primary: true }, { media_type: 'video', url: '/uploads/home.mp4' }],
}
test('real estate markup describes the actual property, offer, dates and breadcrumbs without invented reviews', () => {
  const graph = plain(detailSeo.getListingStructuredData(listing))['@graph']
  const page = graph.find(item => item['@type'] === 'RealEstateListing')
  const property = graph.find(item => item['@type'] === 'House')
  const offer = graph.find(item => item['@type'] === 'Offer')
  assert.equal(page.dateModified, '2026-09-11T09:00:00.000Z')
  assert.equal(offer.price, 3200000)
  assert.ok(offer.businessFunction.endsWith('#Sell'))
  assert.equal(property.floorSize.value, 120)
  assert.equal(property.numberOfBedrooms, undefined)
  assert.equal(property.numberOfBathroomsTotal, undefined)
  assert.equal(property.image.length, 1)
  assert.equal(property.aggregateRating, undefined)
  assert.equal(offer.availability, undefined)
})
test('rent pricing is distinguished from selling; price-on-request and booth rent never become a fake ticket price', () => {
  const data = { ...listing, offer_type: 'rent', price_unit: 'month', category_details: { price_on_request: true }, event: { price_on_request: true, rounds: [{ label: 'รอบ 1' }] } }
  const graph = plain(detailSeo.getListingStructuredData(data))['@graph']
  const offer = graph.find(item => item['@type'] === 'Offer')
  assert.ok(offer.businessFunction.endsWith('#LeaseOut'))
  assert.equal(offer.price, undefined)
  assert.equal(graph.some(item => item['@type'] === 'Event'), false)
  assert.ok(detailSeo.getListingSeoDescription(data).includes('สอบถามราคา'))
})
test('collection markup contains exactly the listings visible on its page', () => {
  const schema = catalog.catalogStructuredData('ที่ดิน', '/properties/land?page=2', inventory.slice(24, 48), 24)
  assert.equal(schema.mainEntity.numberOfItems, 24)
  assert.equal(schema.mainEntity.itemListElement[0].position, 25)
  assert.ok(schema.mainEntity.itemListElement[0].url.endsWith('/land-25'))
})

test('homepage renders real listing links and lazy image URLs before browser JavaScript runs', () => {
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const Showcase = load('src/components/property-home/PropertyListingShowcase.tsx', {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    'next/image': { default: ({ src, alt, loading }) => React.createElement('img', { src, alt, loading }) },
    'next/link': { default: ({ href, children }) => React.createElement('a', { href }, children) },
    '@/components/ListingImageFallback': { default: () => null },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'th', formatCurrencyFrom: value => `${value} บาท` }) },
    '@/components/saved-listings/SavedListingsProvider': { useSavedListings: () => ({ isSaved: () => false, isBusy: () => false }) },
    '@/data/propertyTaxonomy': taxonomy,
    '@/lib/propertySearch': { fetchPropertySearch: () => { throw Error('Server cards must not wait for a browser fetch') } },
  }).default
  const html = renderToStaticMarkup(React.createElement(Showcase, { mode: 'homes', initialListings: inventory.slice(0, 12) }))
  assert.equal((html.match(/<article /g) || []).length, 12)
  assert.equal((html.match(/<img /g) || []).length, 12)
  assert.equal((html.match(/loading="lazy"/g) || []).length, 11)
  assert.ok(html.includes('href="/real-estate-listings/land-12"'))
  assert.ok(!html.includes('ยังไม่มีประกาศที่เผยแพร่'))
})
