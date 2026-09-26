const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

function load(file, imports = {}) {
  const context = {
    exports: {},
    URL,
    require(id) {
      assert.ok(id in imports, id)
      return imports[id]
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
const contacts = load('src/lib/propertyPreviewDetails.ts')
const shared = load('src/components/property-home/ListingContactDetails.tsx', {
  '@/components/account/AccountAvatar': { default: ({ name }) => React.createElement('span', null, name?.[0]) },
  'react/jsx-runtime': require('react/jsx-runtime'),
  'lucide-react': require('lucide-react'),
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  '@/lib/propertyPreviewDetails': contacts,
})
const sample = {
  public_listing_id: 'contact-fixture',
  property_type_code: 'condo',
  contact_name: 'Example Realty',
  contact_phone: '095-000-0000',
  contact_phone_secondary: '1443',
  contact_email: 'hello@example.com',
  line_id: 'personal.id',
  instagram_handle: '@example.real',
  organization_website_url: 'https://example.com/',
  organization_name: 'Example Realty',
  organization_public_id: 'example',
  organization_verification_status: 'verified',
  contact_verification_status: 'identity_verified',
}
const render = (props = {}, Component = shared.default) =>
  renderToStaticMarkup(React.createElement(Component, { listing: sample, isThai: true, ...props }))
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]).sort()

test('complete public contact channels have the same destinations in map and standalone cards', () => {
  const Card = load('src/components/property-map/PropertyPreviewContactCard.tsx', {
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    '@/lib/contactAnalytics': { listingAnalyticsAttributes: () => ({ 'data-analytics-surface': 'map_modal' }) },
    '@/components/property-home/ListingContactDetails': shared,
  }).default
  const page = render(),
    map = render({ price: '9,500,000 บาท' }, Card)
  assert.deepEqual(hrefs(map), hrefs(page))
  for (const href of [
    'tel:0950000000',
    'tel:1443',
    'mailto:hello@example.com',
    'https://line.me/R/ti/p/personal.id',
    'https://www.instagram.com/example.real/',
    'https://example.com/',
  ])
    assert.ok(hrefs(page).includes(href), href)
  assert.ok(page.includes('ดูข้อมูลองค์กร'))
  assert.ok(page.includes('องค์กรตรวจสอบแล้ว'))
  assert.ok(page.includes('ยืนยันตัวตนแล้ว'))
  assert.ok(!page.includes('ตรวจสอบตัวตนและสิทธิแล้ว'), 'organization verification must not imply contact authority')
})

test('phone and email start in native closed disclosures; revealing is separate from calling', () => {
  const html = render()
  assert.equal((html.match(/data-contact-disclosure=/g) || []).length, 2, 'both phone numbers share one disclosure')
  assert.ok(!/<details[^>]*\sopen(?:[ =>])/.test(html))
  assert.ok(html.includes('ดูเบอร์โทร') && html.includes('ดูอีเมล'))
  assert.ok(html.includes('โทรเบอร์สำรอง') && html.includes('095-000-0000'))
  for (const summary of html.matchAll(/<summary[\s\S]*?<\/summary>/g))
    assert.ok(!summary[0].includes('href='), 'opening a disclosure is not a contact action')
  const direct = render({ revealOnRequest: false }, shared.ListingContactChannels)
  const collapsible = render({}, shared.ListingContactChannels)
  assert.ok(!direct.includes('<details'))
  assert.deepEqual(hrefs(direct), hrefs(collapsible), 'explicitly opened contact panels retain every channel')
})

test('missing, duplicate, and invalid contact data do not create empty or unsafe actions', () => {
  const listing = {
    ...sample,
    contact_phone_secondary: '0950000000',
    contact_email: 'invalid',
    line_id: 'https://not-line.example/test',
    instagram_handle: 'https://bad.example',
    organization_website_url: 'javascript:alert(1)',
    organization_verification_status: 'unverified',
    contact_verification_status: 'unverified',
  }
  const html = render({ listing })
  assert.equal((html.match(/href="tel:/g) || []).length, 1)
  assert.ok(!html.includes('mailto:') && !html.includes('javascript:') && !html.includes('instagram.com'))
  assert.ok(!html.includes('องค์กรตรวจสอบแล้ว') && !html.includes('ยืนยันตัวตนแล้ว'))
  const empty = render({ listing: {} }, shared.ListingContactChannels)
  assert.equal(hrefs(empty).length, 0)
  assert.ok(empty.includes('ยังไม่มีช่องทางติดต่อ'))
})

test('English contact actions remain clear and preserve public LINE official account IDs', () => {
  const html = render({ isThai: false, listing: { ...sample, line_id: '@official' } })
  assert.ok(html.includes('Contact and viewings') && html.includes('Show phone numbers') && html.includes('Show email'))
  assert.ok(html.includes('https://line.me/R/ti/p/%40official'))
  assert.ok(html.includes('rel="noopener noreferrer"'))
})
