const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function loadModule(relative, imports = {}) {
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
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
    { filename }
  )
  return context.exports
}
const taxonomy = loadModule('src/data/propertyTaxonomy.ts')
const model = (
  fetchPropertySearch = async () => {
    throw new Error('Unexpected fetch')
  }
) =>
  loadModule('src/lib/propertyMapSearch.ts', {
    '@/data/propertyTaxonomy': taxonomy,
    './propertySearch': { fetchPropertySearch },
  })
const plain = (value) => JSON.parse(JSON.stringify(value))
const makeListing = (index) => ({
  id: index,
  public_listing_id: `public-${index}`,
  latitude: 13.1 + index / 1000,
  longitude: 100.1,
})

test('all 32 posting choices remain reachable across three groups', () => {
  const groups = model().mapCategoryGroups
  assert.deepEqual(plain(groups.map((group) => [group.code, group.options.length])), [
    ['homes', 7],
    ['rooms', 6],
    ['business', 19],
  ])
  assert.equal(new Set(groups.flatMap((group) => group.options.map((item) => item.id))).size, 32)
})

test('mixed category selections keep each channel tied to its own types', () => {
  const queries = plain(
    model().mapCategoryQueries(['homes:condo', 'business:office', 'business:market_stall', 'rooms:apartment'])
  )
  assert.deepEqual(queries, [
    { discoveryChannel: 'homes', propertyTypes: ['condo'], spaceTypes: [] },
    { discoveryChannel: 'rooms', propertyTypes: ['apartment'], spaceTypes: [] },
    { discoveryChannel: 'business', propertyTypes: ['office'], spaceTypes: ['market_stall'] },
  ])
  assert.deepEqual(plain(model().mapCategoryQueries([])), [{}])
})

test('existing channel/type links select the corresponding visible chips', () => {
  assert.deepEqual(plain(model().initialMapCategories({ discoveryChannels: ['rooms'], propertyTypes: ['condo'] })), [
    'rooms:condo',
  ])
  assert.equal(
    model().initialMapCategories({ discoveryChannels: ['business'], propertyTypes: ['retail_space'] }).length,
    11
  )
  assert.deepEqual(plain(model().initialMapCategories({}, ['invalid', 'homes:land'])), ['homes:land'])
})

test('business sections expose every option once, separating retail from buildings and land', () => {
  const business = model().mapCategoryGroups.find((group) => group.code === 'business')
  assert.deepEqual(plain(business.sections.map((section) => [section.id, section.options.length])), [
    ['buildings', 7],
    ['retail', 11],
    ['land', 1],
  ])
  const ids = business.sections.flatMap((section) => section.options.map((option) => option.id))
  assert.equal(new Set(ids).size, 19)
  assert.deepEqual(plain(ids).sort(), plain(business.options.map((option) => option.id)).sort())
})

test('the land shortcut searches land across all channels and keeps offer filters', async () => {
  const requests = []
  const api = model(async (_query, _signal, options) => {
    requests.push(options)
    return { listings: [makeListing(6)], total: 1 }
  })
  assert.equal(api.isLandOnlyMapSelection([]), false)
  assert.equal(api.isLandOnlyMapSelection(['homes:land']), false)
  assert.equal(api.isLandOnlyMapSelection(api.landMapCategoryIds), true)
  assert.equal(api.isLandOnlyMapSelection([...api.landMapCategoryIds, 'homes:condo']), false)
  const results = await api.fetchCompleteMapSearch(
    '',
    api.landMapCategoryIds,
    { offerTypes: ['sale'] },
    new AbortController().signal
  )
  assert.equal(requests.length, 1)
  assert.equal(requests[0].discoveryChannel, undefined)
  assert.ok(
    requests.every(
      (request) =>
        request.propertyTypes.length === 1 && request.propertyTypes[0] === 'land' && request.offerTypes[0] === 'sale'
    )
  )
  assert.equal(results.length, 1)
})

test('pagination includes all 137 matches and preserves exact coordinates', async () => {
  const inventory = Array.from({ length: 137 }, (_, index) => makeListing(index + 1))
  const requests = []
  const api = model(async (_query, signal, options) => {
    assert.equal(signal.aborted, false)
    requests.push(options)
    return { listings: inventory.slice(options.offset, options.offset + 60), total: inventory.length }
  })
  const result = await api.fetchCompleteMapSearch('', [], { offerTypes: ['sale'] }, new AbortController().signal)
  assert.deepEqual(
    requests.map((request) => request.offset),
    [0, 60, 120]
  )
  assert.ok(requests.every((request) => request.view === 'map' && request.offerTypes[0] === 'sale'))
  assert.deepEqual(plain(result), inventory)
})

test('shared properties across channels create one marker, and subtypes remain an OR choice', async () => {
  const api = model(async (_query, _signal, options) => ({
    listings:
      options.discoveryChannel === 'homes' ? [makeListing(1), makeListing(2)] : [makeListing(2), makeListing(3)],
    total: 2,
  }))
  const result = await api.fetchCompleteMapSearch(
    '',
    ['homes:shophouse', 'business:shophouse'],
    {},
    new AbortController().signal
  )
  assert.equal(result.length, 3)
  assert.equal(new Set(result.map((item) => item.public_listing_id)).size, 3)
})

test('ignored offsets and interrupted pages cannot silently claim complete results', async () => {
  const repeated = model(async () => ({ listings: [makeListing(1)], total: 77 }))
  await assert.rejects(repeated.fetchCompleteMapSearch('', [], {}, new AbortController().signal), /did not advance/)
  const failed = model(async (_query, _signal, options) =>
    options.offset ? { listings: [], total: 77 } : { listings: [makeListing(1)], total: 77 }
  )
  await assert.rejects(failed.fetchCompleteMapSearch('', [], {}, new AbortController().signal), /Incomplete/)
})

test('a cancelled filter request cannot replace newer map results', async () => {
  const controller = new AbortController()
  let progress = false
  const api = model(async () => {
    controller.abort()
    return { listings: [makeListing(1)], total: 1 }
  })
  await assert.rejects(
    api.fetchCompleteMapSearch('', [], {}, controller.signal, () => {
      progress = true
    })
  )
  assert.equal(progress, false)
})

test('missing/invalid coordinates are excluded without inventing a fallback position', () => {
  const { hasMapCoordinates } = model()
  assert.equal(hasMapCoordinates(makeListing(1)), true)
  for (const latitude of [undefined, null, NaN, Infinity, 91, -91])
    assert.equal(hasMapCoordinates({ ...makeListing(1), latitude }), false)
  assert.equal(hasMapCoordinates({ ...makeListing(1), longitude: 181 }), false)
})

test('price sorting follows the selected transaction for a sale-and-rent property', () => {
  const { mapListingPrice } = model()
  const listing = { sale_price: 5000000, rent_price_monthly: 20000, property_type_code: 'condo' }
  assert.equal(mapListingPrice(listing, ['sale']), 5000000)
  assert.equal(mapListingPrice(listing, ['rent']), 20000)
})
