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
  assert.deepEqual(plain(model().initialMapCategories({}, ['invalid', 'homes:land'])), ['homes:land', 'business:land'])
})

test('business sections keep land with buildings and expose all 19 choices once', () => {
  const business = model().mapCategoryGroups.find((group) => group.code === 'business')
  assert.deepEqual(plain(business.sections.map((section) => [section.id, section.options.length])), [
    ['buildings', 8],
    ['retail', 11],
  ])
  const ids = business.sections.flatMap((section) => section.options.map((option) => option.id))
  assert.equal(new Set(ids).size, 19)
  assert.deepEqual(plain(ids).sort(), plain(business.options.map((option) => option.id)).sort())
})

test('retail section actions preserve other selections and clear partial selections directly', () => {
  const api = model()
  const retail = api.mapCategoryGroups
    .find((group) => group.code === 'business')
    .sections.find((section) => section.id === 'retail')
  const baseline = ['homes:condo', 'rooms:apartment', 'business:office', ...plain(api.landMapCategoryIds)]
  const partial = [...baseline, retail.options[0].id]
  assert.deepEqual(plain(api.setMapCategorySection(partial, 'business', 'retail', false)), baseline)
  const selected = api.setMapCategorySection(partial, 'business', 'retail', true)
  assert.ok(retail.options.every((option) => selected.includes(option.id)))
  assert.deepEqual(plain(api.setMapCategorySection(selected, 'business', 'retail', true)), plain(selected))
  assert.deepEqual(plain(api.setMapCategorySection(selected, 'business', 'retail', false)), baseline)
})

test('building section actions synchronize land while retaining homes, rooms and retail choices', () => {
  const api = model()
  const buildings = api.mapCategoryGroups
    .find((group) => group.code === 'business')
    .sections.find((section) => section.id === 'buildings')
  const baseline = ['homes:condo', 'rooms:apartment', 'business:market_stall']
  const selected = api.setMapCategorySection(baseline, 'business', 'buildings', true)
  assert.ok(buildings.options.every((option) => selected.includes(option.id)))
  assert.ok(api.landMapCategoryIds.every((id) => selected.includes(id)))
  assert.deepEqual(plain(api.setMapCategorySection(selected, 'business', 'buildings', false)), baseline)
  assert.deepEqual(
    plain(api.setMapCategorySection([...baseline, 'homes:land'], 'business', 'buildings', false)),
    baseline
  )
  assert.deepEqual(plain(api.setMapCategorySection(baseline, 'business', 'unknown', true)), baseline)
})

test('selecting all retail spaces includes legacy listings without a subtype and preserves offer filters', async () => {
  const requests = []
  const api = model(async (_query, _signal, options) => {
    requests.push(options)
    return { listings: [{ ...makeListing(8), property_type_code: 'retail_space' }], total: 1 }
  })
  const selected = api.setMapCategorySection([], 'business', 'retail', true)
  assert.deepEqual(plain(api.mapCategoryQueries(selected)), [
    { discoveryChannel: 'business', propertyTypes: ['retail_space'], spaceTypes: [] },
  ])
  assert.deepEqual(plain(api.mapCategoryQueries([...selected, 'business:office'])), [
    { discoveryChannel: 'business', propertyTypes: ['office', 'retail_space'], spaceTypes: [] },
  ])
  const result = await api.fetchCompleteMapSearch('', selected, { offerTypes: ['rent'] }, new AbortController().signal)
  assert.equal(result.length, 1)
  assert.equal(requests.length, 1)
  assert.deepEqual(plain(requests[0].offerTypes), ['rent'])
  assert.deepEqual(plain(requests[0].propertyTypes), ['retail_space'])
  const cleared = api.setMapCategorySection(selected, 'business', 'retail', false)
  assert.deepEqual(plain(api.mapCategoryQueries([...cleared, 'business:market_stall'])), [
    { discoveryChannel: 'business', propertyTypes: [], spaceTypes: ['market_stall'] },
  ])
})

