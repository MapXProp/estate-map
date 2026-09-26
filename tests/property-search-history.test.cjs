const assert = require('node:assert/strict'),
  { test } = require('node:test'),
  fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  ts = require('typescript'),
  { webcrypto } = require('crypto')
const compile = (file) =>
  ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
const taxonomy = { exports: {} }
vm.runInNewContext(compile('src/data/propertyTaxonomy.ts'), taxonomy)
function model({ storage = new Map(), fetch = async () => ({ ok: false, status: 503 }) } = {}) {
  const events = new EventTarget(),
    window = {
      localStorage: {
        getItem: (key) => storage.get(key) || null,
        setItem: (key, v) => storage.set(key, v),
        removeItem: (key) => storage.delete(key),
      },
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    }
  const c = {
    exports: {},
    window,
    crypto: webcrypto,
    Event,
    URL,
    URLSearchParams,
    Date,
    require: (name) =>
      name === './auth' ? { getAuthApiUrl: (path) => '/apix/' + path, fetchWithAuthRetry: fetch } : taxonomy.exports,
  }
  vm.runInNewContext(compile('src/lib/propertySearchHistory.ts'), c)
  return { ...c.exports, storage }
}
const event = (query = 'บางนา', budget = 20000) => ({
  query,
  label: query,
  url:
    '/properties/map?q=' +
    encodeURIComponent(query) +
    '&search=location&place=' +
    encodeURIComponent(query) +
    '&lat=13.7&lon=100.6&category=homes:condo&offer_type=rent&price_max=' +
    budget,
  source: 'hero',
})
const flush = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve()
}

test('a filter-only submission keeps empty query and the exact category/budget destination', () => {
  const m = model()
  m.setSearchHistoryAccount(null)
  m.recordSearchHistory({
    ...event(),
    query: '',
    label: 'ค้นหาทุกทำเล',
    url: '/properties/map?category=homes:condo&offer_type=rent&price_max=20000',
  })
  const recent = m.getRecentSearchHistory()[0]
  assert.equal(recent.query, '')
  assert.match(recent.url, /price_max=20000/)
  assert.match(m.historyFilterSummary(recent), /เช่า.*20,000.*คอนโด/)
})
function server() {
  const accounts = new Map(),
    calls = []
  return {
    accounts,
    calls,
    fetch: async (url, init) => {
      const body = init.body ? JSON.parse(init.body) : null,
        owner = body?.owner || new URL(url, 'https://test').searchParams.get('owner')
      let state = accounts.get(owner) || { revision: 0, events: [] }
      accounts.set(owner, state)
      calls.push({ owner, method: init.method, body })
      if (body && body.revision !== state.revision) return { ok: false, status: 409 }
      if (init.method === 'POST') {
        const ids = new Set(state.events.map((x) => x.id))
        state.events = [...body.events.filter((x) => !ids.has(x.id)), ...state.events].slice(0, 100)
      }
      if (init.method === 'DELETE') {
        state.revision++
        state.events = []
      }
      return { ok: true, json: async () => JSON.parse(JSON.stringify(state)) }
    },
  }
}
test('guest history persists exact destinations, deduplicates accidental repeats and remains bounded', () => {
  const m = model()
  m.setSearchHistoryAccount(null)
  m.recordSearchHistory(event())
  m.recordSearchHistory(event())
  assert.equal(m.getSearchHistoryEvents().length, 1)
  m.recordSearchHistory(event('บางนา', 30000))
  assert.equal(m.getRecentSearchHistory().length, 2)
  assert.match(m.historyFilterSummary(m.getRecentSearchHistory()[0]), /เช่า.*บาท.*คอนโด/)
  for (let i = 0; i < 105; i++) m.recordSearchHistory(event('place' + i))
  assert.equal(m.getSearchHistoryEvents().length, 100)
  const reloaded = model({ storage: m.storage })
  reloaded.setSearchHistoryAccount(null)
  assert.equal(reloaded.getRecentSearchHistory().length, 8)
  assert.equal(m.cleanHistoryURL('//evil.test'), '')
  assert.equal(m.cleanHistoryURL('/account?token=secret'), '')
  assert.ok(!m.cleanHistoryURL('/properties/map?q=x&token=secret').includes('secret'))
})
test('guest searches never upload to an account; accounts sync across devices without mixing identities', async () => {
  const s = server(),
    a = model({ fetch: s.fetch })
  a.setSearchHistoryAccount(null)
  a.recordSearchHistory(event('guest place'))
  a.setSearchHistoryAccount('account-a')
  await a.syncSearchHistory()
  assert.equal(a.getSearchHistoryEvents().length, 0)
  a.recordSearchHistory(event('A place'))
  await a.syncSearchHistory()
  await flush()
  const another = model({ fetch: s.fetch })
  another.setSearchHistoryAccount('account-a')
  await another.syncSearchHistory()
  assert.equal(another.getRecentSearchHistory()[0].query, 'A place')
  a.setSearchHistoryAccount('account-b')
  await a.syncSearchHistory()
  assert.equal(a.getSearchHistoryEvents().length, 0)
  a.setSearchHistoryAccount(null)
  assert.equal(a.getRecentSearchHistory()[0].query, 'guest place')
  assert.ok(!s.calls.some((x) => x.body?.events?.some((e) => e.query === 'guest place')))
})
test('clearing account history advances revision so stale offline queues cannot resurrect it', async () => {
  const s = server(),
    a = model({ fetch: s.fetch }),
    b = model({ fetch: s.fetch })
  a.setSearchHistoryAccount('a')
  await a.syncSearchHistory()
  a.recordSearchHistory(event())
  await a.syncSearchHistory()
  b.setSearchHistoryAccount('a')
  await b.syncSearchHistory()
  await a.clearSearchHistory()
  assert.equal(a.getSearchHistoryEvents().length, 0)
  assert.equal(s.accounts.get('a').events.length, 0)
  await b.syncSearchHistory()
  assert.equal(b.getSearchHistoryEvents().length, 0)
  a.recordSearchHistory(event('new place'))
  await a.syncSearchHistory()
  assert.equal(s.accounts.get('a').events.length, 1)
})
test('guest clearing in another tab stays cleared and late account responses cannot appear after logout', async () => {
  const storage = new Map(),
    a = model({ storage }),
    b = model({ storage })
  a.setSearchHistoryAccount(null)
  a.recordSearchHistory(event())
  b.setSearchHistoryAccount(null)
  await a.clearSearchHistory()
  b.refreshHistoryFromStorage()
  assert.equal(b.getSearchHistoryEvents().length, 0)
  let release
  const m = model({ fetch: () => new Promise((resolve) => (release = resolve)) })
  m.setSearchHistoryAccount('old')
  m.suspendSearchHistoryAccount()
  m.setSearchHistoryAccount(null)
  release({
    ok: true,
    json: async () => ({
      revision: 0,
      events: [{ ...event('private'), id: webcrypto.randomUUID(), searchedAt: Date.now() }],
    }),
  })
  await flush()
  assert.equal(m.getSearchHistoryEvents().length, 0)
})
test('old browser history migrates only to guest and malformed storage or blocked storage does not break searching', () => {
  const storage = new Map([
    ['mapxprop_recent_property_searches_v1', JSON.stringify([{ query: 'old', label: 'old', searchedAt: 1 }])],
  ])
  const m = model({ storage })
  m.setSearchHistoryAccount('a')
  assert.equal(m.getSearchHistoryEvents().length, 0)
  m.setSearchHistoryAccount(null)
  assert.equal(m.getRecentSearchHistory()[0].query, 'old')
  assert.equal(storage.has('mapxprop_recent_property_searches_v1'), false)
  const broken = model({ storage: new Map([['mapxprop_search_history_v2:guest', '{bad']]) })
  broken.setSearchHistoryAccount(null)
  broken.recordSearchHistory(event())
  assert.equal(broken.getSearchHistoryEvents().length, 1)
})

