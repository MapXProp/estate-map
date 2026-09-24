const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports = {}, globals = {}) {
  const context = {
    exports: {},
    ...globals,
    require: (id) => {
      if (!(id in imports)) throw new Error('Unexpected import: ' + id)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context
  )
  return context.exports
}

const nav = load('src/lib/propertyNavigation.ts')
const saved = (lookup, globals = {}) =>
  load(
    'src/lib/savedListings.ts',
    {
      '@/lib/auth': {},
      '@/lib/propertySearch': { fetchPropertyListingSummary: lookup },
    },
    globals
  )

test('only the menu and saved pages bypass the account sign-in gate', () => {
  for (const route of ['/account', '/account-savelists']) assert.equal(nav.isPublicAccountPage(route), true)
  for (const route of [
    '/account-listings',
    '/account-password',
    '/account-admin',
    '/account-approvals',
    '/account-organizations',
    '/account-billing',
    '/account-drafts',
    '/account/private',
  ]) {
    assert.equal(nav.isPublicAccountPage(route), false, route)
  }
})

test('bottom navigation follows visitors into menu/saved, but never overlaps listing or map actions', () => {
  for (const route of ['/homes', '/rooms', '/business', '/account', '/account-savelists', '/account-listings'])
    assert.equal(nav.usesMobilePrimaryNavigation(route), true)
  for (const route of ['/properties/map', '/real-estate-listings/sample', '/add-listing/1'])
    assert.equal(nav.usesMobilePrimaryNavigation(route), false)
})

test('guest lookups preserve saved order with a maximum of four public requests in flight', async () => {
  let active = 0,
    peak = 0
  const api = saved(async (id) => {
    active++
    peak = Math.max(peak, active)
    await new Promise((resolve) => setTimeout(resolve, id === 'a' ? 15 : 2))
    active--
    return { slug: id, public_listing_id: 'id-' + id }
  })
  const response = await api.fetchGuestSavedListings(['a', 'b', 'c', 'd', 'e', 'f'])
  assert.equal(peak, 4)
  assert.deepEqual(
    Array.from(response.listings, (listing) => listing.slug),
    ['a', 'b', 'c', 'd', 'e', 'f']
  )
  assert.equal(response.failed, 0)
})

test('missing and failed listings do not remove references or hide successfully loaded favorites', async () => {
  const ids = ['visible', 'offline', 'unpublished']
  const api = saved(async (id) => {
    if (id === 'offline') throw new Error('network')
    return id === 'unpublished' ? null : { slug: id }
  })
  const response = await api.fetchGuestSavedListings(ids)
  assert.deepEqual(
    Array.from(response.listings, (item) => item.slug),
    ['visible']
  )
  assert.equal(response.failed, 1)
  assert.deepEqual(ids, ['visible', 'offline', 'unpublished'])
})

test('empty, duplicate and malformed identifiers cannot trigger unbounded lookups', async () => {
  const calls = []
  const api = saved(async (id) => {
    calls.push(id)
    return { slug: id }
  })
  await api.fetchGuestSavedListings([
    '',
    ' a ',
    'a',
    '/private/path',
    ...Array.from({ length: 120 }, (_, i) => 'id-' + i),
  ])
  assert.equal(calls.length, 100)
  assert.equal(calls[0], 'a')
  calls.length = 0
  await api.fetchGuestSavedListings([])
  assert.equal(calls.length, 0)
})

test('storage failures return a truthful failure and malformed storage is safe to read', () => {
  const blocked = saved(null, {
    window: {},
    localStorage: {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('quota')
      },
      removeItem() {
        throw new Error('blocked')
      },
    },
  })
  assert.equal(blocked.readGuestSavedListings().length, 0)
  assert.equal(blocked.writeGuestSavedListings(['a']), false)
  const malformed = saved(null, { window: {}, localStorage: { getItem: () => '{invalid' } })
  assert.equal(malformed.readGuestSavedListings().length, 0)
})
