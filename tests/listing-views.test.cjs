const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { webcrypto, randomUUID } = require('node:crypto')
const { test } = require('node:test')
const ts = require('typescript')

function harness(fetch) {
  const timers = new Map()
  let next = 0
  const context = {
    exports: {},
    require: () => ({ getAuthApiUrl: (path) => '/apix/' + path }),
    crypto: webcrypto,
    Uint8Array,
    AbortSignal,
    fetch,
    setTimeout: (fn) => {
      timers.set(++next, fn)
      return next
    },
    clearTimeout: (id) => timers.delete(id),
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/listingViews.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context
  )
  return {
    api: context.exports,
    timers,
    tick: () => {
      const callbacks = [...timers.values()]
      timers.clear()
      callbacks.forEach((fn) => fn())
    },
  }
}

test('background tabs, closed previews and Strict Mode cleanup do not record views', () => {
  const { api, timers, tick } = harness()
  const listeners = new Set()
  const doc = {
    visibilityState: 'hidden',
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  }
  let count = 0
  let cleanup = api.scheduleListingOpening(doc, () => count++)
  assert.equal(timers.size, 0)
  doc.visibilityState = 'visible'
  listeners.forEach((fn) => fn())
  assert.equal(timers.size, 1)
  doc.visibilityState = 'hidden'
  listeners.forEach((fn) => fn())
  tick()
  assert.equal(count, 0)
  doc.visibilityState = 'visible'
  listeners.forEach((fn) => fn())
  cleanup()
  tick()
  assert.equal(count, 0)
  cleanup = api.scheduleListingOpening(doc, () => count++)
  tick()
  assert.equal(count, 1)
  listeners.forEach((fn) => fn())
  tick()
  assert.equal(count, 1)
  cleanup()
  assert.equal(listeners.size, 0)
})

test('each refresh/opening can count immediately; only duplicate in-flight event requests coalesce', async () => {
  const calls = []
  const resolvers = []
  const { api } = harness((url, options) => {
    calls.push({ url, ...JSON.parse(options.body) })
    return new Promise((resolve) => resolvers.push(resolve))
  })
  const id = randomUUID(),
    event = api.createListingViewEventID()
  const first = api.recordListingOpening(id, 'map_preview', event)
  const retry = api.recordListingOpening(id, 'map_preview', event)
  assert.equal(first, retry)
  const refresh = api.recordListingOpening(id, 'listing_page', api.createListingViewEventID())
  assert.equal(calls.length, 2)
  assert.notEqual(calls[0].event_id, calls[1].event_id)
  let updates = 0
  const unsubscribe = api.subscribeListingViews(() => updates++)
  resolvers[1]({ ok: true, status: 200, json: async () => ({ view_count: 2 }) })
  await refresh
  resolvers[0]({ ok: true, status: 200, json: async () => ({ view_count: 1 }) })
  await first
  assert.equal(api.getListingViewCount(id, 0), 2)
  assert.equal(updates, 2)
  unsubscribe()
})

test('failed requests never invent counts, and invalid IDs never send requests', async () => {
  let calls = 0
  const { api } = harness(async () => {
    calls++
    throw new Error('offline')
  })
  const id = randomUUID()
  await api.recordListingOpening('bad', 'listing_page', randomUUID())
  assert.equal(calls, 0)
  await api.recordListingOpening(id, 'listing_page', randomUUID())
  assert.equal(calls, 1)
  assert.equal(api.getListingViewCount(id, 0), 0)
  assert.equal(api.getListingViewCount(id, 17), 17)
  assert.equal(api.getListingViewCount(id, NaN), 0)
  assert.equal(new Set(Array.from({ length: 100 }, () => api.createListingViewEventID())).size, 100)
})
