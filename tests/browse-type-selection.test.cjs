const assert = require('node:assert/strict')
const { test } = require('node:test')
const { typeSelection: picker, map } = require('./helpers/property-browse.cjs')
const plain = value => JSON.parse(JSON.stringify(value))

test('every original category remains reachable; land appears once and selects both channels', () => {
  const groups = picker.browseTypeGroups
  assert.deepEqual(plain(groups.map(group => group.code)), ['homes', 'rooms', 'business', 'land'])
  const landButtons = groups.flatMap(group => group.options).filter(option => option.propertyType === 'land')
  assert.equal(landButtons.length, 1)
  const reachable = map.normalizeMapCategories(groups.flatMap(group => group.options.map(option => option.id)))
  assert.deepEqual([...reachable].sort(), [...map.validMapCategoryIds].sort())
  const selected = picker.setBrowseTypeGroup([], 'land', true)
  assert.deepEqual([...selected].sort(), [...map.landMapCategoryIds].sort())
  assert.equal(picker.browseTypeGroupState(selected, 'land').all, true)
})

test('one tap selects a whole group without adding land, and clearing it preserves other groups', () => {
  let selected = picker.setBrowseTypeGroup(['rooms:dormitory'], 'homes', true)
  assert.equal(picker.browseTypeGroupState(selected, 'homes').all, true)
  assert.equal(selected.includes('homes:land'), false)
  assert.equal(selected.includes('rooms:dormitory'), true)
  selected = picker.setBrowseTypeGroup(selected, 'homes', false)
  assert.deepEqual(plain(selected), ['rooms:dormitory'])
})

test('shared-use types retain both IDs but appear only in the business group', () => {
  const selected = map.toggleMapCategory([], 'homes:home_office')
  assert.equal(picker.browseTypeGroupState(selected, 'homes').partial, false)
  assert.equal(picker.browseTypeGroupState(selected, 'business').partial, true)
  assert.equal(picker.browseTypeGroupState(selected, 'homes').count, 0)
  assert.equal(picker.browseTypeGroupState(selected, 'business').count, 1)
  assert.equal(selected.includes('business:home_office'), true)
  assert.deepEqual(plain(picker.setBrowseTypeGroup(selected, 'business', false)), [])
})

test('all categories normalize to one unrestricted state, including old full-selection URLs', () => {
  assert.deepEqual(plain(picker.normalizeBrowseTypeSelection([...map.validMapCategoryIds])), [])
  let selected = []
  for (const group of picker.browseTypeGroups) selected = picker.setBrowseTypeGroup(selected, group.code, true)
  assert.deepEqual(plain(selected), [])
  const condo = map.toggleMapCategory(selected, 'homes:condo')
  assert.deepEqual(plain(condo), ['homes:condo'])
  assert.deepEqual(plain(picker.normalizeBrowseTypeSelection(['unknown', 'homes:condo'])), ['homes:condo'])
})
