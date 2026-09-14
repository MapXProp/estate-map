const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports = {}, globals = {}) {
  const context = {
    exports: {},
    URLSearchParams,
    AbortSignal,
    AbortController,
    ...globals,
    require: (id) => {
      if (!(id in imports)) throw Error(id)
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
const model = load('src/lib/mapAreaLabel.ts')
const sample = { province: 'กรุงเทพมหานคร', district: 'เขตสาทร', subdistrict: 'แขวงยานนาวา' }
const plain = (value) => JSON.parse(JSON.stringify(value))

function routeHarness(config = {}) {
  let quotaCalls = 0
  const requests = []
  const route = load(
    'src/app/api/map-area-label/route.ts',
    {
      '@/lib/mapAreaLabel': model,
      '@/lib/server/longdoQuota': {
        getLongdoApiKey: () => (config.noKey ? '' : 'private-test-key'),
        takeLongdoQuota: () => {
          quotaCalls++
          return !config.limited
        },
        longdoNoStoreHeaders: { 'Cache-Control': 'private, no-store' },
      },
      'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    },
    {
      fetch: async (url, options) => {
        requests.push({ url, options })
        return config.fetch
          ? config.fetch(url, options)
          : { ok: true, json: async () => ({ ...sample, road: 'private address', key: 'not forwarded' }) }
      },
    }
  )
  return {
    requests,
    quotaCalls: () => quotaCalls,
    get: (query = 'lat=13.723&lon=100.526&locale=th') =>
      route.GET({ nextUrl: new URL(`https://mapxprop.com/api/map-area-label?${query}`) }),
  }
}

test('area labels use districts at street zoom and provinces at wider zoom', () => {
  assert.equal(model.formatMapArea(sample, 15, 'th'), 'สาทร · กรุงเทพมหานคร')
  assert.equal(model.formatMapArea(sample, 10, 'th'), 'กรุงเทพมหานคร')
  assert.equal(model.formatMapArea(null, 15, 'th'), '')
  assert.equal(
    model.formatMapArea({ province: 'Bangkok', district: 'Sathon', subdistrict: '' }, 15, 'en'),
    'Sathon · Bangkok'
  )
  assert.equal(model.readMapArea({ error: { message: 'failed' }, ...sample }), null)
  assert.equal(model.readMapArea({ province: { name: 'bad' } }), null)
})

test('malformed, missing and unsupported coordinates do not consume upstream quota', async () => {
  const h = routeHarness()
  for (const query of [
    '',
    'lat=&lon=100.5',
    'lat=NaN&lon=100.5',
    'lat=13.7&lon=Infinity',
    'lat=25&lon=100',
    'lat=13.7&lon=0',
  ]) {
    assert.equal((await h.get(query)).status, 400)
  }
  assert.equal(h.quotaCalls(), 0)
  assert.equal(h.requests.length, 0)
})

test('successful lookups expose only admin area names and cache nearby coordinates', async () => {
  const h = routeHarness()
  const first = await h.get()
  assert.equal(first.status, 200)
  assert.deepEqual(plain(first.body), { area: sample })
  assert.equal(first.headers['Cache-Control'], 'private, no-store')
  const second = await h.get('lat=13.72301&lon=100.52601')
  assert.deepEqual(plain(second.body), { area: sample })
  assert.equal(h.requests.length, 1)
  assert.equal(h.quotaCalls(), 1)
  const url = new URL(h.requests[0].url)
  assert.equal(url.origin + url.pathname, 'https://api.longdo.com/map/services/address')
  assert.equal(url.searchParams.get('noroad'), '1')
  assert.equal(url.searchParams.get('key'), 'private-test-key')
  assert.ok(!JSON.stringify(first).includes('private-test-key'))
})

test('missing credentials, quota limits and upstream failures have a neutral fallback', async () => {
  for (const [config, status] of [
    [{ noKey: true }, 503],
    [{ limited: true }, 429],
    [
      {
        fetch: async () => {
          throw Error('network')
        },
      },
      502,
    ],
  ]) {
    const h = routeHarness(config)
    const result = await h.get()
    assert.equal(result.status, status)
    assert.equal(result.body.area, null)
    if (status === 429) assert.equal(result.headers['Retry-After'], '60')
    if (status !== 502) assert.equal(h.requests.length, 0)
  }
})

test('simultaneous lookups of the same area share one upstream request', async () => {
  let finish
  const h = routeHarness({
    fetch: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  })
  const first = h.get(),
    second = h.get()
  finish({ ok: true, json: async () => sample })
  const results = await Promise.all([first, second])
  assert.equal(h.requests.length, 1)
  assert.ok(results.every((result) => result.body.area.district === sample.district))
})

test('map label waits for panning to settle and ignores a late response from the previous viewport', async () => {
  let state = { query: '', area: null },
    deps,
    cleanup,
    timer
  const requests = []
  const hooks = {
    useState: () => [
      state,
      (next) => {
        state = next
      },
    ],
    useEffect: (effect, nextDeps) => {
      if (JSON.stringify(deps) === JSON.stringify(nextDeps)) return
      cleanup?.()
      deps = nextDeps
      cleanup = effect()
    },
  }
  const hook = load(
    'src/hooks/useMapAreaLabel.ts',
    { react: hooks, '@/lib/mapAreaLabel': model },
    {
      setTimeout: (fn, delay) => {
        assert.equal(delay, 800)
        timer = fn
        return 1
      },
      clearTimeout: () => {
        timer = undefined
      },
      fetch: (url, options) => new Promise((resolve) => requests.push({ url, options, resolve })),
    }
  ).useMapAreaLabel
  const a = { lat: 13.723, lon: 100.526 },
    b = { lat: 13.754, lon: 100.54 }
  assert.equal(hook(a, 15, 'th'), '')
  assert.equal(requests.length, 0)
  const runA = timer()
  assert.equal(hook(b, 15, 'th'), '')
  assert.equal(requests[0].options.signal.aborted, true)
  const runB = timer()
  requests[1].resolve({ ok: true, json: async () => ({ area: { ...sample, district: 'เขตราชเทวี' } }) })
  await runB
  requests[0].resolve({ ok: true, json: async () => ({ area: sample }) })
  await runA
  assert.equal(hook(b, 15, 'th'), 'ราชเทวี · กรุงเทพมหานคร')
  assert.equal(hook(a, 15, 'th'), '', 'old district is not kept on a newly moved map')
  assert.equal(hook(b, 15, 'th'), 'ราชเทวี · กรุงเทพมหานคร', 'returning to an area uses the browser cache')
  assert.equal(requests.length, 2)
  cleanup?.()
})
