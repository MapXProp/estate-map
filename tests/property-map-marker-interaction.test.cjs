const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const jsx = require('react/jsx-runtime')
const projectContext = { exports: {}, require: () => ({}) }
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/propertyMapProjects.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  projectContext
)

const listing = {
  id: 'listing-6',
  handle: 'land-sutthisan',
  title: 'ที่ดินสุทธิสาร',
  map: { lat: 13.7, lng: 100.6 },
  galleryImgs: [],
  priceAmount: 315000000,
}
function harness(width, initialZoom = 14, initialListings = [listing], projectsEnabled = false) {
  const slots = [],
    effects = [],
    frames = new Map(),
    listeners = new Map(),
    calls = [],
    navigation = [],
    selected = [],
    selectedProjects = [],
    overlays = []
  let cursor = 0,
    dirty = false,
    tree,
    frameId = 0,
    pathname = '/properties/map',
    props,
    api
  const equal = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
  class Element {
    constructor(link = null) {
      this.link = link
      this.dataset = {}
      this.offsetWidth = 100
      this.style = {
        setProperty(name, value) {
          this[name] = value
        },
      }
      this.classes = new Set()
      this.attributes = {}
      this.classList = { toggle: (name, active) => (active ? this.classes.add(name) : this.classes.delete(name)) }
    }
    closest(selector) {
      if (selector === 'a,button,input,select,textarea,[data-mapx-price-marker]')
        return this.link || (this.isControl ? this : null)
      return selector === '[data-map-canvas]'
        ? this
        : selector.startsWith('a[')
          ? selector.includes('property-link')
            ? null
            : this.link
          : this.root || this
    }
    querySelectorAll(selector) {
      if (selector.includes('aria-controls="map-property-preview"')) return [this]
      if (this.isMap && selector.includes('data-mapx-project-marker')) return projectRoots
      return this.isMap && selector.includes('data-mapx-price-marker') ? markerRoots : []
    }
    querySelector() {
      return this
    }
    getBoundingClientRect() {
      return { left: 0, top: 0, width, height: 600, right: width, bottom: 600 }
    }
    contains() {
      return true
    }
    addEventListener() {}
    removeEventListener() {}
    focus() {}
    setAttribute(name, value) {
      this.attributes[name] = value
    }
    getAttribute(name) {
      return name === 'href' ? '/real-estate-listings/land-sutthisan' : null
    }
  }
  const markerRoots = initialListings.map((item) => {
    const root = new Element()
    root.dataset.mapxListingId = item.id
    return root
  })
  const markerRoot = markerRoots[0]
  const projectRoots = projectsEnabled
    ? projectContext.exports.groupMapProjects(initialListings).map((project) => {
        const root = new Element()
        root.dataset.mapxProjectId = project.id
        return root
      })
    : []
  const hooks = {
    useRef(initial) {
      const i = cursor++
      if (!slots[i]) slots[i] = { current: initial }
      return slots[i]
    },
    useState(initial) {
      const i = cursor++
      if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }
      return [
        slots[i].value,
        (next) => {
          const value = typeof next === 'function' ? next(slots[i].value) : next
          if (!Object.is(value, slots[i].value)) {
            slots[i].value = value
            dirty = true
          }
        },
      ]
    },
    useMemo(fn, deps) {
      const i = cursor++
      if (!slots[i] || !equal(slots[i].deps, deps)) slots[i] = { value: fn(), deps }
      return slots[i].value
    },
    useCallback(fn, deps) {
      return hooks.useMemo(() => fn, deps)
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
  const formatCurrencyFrom = () => '315,000,000 บาท'
  const router = { push: (...args) => navigation.push(args) }
  const imports = {
    react: hooks,
    'react/jsx-runtime': jsx,
    'lucide-react': require('lucide-react'),
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'th', formatCurrencyFrom }) },
    '@/lib/propertyReturnNavigation': { rememberPropertyResultsLocation: () => {} },
    '@/lib/propertyMapProjects': projectContext.exports,
    '@/lib/propertyMapLocationSearch': {},
    'next/navigation': { usePathname: () => pathname, useRouter: () => router },
    'next/script': { default: 'sdk-script' },
  }
  const window = {
    location: { pathname, search: '?lat=13.8&lon=100.4&zoom=14', hash: '' },
    requestAnimationFrame: (fn) => {
      frames.set(++frameId, fn)
      return frameId
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout: () => 1,
    clearTimeout() {},
    matchMedia: () => ({ matches: width < 1024 }),
    addEventListener() {},
    removeEventListener() {},
    longdo: {
      UiComponent: { None: 0 },
      Map: class {
        constructor(options) {
          let center = options.location,
            zoom = options.zoom
          this.Ui = { Crosshair: { visible() {} } }
          this.Event = {
            bind: (event, callback) => {
              if (event === 'ready') callback()
            },
          }
          this.Overlays = {
            add(marker) {
              overlays.push(marker)
            },
            remove() {},
            clear() {},
          }
          this.location = (...args) => {
            if (args.length) {
              calls.push(['location', ...args])
              center = args[0]
            }
            return center
          }
          this.zoom = (...args) => {
            if (args.length) {
              calls.push(['zoom', ...args])
              zoom = args[0]
            }
            return zoom
          }
          this.resize = () => this
          this.repaint = () => this
          api = this
        }
      },
      Marker: class {
        constructor(location, options) {
          this.location = location
          this.options = options
        }
      },
    },
  }
  const context = {
    exports: {},
    window,
    Element,
    Node: Element,
    URLSearchParams,
    setTimeout: () => 1,
    clearTimeout() {},
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
    document: {
      addEventListener: (type, callback) => listeners.set(type, callback),
      removeEventListener: (type) => listeners.delete(type),
      visibilityState: 'visible',
    },
    require: (name) => {
      if (!(name in imports)) throw Error(name)
      return imports[name]
    },
  }
  const filename = path.join(__dirname, '../src/components/map/LongdoPropertyMap.tsx')
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    context
  )
  function visit(node, fn) {
    if (Array.isArray(node)) return node.forEach((child) => visit(child, fn))
    if (!node || typeof node !== 'object') return
    fn(node)
    visit(node.props?.children, fn)
  }
  function render(next = {}) {
    props = { ...props, ...next }
    for (let turn = 0; turn < 10; turn++) {
      dirty = false
      cursor = 0
      tree = context.exports.default(props)
      visit(tree, (node) => {
        if (node.props?.ref && !node.props.ref.current) {
          node.props.ref.current = new Element()
          node.props.ref.current.isMap = Boolean(node.props.onPointerDownCapture)
        }
      })
      while (effects.length) effects.shift()()
      for (const [id, frame] of [...frames]) {
        frames.delete(id)
        frame()
      }
      if (!dirty) return
    }
    throw Error('Hook runner did not settle')
  }
  render({
    apiKey: 'test-key',
    listings: initialListings,
    currentHoverID: '',
    previewListingId: '',
    initialCenter: { lat: 13.8, lon: 100.4 },
    initialZoom,
    exactCoordinates: true,
    onMarkerSelect: (id) => selected.push(id),
    onProjectSelect: projectsEnabled ? (project) => selectedProjects.push(project) : undefined,
    mapMode: projectsEnabled ? 'projects' : undefined,
  })
  visit(tree, (node) => {
    if (node.type === 'sdk-script') node.props.onReady()
  })
  render()
  calls.length = 0
  function linkTarget(action, markerIndex = 0) {
    if (action === 'map') return new Element()
    if (action === 'control') {
      const node = new Element()
      node.isControl = true
      return node
    }
    const link = new Element()
    link.dataset[action === 'project' ? 'mapxProjectLink' : action === 'dot' ? 'mapxMarkerLink' : 'mapxQuickView'] =
      'true'
    link.root = action === 'project' ? projectRoots[markerIndex] : markerRoots[markerIndex]
    return new Element(link)
  }
  function click(action, options = {}) {
    const event = {
      target: linkTarget(action, options.markerIndex),
      button: 0,
      prevented: false,
      stopped: false,
      preventDefault() {
        this.prevented = true
      },
      stopImmediatePropagation() {
        this.stopped = true
      },
      ...options,
    }
    listeners.get('click')(event)
    return event
  }
  let pointerTime = 100
  function pointer(type, action = 'dot', options = {}) {
    const event = {
      target: linkTarget(action),
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 100,
      clientY: 200,
      timeStamp: (pointerTime += 50),
      ...options,
    }
    assert.ok(listeners.has(type), `${type} is handled without relying on a click`)
    listeners.get(type)(event)
    return event
  }
  return {
    render,
    calls,
    navigation,
    selected,
    selectedProjects,
    overlays,
    getProjectMarkerHtml: context.exports.getProjectMarkerHtml,
    click,
    pointer,
    markerRoot,
    markerRoots,
    getSpiderOffsets: context.exports.getSpiderOffsets,
    unmount: () => slots.forEach((slot) => slot?.cleanup?.()),
    api,
    getMarkerHtml: context.exports.getMarkerHtml,
    startMapGesture: (options = {}) =>
      visit(tree, (node) => {
        if (node.props?.onPointerDownCapture)
          node.props.onPointerDownCapture({
            target: linkTarget(options.action || 'map'),
            pointerId: 1,
            clientX: 100,
            clientY: 200,
            timeStamp: 100,
            isPrimary: true,
            button: 0,
            ...options,
          })
      }),
    moveMapGesture: (options = {}) =>
      visit(tree, (node) => {
        if (node.props?.onPointerMoveCapture)
          node.props.onPointerMoveCapture({ pointerId: 1, clientX: 100, clientY: 200, ...options })
      }),
    cancelMapGesture: () =>
      visit(tree, (node) => {
        node.props?.onPointerCancelCapture?.()
      }),
    finishMapGesture: (options = {}) =>
      visit(tree, (node) => {
        if (node.props?.onPointerUpCapture)
          node.props.onPointerUpCapture({
            pointerId: 1,
            clientX: 100,
            clientY: 200,
            timeStamp: 200,
            isPrimary: true,
            button: 0,
            ...options,
          })
      }),
    changePath: (path) => {
      pathname = path
      render()
    },
  }
}

