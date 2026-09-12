const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

function load(relative, imports = {}) {
  const filename = path.join(__dirname, '..', relative)
  const context = {
    exports: {},
    require: (id) => {
      if (!(id in imports)) throw new Error(`Unexpected import: ${id}`)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    context,
    { filename }
  )
  return context.exports
}
const model = load('src/lib/propertyMapPreview.ts')
const plain = (value) => JSON.parse(JSON.stringify(value))

test('photo preview keeps every real image, removes duplicates, and handles empty collections', () => {
  const images = Array.from({ length: 15 }, (_, index) => `https://example.com/photo-${index}.jpg`)
  assert.deepEqual(plain(model.getMapPreviewImages(images[0], [...images, images[0], '', '   '])), images)
  assert.deepEqual(plain(model.getMapPreviewImages(undefined)), [])
  assert.deepEqual(plain(model.getMapPreviewImages('cover.jpg', ['second.jpg'])), ['cover.jpg', 'second.jpg'])
})

test('photo arrows wrap in both directions and remain valid with zero or one image', () => {
  assert.equal(model.stepMapPreviewImage(0, -1, 15), 14)
  assert.equal(model.stepMapPreviewImage(14, 1, 15), 0)
  assert.equal(model.stepMapPreviewImage(0, 1, 1), 0)
  assert.equal(model.stepMapPreviewImage(0, -1, 0), 0)
})

test('full gallery excludes videos and rejects unrelated or unavailable listing responses', () => {
  const detail = {
    slug: 'old-land',
    public_listing_id: 'PUBLIC-6',
    media: [
      { media_type: 'video', url: 'video.mp4' },
      { media_type: 'image', url: 'side.jpg' },
      { media_type: 'image', url: 'front.jpg', is_primary: true },
      { media_type: '360', url: 'tour.jpg' },
    ],
  }
  assert.deepEqual(plain(model.getMapPreviewGallery(detail, 'old-land')), ['front.jpg', 'side.jpg'])
  assert.deepEqual(plain(model.getMapPreviewGallery(detail, 'public-6')), ['front.jpg', 'side.jpg'])
  assert.throws(() => model.getMapPreviewGallery(detail, 'different-listing'), /identity/)
  assert.throws(() => model.getMapPreviewGallery(null, 'old-land'), /identity/)
})

test('preview renders photos, price, area and a separate details link; missing photos remain usable', () => {
  const styles = new Proxy({}, { get: (_, key) => String(key) })
  const Preview = load('src/components/property-map/MapPinPreview.tsx', {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    '@headlessui/react': require('@headlessui/react'),
    'next/image': { default: ({ src, alt, className }) => React.createElement('img', { src, alt, className }) },
    'next/link': {
      default: ({ href, className, children }) => React.createElement('a', { href, className }, children),
    },
    '@/components/preferences/PreferencesProvider': {
      usePreferences: () => ({ locale: 'th', formatCurrencyFrom: (value) => `${value.toLocaleString('en-US')} บาท` }),
    },
    '@/data/propertyTaxonomy': load('src/data/propertyTaxonomy.ts'),
    '@/lib/propertyMapPreview': model,
    '@/lib/propertyReturnNavigation': { rememberPropertyResultsLocation: () => {} },
    '@/lib/propertySearch': {
      fetchPropertyListingDetail: () => {
        throw new Error('Server rendering must not fetch the gallery')
      },
    },
    './MapPinPreview.module.css': { default: styles },
  }).default
  const listing = {
    id: 'real-estate-listing://6',
    handle: 'land-for-sale-sutthisan-700-sq-wah',
    title: 'ขายที่ดิน สุทธิสาร',
    featuredImage: 'https://example.com/land.jpg',
    galleryImgs: [],
    listingCategory: 'ที่ดิน',
    offer: 'ขาย',
    priceAmount: 315000000,
    priceCurrency: 'THB',
    address: 'ถนนสุทธิสาร กรุงเทพ',
    metadataSummary: '700 ตร.ว.',
  }
  const render = (item, props = {}) =>
    renderToStaticMarkup(React.createElement(Preview, { listing: item, onBack() {}, onClose() {}, ...props }))
  const html = render(listing)
  for (const text of [
    '315,000,000 บาท',
    '700 ตร.ว.',
    'ถนนสุทธิสาร กรุงเทพ',
    'กลับไปรายการ',
    'ดูรายละเอียด',
    'ขยายรูปเต็มจอ',
  ])
    assert.ok(html.includes(text), text)
  assert.ok(html.includes(`href="/real-estate-listings/${listing.handle}"`))
  assert.equal((html.match(/<img /g) || []).length, 1)
  const empty = render({ ...listing, featuredImage: '' })
  assert.ok(empty.includes('ยังไม่มีรูปภาพ'))
  assert.ok(empty.includes('ดูรายละเอียด'))
  assert.equal((empty.match(/<img /g) || []).length, 0)
  assert.ok(!html.includes('data-mobile-collapsed'))
  assert.ok(!html.includes('data-map-expand-preview'))
})
