const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports = {}, globals = {}) {
  const context = {
    exports: {},
    process: { env: {} },
    ...globals,
    require: (name) => {
      if (!(name in imports)) throw Error(`Unexpected import: ${name}`)
      return imports[name]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    context
  )
  return context.exports
}
const seo = load('src/lib/seo.ts')
const discoverySeo = load('src/lib/discoveryPageSeo.ts')
const taxonomy = load('src/data/propertyTaxonomy.ts')
const landingRows = load('src/lib/propertyLandingRows.ts', {}, { URLSearchParams })
const catalog = load('src/lib/propertyCatalog.ts', { './seo': seo })
const sitemap = load('src/lib/propertySitemap.ts', {
  './seo': seo,
  './propertyCatalog': catalog,
  './discoveryPageSeo': discoverySeo,
})
const detailSeo = load('src/lib/propertyListingSeo.ts', {
  './seo': seo,
  './propertyCatalog': catalog,
  '@/data/propertyTaxonomy': taxonomy,
})
const plain = (value) => JSON.parse(JSON.stringify(value))

test('discovery metadata matches its canonical sitemap entry and uses an existing channel image', () => {
  const jsx = require('react/jsx-runtime')
  const entries = sitemap.buildPropertySitemap([], [])
  for (const slug of ['homes', 'rooms', 'business', 'buy', 'rent']) {
    const page = load(`src/app/(app)/(home-pages)/${slug}/page.tsx`, {
      'react/jsx-runtime': jsx,
      '@/components/property-home/PropertyLandingPage': { default: 'landing' },
      '@/lib/discoveryPageSeo': discoverySeo,
      '@/lib/seo': seo,
    })
    const metadata = page.metadata
    const canonical = slug === 'rent' ? '/rooms' : `/${slug}`
    assert.equal(metadata.alternates.canonical, canonical)
    assert.equal(metadata.openGraph.url, canonical)
    assert.equal(metadata.robots.index, true)
    assert.ok(entries.some((entry) => entry.url === seo.absoluteUrl(canonical)))
    assert.ok(metadata.description.length > 60)
    assert.ok(!metadata.description.endsWith('…'), 'Edited copy should fit without automatic truncation')
    for (const image of metadata.openGraph.images) {
      const imagePath = new URL(image).pathname
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', imagePath)), imagePath)
    }
    if (slug === 'rent') {
      assert.equal(page.default().props.channel, 'rooms')
      assert.doesNotMatch(metadata.title + metadata.description, /เช่าบ้าน|บ้านเช่า/)
    }
  }
})

test('transit SEO describes actual coverage and structured line links target the visible headings', () => {
  const lineCatalog = require('../src/data/thailandTransitLines.json').filter((line) => line.status === 'operational')
  const stations = require('../src/data/thailandTransitStations.json').filter(
    (station) => station.status === 'operational'
  )
  const page = load('src/app/(app)/(home-pages)/all-transits/page.tsx', {
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@/components/seo/JsonLd': { default: 'json-ld' },
    '@/components/transit/TransitDirectory': { default: 'directory' },
    '@/lib/seo': seo,
    '@/lib/transitStations': { transitLineCatalog: lineCatalog, transitStations: stations },
  })
  assert.match(page.metadata.title, /กรุงเทพฯ.*ปริมณฑล/)
  assert.ok(page.metadata.description.includes(`${stations.length} สถานี`))
  assert.ok(!page.metadata.description.endsWith('…'))
  const schema = page.default().props.children.find((child) => child.type === 'json-ld').props.data
  assert.equal(schema['@type'], 'CollectionPage')
  assert.equal(schema.url, 'https://mapxprop.com/all-transits')
  assert.equal(schema.mainEntity.numberOfItems, lineCatalog.length)
  assert.deepEqual(
    plain(schema.mainEntity.itemListElement.map((item) => item.url)),
    lineCatalog.map((line) => `https://mapxprop.com/all-transits#line-${line.id}`)
  )
  assert.equal(schema.breadcrumb.itemListElement[0].item, 'https://mapxprop.com/homes')
})

test('organization directory markup lists public organizations and encodes the same canonical identifiers', async () => {
  const organizations = [
    { display_name: 'Nick Property', slug: 'nick-property', public_organization_id: 'ORG-1' },
    { display_name: 'บริษัทตัวอย่าง', slug: '', public_organization_id: 'ORG/2' },
  ]
  const page = load(
    'src/app/(app)/(listings)/organizations/page.tsx',
    {
      'react/jsx-runtime': require('react/jsx-runtime'),
      '@/components/seo/JsonLd': { default: 'json-ld' },
      '@/components/organizations/OrganizationDirectory': { default: 'directory' },
      '@/lib/seo': seo,
      '@/lib/publicOrganizations': { getPublicOrganizations: async () => organizations },
    },
    { encodeURIComponent }
  )
  const tree = await page.default()
  const schema = tree.props.children.find((child) => child.type === 'json-ld').props.data
  const directory = tree.props.children.find((child) => child.type === 'directory')
  assert.equal(schema.mainEntity.numberOfItems, directory.props.initialOrganizations.length)
  assert.deepEqual(plain(schema.mainEntity.itemListElement.map((item) => item.url)), [
    'https://mapxprop.com/organizations/nick-property',
    'https://mapxprop.com/organizations/ORG%2F2',
  ])
  const empty = seo.collectionPageStructuredData({ title: 'ห้องเช่า', description: 'ค้นหาห้องพัก', path: '/rooms' }, [])
  assert.equal(empty.mainEntity.numberOfItems, 0)
  assert.equal(empty.mainEntity.itemListElement.length, 0)
})
test('editorial listing SEO is used for metadata with safe text and falls back when absent', () => {
  const listing = {
    title: 'ชื่อประกาศ',
    property_type_code: 'land',
    offer_type: 'sale',
    offer_amount: 89697000,
    land_area_sqm: 87551.2,
    currency: 'THB',
    district: 'ไทรน้อย',
    province: 'นนทบุรี',
    category_details: {},
  }
  assert.equal(detailSeo.getListingSeoTitle(listing), 'ชื่อประกาศ')
  assert.match(detailSeo.getListingSeoDescription(listing), /89,697,000/)
  const edited = {
    ...listing,
    category_details: {
      seo_title_th: '<b>ขายที่ดินไทรน้อย</b>',
      seo_description_th: 'ที่ดิน 54 ไร่ ราคา 89,697,000 บาท มีบ่อน้ำ 2 บ่อ',
    },
  }
  assert.equal(detailSeo.getListingSeoTitle(edited), 'ขายที่ดินไทรน้อย')
  assert.equal(detailSeo.getListingSeoDescription(edited), edited.category_details.seo_description_th)
  assert.equal(listing.title, 'ชื่อประกาศ')
  assert.equal(detailSeo.getListingSeoTitle({ ...listing, category_details: { seo_title_th: 7 } }), listing.title)
})
const inventory = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  slug: `land-${index + 1}`,
  title: `ที่ดิน ${index + 1}`,
  property_type_code: 'land',
  province: index < 97 ? 'กรุงเทพมหานคร' : 'ภูเก็ต',
  offer_type: 'sale',
  sale_price: 1000000,
  primary_image_url: '/uploads/land.jpg',
  image_urls: ['/uploads/land.jpg', '/uploads/side.jpg'],
  published_at: '2026-08-01T08:00:00Z',
  updated_at: '2026-09-11T09:00:00Z',
}))