test('dot selects a preview without changing the camera on phone, tablet and desktop', () => {
  for (const width of [390, 820, 1440]) {
    const h = harness(width)
    // The visitor has panned away from the initial location.
    const center = { lat: 13.95, lon: 100.72 }
    h.api.location(center)
    h.api.zoom(15)
    h.calls.length = 0
    const event = h.click('dot')
    assert.ok(event.prevented && event.stopped)
    assert.deepEqual(h.selected, [listing.id])
    h.render({ previewListingId: listing.id, currentHoverID: listing.id })
    h.render({ previewListingId: '', currentHoverID: '' })
    assert.deepEqual(h.calls, [], `no recenter or zoom after selection/close at width ${width}`)
    assert.equal(h.api.location(), center)
    assert.equal(h.api.zoom(), 15)
    assert.equal(h.navigation.length, 0)
  }
})

test('coincident pins spread at street zoom and stay in place when selecting each listing', () => {
  for (const width of [390, 1440]) {
    const listings = [
      listing,
      { ...listing, id: 'listing-7' },
      { ...listing, id: 'elsewhere', map: { lat: 13.71, lng: 100.61 } },
    ]
    const h = harness(width, 17, listings)
    const positions = () => h.markerRoots.map((root) => [root.style['--mapx-fan-x'], root.style['--mapx-fan-y']])
    const before = positions()
    assert.notDeepEqual(before[0], before[1])
    assert.deepEqual(before[2], ['0px', '0px'])
    for (const markerIndex of [0, 1]) {
      assert.equal(h.markerRoots[markerIndex].dataset.mapxFanned, 'true')
      h.click('dot', { markerIndex })
      h.render({ previewListingId: listings[markerIndex].id, currentHoverID: listings[markerIndex].id })
      assert.deepEqual(positions(), before)
    }
    assert.deepEqual(h.selected, ['listing-6', 'listing-7'])
    h.render({ previewListingId: '', currentHoverID: '' })
    assert.deepEqual(positions(), before)
    assert.deepEqual(h.calls, [])
  }
})

