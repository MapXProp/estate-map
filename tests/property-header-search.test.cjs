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
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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

test('the header starts with buy and rent and can search the selected category without a location', () => {
  assert.deepEqual(plain(api.defaultHeaderOffers), ['sale', 'rent'])
  for (const channel of ['homes', 'rooms', 'business']) {
    const url = new URL(api.getHeaderMapSearchUrl('', channel, api.defaultHeaderOffers), 'https://mapxprop.com')
    assert.equal(url.pathname, '/properties/map')
    assert.equal(url.searchParams.has('q'), false)
    assert.equal(url.searchParams.get('channel'), channel)
    assert.deepEqual(url.searchParams.getAll('offer_type'), ['sale', 'rent'])
  }
})

test('header offers and channel initialize the matching map filters for both single and combined offers', () => {
  for (const channel of ['homes', 'rooms', 'business']) {
    for (const offers of [['sale'], ['rent'], ['sale', 'rent']]) {
      const url = new URL(api.getHeaderMapSearchUrl('อ่อนนุช', channel, offers), 'https://mapxprop.com')
      assert.equal(url.searchParams.get('q'), 'อ่อนนุช')
      assert.deepEqual(plain(map.initialMapOfferTypes(url.searchParams.getAll('offer_type'))), offers)
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

test('primary offer choices allow either or both and never leave a hidden all-offers state', () => {
  const original = ['sale', 'rent']
  const rent = api.toggleHeaderOffer(original, 'sale')
  assert.deepEqual(plain(rent), ['rent'])
  assert.deepEqual(plain(api.toggleHeaderOffer(rent, 'rent')), ['rent'])
  assert.deepEqual(plain(api.toggleHeaderOffer(rent, 'sale')), ['rent', 'sale'])
  assert.deepEqual(original, ['sale', 'rent'])
  const url = new URL(api.getHeaderMapSearchUrl('', 'homes', []), 'https://mapxprop.com')
  assert.deepEqual(url.searchParams.getAll('offer_type'), ['sale', 'rent'])
})

test('the header comparison option selects only the supported legacy layout', () => {
  assert.equal(api.getPropertyHeaderLayout('classic'), 'classic')
  for (const value of [null, '', 'search-first', 'unexpected'])
    assert.equal(api.getPropertyHeaderLayout(value), 'search-first')
})