test('the public home entry permanently resolves to /homes without accepting unknown cookie destinations', async () => {
  const propertyZone = load('src/lib/propertyZone.ts')
  for (const savedZone of [undefined, '', 'homes', 'unknown', 'https://example.invalid']) {
    const page = load('src/app/(app)/(home-pages)/page.tsx', {
      '@/lib/propertyZone': propertyZone,
      'next/headers': {
        cookies: async () => ({ get: () => (savedZone === undefined ? undefined : { value: savedZone }) }),
      },
      'next/navigation': {
        redirect: (destination) => {
          throw Object.assign(new Error('redirect'), { destination, status: 307 })
        },
        permanentRedirect: (destination) => {
          throw Object.assign(new Error('redirect'), { destination, status: 308 })
        },
      },
    }).default
    await assert.rejects(page(), (error) => error.destination === '/homes' && error.status === 308)
  }
})

test('returning visitors can still change their saved discovery channel after visiting the public entry', async () => {
  let savedZone
  const propertyZone = load('src/lib/propertyZone.ts')
  const page = load('src/app/(app)/(home-pages)/page.tsx', {
    '@/lib/propertyZone': propertyZone,
    'next/headers': {
      cookies: async () => ({ get: () => (savedZone === undefined ? undefined : { value: savedZone }) }),
    },
    'next/navigation': {
      redirect: (destination) => {
        throw Object.assign(new Error('redirect'), { destination, status: 307 })
      },
      permanentRedirect: (destination) => {
        throw Object.assign(new Error('redirect'), { destination, status: 308 })
      },
    },
  }).default
  for (const [zone, destination, status] of [
    [undefined, '/homes', 308],
    ['rooms', '/rooms', 307],
    ['business', '/business', 307],
    ['homes', '/homes', 308],
  ]) {
    savedZone = zone
    await assert.rejects(page(), (error) => error.destination === destination && error.status === status)
  }
})