test('a duplicate can be expanded at overview zoom without recentering or zooming', () => {
  const h = harness(390, 12, [listing, { ...listing, id: 'listing-7' }])
  assert.ok(h.markerRoots.every((root) => root.dataset.mapxFanned === 'false'))
  h.click('dot')
  h.render({ currentHoverID: listing.id, previewListingId: listing.id })
  assert.ok(h.markerRoots.every((root) => root.dataset.mapxFanned === 'true'))
  const positions = h.markerRoots.map((root) => root.style['--mapx-fan-x'])
  h.render({ currentHoverID: 'listing-7', previewListingId: 'listing-7' })
  assert.deepEqual(
    h.markerRoots.map((root) => root.style['--mapx-fan-x']),
    positions
  )
  assert.deepEqual(h.calls, [])
})

test('spider layouts keep separate touch targets for small and large duplicate groups', () => {
  const h = harness(390)
  for (const count of [2, 3, 4, 8, 9, 16, 24, 50, 100]) {
    const offsets = h.getSpiderOffsets(count, 100)
    assert.equal(offsets.length, count)
    offsets.forEach((point, index) => {
      assert.ok(Math.hypot(point.x, point.y) >= 44)
      offsets.slice(index + 1).forEach((other) => {
        assert.ok(Math.hypot(point.x - other.x, point.y - other.y) >= 44, `${count} pins keep 44px clearance`)
      })
    })
  }
})