test('clearing never follows an account switch while waiting for synchronization', async () => {
  const s = server()
  let release
  const m = model({
    fetch: async (url, init) =>
      init.method === 'GET' && url.includes('owner=old')
        ? new Promise((resolve) => (release = resolve))
        : s.fetch(url, init),
  })
  m.setSearchHistoryAccount('old')
  const clearing = m.clearSearchHistory()
  m.setSearchHistoryAccount('new')
  await m.syncSearchHistory()
  m.recordSearchHistory(event('keep new'))
  await m.syncSearchHistory()
  release({ ok: true, json: async () => ({ revision: 0, events: [] }) })
  await clearing
  assert.equal(
    s.calls.some((call) => call.method === 'DELETE'),
    false
  )
  assert.equal(m.getRecentSearchHistory()[0].query, 'keep new')
})

test('offline pending events survive account changes and retry once, while failed clears keep history', async () => {
  const s = server()
  let offline = true
  const m = model({ fetch: (...args) => (offline ? Promise.reject(Error('offline')) : s.fetch(...args)) })
  m.setSearchHistoryAccount('a')
  await m.syncSearchHistory()
  m.recordSearchHistory(event('offline place'))
  await m.syncSearchHistory()
  await assert.rejects(m.clearSearchHistory())
  assert.equal(m.getSearchHistoryEvents().length, 1)
  m.setSearchHistoryAccount('b')
  await m.syncSearchHistory()
  m.setSearchHistoryAccount('a')
  await m.syncSearchHistory()
  assert.equal(m.getSearchHistoryEvents().length, 1)
  offline = false
  await m.syncSearchHistory()
  await m.syncSearchHistory()
  assert.equal(s.accounts.get('a').events.length, 1)
})

test('blocked storage preserves in-memory history after clearing and cannot regress deletion revision', async () => {
  let blocked = false
  const storage = new Map(),
    get = storage.get.bind(storage),
    set = storage.set.bind(storage)
  storage.get = (k) => {
    if (blocked) throw Error('blocked')
    return get(k)
  }
  storage.set = (k, v) => {
    if (blocked) throw Error('blocked')
    return set(k, v)
  }
  const m = model({ storage })
  m.setSearchHistoryAccount(null)
  m.recordSearchHistory(event('old'))
  await m.clearSearchHistory()
  blocked = true
  m.recordSearchHistory(event('one'))
  m.recordSearchHistory(event('two'))
  assert.equal(m.getSearchHistoryEvents().length, 2)
  blocked = false
  storage.set('mapxprop_search_history_v2:guest', JSON.stringify({ revision: 0, events: [], pending: [] }))
  m.refreshHistoryFromStorage()
  assert.equal(m.getSearchHistoryEvents().length, 2)
})
