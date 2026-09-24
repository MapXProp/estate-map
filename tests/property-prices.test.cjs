const assert = require('node:assert/strict')
const { test } = require('node:test')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { prices: api, component, preferences, load } = require('./helpers/property-prices.cjs')
const plain = (value) => JSON.parse(JSON.stringify(value))
const city = {
  sale_price: 11900000,
  rent_price_monthly: 65000,
  offer_type: 'rent',
  offer_amount: 65000,
  price_unit: 'month',
  currency: 'THB',
}

test('the same dual-offer property has both exact prices in search and detail, without duplicating the legacy primary offer', () => {
  const detail = api.getPropertyPrices(city)
  const search = api.getPropertyPrices({
    ...city,
    offer_type: 'sale',
    offer_amount: 11900000,
    offer_price_unit: 'total',
  })
  assert.deepEqual(plain(detail), plain(search))
  assert.deepEqual(plain(detail.map((p) => [p.offerType, p.amount, p.unit])), [
    ['sale', 11900000, 'total'],
    ['rent', 65000, 'month'],
  ])
  assert.equal(api.propertyOffersLabel(detail, true), 'ขาย / เช่า')
  assert.equal(api.propertyOffersLabel(detail, false), 'Sale / Rent')
})

test('buy/rent filters select the actual matching amount; both and unfiltered scopes retain both offers', () => {
  const prices = api.getPropertyPrices(city)
  for (const offers of [[], ['sale', 'rent']])
    assert.deepEqual(plain(api.filterPropertyPrices(prices, offers)), plain(prices))
  assert.equal(api.filterPropertyPrices(prices, ['sale'])[0].amount, 11900000)
  assert.equal(api.filterPropertyPrices(prices, ['rent'])[0].amount, 65000)
  assert.equal(
    api.filterPropertyPrices(api.getPropertyPrices({ sale_price: 5000000 }), ['rent'])[0].amount,
    undefined,
    'never relabel a sale amount as monthly rent'
  )
  assert.equal(prices.length, 2, 'filtering does not mutate the source used when switching back to both')
})

test('single offers and day/week/event rentals retain their periods; zero, missing and request prices never invent an amount', () => {
  for (const [unit, expected] of [
    ['day', '/วัน'],
    ['week', '/สัปดาห์'],
    ['event_period', '/งาน'],
    ['month', '/เดือน'],
  ]) {
    const prices = api.getPropertyPrices({ offer_type: 'rent', offer_amount: 1500, offer_price_unit: unit })
    assert.equal(prices.length, 1)
    assert.equal(api.propertyPricesText(prices, true, preferences().formatCurrencyFrom), `1,500 บาท${expected}`)
  }
  for (const source of [
    { sale_price: 0, rent_price_monthly: -1 },
    {},
    { sale_price: NaN, offer_amount: Infinity },
    { ...city, price_on_request: true },
    { ...city, category_details: { price_on_request: true } },
  ]) {
    const prices = api.getPropertyPrices(source)
    assert.equal(prices.length, 1)
    assert.equal(prices[0].amount, undefined)
    assert.equal(api.propertyPricesText(prices, true, preferences().formatCurrencyFrom), 'สอบถามราคา')
  }
  const sublease = api.getPropertyPrices({ offer_type: 'sublease', offer_amount: 50000, offer_price_unit: 'week' })
  assert.equal(api.filterPropertyPrices(sublease, ['rent'])[0].unit, 'week')
  assert.equal(
    api.getPropertyPrices({ offer_type: 'business_transfer', offer_amount: 500000 })[0].offerType,
    'business_transfer'
  )
})

test('formatted prices retain currency conversion and rental units with optional compact text', () => {
  const prices = api.getPropertyPrices(city)
  assert.equal(
    api.propertyPricesText(prices, true, preferences().formatCurrencyFrom, true),
    'ขาย 11.9 ล้านบาท\nเช่า 65,000 บาท/เดือน'
  )
  assert.equal(
    api.propertyPricesText(prices, true, preferences().formatCurrencyFrom),
    'ขาย 11,900,000 บาท\nเช่า 65,000 บาท/เดือน'
  )
  const converted = (value, currency) => {
    assert.equal(currency, 'THB')
    return `$${(value / 35).toFixed(2)}`
  }
  assert.equal(api.propertyPricesText(prices, false, converted), 'Sale $340000.00\nRent $1857.14/mo')
})

test('map pin text preserves exact amounts and rental periods without sale or rent prefixes', () => {
  const prices = api.getPropertyPrices(city)
  const before = plain(prices)
  assert.equal(api.propertyPinPricesText(prices, true, preferences().formatCurrencyFrom), '11,900,000 บาท\n65,000 บาท/เดือน')
  assert.equal(api.propertyPinPricesText(prices, false, value => `$${value.toLocaleString('en-US')}`), '$11,900,000\n$65,000/mo')
  assert.equal(api.propertyPinPricesText(api.filterPropertyPrices(prices, ['rent']), true, preferences().formatCurrencyFrom), '65,000 บาท/เดือน')
  assert.equal(api.propertyPinPricesText(api.filterPropertyPrices(prices, ['sale']), true, preferences().formatCurrencyFrom), '11,900,000 บาท')
  for (const [unit, expected] of [['day', '/วัน'], ['week', '/สัปดาห์'], ['event_period', '/งาน']]) {
    const rental = api.getPropertyPrices({ offer_type: 'rent', offer_amount: 1500, offer_price_unit: unit })
    assert.equal(api.propertyPinPricesText(rental, true, preferences().formatCurrencyFrom), `1,500 บาท${expected}`)
  }
  assert.equal(api.propertyPinPricesText(api.getPropertyPrices({ ...city, price_on_request: true }), true, preferences().formatCurrencyFrom), 'สอบถามราคา')
  assert.deepEqual(plain(prices), before)
})