test('all 100 listings have distinct crawlable pagination URLs and no listings are lost', () => {
  const urls = [],
    ids = []
  for (let page = 1; page <= Math.ceil(inventory.length / catalog.CATALOG_PAGE_SIZE); page++) {
    urls.push(catalog.catalogPagePath(catalog.CATALOG_PATH, page))
    ids.push(
      ...inventory.slice((page - 1) * catalog.CATALOG_PAGE_SIZE, page * catalog.CATALOG_PAGE_SIZE).map((row) => row.id)
    )
  }
  assert.equal(urls[0], '/real-estate-categories/all')
  assert.equal(urls[4], '/real-estate-categories/all?page=5')
  assert.equal(new Set(ids).size, 100)
  for (const invalid of ['0', '-1', '2x', '1.5', '10000000000', ['2', '3'], ''])
    assert.equal(catalog.catalogPageNumber(invalid), null)
  assert.equal(catalog.catalogPageNumber(undefined), 1)
})

test('type, province and transaction pages show their actual matching inventory', () => {
  const sale = catalog.getPropertyCatalog('for-sale'),
    rent = catalog.getPropertyCatalog('for-rent')
  assert.equal(catalog.matchesPropertyCatalog(inventory[0], sale), true)
  assert.equal(catalog.matchesPropertyCatalog(inventory[0], rent), false)
  assert.equal(
    catalog.matchesPropertyCatalog({ ...inventory[0], sale_price: undefined, offer_type: 'rent' }, sale),
    false
  )
  assert.equal(catalog.matchesPropertyCatalog({ ...inventory[0], rent_price_monthly: 15000 }, rent), true)
  assert.equal(
    inventory.filter((row) => catalog.matchesPropertyCatalog(row, catalog.getPropertyCatalog('phuket'))).length,
    3
  )
  assert.equal(catalog.matchesPropertyCatalog(inventory[0], catalog.getPropertyCatalog('condos')), false)
})

test('sitemap includes all published permalinks, real modification dates, photos and paginated collections', () => {
  const result = sitemap.buildPropertySitemap(inventory, [{ slug: 'real-company', public_organization_id: 'ORG-1' }])
  const listingEntries = result.filter((entry) => entry.url.includes('/real-estate-listings/'))
  assert.equal(listingEntries.length, 100)
  assert.equal(listingEntries[0].lastModified.toISOString(), '2026-09-11T09:00:00.000Z')
  assert.equal(listingEntries[0].images.length, 2)
  assert.ok(result.some((entry) => entry.url.endsWith('/real-estate-categories/all?page=5')))
  assert.ok(result.some((entry) => entry.url.endsWith('/organizations/real-company')))
  assert.ok(!result.some((entry) => entry.url.endsWith('/properties/condos')), 'no empty invented landing pages')
  assert.equal(
    result.find((entry) => entry.url.endsWith('/homes')).lastModified.toISOString(),
    '2026-09-18T00:00:00.000Z',
    'use the recorded content revision, not build time'
  )
  assert.ok(!result.find((entry) => entry.url.endsWith('/about')).lastModified, 'omit unknown modification dates')
  assert.ok(!result.some((entry) => entry.url.endsWith('/rent')), 'do not submit the duplicate monthly-rental entry')
  assert.equal(catalog.validModifiedDate({ published_at: 'not-a-date' }), undefined)
})

