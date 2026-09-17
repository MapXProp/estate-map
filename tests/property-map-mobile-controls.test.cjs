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
const projects = load('src/lib/propertyMapProjects.ts', { './auth': {}, './propertySearch': {} })
const model = load('src/lib/propertyMapSearch.ts', {
  '@/data/propertyTaxonomy': taxonomy,
  './propertySearch': {
    fetchPropertySearch() {
      throw Error('No network in interaction test')
    },
  },
})

function harness(width, locale = 'th', entryProps = {}) {
  const slots = []
  let cursor = 0,
    tree,
    onSheetSnap
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
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  }
  const component = load(
    'src/components/property-map/PropertyMapSearch.tsx',
    {
      react: hooks,
      'react/jsx-runtime': jsx,
      'lucide-react': require('lucide-react'),
      'framer-motion': { AnimatePresence: 'test-presence' },
      '@/components/Header/AvatarDropdown': { default: 'test-account' },
      '@/components/map/LongdoPropertyMap': { default: 'test-map' },
      '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale }) },
      '@/data/listings': { toRealEstateListing: (row) => row },
      '@/data/propertyTaxonomy': taxonomy,
      '@/lib/propertyMapSearch': model,
      '@/lib/propertyMapProjects': projects,
      '@/hooks/useMapAreaLabel': { useMapAreaLabel: () => 'สาทร · กรุงเทพมหานคร' },
      '@/hooks/useMapAutoAreaSearch': { useMapAutoAreaSearch: () => true },
      '@/hooks/useMobileSheets': {
        useMapBottomSheet: (_snap, _previewId, onSnap) => {
          onSheetSnap = onSnap
          return { panelRef: () => {} }
        },
      },
      '@/hooks/useMapPreviewHeaderHeight': {
        useMapPreviewHeaderHeight: () => ({ searchRef: null, categoriesRef: null, areaControlRef: null }),
      },
      '@/shared/Logo': { default: 'test-logo' },
      './MapOfferControls': { default: 'test-offers' },
      './MapPinPreview': { default: 'test-preview' },
      './MapPreviewPanel': { default: 'test-preview-panel' },
      './MapProjectPanel': { default: 'test-project-panel' },
      './MapProjectResults': { default: 'test-project-results' },
      './MapViewControls': { default: 'test-map-view-controls' },
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
      window: {
        matchMedia: (query) => ({
          matches: query.split(',').some((part) => {
            const maxWidth = part.match(/max-width: (\d+)/),
              maxHeight = part.match(/max-height: (\d+)/)
            return (!maxWidth || width <= Number(maxWidth[1])) && (!maxHeight || 900 <= Number(maxHeight[1]))
          }),
        }),
      },
      process: { env: { NEXT_PUBLIC_LONGDO_MAP_KEY: 'test-key' } },
    }
  ).default
  const center = { lat: 13.91, lon: 100.71 }
  function render() {
    cursor = 0
    tree = component({ initialMapCenter: center, initialMapZoom: 15, ...entryProps })
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
  return {
    render,
    nodes,
    data,
    map,
    tab,
    click,
    center,
    seedSelectedListing(listing) {
      const selection = slots.find((slot) => slot?.id === listing.id && slot.requestKey)
      assert.ok(selection)
      const index = slots.findIndex((slot) => slot?.rows && slot.status)
      slots[index] = { key: selection.requestKey, rows: [listing], status: 'ready' }
      render()
    },
    snapTo(value) {
      onSheetSnap(value)
      render()
    },
  }
}

