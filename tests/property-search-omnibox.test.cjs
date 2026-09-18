const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function harness(variant, options = {}) {
  const slots = [],
    effects = [],
    timers = new Map(),
    navigation = [],
    lookups = [],
    localLookups = [],
    scrollCalls = [],
    viewportListeners = new Map()
  let cursor = 0,
    timerId = 0,
    tree,
    closed = 0
  const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
  const hooks = {
    useId: () => 'search-options',
    useRef(initial) {
      const i = cursor++
      return (slots[i] ??= { current: initial })
    },
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial
      return [
        slots[i],
        (next) => {
          slots[i] = typeof next === 'function' ? next(slots[i]) : next
        },
      ]
    },
    useEffect(fn, deps) {
      const i = cursor++
      if (!slots[i] || !equal(slots[i].deps, deps)) {
        const old = slots[i]
        slots[i] = { deps }
        effects.push(() => {
          old?.cleanup?.()
          slots[i].cleanup = fn()
        })
      }
    },
  }
  const imports = {
    '@/lib/transitStations': require('./helpers/transit-stations.cjs'),
    react: hooks,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    'next/navigation': { useRouter: () => ({ push: (url) => navigation.push(url) }) },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'th' }) },
    '@/lib/propertyRecentLocations': {
      getPropertyRecentLocations: () => options.recentLocations || [],
      savePropertyRecentLocation() {},
    },
    '@/lib/propertyRecentSearches': { getPropertyRecentSearches: () => [], savePropertyRecentSearch() {} },
    '@/lib/propertySearch': {
      fetchPropertySearchSuggestions: async (query, signal, config) => {
        localLookups.push({ query, config })
        return options.local ? options.local(query, signal) : []
      },
      fetchLongdoPropertyLocationSuggestions: async (query) => {
        lookups.push(query)
        if (options.external) return options.external(query)
        return [
          { type: 'longdo', query: `${query} กรุงเทพมหานคร`, label: `${query} กรุงเทพมหานคร`, description: 'longdo' },
        ]
      },
    },
    './PropertySearchOmnibox.module.css': { default: {} },
  }
  const context = {
    exports: {},
    AbortController,
    window: {
      setTimeout: (fn) => {
        timers.set(++timerId, fn)
        return timerId
      },
      clearTimeout: (id) => timers.delete(id),
      requestAnimationFrame: (fn) => {
        timers.set(++timerId, fn)
        return timerId
      },
      cancelAnimationFrame: (id) => timers.delete(id),
      visualViewport: {
        addEventListener: (name, fn) => viewportListeners.set(name, fn),
        removeEventListener: (name) => viewportListeners.delete(name),
      },
    },
    document: { addEventListener() {}, removeEventListener() {} },
    require: (id) => {
      assert.ok(id in imports, id)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, '../src/components/property-home/PropertySearchOmnibox.tsx'), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }
    ).outputText,
    context
  )
  function render() {
    cursor = 0
    tree = context.exports.default({
      variant,
      suggestionsMode: variant === 'hero' ? 'inline' : 'popover',
      allowEmptyQuery: true,
      showSuggestionsOnEmpty: false,
      buildSearchUrl: (query) =>
        `/properties/map?${new URLSearchParams({ q: query, channel: 'homes', offer_type: 'rent' })}`,
      onSubmitQuery: () => {
        closed++
      },
      ...options.props,
    })
    tree.props.ref.current = { scrollIntoView: (config) => scrollCalls.push(config) }
    while (effects.length) effects.shift()()
  }
  function nodes(predicate) {
    const found = []
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit)
      if (!node || typeof node !== 'object') return
      if (predicate(node)) found.push(node)
      visit(node.props?.children)
    }
    visit(tree)
    return found
  }
  const input = () => nodes((n) => n.type === 'input')[0].props
  async function suggestions() {
    for (let turn = 0; turn < 6; turn++) {
      for (const [id, timer] of [...timers]) {
        timers.delete(id)
        timer()
      }
      for (let tick = 0; tick < 8; tick++) await Promise.resolve()
      render()
    }
  }
  render()
  return {
    navigation,
    lookups,
    localLookups,
    scrollCalls,
    viewportListeners,
    nodes,
    render,
    input,
    suggestions,
    closed: () => closed,
    type(query) {
      input().onFocus()
      input().onChange({ target: { value: query } })
      render()
    },
    submit() {
      nodes((n) => n.type === 'form')[0].props.onSubmit({ preventDefault() {} })
      render()
    },
  }
}