test('project mode replaces coincident price pins with one accessible building marker and opens without moving the camera', () => {
  const units = [listing, { ...listing, id: 'listing-7' }].map((row) => ({
    ...row,
    projectPublicId: 'project-a',
    projectSlug: 'the-address',
    projectName: 'The Address <A>',
    projectCategory: 'condominium',
  }))
  for (const width of [390, 1440]) {
    const h = harness(width, 17, units, true)
    const markers = h.overlays.filter((marker) => marker.options?.icon)
    assert.ok(markers.every((marker) => marker.options.icon.html.includes('data-mapx-project-marker')))
    const html = markers[0].options.icon.html
    assert.ok(html.includes('The Address &lt;A&gt;'))
    assert.ok(html.includes('project=the-address'))
    assert.ok(!html.includes('mapx-fan-line'))
    h.click('project')
    assert.equal(h.selectedProjects.length, 1)
    assert.equal(h.selectedProjects[0].id, 'project-a')
    assert.equal(h.navigation.length, 0)
    assert.equal(h.selected.length, 0)
    assert.deepEqual(h.calls, [])
    const overlayCount = h.overlays.length
    h.render({ selectedProjectId: 'project-a' })
    h.render({ selectedProjectId: '' })
    assert.equal(
      h.overlays.length,
      overlayCount,
      'selection highlights existing project pins without rebuilding overlays'
    )
    h.pointer('pointerdown', 'project')
    h.pointer('pointerup', 'project')
    h.click('project', { detail: 1 })
    h.render()
    assert.equal(h.selectedProjects.length, 2, 'native touch and compatibility click open once')
    assert.equal(h.click('project', { ctrlKey: true }).prevented, false)
    assert.deepEqual(h.calls, [])
  }
})

test('listing pins are the default; switching to all projects and back preserves the camera', () => {
  const units = ['condominium', 'housing_estate', 'commercial_complex', 'mixed_use'].map((category, i) => ({
    ...listing,
    id: `unit-${i}`,
    projectPublicId: `project-${i}`,
    projectSlug: `project-${i}`,
    projectName: `Project ${i}`,
    projectCategory: category,
  }))
  const rows = [...units, { ...listing, id: 'standalone' }]
  const h = harness(1440, 17, rows)
  h.render({ onProjectSelect: () => {} })
  const markers = (since) => h.overlays.slice(since).filter((marker) => marker.options?.icon)
  assert.equal(markers(0).length, rows.length)
  assert.ok(markers(0).every((marker) => marker.options.icon.html.includes('data-mapx-price-marker')))
  let before = h.overlays.length
  h.render({ mapMode: 'projects' })
  assert.equal(markers(before).length, units.length)
  assert.ok(markers(before).every((marker) => marker.options.icon.html.includes('data-mapx-project-marker')))
  before = h.overlays.length
  h.render({ mapMode: 'listings' })
  assert.equal(markers(before).length, rows.length)
  assert.ok(markers(before).every((marker) => marker.options.icon.html.includes('data-mapx-price-marker')))
  assert.deepEqual(h.calls, [], 'mode switches never pan or zoom')
})

test('a two-pin spider has at most 84px wings instead of 132px', () => {
  const offsets = harness(390).getSpiderOffsets(2, 180)
  assert.ok(offsets.every((point) => Math.hypot(point.x, point.y) <= 84))
})

test('price opens the same preview as the dot without navigating or changing the camera', () => {
  for (const width of [390, 820, 1440]) {
    const h = harness(width)
    const event = h.click('price')
    assert.ok(event.prevented && event.stopped)
    assert.deepEqual(h.selected, [listing.id])
    h.render({ previewListingId: listing.id, currentHoverID: listing.id })
    assert.equal(h.navigation.length, 0)
    h.render({ previewListingId: '', currentHoverID: '' })
    assert.deepEqual(h.calls, [])
  }
})

