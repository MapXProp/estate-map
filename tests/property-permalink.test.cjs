const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

// Exercise the actual API client without browser state or a running backend.
function client(response, status = 200) {
  const requests = []
  const context = {
    exports: {},
    URLSearchParams,
    setTimeout,
    require: () => ({ getAuthApiUrl: (route) => `https://example.invalid/apix/${route}` }),
    fetch: async (url) => {
      requests.push(new URL(url))
      return { ok: status === 200, status, json: async () => response }
    },
  }
  const filename = path.join(__dirname, '../src/lib/propertySearch.ts')
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  vm.runInNewContext(compiled, context, { filename })
  return { fetchSummary: context.exports.fetchPropertyListingSummary, requests }
}

const oldListing = {
  id: 6,
  slug: 'land-for-sale-sutthisan-700-sq-wah',
  public_listing_id: '4eedd824-1c3d-4f39-b076-74ec5d72452b',
}

test('an old permalink requests its identity rather than a recent catalogue page', async () => {
  const { fetchSummary, requests } = client({ listings: [oldListing], total: 1 })
  assert.equal((await fetchSummary(oldListing.slug)).id, 6)
  assert.equal(requests[0].searchParams.get('identifier'), oldListing.slug)
  assert.equal(requests[0].searchParams.get('limit'), '1')
  assert.equal(requests.length, 1)
})

test('a stable public ID resolves the same property', async () => {
  const { fetchSummary } = client({ listings: [oldListing], total: 1 })
  assert.equal((await fetchSummary(oldListing.public_listing_id.toUpperCase())).id, 6)
})

test('missing links and stale API responses never display another property', async () => {
  assert.equal(await client({ listings: [], total: 0 }).fetchSummary('missing'), null)
  assert.equal(await client({ listings: [oldListing], total: 77 }).fetchSummary('another-listing'), null)
  const empty = client({ listings: [oldListing] })
  assert.equal(await empty.fetchSummary('  '), null)
  assert.equal(empty.requests.length, 0)
})

test('an API outage remains an error rather than a missing listing', async () => {
  await assert.rejects(client({}, 503).fetchSummary(oldListing.slug), /property search failed/)
})
