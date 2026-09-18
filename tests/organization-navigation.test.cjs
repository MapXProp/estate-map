const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')

function load(relative, imports = {}) {
  const filename = path.join(__dirname, '..', relative)
  const context = {
    exports: {},
    require: (id) => {
      if (!(id in imports)) throw new Error(`Unexpected import ${id}`)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    context,
    { filename }
  )
  return context.exports
}

const navigation = load('src/lib/propertyNavigation.ts')
const leaf = () => null
const common = (pathname, locale = 'th') => ({
  react: React,
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/navigation': { usePathname: () => pathname },
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  'lucide-react': require('lucide-react'),
  '@/lib/propertyNavigation': navigation,
  '@/components/preferences/PreferencesProvider': {
    usePreferences: () => ({ locale, formatCurrencyFrom: (amount) => `${amount} THB` }),
  },
})
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props))

test('organization index and profiles select the standard property header and footer', () => {
  for (const pathname of [
    '/organizations',
    '/organizations/',
    '/organizations/nick-property',
    '/real-estate-listings/land',
    '/stay-listings/villa',
    '/organizations-old',
  ]) {
    const property = pathname.startsWith('/real-estate-listings/') || navigation.isOrganizationPath(pathname)
    const PropertyHeader = () => null
    const LegacyHeader = () => null
    const PropertyFooter = () => null
    const LegacyFooter = () => null
    const Header = load('src/app/(app)/(listings)/ListingsHeader.tsx', {
      ...common(pathname),
      '@/components/Header/Header': { default: LegacyHeader },
      '@/components/Header/PropertyHeaderPrototype': { default: PropertyHeader },
    }).default
    const Footer = load('src/components/property-home/ListingsFooter.tsx', {
      ...common(pathname),
      '@/components/Footer2': { default: LegacyFooter },
      './PropertyFooterPrototype': { default: PropertyFooter },
    }).default
    assert.equal(Header().type, property ? PropertyHeader : LegacyHeader, pathname)
    assert.equal(Footer().type, property ? PropertyFooter : LegacyFooter, pathname)
    if (property) assert.equal(Footer().props.showListingCta, false)
  }
})

test('organization and home routes show exactly one mobile navigation; listing contact bars remain separate', () => {
  for (const pathname of [
    '/homes',
    '/rooms',
    '/business',
    '/organizations',
    '/organizations/nick-property',
    '/stay-listings/villa',
    '/all-transits',
    '/real-estate-listings/land',
  ]) {
    const Primary = load('src/components/property-home/MobilePrimaryNavigation.tsx', common(pathname)).default
    const Quick = load('src/components/FooterQuickNavigation.tsx', {
      ...common(pathname),
      '@heroicons/react/24/outline': {
        Bars3Icon: leaf,
        HeartIcon: leaf,
        MagnifyingGlassIcon: leaf,
        UserCircleIcon: leaf,
      },
      clsx: { default: require('clsx') },
      'react-use': { useIntersection: () => null },
      './aside': { useAside: () => ({ open: leaf }) },
    }).default
    const primary = render(Primary)
    const quick = render(Quick)
    if (navigation.usesMobilePrimaryNavigation(pathname)) {
      assert.ok(primary.includes('<nav'), pathname)
      assert.equal(quick, '', 'the old bottom bar must not overlap the standard navigation')
      for (const href of ['/', '/properties/map', '/add-listing/1?new=1', '/account-savelists', '/account']) {
        assert.ok(primary.includes(`href="${href}"`))
      }
      assert.equal(primary.includes('aria-current="page"'), ['/homes', '/rooms', '/business'].includes(pathname))
    } else if (pathname.startsWith('/real-estate-listings/')) {
      assert.equal(primary + quick, '', 'the listing retains its dedicated contact bar')
    } else {
      assert.equal(primary, '')
      assert.ok(quick.includes('role="menuitem"'))
    }
  }
})