test('pressing the selected price keeps its preview open and modified clicks retain native links', () => {
  const h = harness(820)
  h.click('dot')
  h.render({ previewListingId: listing.id, currentHoverID: listing.id })
  h.click('price')
  assert.deepEqual(h.selected, [listing.id])
  assert.equal(h.navigation.length, 0)
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { button: 1 }]) {
    const event = h.click('price', options)
    assert.equal(event.prevented, false)
  }
  assert.equal(h.navigation.length, 0)
  assert.deepEqual(h.calls, [])
})

test('dot and price are separate accessible links, escape content and preserve native property URLs', () => {
  const h = harness(1440)
  const html = h.getMarkerHtml(
    { ...listing, title: '<script>test</script>' },
    '315,000,000 บาท',
    true,
    true,
    true,
    true
  )
  assert.equal((html.match(/<a\s/g) || []).length, 2)
  assert.match(html, /data-mapx-marker-link="true"[\s\S]*aria-expanded="true"/)
  assert.match(html, /data-mapx-quick-view="true"[\s\S]*aria-expanded="true"/)
  assert.equal((html.match(/aria-controls="map-property-preview"/g) || []).length, 2)
  assert.doesNotMatch(html, /aria-haspopup="dialog"/)
  assert.match(html, /class="mapx-price-pill">315,000,000 บาท<\/span>/)
  assert.doesNotMatch(html, /\stitle=|<svg/)
  assert.ok(!html.includes('<script>'))
  const legacy = h.getMarkerHtml(listing, '315,000,000 บาท', false, true, false, false)
  assert.equal((legacy.match(/<a\s/g) || []).length, 1)
})

test('mouse press folds map controls before release, once per gesture, without changing the camera', () => {
  const h = harness(1440)
  let folds = 0
  h.render({ onMapInteraction: () => folds++ })
  h.startMapGesture({ pointerType: 'mouse' })
  assert.equal(folds, 1, 'fold synchronously on primary mouse down')
  h.moveMapGesture({ clientX: 160 })
  h.finishMapGesture({ pointerType: 'mouse', clientX: 160 })
  h.render()
  assert.equal(folds, 1, 'mouse up does not fold again')
  h.startMapGesture({ pointerType: 'mouse', button: 2 })
  h.finishMapGesture({ pointerType: 'mouse', button: 2 })
  h.startMapGesture({ pointerType: 'mouse', isPrimary: false })
  h.finishMapGesture({ pointerType: 'mouse', isPrimary: false })
  h.render()
  assert.equal(folds, 1, 'secondary presses do not fold')
  assert.deepEqual(h.calls, [])
})

test('touch map interaction callback waits for a completed primary gesture without moving the camera', () => {
  const h = harness(390)
  let completed = 0
  h.render({ onMapInteraction: () => completed++ })
  h.startMapGesture()
  h.finishMapGesture()
  assert.equal(completed, 0, 'do not resize underneath an unfinished tap')
  h.render()
  assert.equal(completed, 1)
  h.startMapGesture()
  h.startMapGesture({ isPrimary: false })
  h.finishMapGesture()
  h.finishMapGesture({ isPrimary: false })
  h.startMapGesture({ button: 2 })
  h.finishMapGesture({ button: 2 })
  h.render()
  assert.equal(completed, 1)
  assert.deepEqual(h.calls, [])
})

test('native touch on dot then price keeps one preview even when the SDK suppresses clicks', () => {
  for (const width of [390, 820]) {
    const h = harness(width, 12)
    assert.equal(h.markerRoot.dataset.mapxLabelVisible, 'false')
    const center = h.api.location()
    h.pointer('pointerdown')
    h.pointer('pointerup', 'dot', { clientX: 104, clientY: 203, defaultPrevented: true })
    assert.deepEqual(h.selected, [], 'SDK must finish touchend before React changes the preview')
    h.render()
    assert.deepEqual(h.selected, [listing.id])
    h.render({ currentHoverID: listing.id, previewListingId: listing.id })
    assert.ok(h.markerRoot.classes.has('is-active'))
    assert.equal(h.markerRoot.dataset.mapxLabelVisible, 'true')
    assert.equal(h.markerRoot.attributes['aria-expanded'], 'true')
    h.pointer('pointerdown', 'price')
    h.pointer('pointerup', 'price')
    assert.equal(h.click('price', { detail: 1 }).prevented, true, 'a compatibility click is consumed')
    h.render()
    assert.equal(h.navigation.length, 0)
    assert.deepEqual(h.selected, [listing.id])
    assert.deepEqual(h.calls, [], 'tap activation never pans or zooms the map')
    assert.equal(h.api.location(), center)
  }
})