function publicReader(responseForOffset) {
  const requested = []
  const api = load(
    'src/lib/publishedProperties.ts',
    {
      'server-only': {},
      react: { cache: (fn) => fn },
      './auth': { getAuthApiUrl: (path) => `https://example.invalid/${path}` },
      './propertyLandingRows': landingRows,
    },
    {
      URLSearchParams,
      AbortSignal,
      fetch: async (url) => {
        const offset = Number(new URL(url).searchParams.get('offset'))
        requested.push(offset)
        return responseForOffset(offset)
      },
    }
  )
  return { ...api, requested }
}
test('public catalogue follows the API page limit past the original 60 records', async () => {
  const api = publicReader((offset) => ({
    ok: true,
    json: async () => ({ listings: inventory.slice(offset, offset + 60), total: 100 }),
  }))
  assert.equal((await api.getPublishedProperties()).length, 100)
  assert.deepEqual(api.requested, [0, 60])
})
test('failed, truncated or repeated API pages throw instead of publishing an incomplete sitemap', async () => {
  await assert.rejects(publicReader(() => ({ ok: false })).getPublishedProperties(), /temporarily unavailable/)
  await assert.rejects(
    publicReader(() => ({
      ok: true,
      json: async () => ({ listings: inventory.slice(0, 60), total: 100 }),
    })).getPublishedProperties(),
    /Incomplete/
  )
  await assert.rejects(
    publicReader(() => ({
      ok: true,
      json: async () => ({ listings: inventory.slice(0, 4), total: 100 }),
    })).getPublishedProperties(),
    /Incomplete/
  )
})

const listing = {
  id: 1,
  public_listing_id: 'property-1',
  slug: 'real-home',
  title: 'บ้านใกล้สวน',
  description: 'บ้าน 2 ชั้น',
  property_type_code: 'detached_house',
  offer_type: 'sale',
  offer_amount: 3200000,
  currency: 'THB',
  price_unit: 'total',
  province: 'กรุงเทพมหานคร',
  district: 'บางเขน',
  address: 'บ้านเลขที่ 12',
  latitude: 13.8,
  longitude: 100.6,
  bedroom_count: 0,
  bathroom_count: 0,
  land_area_sqm: 200,
  usable_area_sqm: 120,
  category_details: {},
  published_at: '2026-08-01T08:00:00Z',
  updated_at: '2026-09-11T09:00:00Z',
  media: [
    { media_type: 'image', url: '/uploads/home.jpg', is_primary: true },
    { media_type: 'video', url: '/uploads/home.mp4' },
  ],
}
test('real estate markup describes the actual property, offer, dates and breadcrumbs without invented reviews', () => {
  const graph = plain(detailSeo.getListingStructuredData(listing))['@graph']
  const page = graph.find((item) => item['@type'] === 'RealEstateListing')
  const property = graph.find((item) => item['@type'] === 'House')
  const offer = graph.find((item) => item['@type'] === 'Offer')
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
  const data = {
    ...listing,
    offer_type: 'rent',
    price_unit: 'month',
    category_details: { price_on_request: true },
    event: { price_on_request: true, rounds: [{ label: 'รอบ 1' }] },
  }
  const graph = plain(detailSeo.getListingStructuredData(data))['@graph']
  const offer = graph.find((item) => item['@type'] === 'Offer')
  assert.ok(offer.businessFunction.endsWith('#LeaseOut'))
  assert.equal(offer.price, undefined)
  assert.equal(
    graph.some((item) => item['@type'] === 'Event'),
    false
  )
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
    './PropertyListingShowcase.module.css': { default: {} },
    '@/components/PropertyPrices': require('./helpers/property-prices.cjs').component(),
    '@/lib/propertyPrices': require('./helpers/property-prices.cjs').prices,
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    'next/image': { default: ({ src, alt, loading }) => React.createElement('img', { src, alt, loading }) },
    'next/link': { default: ({ href, children }) => React.createElement('a', { href }, children) },
    '@/components/ListingImageFallback': { default: () => null },
    '@/components/preferences/PreferencesProvider': {
      usePreferences: () => ({ locale: 'th', formatCurrencyFrom: (value) => `${value} บาท` }),
    },
    '@/components/saved-listings/SavedListingsProvider': {
      useSavedListings: () => ({ isSaved: () => false, isBusy: () => false }),
    },
    '@/data/propertyTaxonomy': taxonomy,
    '@/lib/propertyLandingRows': landingRows,
    '@/lib/propertySearch': {
      fetchPropertySearch: () => {
        throw Error('Server cards must not wait for a browser fetch')
      },
    },
  }).default
  const html = renderToStaticMarkup(
    React.createElement(Showcase, {
      mode: 'homes',
      initialRows: landingRows.getPropertyLandingRows('homes').map((row) => ({
        ...row,
        listings: row.id === 'latest' ? inventory.slice(0, 4) : row.id === 'land' ? inventory.slice(0, 8) : [],
      })),
    })
  )
  assert.equal((html.match(/<article /g) || []).length, 8)
  const cardsHtml = [...html.matchAll(/<article [\s\S]*?<\/article>/g)].map(([card]) => card).join('')
  assert.equal((cardsHtml.match(/<img /g) || []).length, 8)
  assert.equal((cardsHtml.match(/loading="lazy"/g) || []).length, 7)
  assert.ok(html.includes('href="/real-estate-listings/land-8"'))
  assert.ok(!html.includes('href="/real-estate-listings/land-9"'))
  assert.deepEqual(
    [...html.matchAll(/data-listing-row="([^"]+)"/g)].map((match) => match[1]),
    ['latest', 'land']
  )
  assert.ok(html.includes('href="/properties/map?channel=homes&amp;property_type=land"'))
  assert.ok(!html.includes('ยังไม่มีประกาศที่เผยแพร่'))
})

