const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports = {}) {
  const context = {
    exports: {},
    URLSearchParams,
    require(id) {
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
const plain = (value) => JSON.parse(JSON.stringify(value))
const taxonomy = load('src/data/propertyTaxonomy.ts')
const map = load('src/lib/propertyMapSearch.ts', { '@/data/propertyTaxonomy': taxonomy, './propertySearch': {} })
const header = load('src/lib/propertyHeaderSearch.ts')
const api = load('src/lib/mobilePropertySearch.ts', { './propertyHeaderSearch': header, './propertyMapSearch': map })
const toUrl = (options) => new URL(api.getMobilePropertyMapSearchUrl(options), 'https://mapxprop.com')
const initialCategories = (url) =>
  plain(
    map.initialMapCategories(
      { discoveryChannels: [url.searchParams.get('channel')] },
      url.searchParams.getAll('category')
    )
  )

test('mobile cards use the current map taxonomy with one card representing the complete retail section', () => {
  assert.deepEqual(
    ['homes', 'rooms', 'business'].map(
      (channel) => api.mobilePropertyCategories.filter((c) => c.channel === channel).length
    ),
    [7, 6, 9]
  )
  for (const group of map.mapCategoryGroups) {
    const cards = api.mobilePropertyCategories.filter((card) => card.channel === group.code)
    assert.deepEqual(
      plain(cards.flatMap((card) => card.categoryIds)).sort(),
      plain(group.options.map((option) => option.id)).sort()
    )
    for (const card of cards.filter((card) => card.value !== 'business:retail')) {
      const option = group.options.find((option) => option.id === card.value)
      assert.equal(card.label, option.nameTh)
      assert.equal(card.labelEn, option.nameEn)
      assert.equal(card.propertyType, option.propertyType)
    }
  }
  const retail = api.mobilePropertyCategories.filter((card) => card.propertyType === 'retail_space')
  assert.equal(retail.length, 1)
  assert.equal(retail[0].label, 'พื้นที่ขายของ')
  assert.equal(retail[0].categoryIds.length, taxonomy.primaryBusinessSpaceTypeCodes.length)
})

test('every selected card opens exactly its map categories, including linked shared types', () => {
  for (const card of api.mobilePropertyCategories) {
    const url = toUrl({ query: '', channel: card.channel, selectedCategories: [card.value] })
    assert.equal(url.pathname, '/properties/map')
    assert.equal(url.searchParams.has('q'), false)
    assert.deepEqual(
      initialCategories(url).sort(),
      plain(map.normalizeMapCategories(card.categoryIds)).sort(),
      card.value
    )
    assert.deepEqual(url.searchParams.getAll('offer_type'), card.channel === 'rooms' ? ['rent'] : ['sale', 'rent'])
  }
})

test('retail expands to all selling-space types and combines with a building category without adding keyword filters', () => {
  const retail = map.mapCategoryGroups
    .find((group) => group.code === 'business')
    .sections.find((section) => section.id === 'retail')
  const query = '  สาทร & A/B?offer_type=sale #โครงการ  '
  const url = toUrl({
    query,
    channel: 'business',
    selectedCategories: ['business:retail', 'business:office'],
    offerType: 'rent',
    minPrice: 20000,
    maxPrice: 60000,
  })
  assert.equal(url.searchParams.get('q'), query.trim())
  assert.equal(url.hash, '')
  assert.deepEqual(url.searchParams.getAll('offer_type'), ['rent'])
  assert.equal(url.searchParams.get('price_min'), '20000')
  assert.equal(url.searchParams.get('price_max'), '60000')
  assert.deepEqual(
    initialCategories(url).sort(),
    [...plain(retail.options.map((option) => option.id)), 'business:office'].sort()
  )
})

test('empty card selection scopes to the chosen channel and rooms remain rental-only', () => {
  for (const group of map.mapCategoryGroups) {
    const url = toUrl({
      query: '',
      channel: group.code,
      selectedCategories: [],
      offerType: 'sale',
      minPrice: -1,
      maxPrice: Infinity,
    })
    assert.deepEqual(
      initialCategories(url).sort(),
      plain(map.normalizeMapCategories(group.options.map((option) => option.id))).sort()
    )
    assert.deepEqual(url.searchParams.getAll('offer_type'), group.code === 'rooms' ? ['rent'] : ['sale'])
    assert.equal(url.searchParams.has('price_min'), false)
    assert.equal(url.searchParams.has('price_max'), false)
  }
})

function harness(locale = 'th') {
  const slots = []
  let cursor = 0,
    tree,
    propertyZone = 'homes'
  const component = load('src/components/property-home/MobilePropertySearch.tsx', {
    react: {
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
      useEffect() {},
      useMemo: (fn) => fn(),
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    'next/navigation': { usePathname: () => '/homes', useSearchParams: () => new URLSearchParams() },
    '@/hooks/useMobileSearchViewport': { useMobileSearchViewport: () => null },
    '@headlessui/react': { Dialog: 'test-dialog', DialogPanel: 'test-panel', DialogTitle: 'test-title' },
    '@/components/preferences/PreferencesProvider': {
      usePreferences: () => ({
        locale,
        propertyZone,
        setPropertyZone: (value) => {
          propertyZone = value
        },
      }),
    },
    '@/components/PropertyCategoryLabel': { default: 'test-category-label' },
    '@/lib/propertyZone': load('src/lib/propertyZone.ts'),
    '@/lib/mobilePropertySearch': api,
    './MobileProjectSearchDialog': { default: 'test-project-search' },
    './MobilePropertyBrandMark': { default: 'test-brand' },
    './PropertySearchOmnibox': { default: 'test-omnibox' },
    './MobileSearchBudgetSheet': { default: 'test-budget', emptySearchBudget: { minPrice: '', maxPrice: '' } },
  }).default
  function render() {
    cursor = 0
    tree = component({})
  }
  function nodes(predicate) {
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
  function one(predicate) {
    const found = nodes(predicate)
    assert.equal(found.length, 1)
    return found[0]
  }
  function click(node) {
    node.props.onClick()
    render()
  }
  render()
  return {
    nodes,
    one,
    click,
    render,
    data: (name, value) => one((node) => node.props[name] === value),
    url: (query = '') =>
      new URL(one((node) => node.type === 'test-omnibox').props.buildSearchUrl(query), 'https://mapxprop.com'),
  }
}

test('the actual mobile dialog keeps icon cards, supports multi-selection and sends the selected categories to Map', () => {
  for (const locale of ['th', 'en']) {
    const h = harness(locale)
    h.click(h.data('data-mobile-property-search-trigger', true))
    assert.equal(h.one((node) => node.type === 'test-dialog').props.open, true)
    assert.equal(h.nodes((node) => node.props['data-mobile-search-category']).length, 7)
    const card = (value) => h.data('data-mobile-search-category', value)
    h.click(card('homes:detached_house'))
    h.click(card('homes:semi_detached_house'))
    assert.deepEqual(h.url().searchParams.getAll('category'), ['homes:detached_house', 'homes:semi_detached_house'])
    for (const node of h.nodes((node) => node.props['data-mobile-search-category']))
      assert.ok(node.props.children[1].props.children.type, 'every card keeps its property icon')
    h.click(h.data('data-mobile-search-group', 'business'))
    assert.equal(h.nodes((node) => node.props['data-mobile-search-category']).length, 9)
    h.click(card('business:retail'))
    assert.equal(card('business:retail').props['aria-pressed'], true)
    assert.equal(h.url().searchParams.getAll('category').length, taxonomy.primaryBusinessSpaceTypeCodes.length)
    h.click(card('business:office'))
    assert.equal(h.url().searchParams.getAll('category').length, taxonomy.primaryBusinessSpaceTypeCodes.length + 1)
    h.click(card('business:retail'))
    assert.deepEqual(h.url('สาทร').searchParams.getAll('category'), ['business:office'])
    assert.equal(h.url('สาทร').searchParams.get('q'), 'สาทร')
    const omnibox = h.one((node) => node.type === 'test-omnibox').props
    assert.equal(omnibox.allowEmptyQuery, true)
    assert.equal(omnibox.buildQuery, undefined)
    omnibox.onSubmitQuery('สาทร')
    h.render()
    assert.equal(h.one((node) => node.type === 'test-dialog').props.open, false)
  }
})

test('direct buy/rent controls send custom prices to Map, clear incompatible prices and retain the selected category', () => {
  const h = harness('en')
  h.click(h.data('data-mobile-property-search-trigger', true))
  h.click(h.data('data-mobile-search-category', 'homes:semi_detached_house'))
  h.click(h.data('data-mobile-search-offer', 'rent'))
  h.click(h.data('data-mobile-search-budget', true))
  const sheet = () => h.one((node) => node.type === 'test-budget').props
  sheet().onApply({ minPrice: '20000', maxPrice: '60000' })
  sheet().onClose()
  h.render()
  let url = h.url()
  assert.deepEqual(url.searchParams.getAll('offer_type'), ['rent'])
  assert.deepEqual(url.searchParams.getAll('category'), ['homes:semi_detached_house'])
  assert.equal(url.searchParams.get('price_min'), '20000')
  assert.equal(url.searchParams.get('price_max'), '60000')
  h.click(h.data('data-mobile-search-offer', 'sale'))
  assert.equal(h.url().searchParams.has('price_min'), false)
  assert.equal(h.url().searchParams.has('price_max'), false)
  h.click(h.data('data-mobile-search-budget', true))
  sheet().onApply({ minPrice: '10000000', maxPrice: '' })
  sheet().onClose()
  h.render()
  url = h.url()
  assert.deepEqual(url.searchParams.getAll('offer_type'), ['sale'])
  assert.equal(url.searchParams.get('price_min'), '10000000')
  assert.equal(url.searchParams.has('price_max'), false)
})

test('both offers can use an exact budget immediately; closing budget does not close discovery and rooms stay rent-only', () => {
  const h = harness()
  h.click(h.data('data-mobile-property-search-trigger', true))
  h.click(h.data('data-mobile-search-budget', true))
  let sheet = h.one((node) => node.type === 'test-budget').props
  assert.equal(sheet.offerType, '')
  h.one((node) => node.type === 'test-dialog').props.onClose()
  h.render()
  assert.equal(h.one((node) => node.type === 'test-dialog').props.open, true)
  sheet.onApply({ minPrice: '', maxPrice: '123456789' })
  sheet.onClose()
  h.render()
  assert.deepEqual(h.url().searchParams.getAll('offer_type'), ['sale', 'rent'])
  assert.equal(h.url().searchParams.get('price_max'), '123456789')
  h.click(h.data('data-mobile-search-budget', true))
  sheet = h.one((node) => node.type === 'test-budget').props
  assert.equal(sheet.value.maxPrice, '123456789')
  sheet.onClose()
  h.click(h.data('data-mobile-search-group', 'rooms'))
  assert.equal(h.nodes((node) => node.props['data-mobile-search-offer'] === 'sale').length, 0)
  assert.deepEqual(h.url().searchParams.getAll('offer_type'), ['rent'])
  assert.equal(h.url().searchParams.has('price_max'), false)
  const omnibox = h.one((node) => node.type === 'test-omnibox').props
  assert.equal(omnibox.suggestionScope, 'location')
  assert.equal(omnibox.scrollSuggestionsIntoView, true)
})