test('station suggestions are immediately selectable on desktop and mobile while the remote search is pending', async () => {
  for (const variant of ['header', 'hero']) {
    let resolveLocal
    const h = harness(variant, {
      local: () =>
        new Promise((resolve) => {
          resolveLocal = resolve
        }),
    })
    h.type('อารีย์')
    await h.suggestions()
    const options = h.nodes((n) => n.props?.role === 'option')
    options[0].props.onClick()
    const url = new URL(h.navigation[0], 'https://mapxprop.com')
    assert.equal(url.searchParams.get('station'), 'bts-n5')
    assert.equal(url.searchParams.get('q'), 'BTS อารีย์ (N5)')
    assert.equal(url.searchParams.get('channel'), 'homes')
    assert.equal(url.searchParams.get('offer_type'), 'rent')
    h.render()
    resolveLocal([])
    await h.suggestions()
    assert.equal(h.closed(), 1)
  }
})

test('desktop and mobile both offer external locations; tapping one submits its complete place name', async () => {
  for (const variant of ['header', 'hero']) {
    const h = harness(variant)
    h.type('สถานีอารีย์')
    await h.suggestions()
    assert.deepEqual(h.lookups, ['สถานีอารีย์'])
    assert.equal(h.input().enterKeyHint, 'search')
    const options = h.nodes((n) => n.props?.role === 'option')
    options[0].props.onClick()
    const url = new URL(h.navigation[0], 'https://mapxprop.com')
    assert.equal(url.pathname, '/properties/map')
    assert.equal(url.searchParams.get('q'), 'สถานีอารีย์ กรุงเทพมหานคร')
    assert.equal(url.searchParams.get('offer_type'), 'rent')
    assert.equal(h.closed(), 1)
  }
})

test('mobile place autocomplete uses location scope, exposes local matches before external lookup completes and reveals suggestions above the keyboard', async () => {
  let resolveExternal
  const h = harness('hero', {
    props: { suggestionScope: 'location', scrollSuggestionsIntoView: true, showSuggestionsOnEmpty: true },
    local: async () => [{ type: 'location', label: 'สาทร', query: 'สาทร', description: 'district' }],
    external: () =>
      new Promise((resolve) => {
        resolveExternal = resolve
      }),
  })
  h.type('สาทร')
  await h.suggestions()
  assert.equal(h.localLookups[0].config.scope, 'location')
  assert.equal(h.input()['aria-autocomplete'], 'list')
  assert.equal(h.input()['aria-expanded'], true)
  assert.ok(h.nodes((node) => node.props?.role === 'option').length > 0, 'local match is already tappable')
  assert.ok(h.scrollCalls.length > 0)
  h.viewportListeners.get('resize')()
  assert.equal(h.scrollCalls.at(-1).block, 'start')
  resolveExternal([{ type: 'longdo', label: 'สาทร ซอย 1', query: 'สาทร ซอย 1', description: 'longdo' }])
  await h.suggestions()
  const results = h.nodes((node) => node.props?.role === 'option')
  results[1].props.onClick()
  assert.equal(new URL(h.navigation[0], 'https://mapxprop.com').searchParams.get('q'), 'สาทร ซอย 1')
})

test('mobile empty field shows recent places and stale autocomplete responses cannot replace a newer place', async () => {
  let oldResolve
  const h = harness('hero', {
    props: { suggestionScope: 'location', showSuggestionsOnEmpty: true },
    recentLocations: [{ query: 'อารีย์', label: 'อารีย์', searchedAt: 100 }],
    local: (query) =>
      query === 'สาทร'
        ? new Promise((resolve) => {
            oldResolve = resolve
          })
        : Promise.resolve([{ type: 'location', label: query, query, description: 'district' }]),
  })
  h.input().onFocus()
  h.render()
  assert.equal(h.nodes((node) => node.props?.role === 'option').length, 1)
  h.type('สาทร')
  await h.suggestions()
  h.type('บางนา')
  await h.suggestions()
  oldResolve([{ type: 'location', label: 'สาทร', query: 'สาทร', description: 'district' }])
  await h.suggestions()
  h.nodes((node) => node.props?.role === 'option')[0].props.onClick()
  assert.equal(new URL(h.navigation[0], 'https://mapxprop.com').searchParams.get('q'), 'บางนา')
})

test('typing another place removes old clickable suggestions; direct submission preserves the new query and filters', async () => {
  for (const variant of ['header', 'hero']) {
    const h = harness(variant)
    h.type('สถานีอารีย์')
    await h.suggestions()
    h.type('สุราษฎร์ธานี')
    assert.equal(
      h.nodes((n) => n.props?.role === 'option').length,
      0,
      'old options are hidden while the new query loads'
    )
    h.submit()
    const url = new URL(h.navigation[0], 'https://mapxprop.com')
    assert.equal(url.searchParams.get('q'), 'สุราษฎร์ธานี')
    assert.equal(url.searchParams.get('channel'), 'homes')
    assert.equal(url.searchParams.get('offer_type'), 'rent')
  }
})
