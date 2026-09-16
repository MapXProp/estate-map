const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function harness(variant) {
  const slots = [],
    effects = [],
    timers = new Map(),
    navigation = [],
    lookups = []
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
    react: hooks,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    'next/navigation': { useRouter: () => ({ push: (url) => navigation.push(url) }) },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'th' }) },
    '@/lib/propertyRecentLocations': { getPropertyRecentLocations: () => [], savePropertyRecentLocation() {} },
    '@/lib/propertyRecentSearches': { getPropertyRecentSearches: () => [], savePropertyRecentSearch() {} },
    '@/lib/propertySearch': {
      fetchPropertySearchSuggestions: async () => [],
      fetchLongdoPropertyLocationSuggestions: async (query) => {
        lookups.push(query)
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
    })
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