test('entry location search reaches the map on desktop and mobile and preserves selected filters when resolved', () => {
  for (const width of [320, 390, 820, 1440]) {
    const h = harness(width, 'th', {
      query: 'สุราษฎร์ธานี',
      initialMapCenter: undefined,
      initialCategories: ['homes:condo'],
      initialFilters: { offerTypes: ['rent'], minPrice: '20000', maxPrice: '60000' },
    })
    assert.equal(h.map().initialSearchQuery, 'สุราษฎร์ธานี')
    h.map().onLocationSearch({ lat: 9.1382, lon: 99.3217 }, 'สุราษฎร์ธานี', 10)
    h.render()
    assert.equal(h.map().initialCenter.lat, 9.1382)
    assert.equal(h.map().initialZoom, 10)
    const filters = h.nodes((node) => node.type === 'test-filters')[0].props
    const serialized = JSON.stringify(filters)
    assert.match(serialized, /20000/)
    assert.match(serialized, /60000/)
    assert.deepEqual(Array.from(h.nodes((node) => node.type === 'test-offers')[0].props.value), ['rent'])
    h.click(h.tab('homes'))
    assert.equal(h.data('data-map-category', 'homes:condo').props['aria-pressed'], true)
  }
})

test('explicit coordinates and project deep links do not trigger another location lookup', () => {
  for (const entryProps of [
    { query: 'saved query' },
    { initialMapCenter: undefined, query: 'project name', initialProject: 'id' },
  ]) {
    assert.equal(harness(390, 'th', entryProps).map().initialSearchQuery, '')
  }
})

test('one project switch hides listing categories, clears previews and preserves the camera and category selection', () => {
  const h = harness(390)
  const controls = () => h.nodes((node) => node.type === 'test-map-view-controls')[0].props
  assert.equal(controls().mode, 'listings')
  h.click(h.tab('homes'))
  const category = h.nodes((node) => node.props?.['data-map-category'])[0]
  h.click(category)
  const categoryId = category.props['data-map-category']
  controls().onModeChange('projects')
  h.render()
  assert.equal(h.map().mapMode, 'projects')
  assert.equal(h.nodes((node) => node.props?.['data-map-group']).length, 0)
  assert.equal(h.nodes((node) => node.type === 'test-project-results').length, 1)
  assert.deepEqual(h.map().initialCenter, h.center)
  assert.equal(h.map().initialZoom, 15)
  controls().onModeChange('listings')
  h.render()
  assert.equal(h.map().mapMode, 'listings')
  assert.equal(h.data('data-map-category', categoryId).props['aria-pressed'], true)
})

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

test('project search opens exact project listings and its pin independently of the overview filters', () => {
  const h = harness(1440)
  h.nodes((node) => node.type === 'test-map-view-controls')[0].props.onModeChange('projects')
  h.render()
  h.nodes((node) => node.type === 'test-offers')[0].props.onChange(['rent'])
  h.render()
  const project = {
    public_project_id: 'project-1',
    slug: 'project-one',
    name_th: 'โครงการหนึ่ง',
    name_en: 'Project One',
    project_category: 'housing_estate',
    latitude: 14.1,
    longitude: 101.2,
    listing_count: 2,
  }
  h.map().onProjectSearchSelect(project)
  h.render()
  const panel = h.nodes((node) => node.type === 'test-project-panel')[0]
  assert.equal(panel.props.identifier, 'project-1')
  assert.equal(h.map().selectedProjectId, 'project-1')
  assert.equal(h.map().projectMarkers[0].id, 'project-1')
  assert.equal(h.map().initialCenter.lat, 14.1)
  assert.equal(h.map().initialZoom, 17)
  assert.deepEqual(Array.from(h.nodes((node) => node.type === 'test-offers')[0].props.value), ['rent'])
})

