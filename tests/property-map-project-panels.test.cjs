const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports) {
  const context = {
    exports: {},
    require(id) {
      if (id === '@/lib/propertyPrices') return require('./helpers/property-prices.cjs').prices
      assert.ok(id in imports, id)
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
const model = load('src/lib/propertyMapProjects.ts', { './auth': {}, './propertySearch': {} })
const shared = {
  'react/jsx-runtime': require('react/jsx-runtime'),
  'lucide-react': require('lucide-react'),
  '@/lib/propertyMapProjects': model,
  './PropertyMapSearch.module.css': { default: new Proxy({}, { get: (_, key) => key }) },
}
function nodes(tree, predicate) {
  const found = []
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit)
    if (!node?.props) return
    if (predicate(node)) found.push(node)
    visit(node.props.children)
  }
  visit(tree)
  return found
}

test('project rows highlight on mouse/focus, ignore touch hover and only open on deliberate activation', () => {
  const Results = load('src/components/property-map/MapProjectResults.tsx', shared).default
  const project = {
    id: 'project-a',
    name: 'หมู่บ้านนิมิตรา',
    displayName: 'หมู่บ้านนิมิตรา',
    category: 'housing_estate',
    location: { lat: 13.7, lon: 100.5 },
    listingIds: ['one'],
  }
  const hovered = [],
    chosen = []
  const row = nodes(
    Results({
      projects: [project],
      hoveredProjectId: 'project-a',
      th: true,
      onHover: (id) => hovered.push(id),
      onChoose: (value) => chosen.push(value),
    }),
    (node) => node.props['data-project-result']
  )[0]
  assert.equal(row.props['data-hovered'], true)
  row.props.onPointerEnter({ pointerType: 'mouse' })
  row.props.onPointerLeave({ pointerType: 'mouse' })
  row.props.onFocus()
  row.props.onBlur()
  row.props.onPointerEnter({ pointerType: 'touch' })
  assert.deepEqual(hovered, ['project-a', '', 'project-a', ''])
  assert.equal(chosen.length, 0)
  row.props.onClick()
  assert.deepEqual(chosen, [project])
})

test('project tabs preserve event rental units, show selected dual-offer prices and use only real coordinates for Locate', () => {
  let cursor = 0,
    tree,
    expanded = true
  const slots = [],
    located = []
  const data = {
    project: { display_name: 'Emsphere', project_category: 'commercial_complex', latitude: 13.73, longitude: 100.56 },
    rows: [
      {
        id: 'event',
        title: 'LOCAL FAVORITES',
        offer_type: 'rent',
        offer_amount: 60000,
        offer_price_unit: 'event_period',
        date: '2026-09-17',
      },
      {
        id: 'unit',
        title: 'Retail unit',
        listing_type: 'sale_rent',
        sale_price: 3000000,
        rent_price_monthly: 20000,
        latitude: 13.731,
        longitude: 100.561,
        date: '2026-09-16',
      },
    ],
  }
  const Panel = load('src/components/property-map/MapProjectPanel.tsx', {
    ...shared,
    react: {
      useState(initial) {
        const i = cursor++
        if (!(i in slots)) slots[i] = i === 0 ? data : initial
        return [
          slots[i],
          (next) => {
            slots[i] = typeof next === 'function' ? next(slots[i]) : next
          },
        ]
      },
      useEffect() {},
      useRef: () => ({ current: null }),
      useMemo: (fn) => fn(),
    },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'th' }) },
    '@/data/listings': {
      toRealEstateListing: (row) => ({
        ...row,
        prices: require('./helpers/property-prices.cjs').prices.getPropertyPrices(row),
        priceAmount: row.sale_price || row.offer_amount,
        priceUnit: row.offer_price_unit || '',
        map: {},
      }),
    },
    '@/lib/propertyMapSearch': {
      hasMapCoordinates: (row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude),
    },
    './MapResultCard': { default: 'card' },
  }).default
  function render() {
    cursor = 0
    tree = Panel({
      identifier: 'project-a',
      expanded,
      onToggle: () => { expanded = !expanded; render() },
      onLocate: (listing) => located.push(listing),
    })
  }
  const cards = () => nodes(tree, (node) => node.type === 'card')
  function choose(offer) {
    nodes(tree, (node) => node.props['data-project-offer'] === offer)[0].props.onClick()
    render()
  }
  render()
  assert.equal(cards()[1].props.listing.prices.length, 2)
  choose('rent')
  assert.equal(cards()[0].props.listing.priceUnit, 'event_period')
  assert.equal(cards()[0].props.listing.priceAmount, 60000)
  assert.equal(cards()[1].props.listing.priceUnit, 'month')
  assert.equal(cards()[1].props.listing.priceAmount, 20000)
  assert.equal(cards()[1].props.listing.prices.length, 1)
  assert.equal(cards()[1].props.listing.prices[0].amount, 20000)
  cards()[0].props.onLocate()
  cards()[1].props.onLocate()
  assert.equal(located[0].map.lat, data.project.latitude)
  assert.equal(located[1].map.lat, data.rows[1].latitude)
  choose('sale')
  assert.equal(cards().length, 1)
  assert.equal(cards()[0].props.listing.priceAmount, 3000000)
  assert.equal(cards()[0].props.listing.priceUnit, '')
  assert.equal(cards()[0].props.listing.prices.length, 1)
  assert.equal(cards()[0].props.listing.prices[0].amount, 3000000)
  choose('all')
  assert.equal(cards()[1].props.listing.prices.length, 2)

  choose('rent')
  nodes(tree, (node) => node.type === 'select')[0].props.onChange({ target: { value: 'price_low' } })
  render()
  const toggle = () => nodes(tree, (node) => node.props['data-map-mobile-panel-toggle'])[0]
  const filteredOrder = cards().map((node) => node.props.listing.id)
  assert.deepEqual(filteredOrder, ['unit', 'event'])
  toggle().props.onClick()
  assert.equal(toggle().props['aria-expanded'], false)
  assert.deepEqual(cards().map((node) => node.props.listing.id), filteredOrder, 'collapse keeps the listings mounted')
  toggle().props.onClick()
  assert.equal(toggle().props['aria-expanded'], true)
  assert.equal(nodes(tree, (node) => node.props['data-project-offer'] === 'rent')[0].props['aria-pressed'], true)
  assert.equal(nodes(tree, (node) => node.type === 'select')[0].props.value, 'price_low')
  assert.deepEqual(cards().map((node) => node.props.listing.id), filteredOrder)
})