test('organization mobile headers use property search with its compact setting preserved', () => {
  const MobileSearch = ({ compactMapHeader }) =>
    React.createElement('span', null, compactMapHeader ? 'compact property search' : 'property search')
  for (const pathname of [
    '/organizations',
    '/organizations/nick-property',
    '/homes',
    '/all-transits',
    '/real-estate-listings/land',
  ]) {
    const Header = load('src/components/HeroSearchFormMobile/HeroSearchFormMobile.tsx', {
      ...common(pathname),
      '@/shared/Button': {},
      '@/shared/ButtonPrimary': { default: leaf },
      '@/shared/ButtonThird': { default: leaf },
      '@/utils/getT': { default: {} },
      '@headlessui/react': {},
      '@heroicons/react/24/solid': {},
      '@hugeicons/core-free-icons': {},
      '@hugeicons/react': {},
      clsx: { default: require('clsx') },
      'next/dynamic': { default: () => leaf },
      'react-use': { useTimeoutFn: () => [false, leaf, leaf] },
      '../property-home/MobilePropertySearch': { default: MobileSearch },
    }).default
    assert.equal(render(Header, { compactMapHeader: true }), '<span>compact property search</span>')
    assert.equal(render(Header), '<span>property search</span>')
  }
})

function profile(locale = 'th') {
  return load('src/components/organizations/OrganizationPublicProfile.tsx', {
    ...common('/organizations/example', locale),
    '@/components/ListingImageFallback': { default: leaf },
    '@/data/propertyTaxonomy': { getPropertyType: () => ({ nameTh: 'บ้าน', nameEn: 'House' }) },
    '@/lib/myListings': { getListingMediaUrl: () => '' },
    '@/lib/organizationTaxonomy': { organizationTypeLabel: () => 'Agency', organizationSpecialtyLabel: () => 'Homes' },
    '@/lib/organizations': {},
  }).default
}
const organization = {
  public_organization_id: 'org-id',
  display_name: 'Example Agency',
  organization_type: 'brokerage',
  listing_count: 1,
}

test('profile shortcuts reach focusable sections while listing and contact destinations remain intact', () => {
  for (const locale of ['th', 'en']) {
    const html = render(profile(locale), {
      identifier: 'example',
      initialData: {
        organization,
        contacts: [
          { channel_type: 'phone', channel_value: '081-234-5678' },
          { channel_type: 'line', channel_value: '@example' },
        ],
        listings: [
          {
            public_listing_id: 'listing-id',
            slug: 'example-house',
            title: 'Example house',
            property_type_code: 'house',
            offer_amount: 4200000,
          },
        ],
      },
    })
    for (const id of ['organization-listings', 'organization-contacts']) {
      assert.ok(html.includes(`href="#${id}"`))
      assert.ok(html.includes(`id="${id}" tabindex="-1"`))
    }
    for (const href of [
      '/organizations',
      '/real-estate-listings/example-house',
      'tel:0812345678',
      'https://line.me/R/ti/p/%40example',
    ]) {
      assert.ok(html.includes(`href="${href}"`))
    }
    assert.ok(html.includes('data-analytics-organization-id="org-id"'))
    assert.ok(html.includes(locale === 'th' ? 'ติดต่อองค์กร' : 'Contact organization'))
  }
})

test('organizations without contact details do not present an unusable contact shortcut', () => {
  const props = { identifier: 'example', initialData: { organization, contacts: [], listings: [] } }
  const html = render(profile(), props)
  assert.ok(!html.includes('href="#organization-contacts"'))
  assert.ok(html.includes('href="#organization-listings"'))
  const website = render(profile(), {
    ...props,
    initialData: { ...props.initialData, organization: { ...organization, website_url: 'https://example.com' } },
  })
  assert.ok(website.includes('href="#organization-contacts"'))
  assert.ok(website.includes('href="https://example.com"'))
})