test('a searched project without coordinates opens its listings without inventing a map position', () => {
  const h = harness(390)
  h.nodes((node) => node.type === 'test-map-view-controls')[0].props.onModeChange('projects')
  h.render()
  h.map().onProjectSearchSelect({
    public_project_id: 'project-no-point',
    slug: 'no-point',
    name_th: 'โครงการ',
    name_en: '',
    project_category: 'housing_estate',
  })
  h.render()
  assert.equal(h.nodes((node) => node.type === 'test-project-panel')[0].props.identifier, 'project-no-point')
  assert.equal(h.map().initialCenter, h.center)
  assert.equal(h.map().initialZoom, 15)
  assert.equal(h.map().projectMarkers.length, 0)
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

test('desktop map interactions fold categories and the arrow restores their selection without moving the camera', () => {
  for (const width of [1024, 1440, 1920]) {
    const h = harness(width)
    h.click(h.data('data-map-category', 'homes:condo'))
    h.map().onMapInteraction()
    h.render()
    assert.equal(h.nodes((node) => node.props?.['data-map-category-group']).length, 0)
    assert.equal(h.data('aria-controls', 'map-category-options').props['aria-expanded'], false)
    assert.equal(h.map().initialCenter, h.center)
    assert.equal(h.map().initialZoom, 15)
    h.click(h.data('aria-controls', 'map-category-options'))
    assert.equal(h.nodes((node) => node.props?.['data-map-category-group']).length, 3)
    assert.equal(h.data('data-map-category', 'homes:condo').props['aria-pressed'], true)
    assert.deepEqual(Array.from(h.nodes((node) => node.type === 'test-offers')[0].props.value), ['sale', 'rent'])
  }
})

test('folding and reopening desktop categories never requests a map resize or changes its camera', () => {
  const h = harness(1440)
  const resizeRequest = h.map().resizeRequestId
  for (let i = 0; i < 4; i++) {
    h.click(h.data('aria-controls', 'map-category-options'))
    assert.equal(h.map().resizeRequestId, resizeRequest)
    assert.equal(h.map().initialCenter, h.center)
    assert.equal(h.map().initialZoom, 15)
  }
})

test('select-all and the disclosure arrow operate independently and preserve the other filters and camera', () => {
  for (const width of [1024, 1440, 1920]) {
    const h = harness(width)
    const filters = () => h.nodes((node) => node.type === 'test-filters')[0].props
    filters().onChange({ ...filters().value, offerTypes: ['rent'], minPrice: '20000', bedrooms: 2 })
    h.render()
    h.click(h.data('data-map-category', 'homes:condo'))
    const all = () => h.data('data-map-select-all-categories', true)
    const arrow = () => h.data('data-map-categories-toggle', true)
    const assertAllSelected = () => {
      const chips = h.nodes((node) => node.props?.['data-map-category'])
      assert.equal(chips.length, model.validMapCategoryIds.size)
      assert.ok(chips.every((node) => node.props['aria-pressed']))
    }
    assert.equal(all().props['aria-expanded'], undefined)
    assert.equal(all().props['aria-pressed'], false)
    h.click(all())
    assert.equal(arrow().props['aria-expanded'], true)
    assert.equal(all().props['aria-pressed'], true)
    assertAllSelected()
    h.click(arrow())
    assert.equal(arrow().props['aria-expanded'], false)
    assert.equal(all().props['aria-pressed'], true)
    h.click(arrow())
    assertAllSelected()

    // Selecting all also works while folded, without opening the panel.
    h.click(h.data('data-map-category', 'business:office'))
    h.click(arrow())
    h.click(all())
    assert.equal(arrow().props['aria-expanded'], false)
    assert.equal(all().props['aria-pressed'], true)
    h.click(arrow())
    assertAllSelected()
    h.click(all())
    assertAllSelected()
    assert.deepEqual(Array.from(filters().value.offerTypes), ['rent'])
    assert.equal(filters().value.minPrice, '20000')
    assert.equal(filters().value.bedrooms, 2)
    assert.equal(h.map().initialCenter, h.center)
    assert.equal(h.map().initialZoom, 15)
  }
})

test('four category footer actions select their own sections, combine groups and reflect partial selection', () => {
  for (const width of [390, 1440])
    for (const locale of ['th', 'en']) {
      const h = harness(width, locale)
      if (width < 1024) h.click(h.tab('homes'))
      const filters = () => h.nodes((node) => node.type === 'test-filters')[0].props
      filters().onChange({ ...filters().value, offerTypes: ['rent'], minPrice: '20000', bedrooms: 2 })
      h.render()
      const actions = h.nodes((node) => node.props?.['data-map-section-group'])
      assert.deepEqual(
        actions.map((node) => node.props.children[1].props.children),
        locale === 'th'
          ? ['หาที่อยู่อาศัย', 'หาห้องเช่า', 'หาพื้นที่ธุรกิจ', 'หาพื้นที่ขายของ']
          : ['Find a home', 'Find a rental', 'Find business space', 'Find retail space']
      )
      assert.equal(h.nodes((node) => ['groupHeading', 'sectionToolbar'].includes(node.props?.className)).length, 0)
      for (const section of h.nodes((node) => node.props?.['data-map-section'])) {
        const [chips, footer] = section.props.children
        const button = footer.props.children
        assert.equal(footer.props.className, 'sectionAction')
        assert.equal(button.props['aria-controls'], chips.props.id)
        assert.equal(section.props['aria-labelledby'], button.props.id)
      }
      const action = (key) => h.data('data-map-section-group', key)
      const select = (key) => {
        const group = key.split(':')[0]
        if (width < 1024 && !h.tab(group).props['aria-expanded']) h.click(h.tab(group))
        h.click(action(key))
      }
      for (const key of ['homes:homes', 'rooms:rooms', 'business:retail']) select(key)
      assert.equal(action('homes:homes').props['aria-pressed'], true)
      assert.equal(action('rooms:rooms').props['aria-pressed'], true)
      assert.equal(action('business:retail').props['aria-pressed'], true)
      assert.equal(
        action('business:buildings').props['aria-pressed'],
        false,
        'retail does not select the buildings section'
      )
      select('business:buildings')
      assert.ok(h.nodes((node) => node.props?.['data-map-category']).every((node) => node.props['aria-pressed']))
      for (const key of ['homes:homes', 'rooms:rooms', 'business:buildings', 'business:retail'])
        assert.equal(action(key).props.children[0].type, require('lucide-react').Check)
      select('business:retail')
      assert.equal(action('business:retail').props['aria-pressed'], false)
      for (const key of ['homes:homes', 'rooms:rooms', 'business:buildings'])
        assert.equal(action(key).props['aria-pressed'], true, 'clearing retail preserves other groups')
      if (width < 1024) h.click(h.tab('rooms'))
      h.click(h.data('data-map-category', 'rooms:condo'))
      assert.equal(
        action('rooms:rooms').props['aria-pressed'],
        false,
        'partial selection does not claim the whole group is selected'
      )
      select('rooms:rooms')
      assert.equal(action('rooms:rooms').props['aria-pressed'], true)
      assert.deepEqual(Array.from(filters().value.offerTypes), ['rent'])
      assert.equal(filters().value.minPrice, '20000')
      assert.equal(filters().value.bedrooms, 2)
      assert.equal(h.map().initialCenter, h.center)
      assert.equal(h.map().initialZoom, 15)
    }
})

test('map searching stays automatic and the four footer actions can select every category together', () => {
  const h = harness(390)
  h.click(h.tab('business'))
  h.click(h.data('data-map-category', 'business:office'))
  assert.equal(h.data('data-map-auto-search', true).props.role, 'status')
  assert.equal(h.nodes((node) => node.props?.['data-map-area-search']).length, 0)
  assert.equal(h.map().areaSearchRequestId, 0)
  assert.equal(h.map().initialCenter, h.center)
  assert.equal(h.data('data-map-category', 'business:office').props['aria-pressed'], true)
  for (const group of model.mapCategoryGroups) {
    if (!h.tab(group.code).props['aria-expanded']) h.click(h.tab(group.code))
    for (const section of group.sections) h.click(h.data('data-map-section-group', `${group.code}:${section.id}`))
  }
  assert.equal(h.data('data-map-category', 'business:office').props['aria-pressed'], true)
  assert.ok(h.nodes((node) => node.props?.['data-map-category']).every((node) => node.props['aria-pressed']))
  assert.equal(h.tab('business').props['aria-expanded'], true)
  const offers = h.nodes((node) => node.type === 'test-offers')[0].props.value
  assert.deepEqual(Array.from(offers), ['sale', 'rent'])
})

test('visible topbar reset clears all category groups and filters without moving the map', () => {
  const h = harness(390)
  const brand = h.data('data-map-brand', true)
  assert.ok(brand.props.children.some((node) => node?.type === 'test-logo'))
  assert.equal(h.data('data-map-search-controls', true).props['data-offer-layout'], 'compact')
  assert.equal(h.data('data-map-reset', true).props.disabled, true)
  assert.equal(h.data('data-map-reset', true).props['aria-hidden'], undefined)
  h.click(h.tab('homes'))
  h.click(h.data('data-map-category', 'homes:land'))
  h.click(h.data('data-map-category', 'rooms:condo'))
  const details = h.nodes((node) => node.type === 'test-filters')[0].props
  details.onChange({ ...details.value, offerTypes: ['rent'], minPrice: '1000000', bedrooms: 3 })
  h.map().onSearchArea({ bounds: { minLat: 13, maxLat: 14, minLon: 100, maxLon: 101 } })
  h.render()
  assert.equal(h.data('data-map-reset', true).props.disabled, false)
  h.click(h.data('data-map-reset', true))
  assert.equal(h.data('data-map-category', 'homes:land').props['aria-pressed'], false)
  assert.equal(h.data('data-map-category', 'business:land').props['aria-pressed'], false)
  assert.equal(h.data('data-map-category', 'rooms:condo').props['aria-pressed'], false)
  assert.deepEqual(Array.from(h.nodes((node) => node.type === 'test-offers')[0].props.value), ['sale', 'rent'])
  assert.equal(h.nodes((node) => node.type === 'test-filters')[0].props.value.minPrice, '')
  assert.equal(h.nodes((node) => node.type === 'test-filters')[0].props.value.bedrooms, 0)
  assert.equal(h.data('data-map-reset', true).props.disabled, true)
  assert.equal(h.map().initialCenter, h.center)
  assert.equal(h.map().initialZoom, 15)
})

test('desktop results start collapsed; opening the list replaces the floating preview without moving the map', () => {
  const h = harness(1440)
  h.click(h.data('data-map-open-results', true))
  assert.equal(h.nodes((node) => node.props?.['data-map-open-results']).length, 0)
  h.map().onMarkerSelect('listing-6')
  h.render()
  h.seedSelectedListing({ id: 'listing-6', latitude: 13.7, longitude: 100.6 })
  assert.equal(h.nodes((node) => node.type === 'test-preview').length, 1)
  h.click(h.data('data-map-open-results', true))
  assert.equal(h.nodes((node) => node.type === 'test-preview').length, 0)
  assert.equal(h.map().initialCenter, h.center)
})

test('project overview and map markers share hover state without opening a project or changing camera', () => {
  const h = harness(1440, 'th', { initialMapMode: 'projects' })
  const overview = () => h.nodes((node) => node.type === 'test-project-results')[0].props
  overview().onHover('project-a')
  h.render()
  assert.equal(h.map().hoveredProjectId, 'project-a')
  h.map().onProjectHover('project-b')
  h.render()
  assert.equal(overview().hoveredProjectId, 'project-b')
  assert.equal(h.nodes((node) => node.type === 'test-project-panel').length, 0)
  assert.equal(h.map().initialCenter, h.center)
  assert.equal(h.map().initialZoom, 15)
  overview().onChoose({ id: 'project-b', location: { lat: 13.7, lon: 100.5 } })
  h.render()
  assert.equal(h.map().hoveredProjectId, '')
  assert.equal(h.nodes((node) => node.type === 'test-project-panel')[0].props.identifier, 'project-b')
})

test('selection keeps the phone top sheet and anchors tablet/desktop previews inside the map', () => {
  for (const width of [320, 390, 820, 1440]) {
    const h = harness(width)
    if (width < 1024) h.click(h.tab('homes'))
    h.map().onMarkerSelect('listing-6')
    h.render()
    h.seedSelectedListing({ id: 'listing-6', latitude: 13.7, longitude: 100.6, offer_amount: 315000000 })
    assert.equal(h.map().currentHoverID, 'listing-6')
    assert.equal(h.map().previewListingId, 'listing-6')
    assert.equal(h.data('data-map-results-panel', true).props['data-sheet-snap'], 'peek')
    const preview = () => h.nodes((node) => node.type === 'test-preview')[0].props
    assert.equal(preview().listing.id, 'listing-6')
    assert.equal(h.nodes((node) => node.type === 'test-preview-panel')[0].props.mobile, width < 768)
    assert.equal(h.data('data-map-navigation', true).props.inert, width < 768)
    if (width < 1024) assert.equal(h.tab('homes').props['aria-expanded'], false)
    const canvas = h.data('data-map-canvas', true)
    const previewInsideCanvas = canvas.props.children.some(
      (node) => node?.type === 'test-presence' && Boolean(node.props.children)
    )
    assert.equal(previewInsideCanvas, width >= 768, 'phone card is above navigation, outside the clipped map canvas')
    assert.equal(h.nodes((node) => node.props?.className === 'resultsList')[0].props.hidden, undefined)
    h.map().onMapInteraction()
    h.render()
    assert.equal(preview().listing.id, 'listing-6', 'ordinary pan completion leaves the preview visible')
    assert.equal(h.map().currentHoverID, 'listing-6')
    assert.equal(h.map().initialCenter, h.center)
    h.map().onMapBackgroundTap()
    h.render()
    assert.equal(h.nodes((node) => node.type === 'test-preview').length, width < 1024 ? 0 : 1)
    assert.equal(h.data('data-map-navigation', true).props.inert, false)
    assert.equal(h.map().initialCenter, h.center)
  }
})

test('another marker replaces the top preview; expanding results closes it on mobile', () => {
  const h = harness(390)
  for (const id of ['listing-6', 'listing-7']) {
    h.map().onMarkerSelect(id)
    h.render()
    h.seedSelectedListing({ id, latitude: 13.7, longitude: 100.6, offer_amount: 315000000 })
    const previews = h.nodes((node) => node.type === 'test-preview')
    assert.equal(previews.length, 1)
    assert.equal(previews[0].props.listing.id, id)
    assert.equal(h.map().currentHoverID, id)
  }
  h.data('data-map-results-panel', true).props.onPointerDownCapture()
  h.render()
  assert.equal(
    h.nodes((node) => node.type === 'test-preview').length,
    0,
    'touching the list dismisses the top preview before dragging'
  )
  h.snapTo('full')
  assert.equal(h.nodes((node) => node.type === 'test-preview').length, 0)
  assert.equal(h.data('data-map-results-panel', true).props['data-sheet-snap'], 'full')
  assert.equal(h.map().initialCenter, h.center)
})

test('observing a moved viewport does not issue camera commands or implicitly filter results', () => {
  const h = harness(390)
  h.map().onViewportChange({ center: { lat: 13.73, lon: 100.52 }, zoom: 16 })
  h.render()
  assert.equal(h.map().initialCenter, h.center)
  assert.equal(h.map().initialZoom, 15)
  assert.equal(h.map().areaSearchRequestId, 0)
  assert.match(h.data('data-map-area-label', true).props.title, /สาทร/)
  h.click(h.data('data-map-mobile-panel-toggle', true))
  assert.equal(h.data('data-map-results-panel', true).props['data-sheet-snap'], 'full')
  h.click(h.data('data-map-mobile-panel-toggle', true))
  assert.equal(h.data('data-map-results-panel', true).props['data-sheet-snap'], 'peek')
})