test('the land shortcut searches land across all channels and keeps offer filters', async () => {
  const requests = []
  const api = model(async (_query, _signal, options) => {
    requests.push(options)
    return { listings: [makeListing(6)], total: 1 }
  })
  assert.equal(api.isLandOnlyMapSelection([]), false)
  assert.equal(api.isLandOnlyMapSelection(['homes:land']), true)
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

test('either land button selects and clears both copies while retaining other categories', () => {
  const api = model()
  for (const id of api.landMapCategoryIds) {
    const selected = api.toggleMapCategory(['homes:condo'], id)
    assert.deepEqual(plain(selected).sort(), ['business:land', 'homes:condo', 'homes:land'])
    assert.equal(api.hasMapLandSelection(selected), true)
    for (const clearId of api.landMapCategoryIds) {
      const cleared = api.toggleMapCategory(selected, clearId)
      assert.deepEqual(plain(cleared), ['homes:condo'])
      assert.equal(api.hasMapLandSelection(cleared), false)
    }
    assert.deepEqual(plain(api.toggleMapCategory(selected, 'homes:condo')).sort(), plain(api.landMapCategoryIds).sort())
    assert.deepEqual(plain(api.toggleMapCategory([id], id)), [])
  }
  assert.deepEqual(plain(api.normalizeMapCategories(['unknown', 'homes:land', 'homes:land'])), [
    'homes:land',
    'business:land',
  ])
  assert.deepEqual(plain(api.toggleMapCategory(['homes:condo'], 'unknown')), ['homes:condo'])
})

test('selecting and clearing whole groups keeps the shared land choice consistent', () => {
  const api = model()
  for (const code of ['homes', 'business']) {
    const selected = api.toggleMapCategoryGroup(['rooms:condo'], code)
    const group = api.mapCategoryGroups.find((item) => item.code === code)
    assert.ok(group.options.every((item) => selected.includes(item.id)))
    assert.ok(api.landMapCategoryIds.every((id) => selected.includes(id)))
    assert.deepEqual(plain(api.toggleMapCategoryGroup(selected, code)), ['rooms:condo'])
  }
  const homesThenBusiness = api.toggleMapCategoryGroup(api.toggleMapCategoryGroup([], 'homes'), 'business')
  const clearedBusiness = api.toggleMapCategoryGroup(homesThenBusiness, 'business')
  assert.deepEqual(
    plain(clearedBusiness).sort(),
    plain(api.mapCategoryGroups.find((group) => group.code === 'homes').options.map((item) => item.id))
      .filter((id) => id !== 'homes:land')
      .sort()
  )
  const roomsSelected = api.toggleMapCategoryGroup(['homes:land'], 'rooms')
  assert.deepEqual(
    plain(api.toggleMapCategoryGroup(roomsSelected, 'rooms')).sort(),
    plain(api.landMapCategoryIds).sort()
  )
})

test('saved single-land links and legacy links initialize both land buttons', () => {
  const api = model()
  for (const id of api.landMapCategoryIds) {
    assert.deepEqual(plain(api.initialMapCategories({}, [id])).sort(), plain(api.landMapCategoryIds).sort())
  }
  for (const discoveryChannel of ['homes', 'business']) {
    assert.deepEqual(
      plain(api.initialMapCategories({ discoveryChannels: [discoveryChannel], propertyTypes: ['land'] })).sort(),
      plain(api.landMapCategoryIds).sort()
    )
  }
  const restored = api.initialMapCategories({}, ['business:land', 'homes:condo'])
  assert.deepEqual(plain(restored).sort(), ['business:land', 'homes:condo', 'homes:land'])
  assert.equal(api.hasMapLandSelection(restored), true)
  assert.equal(api.isLandOnlyMapSelection(restored), false)
})

test('mixed land and other categories query land globally once and preserve search filters', async () => {
  const requests = []
  const land = { ...makeListing(6), property_type_code: 'land', discovery_channels: [] }
  const condo = { ...makeListing(7), property_type_code: 'condo' }
  const api = model(async (query, _signal, options) => {
    requests.push({ query, options })
    return { listings: options.discoveryChannel ? [condo] : [land], total: 1 }
  })
  const categories = ['homes:condo', 'homes:land', 'business:land', 'business:office']
  assert.deepEqual(plain(api.mapCategoryQueries(categories)), [
    { discoveryChannel: 'homes', propertyTypes: ['condo'], spaceTypes: [] },
    { discoveryChannel: 'business', propertyTypes: ['office'], spaceTypes: [] },
    { propertyTypes: ['land'] },
  ])
  const filters = { offerTypes: ['sale', 'rent'], minPrice: '100000', maxPrice: '9000000' }
  const result = await api.fetchCompleteMapSearch('สุทธิสาร', categories, filters, new AbortController().signal)
  assert.equal(requests.length, 3)
  assert.equal(requests.filter(({ options }) => !options.discoveryChannel).length, 1)
  for (const { query, options } of requests) {
    assert.equal(query, 'สุทธิสาร')
    assert.deepEqual(plain(options.offerTypes), filters.offerTypes)
    assert.equal(options.minPrice, filters.minPrice)
    assert.equal(options.maxPrice, filters.maxPrice)
  }
  assert.deepEqual(plain(result.map((item) => item.id)).sort(), [6, 7])
})

test('whole business group still includes legacy listings without a retail subtype and deduplicates land', async () => {
  const legacyRetail = { ...makeListing(8), property_type_code: 'retail_space' }
  const land = { ...makeListing(6), property_type_code: 'land' }
  const api = model(async (_query, _signal, options) => {
    if (options.discoveryChannel === 'business') {
      assert.deepEqual(plain(options.propertyTypes), [])
      assert.deepEqual(plain(options.spaceTypes), [])
      return { listings: [legacyRetail, land], total: 2 }
    }
    assert.equal(options.discoveryChannel, undefined)
    assert.deepEqual(plain(options.propertyTypes), ['land'])
    return { listings: [land], total: 1 }
  })
  const result = await api.fetchCompleteMapSearch(
    '',
    api.toggleMapCategoryGroup([], 'business'),
    {},
    new AbortController().signal
  )
  assert.deepEqual(plain(result.map((item) => item.id)).sort(), [6, 8])
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
