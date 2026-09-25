const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

class ElementFixture {
  constructor(attributes = {}, parent = null) {
    this.attributes = attributes
    this.parent = parent
  }
  getAttribute(name) {
    return this.attributes[name] ?? null
  }
  closest(selector) {
    for (let item = this; item; item = item.parent) {
      if (selector === 'a[href]' && item.attributes.href) return item
      if (selector === '[data-analytics-surface]' && item.attributes['data-analytics-surface']) return item
      if (selector === '[data-analytics-ignore]' && 'data-analytics-ignore' in item.attributes) return item
    }
    return null
  }
}
const consentContext = { exports: {}, Date, Event }
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/analyticsConsent.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  consentContext
)
const consent = consentContext.exports
const context = {
  exports: {},
  URL,
  Set,
  Element: ElementFixture,
  Date,
  require(name) {
    if (name === './analyticsConsent') return consent
    throw Error('Unexpected import: ' + name)
  },
}
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/contactAnalytics.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  context
)
const { initializeAnalytics, getContactMethod, getContactEvent, installContactAnalytics } = context.exports
const plain = (value) => JSON.parse(JSON.stringify(value))
const fixtureWindow = () => ({
  __mapxpropCookieChoice: { version: 1, analytics: true, updatedAt: Date.now() },
  location: {
    href: 'https://mapxprop.com/real-estate-listings/house?source=map',
    origin: 'https://mapxprop.com',
    pathname: '/real-estate-listings/house',
  },
})
const listingId = 'a08c819d-3ea4-4b09-9379-50e26717d440'
const listing = new ElementFixture({
  'data-analytics-surface': 'listing_page',
  'data-analytics-listing-id': listingId,
  'data-analytics-property-type': 'house',
})

test('GA initializes once and preserves the existing Google-compatible queue', () => {
  const win = fixtureWindow()
  const existing = ['existing entry']
  win.dataLayer = existing
  assert.equal(initializeAnalytics('G-SL2JTL4WE7', win), true)
  assert.equal(initializeAnalytics('G-SL2JTL4WE7', win), true)
  assert.equal(win.dataLayer, existing)
  assert.equal(win.dataLayer.length, 4)
  assert.deepEqual(plain(Array.from(win.dataLayer[3])), [
    'config',
    'G-SL2JTL4WE7',
    {
      page_location: win.location.origin + win.location.pathname,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 15552000,
    },
  ])
  assert.equal(initializeAnalytics('invalid-tag<script>', win), false)
  assert.equal(win.dataLayer.length, 4)
})

test('only telephone and exact HTTPS LINE hosts are measured', () => {
  for (const href of ['tel:0812345678', 'tel:+66-81-234-5678', 'TEL:(081) 234 5678'])
    assert.equal(getContactMethod(href), 'phone')
  for (const href of ['https://line.me/R/ti/p/%40contact', 'https://lin.ee/abcdef'])
    assert.equal(getContactMethod(href), 'line')
  for (const href of [
    'tel:',
    'tel:javascript:alert(1)',
    'https://line.me.evil.test/abc',
    'https://evil.test/?line.me',
    'http://line.me/abc',
    'mailto:person@example.com',
    '/real-estate-listings/house',
  ])
    assert.equal(getContactMethod(href), null)
})

test('listing/map context is explicit, and contact values never become analytics parameters', () => {
  const anchor = new ElementFixture({ href: 'https://line.me/R/ti/p/%40private-handle' }, listing)
  const params = plain(getContactEvent(anchor, '/real-estate-listings/house'))
  assert.deepEqual(params, {
    contact_method: 'line',
    contact_surface: 'listing_page',
    listing_id: listingId,
    property_type: 'house',
  })
  assert.ok(!JSON.stringify(params).includes('private-handle'))
  const modal = new ElementFixture({
    'data-analytics-surface': 'map_modal',
    'data-analytics-listing-id': 'another-listing',
    'data-analytics-property-type': 'land',
  })
  assert.equal(
    getContactEvent(new ElementFixture({ href: 'tel:0812345678' }, modal), '/properties/map').listing_id,
    'another-listing'
  )
})

