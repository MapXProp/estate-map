const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

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
const api = load('src/lib/propertyHeaderSearch.ts')
const taxonomy = load('src/data/propertyTaxonomy.ts')
const map = load('src/lib/propertyMapSearch.ts', { '@/data/propertyTaxonomy': taxonomy, './propertySearch': {} })
const plain = (value) => JSON.parse(JSON.stringify(value))

test('header defaults include only rental offers for rooms and can search without a location', () => {
  assert.deepEqual(plain(api.defaultHeaderOffers), ['sale', 'rent'])
  for (const channel of ['homes', 'rooms', 'business']) {
    const url = new URL(api.getHeaderMapSearchUrl('', channel, api.defaultHeaderOffers), 'https://mapxprop.com')
    assert.equal(url.pathname, '/properties/map')
    assert.equal(url.searchParams.has('q'), false)
    assert.equal(url.searchParams.get('channel'), channel)
    assert.deepEqual(url.searchParams.getAll('offer_type'), channel === 'rooms' ? ['rent'] : ['sale', 'rent'])
  }
})

test('header offers and channel initialize the matching map filters for both single and combined offers', () => {
  for (const channel of ['homes', 'rooms', 'business']) {
    for (const offers of [['sale'], ['rent'], ['sale', 'rent'], []]) {
      const url = new URL(api.getHeaderMapSearchUrl('อ่อนนุช', channel, offers), 'https://mapxprop.com')
      assert.equal(url.searchParams.get('q'), 'อ่อนนุช')
      assert.deepEqual(
        plain(map.initialMapOfferTypes(url.searchParams.getAll('offer_type'))),
        channel === 'rooms' ? ['rent'] : offers.length ? offers : ['sale', 'rent']
      )
      const selected = map.initialMapCategories({ discoveryChannels: [url.searchParams.get('channel')] })
      const group = map.mapCategoryGroups.find((item) => item.code === channel)
      assert.ok(group.options.every((item) => selected.includes(item.id)))
    }
  }
})

test('search text remains intact and cannot overwrite the selected offer through query characters', () => {
  const query = '  โครงการ A & B / BTS?offer_type=business_transfer #อโศก  '
  const url = new URL(api.getHeaderMapSearchUrl(query, 'homes', ['rent']), 'https://mapxprop.com')
  assert.equal(url.searchParams.get('q'), query.trim())
  assert.deepEqual(url.searchParams.getAll('offer_type'), ['rent'])
  assert.equal(url.hash, '')
  assert.deepEqual([...url.searchParams.keys()], ['q', 'channel', 'offer_type'])
})

test('clicking a header offer selects exactly that offer and submits it, including repeated clicks', () => {
  const find = (node, predicate) => {
    if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean)
    if (!node || typeof node !== 'object') return undefined
    return predicate(node) ? node : find(node.props?.children, predicate)
  }
  for (const channel of ['homes', 'rooms', 'business']) {
    let activeChannel = channel
    let state
    const Omnibox = () => null
    const leaf = () => null
    const header = load('src/components/Header/PropertyHeaderContent.tsx', {
      'react/jsx-runtime': require('react/jsx-runtime'),
      react: {
        useState: (initial) => {
          if (state === undefined) state = initial()
          return [
            state,
            (value) => {
              state = typeof value === 'function' ? value(state) : value
            },
          ]
        },
      },
      'next/navigation': { usePathname: () => `/${activeChannel}` },
      'lucide-react': { House: leaf, KeyRound: leaf },
      '@/components/preferences/PreferencesProvider': {
        usePreferences: () => ({ locale: 'th', propertyZone: activeChannel }),
      },
      '@/components/property-home/PropertySearchOmnibox': { default: Omnibox },
      '@/lib/propertyHeaderSearch': api,
      '@/lib/propertyZone': load('src/lib/propertyZone.ts'),
      '@/shared/Logo': { default: leaf },
      './AvatarDropdown': { default: leaf },
      './CurrLangDropdown': { default: leaf },
      './NotifyDropdown': { default: leaf },
      './PropertyHeaderClassic': { default: leaf },
      './PropertyHeaderContent.module.css': { default: {} },
      './PropertyListingCta': { default: leaf },
      './PropertySiteSwitcher': { default: leaf },
    }).default
    const render = () => {
      const element = header({})
      return element.type(element.props)
    }
    let tree = render()
    assert.deepEqual(plain(state), ['sale', 'rent'])
    const assertRentalOnly = () => {
      assert.ok(!find(tree, (node) => node.props?.['data-header-offer']))
      assert.ok(find(tree, (node) => node.props?.['data-header-offer-fixed'] === 'rent'))
      for (const query of ['', 'อ่อนนุช']) {
        const url = new URL(
          find(tree, (node) => node.type === Omnibox).props.buildSearchUrl(query),
          'https://mapxprop.com'
        )
        assert.equal(url.searchParams.get('channel'), 'rooms')
        assert.deepEqual(url.searchParams.getAll('offer_type'), ['rent'])
      }
    }
    if (channel === 'rooms') {
      assertRentalOnly()
      continue
    }
    for (const clicked of ['sale', 'sale', 'rent', 'rent', 'sale']) {
      const button = find(tree, (node) => node.props?.['data-header-offer'] === clicked)
      assert.ok(button && !button.props.disabled)
      assert.equal(button.props.type, 'button', 'offer controls must not submit their containing search form')
      assert.ok(find(find(tree, (node) => node.type === Omnibox).props.children, (node) => node === button))
      button.props.onClick()
      tree = render()
      for (const offer of ['sale', 'rent']) {
        assert.equal(
          find(tree, (node) => node.props?.['data-header-offer'] === offer).props['aria-pressed'],
          offer === clicked
        )
      }
      const url = new URL(
        find(tree, (node) => node.type === Omnibox).props.buildSearchUrl('อ่อนนุช'),
        'https://mapxprop.com'
      )
      assert.deepEqual(url.searchParams.getAll('offer_type'), [clicked])
      assert.equal(url.searchParams.get('channel'), channel)
      assert.equal(url.searchParams.get('q'), 'อ่อนนุช')
      assert.deepEqual(plain(map.initialMapOfferTypes(url.searchParams.getAll('offer_type'))), [clicked])
    }
    activeChannel = 'rooms'
    tree = render()
    assertRentalOnly()
    activeChannel = channel
    tree = render()
    const restored = new URL(
      find(tree, (node) => node.type === Omnibox).props.buildSearchUrl(''),
      'https://mapxprop.com'
    )
    assert.equal(restored.searchParams.get('channel'), channel)
    assert.deepEqual(restored.searchParams.getAll('offer_type'), ['sale'])
  }
})

test('the header comparison option selects only the supported legacy layout', () => {
  assert.equal(api.getPropertyHeaderLayout('classic'), 'classic')
  for (const value of [null, '', 'search-first', 'unexpected'])
    assert.equal(api.getPropertyHeaderLayout(value), 'search-first')
})
