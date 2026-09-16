const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, dependencies = {}, globals = {}) {
  const context = {
    exports: {},
    FormData,
    ...globals,
    require: (name) => {
      if (!(name in dependencies)) throw Error(name)
      return dependencies[name]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
    { filename: file }
  )
  return context.exports
}
const taxonomy = load('src/data/propertyTaxonomy.ts')
function setup(draft) {
  const values = new Map([
    ['mapxprop_listing_draft', JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })],
  ])
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  return load(
    'src/lib/listingDraft.ts',
    {
      '@/data/propertyTaxonomy': taxonomy,
      './auth': {},
      './listingImageWatermark': {},
      './listingMediaFormats': load('src/lib/listingMediaFormats.ts'),
    },
    { window: {}, localStorage: storage, sessionStorage: storage }
  )
}
const plain = (value) => JSON.parse(JSON.stringify(value))
const retail = {
  discovery_channel_code: 'business',
  property_type_code: 'retail_space',
  listing_scope: 'space_slot',
  space_type_code: 'event_booth',
  'spaceTypeCodes[]': ['event_booth', 'mall_kiosk'],
  'useCaseCodes[]': ['retail'],
  'offerTypes[]': ['rent'],
  listing_type: 'rent',
  usage_type: 'business',
  eventName: 'Test event',
  'eventRoundStarts[]': ['2026-10-01'],
  'eventRoundEnds[]': ['2026-10-02'],
  listingTitle: 'Test listing',
  latMapPosition: '13.7',
  lngMapPosition: '100.5',
  'listingPhotoUrls[]': ['https://example.test/photo.jpg'],
}

test('switching a retail draft clears obsolete subtypes and category details, preserving location and media', () => {
  const lib = setup(retail)
  lib.resetListingDetailsForCategoryChange('homes', 'condo')
  const draft = lib.getListingDraft()
  for (const key of ['space_type_code', 'spaceTypeCodes[]', 'eventName', 'eventRoundStarts[]'])
    assert.equal(draft[key], undefined)
  for (const key of ['listingTitle', 'latMapPosition', 'lngMapPosition', 'listingPhotoUrls[]'])
    assert.deepEqual(plain(draft[key]), retail[key])
  const form = new FormData()
  Object.entries({
    discovery_channel_code: 'homes',
    property_type_code: 'condo',
    listing_scope: 'single_unit',
    usage_type: 'residence',
    listing_type: 'sale',
    'spaceTypeCodes[]': '',
    'offerTypes[]': 'sale',
    'useCaseCodes[]': 'residential',
  }).forEach(([key, value]) => form.set(key, value))
  const payload = lib.buildCreateListingPayload(lib.saveListingStep(1, form))
  assert.equal(payload.property_type_code, 'condo')
  assert.equal(payload.space_type_code, '')
  assert.deepEqual(plain(payload.space_type_codes), [])
  assert.deepEqual(plain(payload.event_rounds), [])
})

test('clearing and reordering retail choices persists code identity instead of visual position', () => {
  const lib = setup(retail)
  const form = new FormData()
  form.set('space_type_code', 'mall_kiosk')
  form.append('spaceTypeCodes[]', '')
  form.append('spaceTypeCodes[]', 'mall_kiosk')
  form.append('spaceTypeCodes[]', 'shophouse_ground_floor')
  const payload = lib.buildCreateListingPayload(lib.saveListingStep(1, form))
  assert.deepEqual(plain(payload.space_type_codes), ['mall_kiosk', 'shophouse_ground_floor'])
  assert.equal(payload.space_type_code, 'mall_kiosk')
  assert.equal(payload.event_name, '')
  assert.deepEqual(plain(payload.event_rounds), [])
  form.set('space_type_code', '')
  form.set('spaceTypeCodes[]', '')
  const cleared = lib.saveListingStep(1, form)
  assert.equal(cleared['spaceTypeCodes[]'], undefined)
})

test('legacy drafts cannot submit retail event metadata with a non-retail property', () => {
  const lib = setup(retail)
  for (const type of taxonomy.propertyTypes.filter((item) => item.code !== 'retail_space')) {
    const payload = lib.buildCreateListingPayload({ ...retail, property_type_code: type.code })
    assert.deepEqual(plain(payload.space_type_codes), [], type.code)
    assert.equal(payload.event_name, '', type.code)
    assert.deepEqual(plain(payload.event_rounds), [], type.code)
  }
})

test('retail options retain stable codes after moving the ground-floor shop to second place', () => {
  assert.equal(taxonomy.primaryBusinessSpaceTypeCodes.length, 10)
  assert.equal(taxonomy.primaryBusinessSpaceTypeCodes[1], 'shophouse_ground_floor')
  assert.equal(taxonomy.getBusinessSpaceType('mall_kiosk').nameTh, 'ล็อกในห้าง')
  assert.equal(taxonomy.primaryBusinessSpaceTypeCodes.includes('street_food_space'), false)
  const validation = load('src/lib/listingPublishValidation.ts', { '@/data/propertyTaxonomy': taxonomy })
  const retiredDraft = {
    ...retail,
    property_group_code: 'commercial',
    space_type_code: 'street_food_space',
    'spaceTypeCodes[]': ['street_food_space'],
  }
  assert.equal(validation.validateListingDraftForPublish(retiredDraft).code, 'business_space_type_invalid')
  const lib = setup(retail)
  for (const code of taxonomy.primaryBusinessSpaceTypeCodes) {
    const payload = lib.buildCreateListingPayload({ ...retail, space_type_code: code, 'spaceTypeCodes[]': [code] })
    assert.equal(payload.space_type_code, code)
    assert.deepEqual(plain(payload.space_type_codes), [code])
  }
})
