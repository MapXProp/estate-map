const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const jsx = require('react/jsx-runtime')
function load(relative, imports = {}) {
  const filename = path.join(__dirname, '..', relative)
  const context = { exports: {}, URL, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`)
    return imports[name]
  } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context, { filename })
  return context.exports
}
const helpers = load('src/lib/propertyPreviewDetails.ts')
const gallery = load('src/lib/propertyMapPreview.ts')
const fixture = {
  id: 1280, public_listing_id: 'public-1280', slug: 'sam-direct-sale-isaraphap-8z6070',
  title: 'ตึกแถว 4 ชั้นครึ่ง ถนนอิสรภาพ คลองสาน ติดถนน 3 ด้าน',
  description: 'รายละเอียดทรัพย์\n\nตึกแถวติดถนน 3 ด้าน\n\nข้อควรทราบเกี่ยวกับทรัพย์\n\nข้อมูลท้ายประกาศต้องอ่านได้ครบ',
  property_type_code: 'shophouse', address: 'ถนนอิสรภาพ', district: 'คลองสาน', province: 'กรุงเทพมหานคร',
  land_area_sqm: 94.8, offer_amount: 10179000, currency: 'THB', price_unit: 'total',
  contact_name: 'ฝ่ายขาย SAM', organization_name: 'บริษัท บริหารสินทรัพย์สุขุมวิท จำกัด',
  contact_phone: '02-686-1888', contact_phone_secondary: '1443', contact_email: 'sales@sam.or.th',
  line_id: '@samline', instagram_handle: 'sam.test', organization_website_url: 'https://www.sam.or.th',
  category_details: { official_page_reference_code: '8Z6070' },
  media: Array.from({ length: 29 }, (_, index) => ({ media_type: 'image', url: `/photo-${index + 1}.webp`, is_primary: index === 0 })),
}

test('preview exposes real, actionable contact values, including secondary phone and official LINE ID', () => {
  const contacts = helpers.getPropertyPreviewContacts(fixture)
  assert.deepEqual(Array.from(contacts, (c) => c.href), [
    'tel:026861888', 'tel:1443', 'https://line.me/R/ti/p/%40samline',
    'mailto:sales@sam.or.th', 'https://www.instagram.com/sam.test/', 'https://www.sam.or.th/',
  ])
  assert.equal(contacts[0].value, '02-686-1888')
  assert.equal(helpers.getPropertyPreviewContacts({ line_id: 'personal.line' })[0].href, 'https://line.me/R/ti/p/personal.line')
})

test('missing contacts do not become fake phone links; duplicate phones and unsafe URLs are excluded', () => {
  assert.equal(helpers.getPropertyPreviewContacts({}).length, 0)
  const contacts = helpers.getPropertyPreviewContacts({
    contact_phone: '02-686-1888', contact_phone_secondary: '026861888',
    contact_email: 'invalid email', line_id: 'https://not-line.example/', organization_website_url: 'javascript:alert(1)',
  })
  assert.equal(contacts.length, 1)
  assert.equal(contacts[0].href, 'tel:026861888')
})

test('unknown rooms stay absent and land area is not mistaken for usable area', () => {
  const facts = helpers.getPropertyPreviewFacts(fixture, true)
  assert.equal(facts.length, 1)
  assert.equal(facts[0].label, 'ที่ดิน')
  assert.equal(facts[0].value, '23.7 ตร.ว.')
  assert.equal(helpers.getPropertyPreviewFacts({ bedroom_count: 0, bathroom_count: null }, true).length, 0)
})

const common = { react: React, 'react/jsx-runtime': jsx, 'lucide-react': require('lucide-react'), '@/lib/contactAnalytics': load('src/lib/contactAnalytics.ts') }
const Description = load('src/components/PropertyDescription.tsx', common).default
const Contact = load('src/components/property-map/PropertyPreviewContactCard.tsx', {
  ...common, '@/lib/propertyPreviewDetails': helpers,
}).default
function modal(galleryOpen = false) {
  let stateIndex = 0
  return load('src/app/(app)/(categories)/(real-estate)/properties/map/components/PropertyPreviewModal.tsx', {
    ...common,
    react: { ...React, useState: (initial) => [stateIndex++ === 0 ? galleryOpen : initial, () => {}] },
    '@/components/BtnLikeIcon': { default: () => React.createElement('button', null, 'Save') },
    '@/components/PropertyDescription': { default: Description },
    '@/components/property-map/PropertyPreviewContactCard': { default: Contact },
    '@/components/property-map/MobileSheet.module.css': { default: new Proxy({}, { get: (_, key) => String(key) }) },
    '@/hooks/useMobileSheets': { useSwipeDismiss: (onClose) => ({ panelRef: () => {}, backdropRef: () => {}, dismiss: onClose }) },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'th', formatCurrencyFrom: (v) => `${v.toLocaleString('en-US')} บาท` }) },
    '@/data/propertyTaxonomy': load('src/data/propertyTaxonomy.ts'),
    '@/lib/propertyMapPreview': gallery,
    '@/lib/propertyPreviewDetails': helpers,
    '@headlessui/react': {
      Dialog: ({ open, children }) => open ? React.createElement('div', null, children) : null,
      DialogBackdrop: () => null,
      DialogPanel: ({ children, ...props }) => React.createElement('div', props, children),
      DialogTitle: ({ children, className }) => React.createElement('h2', { className }, children),
    },
    'next/image': { default: ({ src, alt, loading }) => React.createElement('img', { src, alt, loading }) },
    'next/navigation': { useRouter: () => ({ back() {} }) },
  }).default
}

test('map detail initially renders three photos, correct total, actual contacts and complete description', () => {
  const html = renderToStaticMarkup(React.createElement(modal(), { listing: fixture }))
  for (const text of ['ดูรูปทั้งหมด · 29 รูป', '02-686-1888', 'sales@sam.or.th', '@samline', '8Z6070', 'ฝ่ายขาย SAM', 'ข้อมูลท้ายประกาศต้องอ่านได้ครบ', '23.7 ตร.ว.']) assert.ok(html.includes(text), text)
  assert.equal((html.match(/<img /g) || []).length, 3)
  assert.ok(!html.includes('0 ห้องนอน'))
  assert.ok(!html.includes('0 ห้องน้ำ'))
  assert.ok(!html.includes('line-clamp-4'))
  assert.ok(!html.includes('ข้อมูลจาก SAM'))
  assert.ok(!html.includes('href="tel:"'))
  assert.ok(html.includes('data-analytics-surface="map_modal"'))
  assert.ok(html.includes('data-analytics-listing-id="public-1280"'))
})

test('opening gallery makes every photo available with lazy loading, including photo 29', () => {
  const html = renderToStaticMarkup(React.createElement(modal(true), { listing: fixture }))
  assert.equal((html.match(/loading="lazy"/g) || []).length, 29)
  assert.ok(html.includes('src="/photo-29.webp"'))
  assert.equal((html.match(/<img /g) || []).length, 32)
})

test('zero and one-photo listings do not repeat images or render empty image/contact URLs', () => {
  const empty = renderToStaticMarkup(React.createElement(modal(), { listing: { ...fixture, media: [], contact_phone: '', contact_phone_secondary: '', contact_email: '', line_id: '', instagram_handle: '', organization_website_url: '' } }))
  assert.ok(empty.includes('ยังไม่มีรูปภาพ'))
  assert.equal((empty.match(/<img /g) || []).length, 0)
  assert.ok(!empty.includes('href="tel:"'))
  const one = renderToStaticMarkup(React.createElement(modal(), { listing: { ...fixture, media: fixture.media.slice(0, 1) } }))
  assert.equal((one.match(/<img /g) || []).length, 1)
})

test('intercepted route requests full listing detail, retaining its full media and contact fields', async () => {
  const requested = []
  const page = load('src/app/(app)/(categories)/(real-estate)/properties/map/@modal/(..)(..)real-estate-listings/[handle]/page.tsx', {
    'react/jsx-runtime': jsx,
    '@/app/(app)/(listings)/real-estate-listings/[handle]/page': { default: () => null },
    '@/lib/propertySearch': { fetchPropertyListingDetail: async (handle) => { requested.push(handle); return fixture } },
    'next/navigation': { notFound() { throw new Error('not found') } },
    '../../../components/FullPropertyDetailView': { default: () => null },
    '../../../components/PropertyPreviewModal': { default: () => null },
  }).default
  const result = await page({ params: Promise.resolve({ handle: fixture.slug }), searchParams: Promise.resolve({}) })
  assert.deepEqual(requested, [fixture.slug])
  assert.equal(result.props.listing.media.length, 29)
  assert.equal(result.props.listing.contact_phone, fixture.contact_phone)
})