test('native taps on an already-visible price select the preview without navigating', () => {
  const h = harness(390)
  h.pointer('pointerdown', 'price')
  h.pointer('pointerup', 'price')
  h.render()
  assert.deepEqual(h.selected, [listing.id])
  assert.equal(h.navigation.length, 0)
  assert.deepEqual(h.calls, [])
})

test('panning away and back, pinching, long-pressing and cancelling a marker do not select or open it', () => {
  for (const gesture of ['pan', 'pinch', 'hold', 'cancel', 'outside']) {
    const h = harness(390)
    h.pointer('pointerdown', gesture === 'outside' ? 'map' : 'dot')
    if (gesture === 'pan') {
      h.pointer('pointermove', 'dot', { clientX: 140 })
      h.pointer('pointermove', 'dot', { clientX: 100 })
    }
    if (gesture === 'pinch') h.pointer('pointerdown', 'map', { pointerId: 2, isPrimary: false })
    if (gesture === 'cancel') h.pointer('pointercancel')
    h.pointer('pointerup', 'dot', { timeStamp: gesture === 'hold' ? 1000 : 350 })
    if (gesture === 'pinch') h.pointer('pointerup', 'map', { pointerId: 2, isPrimary: false })
    if (gesture !== 'outside') h.click('dot', { detail: 1 })
    h.render()
    assert.deepEqual(h.selected, [], gesture)
    assert.equal(h.navigation.length, 0, gesture)
    assert.deepEqual(h.calls, [], gesture)
  }
})

test('touch de-duplication keeps keyboard and subsequent mouse clicks usable; unmount cancels queued taps', () => {
  const h = harness(820)
  h.pointer('pointerdown', 'price')
  h.pointer('pointerup', 'price')
  h.render()
  h.click('price', { detail: 0 })
  assert.equal(h.selected.length, 2, 'keyboard activation is never suppressed')
  h.pointer('pointerdown', 'price', { pointerType: 'mouse' })
  h.click('price', { detail: 1 })
  assert.equal(h.selected.length, 3, 'mouse activation works immediately after touch')
  h.pointer('pointerdown', 'price')
  h.pointer('pointerup', 'price')
  h.unmount()
  h.render()
  assert.equal(h.selected.length, 3)
  assert.equal(h.navigation.length, 0)
})

test('maps without a preview handler keep their normal listing navigation', () => {
  const h = harness(1440)
  h.render({ onMarkerSelect: undefined })
  h.click('dot')
  assert.equal(h.navigation[0][0], '/real-estate-listings/land-sutthisan')
  assert.equal(h.navigation[0][1].scroll, false)
  assert.deepEqual(h.selected, [])
})

test('a background tap closes the mobile preview after the gesture completes without moving the map', () => {
  const h = harness(390)
  let dismissed = 0
  h.render({ onMapBackgroundTap: () => dismissed++ })
  h.startMapGesture()
  h.finishMapGesture({ clientX: 104, clientY: 202 })
  assert.equal(dismissed, 0)
  h.render()
  assert.equal(dismissed, 1)
  assert.deepEqual(h.calls, [])
})

test('marker and price taps, controls, panning, pinching, cancellation and long holds do not dismiss the preview', () => {
  for (const action of ['dot', 'price', 'control', 'pan', 'pinch', 'cancel', 'hold', 'right-click']) {
    const h = harness(390)
    let dismissed = 0
    h.render({ onMapBackgroundTap: () => dismissed++ })
    h.startMapGesture({
      action: ['dot', 'price', 'control'].includes(action) ? action : 'map',
      button: action === 'right-click' ? 2 : 0,
    })
    if (action === 'pan') {
      h.moveMapGesture({ clientX: 150 })
      h.moveMapGesture({ clientX: 100 })
    }
    if (action === 'pinch') h.startMapGesture({ pointerId: 2, isPrimary: false })
    if (action === 'cancel') h.cancelMapGesture()
    h.finishMapGesture({ timeStamp: action === 'hold' ? 1000 : 300 })
    h.render()
    assert.equal(dismissed, 0, action)
    assert.deepEqual(h.calls, [], action)
  }
})
