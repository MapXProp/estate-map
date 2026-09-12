const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const jsx = require('react/jsx-runtime')

function load(file, imports, globals = {}) {
  const context = {
    exports: {},
    ...globals,
    require: (id) => {
      if (!(id in imports)) throw Error(`Unexpected import: ${id}`)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    context
  )
  return context.exports
}
const taxonomy = load('src/data/propertyTaxonomy.ts', {})
const model = load('src/lib/propertyMapSearch.ts', {
  '@/data/propertyTaxonomy': taxonomy,
  './propertySearch': {
    fetchPropertySearch() {
      throw Error('No network in interaction test')
    },
  },
})

function harness(width) {
  const slots = []
  let cursor = 0,
    tree
  const hooks = {
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
    useRef: (value) => ({ current: value }),
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useEffect() {},
    useSyncExternalStore: () => false,
  }
  const component = load(
    'src/components/property-map/PropertyMapSearch.tsx',
    {
      react: hooks,
      'react/jsx-runtime': jsx,
      'lucide-react': require('lucide-react'),
      '@/components/Header/AvatarDropdown': { default: 'test-account' },
      '@/components/map/LongdoPropertyMap': { default: 'test-map' },
      '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'th' }) },
      '@/data/listings': { toRealEstateListing: (row) => row },
      '@/data/propertyTaxonomy': taxonomy,
      '@/lib/propertyMapSearch': model,
      '@/shared/Logo': { default: 'test-logo' },
      './MapOfferControls': { default: 'test-offers' },
      './MapPinPreview': { default: 'test-preview' },
      './MapResultCard': { default: 'test-card' },
      './MapSearchDetails': { default: 'test-filters' },
      './PropertyMapFilterBar': {
        emptyPropertyMapFilters: {
          discoveryChannels: [],
          offerTypes: [],
          propertyTypes: [],
          spaceTypes: [],
          minPrice: '',
          maxPrice: '',
          bedrooms: 0,
          bathrooms: 0,
          minArea: '',
          features: [],
        },
      },
      './PropertyMapSearch.module.css': { default: new Proxy({}, { get: (_, key) => String(key) }) },
    },
    {
      window: { matchMedia: () => ({ matches: width < 1024 }) },
      process: { env: { NEXT_PUBLIC_LONGDO_MAP_KEY: 'test-key' } },
    }
  ).default
  const center = { lat: 13.91, lon: 100.71 }
  function render() {
    cursor = 0
    tree = component({ initialMapCenter: center, initialMapZoom: 15 })
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
  const one = (predicate) => {
    const found = nodes(predicate)
    assert.equal(found.length, 1)
    return found[0]
  }
  const data = (name, value) => one((node) => node.props?.[name] === value)
  const map = () => one((node) => node.type === 'test-map').props
  const tab = (code) => data('data-map-group', code)
  function click(node) {
    node.props.onClick()
    render()
  }
  render()
  return { render, nodes, data, map, tab, click, center }
}

test('mobile starts folded, keeps all tabs reachable and folds without clearing selected categories or camera', () => {
  for (const width of [320, 390, 820]) {
    const h = harness(width)
    for (const code of ['homes', 'rooms', 'business']) assert.equal(h.tab(code).props['aria-expanded'], false)
    h.click(h.tab('homes'))
    assert.equal(h.tab('homes').props['aria-expanded'], true)
    h.click(h.data('data-map-category', 'homes:land'))
    h.click(h.data('data-map-category', 'homes:shophouse'))
    h.map().onMapInteraction()
    h.render()
    assert.equal(h.tab('homes').props['aria-expanded'], false)
    for (const id of ['homes:land', 'business:land', 'homes:shophouse', 'business:shophouse'])
      assert.equal(h.data('data-map-category', id).props['aria-pressed'], true)
    assert.equal(h.map().initialCenter, h.center)
    assert.equal(h.map().initialZoom, 15)
    h.click(h.tab('business'))
    assert.equal(h.tab('business').props['aria-expanded'], true)
    h.click(h.tab('business'))
    assert.equal(h.tab('business').props['aria-expanded'], false)
  }
})

test('tabs reopen after location search has collapsed the entire category section', () => {
  const h = harness(390)
  h.click(h.tab('rooms'))
  h.map().onLocationSearchFocus()
  h.render()
  assert.equal(h.tab('rooms').props['aria-expanded'], false)
  h.click(h.tab('rooms'))
  assert.equal(h.tab('rooms').props['aria-expanded'], true)
  assert.equal(h.nodes((node) => node.props?.['data-map-category-group']).length, 3)
})

test('desktop map interactions leave the category section expanded', () => {
  const h = harness(1440)
  h.map().onMapInteraction()
  h.render()
  assert.equal(h.nodes((node) => node.props?.['data-map-category-group']).length, 3)
  assert.equal(h.data('aria-controls', 'map-category-options').props['aria-expanded'], true)
})

test('area search and the relocated all-types action keep their existing filter behavior', () => {
  const h = harness(390)
  h.click(h.tab('business'))
  h.click(h.data('data-map-category', 'business:office'))
  h.click(h.data('data-map-area-search', true))
  assert.equal(h.map().areaSearchRequestId, 1)
  assert.equal(h.map().initialCenter, h.center)
  assert.equal(h.data('data-map-category', 'business:office').props['aria-pressed'], true)
  const allTypes = h.nodes((node) => node.props?.className === 'mobileAllCategories')[2]
  h.click(allTypes)
  assert.equal(h.data('data-map-category', 'business:office').props['aria-pressed'], false)
  const offers = h.nodes((node) => node.type === 'test-offers')[0].props.value
  assert.deepEqual(Array.from(offers), ['sale', 'rent'])
})
