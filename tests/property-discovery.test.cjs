const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const path = require('node:path')

function load(relative, imports = {}) {
  const filename = path.join(__dirname, '..', relative)
  const context = {
    exports: {},
    URLSearchParams,
    require: (id) => {
      if (!(id in imports)) throw new Error(`Unexpected import ${id}`)
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

const headerSearch = load('src/lib/propertyHeaderSearch.ts')
const taxonomy = load('src/data/propertyTaxonomy.ts')
const map = load('src/lib/propertyMapSearch.ts', { '@/data/propertyTaxonomy': taxonomy, './propertySearch': {} })
const plain = (value) => JSON.parse(JSON.stringify(value))
const nodes = (node) =>
  Array.isArray(node)
    ? node.flatMap(nodes)
    : node && typeof node === 'object'
      ? [node, ...nodes(node.props?.children)]
      : []

function discovery(mode, locale = 'th') {
  let selected = 'all'
  const Omnibox = () => null
  const component = load('src/components/property-home/PropertyDiscovery.tsx', {
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    react: {
      useState: () => [
        selected,
        (value) => {
          selected = value
        },
      ],
    },
    'next/image': { default: () => null },
    'next/link': { default: () => null },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale }) },
    '@/lib/propertyHeaderSearch': headerSearch,
    './PropertyDiscovery.module.css': { default: {} },
    './DiscoveryHero': { default: 'test-discovery-hero' },
    './PropertySearchOmnibox': { default: Omnibox },
  }).default
  const render = () => nodes(component({ mode }))
  return { render, search: () => render().find((node) => node.type === Omnibox).props }
}

test('discovery searches keep their channel and offer selection with Thai and English preferences', () => {
  for (const locale of ['th', 'en']) {
    for (const channel of ['homes', 'rooms', 'business']) {
      const view = discovery(channel, locale)
      const check = (offers) => {
        const query = 'อารีย์ & B ?offer_type=sale'
        const url = new URL(view.search().buildSearchUrl(query), 'https://mapxprop.com')
        assert.equal(url.pathname, '/properties/map')
        assert.equal(url.searchParams.get('q'), query)
        assert.equal(url.searchParams.get('channel'), channel)
        assert.deepEqual(url.searchParams.getAll('offer_type'), offers)
      }
      check(channel === 'rooms' ? ['rent'] : ['sale', 'rent'])
      const buttons = view.render().filter((node) => node.type === 'button')
      if (channel === 'rooms') {
        assert.equal(buttons.length, 0, 'Monthly rentals must not expose a sale option')
      } else {
        buttons[2].props.onClick()
        check(['rent'])
        buttons[1].props.onClick()
        check(['sale'])
        buttons[0].props.onClick()
        check(['sale', 'rent'])
      }
    }
  }
})

test('every category shortcut opens supported map filters and event booths exclude unrelated retail types', () => {
  for (const channel of ['homes', 'rooms', 'business']) {
    const links = discovery(channel)
      .render()
      .filter((node) => /[?&](property_type|space_type)=/.test(node.props?.href || ''))
    assert.ok(links.length > 0)
    for (const link of links) {
      const params = new URL(link.props.href, 'https://mapxprop.com').searchParams
      const categories = map.initialMapCategories({
        discoveryChannels: params.getAll('channel'),
        propertyTypes: params.getAll('property_type'),
        spaceTypes: params.getAll('space_type'),
      })
      assert.equal(params.get('channel'), channel)
      assert.ok(categories.length > 0, `Unrecognized category link: ${link.props.href}`)
      if (channel === 'rooms') assert.deepEqual(params.getAll('offer_type'), ['rent'])
      if (params.get('space_type') === 'event_booth') assert.deepEqual(plain(categories), ['business:event_booth'])
    }
    if (channel === 'business') assert.ok(links.some((link) => link.props.href.includes('space_type=event_booth')))
  }
})

test('home shortcuts target the requested soi/intersection and business uses a location-only placeholder', () => {
  for (const locale of ['th', 'en']) {
    const links = discovery('homes', locale)
      .render()
      .filter((node) => node.props?.href?.includes('?'))
    const queries = links.map((node) => new URL(node.props.href, 'https://mapxprop.com').searchParams.get('q'))
    assert.ok(queries.includes('ซอยอารีย์ (พหลโยธิน 7)'))
    assert.ok(queries.includes('แยกพระราม 9–รัชดาภิเษก'))
    assert.doesNotMatch(discovery('business', locale).search().placeholder, /โกดังบางนา|warehouse Bang Na/)
  }
})

test('location navigation exposes the station directory beside a map link that preserves the selected offer', () => {
  for (const locale of ['th', 'en']) {
    for (const channel of ['homes', 'rooms', 'business']) {
      const view = discovery(channel, locale)
      if (channel !== 'rooms')
        view
          .render()
          .filter((node) => node.type === 'button')[2]
          .props.onClick()
      const navigation = view.render().find((node) => node.type === 'nav')
      assert.equal(navigation.props['aria-label'], locale === 'th' ? 'ค้นหาตามทำเล' : 'Explore by location')
      const links = nodes(navigation).filter((node) => node.props?.href)
      assert.equal(links.length, 2)
      const mapUrl = new URL(links[0].props.href, 'https://mapxprop.com')
      assert.equal(mapUrl.pathname, '/properties/map')
      assert.equal(mapUrl.searchParams.get('channel'), channel)
      assert.deepEqual(mapUrl.searchParams.getAll('offer_type'), ['rent'])
      assert.equal(links[1].props.href, '/all-transits')
      for (const link of links) {
        assert.ok(link.props['aria-label'], 'Compact icon links need a full accessible label')
        assert.ok(link.props.title)
      }
    }
  }
})