test('gallery portals inherit the displayed listing UUID, but unrelated map routes cannot', () => {
  const gallery = new ElementFixture({ 'data-analytics-surface': 'gallery' })
  const anchor = new ElementFixture({ href: 'tel:0812345678' }, gallery)
  assert.equal(getContactEvent(anchor, '/real-estate-listings/house', listing).listing_id, listingId)
  assert.equal(getContactEvent(anchor, '/real-estate-listings/house', listing).contact_surface, 'gallery')
  assert.equal(getContactEvent(anchor, '/properties/map', listing).listing_id, undefined)
  const sheet = new ElementFixture({
    'data-analytics-surface': 'mobile_contact_sheet',
    'data-analytics-listing-id': listingId,
  })
  assert.equal(
    getContactEvent(new ElementFixture({ href: 'tel:0812345678' }, sheet), '/real-estate-listings/house').listing_id,
    listingId
  )
})

test('private account routes, explicit opt-outs and unsafe metadata are excluded', () => {
  const anchor = new ElementFixture({ href: 'tel:0812345678' }, listing)
  for (const route of ['/account', '/account/saved-listings', '/add-listing/3', '/admin', '/forgot-password'])
    assert.equal(getContactEvent(anchor, route), null)
  assert.equal(
    getContactEvent(new ElementFixture({ href: 'tel:0812345678', 'data-analytics-ignore': '' }), '/contact'),
    null
  )
  const unsafe = new ElementFixture({
    'data-analytics-surface': 'someone@example.com',
    'data-analytics-listing-id': 'name@example.com',
  })
  assert.deepEqual(plain(getContactEvent(new ElementFixture({ href: 'tel:0812345678' }, unsafe), '/contact')), {
    contact_method: 'phone',
    contact_surface: 'site',
  })
})

test('first click queues once before external loading and preserves native link navigation', () => {
  const win = fixtureWindow()
  initializeAnalytics('G-SL2JTL4WE7', win)
  const listeners = new Map()
  const doc = {
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type),
    querySelector: () => listing,
  }
  let loads = 0
  const cleanup = installContactAnalytics(win, doc, () => {
    loads++
    assert.equal(win.dataLayer.at(-1)[1], 'contact_click')
  })
  const anchor = new ElementFixture({ href: 'tel:0812345678' }, listing)
  const icon = new ElementFixture({}, anchor)
  listeners.get('click')({
    target: icon,
    button: 0,
    defaultPrevented: false,
    preventDefault: () => assert.fail('navigation prevented'),
  })
  assert.equal(loads, 1)
  assert.equal(win.dataLayer.length, 4)
  const event = Array.from(win.dataLayer.at(-1))
  assert.equal(event[1], 'contact_click')
  assert.equal(event[2].page_location, 'https://mapxprop.com/real-estate-listings/house')
  assert.ok(!JSON.stringify(event).includes('0812345678'))
  listeners.get('click')({ target: icon, button: 2, defaultPrevented: false })
  listeners.get('click')({ target: icon, button: 0, defaultPrevented: true })
  assert.equal(loads, 1)
  cleanup()
  assert.equal(listeners.size, 0)
})

test('unknown, rejected and expired consent cannot initialize or queue analytics', () => {
  for (const choice of [
    undefined,
    { version: 1, analytics: false, updatedAt: Date.now() },
    { version: 1, analytics: true, updatedAt: Date.now() - consent.CONSENT_MAX_AGE },
  ]) {
    const win = fixtureWindow()
    win.__mapxpropCookieChoice = choice
    assert.equal(initializeAnalytics('G-SL2JTL4WE7', win), false)
    assert.equal(win.dataLayer, undefined)
  }
})
test('withdrawing consent gates an already initialized tag and its contact listener', () => {
  const win = fixtureWindow()
  initializeAnalytics('G-SL2JTL4WE7', win)
  const listeners = new Map()
  const doc = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    querySelector: () => listing,
  }
  const cleanup = installContactAnalytics(win, doc, () => assert.fail('must not load'))
  const before = win.dataLayer.length
  win.__mapxpropCookieChoice = { version: 1, analytics: false, updatedAt: Date.now() }
  assert.equal(initializeAnalytics('G-SL2JTL4WE7', win), false)
  listeners.get('click')({
    target: new ElementFixture({ href: 'tel:0812345678' }, listing),
    button: 0,
    defaultPrevented: false,
  })
  assert.equal(win.dataLayer.length, before)
  cleanup()
})