test('landing rows cap each category, remove repeated listings, and hide empty categories', () => {
  const rows = landingRows.getPropertyLandingRows('homes').map((row) => ({
    ...row,
    listings: row.id === 'latest' ? inventory.slice(0, 4) : row.id === 'land' ? inventory.slice(0, 8) : [],
  }))
  const result = landingRows.selectPropertyLandingRows(rows)
  assert.deepEqual(plain(result.map((row) => row.id)), ['latest', 'land'])
  assert.deepEqual(plain(result.map((row) => row.listings.length)), [4, 4])
  const ids = result.flatMap((row) => row.listings.map((listing) => listing.id))
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(rows.find((row) => row.id === 'land').listings.length, 8, 'selection never mutates the cache')
  assert.deepEqual(plain(landingRows.selectPropertyLandingRows(rows.map((row) => ({ ...row, listings: [] })))), [])
})

test('every category view-all link retains the same channel, property types and offer as its API request', () => {
  for (const mode of ['all', 'homes', 'rooms', 'business']) {
    for (const offer of [undefined, 'sale', 'rent']) {
      for (const row of landingRows.getPropertyLandingRows(mode)) {
        const options = landingRows.propertyLandingRowOptions(row, mode, offer)
        const url = new URL(landingRows.propertyLandingRowHref(row, mode, offer), 'https://mapxprop.com')
        assert.equal(url.pathname, '/properties/map')
        assert.equal(url.searchParams.get('channel'), options.discoveryChannel || null)
        assert.deepEqual(url.searchParams.getAll('property_type'), plain(options.propertyTypes || []))
        assert.deepEqual(url.searchParams.getAll('offer_type'), plain(options.offerTypes || []))
        assert.equal(options.limit, row.id === 'latest' ? 4 : 8)
      }
    }
  }
})

test('landing server fetches each category independently so recent land cannot crowd out houses or condos', async () => {
  const requested = []
  const house = { ...inventory[0], id: 1001, property_type_code: 'detached_house', slug: 'older-house' }
  const condo = { ...inventory[0], id: 1002, property_type_code: 'condo', slug: 'older-condo' }
  const api = load(
    'src/lib/publishedProperties.ts',
    {
      'server-only': {},
      react: { cache: (fn) => fn },
      './auth': { getAuthApiUrl: (path) => 'https://example.invalid/' + path },
      './propertyLandingRows': landingRows,
    },
    {
      URLSearchParams,
      AbortSignal,
      fetch: async (url) => {
        const params = new URL(url).searchParams
        requested.push(params)
        const types = params.getAll('property_type')
        const listings = types.includes('detached_house')
          ? [house]
          : types.includes('condo')
            ? [condo]
            : types.length && !types.includes('land')
              ? []
              : inventory.slice(0, Number(params.get('limit')))
        return { ok: true, json: async () => ({ listings, total: listings.length }) }
      },
    }
  )
  const rows = landingRows.selectPropertyLandingRows(await api.getPropertyLandingListings('homes', 'sale'))
  assert.deepEqual(plain(rows.map((row) => row.id)), ['latest', 'houses', 'condos', 'land'])
  assert.equal(rows.find((row) => row.id === 'houses').listings[0].slug, 'older-house')
  assert.equal(rows.find((row) => row.id === 'condos').listings[0].slug, 'older-condo')
  assert.equal(rows[0].listings[0].description, '', 'long descriptions stay off card payloads')
  assert.equal(requested.length, 5)
  assert.ok(requested.every((params) => params.get('channel') === 'homes' && params.get('offer_type') === 'sale'))
})