test('all card/detail/footer variants render both labeled full amounts in Thai and English without duplicate units', () => {
  for (const locale of ['th', 'en']) {
    const Prices = component({ usePreferences: () => preferences(locale) }).default
    for (const variant of ['card', 'compact', 'detail']) {
      const html = renderToStaticMarkup(React.createElement(Prices, { prices: api.getPropertyPrices(city), variant }))
      for (const amount of ['11,900,000', '65,000']) assert.ok(html.includes(amount), `${variant}: ${amount}`)
      assert.ok(html.includes(locale === 'th' ? '/เดือน' : '/mo'))
      assert.ok(html.includes('data-property-price-offer="sale"'))
      assert.ok(html.includes('data-property-price-offer="rent"'))
      assert.ok(!html.includes('truncate'), 'long prices can wrap instead of losing digits')
    }
  }
})

test('the standalone detail renders both offers in its content, desktop price card and mobile contact bar', () => {
  const provider = { usePreferences: () => preferences() }
  const View = load('src/app/(app)/(listings)/real-estate-listings/[handle]/PropertyListingView.tsx', {
    '@/lib/propertyDetailPresentation': load('src/lib/propertyDetailPresentation.ts'),
    '@/lib/propertyMapPreview': { getMapPreviewGoogleMapsUrl: () => null },
    './PropertyListingView.module.css': { default: {} },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    '@/components/preferences/PreferencesProvider': provider,
    '@/components/PropertyPrices': component(provider),
    '@/lib/propertyPrices': api,
    '@/components/ListingImageFallback': { default: () => null },
    '@/components/ListingViewCount': { default: () => null },
    '@/components/PropertyDescription': { default: () => null },
    '@/components/property-home/ListingContactDetails': { default: () => null },
    '@/lib/propertyPreviewDetails': load('src/lib/propertyPreviewDetails.ts'),
    '@/components/property-home/ListingLocationSection': { default: () => null },
    '@/data/propertyTaxonomy': {
      getPropertyType: () => ({ nameTh: 'บ้านเดี่ยว' }),
      normalizeLegacyPropertyType: (code) => code,
    },
    '@/lib/contactAnalytics': { listingAnalyticsAttributes: () => ({}) },
    '@/lib/propertySearch': { getPropertyMapSearchUrl: (query) => `/properties/map?q=${encodeURIComponent(query)}` },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    '../../components/HeaderGallery': { default: () => null },
    '../../components/MobileListingActionBar': load('src/app/(app)/(listings)/components/MobileListingActionBar.tsx', {
      react: React,
      'react/jsx-runtime': require('react/jsx-runtime'),
      'lucide-react': require('lucide-react'),
      '@/components/PropertyPrices': component(provider),
      '@/lib/propertyPrices': api,
      './MobileListingActionBar.module.css': { default: {} },
      './ListingContactSheetContext': { ListingContactSheetContext: React.createContext(null) },
    }),
    '../../components/MobileListingContactSheet': { default: () => React.createElement('button', null, 'ติดต่อ') },
  }).default
  const html = renderToStaticMarkup(
    React.createElement(View, {
      listing: {
        ...city,
        id: 1,
        slug: 'the-city',
        public_listing_id: 'city-id',
        title: 'THE CITY',
        description: '',
        property_type_code: 'detached_house',
        address: '',
        subdistrict: '',
        district: '',
        province: '',
        postal_code: '',
        contact_name: 'Agent',
        contact_phone: '020000000',
        contact_email: '',
        line_id: '',
        contact_role_code: 'independent_broker',
        media: [],
        amenities: [],
        category_details: {},
        nearby_places: [],
        transaction_terms: [],
      },
    })
  )
  assert.equal((html.match(/data-property-prices="2"/g) || []).length, 3)
  assert.equal((html.match(/11,900,000 บาท/g) || []).length, 3)
  assert.equal((html.match(/65,000 บาท\/เดือน/g) || []).length, 3)
  assert.ok(html.includes('ขาย / เช่า'))
  assert.ok(html.includes('data-listing-drag-handle'), 'price dock opens contact channels without a direct call')
})

test('map result cards show two offers together, and a rent-only card cannot display the sale amount', () => {
  const provider = { usePreferences: () => preferences() }
  const Card = load('src/components/property-map/MapResultCard.tsx', {
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    '@/components/preferences/PreferencesProvider': provider,
    '@/components/PropertyPrices': component(provider),
    '@/lib/propertyPrices': api,
    '@/data/propertyTaxonomy': { getPropertyType: () => ({ nameEn: 'House' }), offerTypes: [] },
    '@/lib/propertyReturnNavigation': { rememberPropertyResultsLocation() {} },
    'next/image': { default: () => null },
    'next/link': { default: ({ children, scroll, ...props }) => React.createElement('a', props, children) },
  }).default
  const prices = api.getPropertyPrices(city)
  const render = (selected) =>
    renderToStaticMarkup(
      React.createElement(Card, {
        listing: {
          id: 'city',
          handle: 'the-city',
          title: 'THE CITY',
          listingCategory: 'บ้านเดี่ยว',
          prices: selected,
        },
        onHover() {},
      })
    )
  assert.ok(render(prices).includes('ขาย / เช่า'))
  assert.ok(render(prices).includes('11,900,000 บาท'))
  const rental = render(api.filterPropertyPrices(prices, ['rent']))
  assert.ok(rental.includes('65,000 บาท/เดือน'))
  assert.ok(!rental.includes('11,900,000'))
})
