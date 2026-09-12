const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const jsx = require('react/jsx-runtime')

const listing = {
  id: 'listing-6',
  handle: 'land-sutthisan',
  title: 'ที่ดินสุทธิสาร',
  map: { lat: 13.7, lng: 100.6 },
  galleryImgs: [],
  priceAmount: 315000000,
}
function harness(width, initialZoom = 14) {
  const slots = [],
    effects = [],
    frames = new Map(),
    listeners = new Map(),
    calls = [],
    navigation = [],
    selected = []
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
      this.style = { setProperty() {} }
      this.classes = new Set()
      this.attributes = {}
      this.classList = { toggle: (name, active) => (active ? this.classes.add(name) : this.classes.delete(name)) }
    }
    closest(selector) {
      return selector === '[data-map-canvas]'
        ? this
        : selector.startsWith('a[')
          ? selector.includes('property-link')
            ? null
            : this.link
          : this.root || this
    }
    querySelectorAll(selector) {
      return this.isMap && selector.includes('data-mapx-price-marker') ? [markerRoot] : []
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
  const markerRoot = new Element()
  markerRoot.dataset.mapxListingId = listing.id
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
          this.Overlays = { add() {}, remove() {}, clear() {} }
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
      Marker: class {},
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
    listings: [listing],
    currentHoverID: '',
    previewListingId: '',
    initialCenter: { lat: 13.8, lon: 100.4 },
    initialZoom,
    exactCoordinates: true,
    onMarkerSelect: (id) => selected.push(id),
  })
  visit(tree, (node) => {
    if (node.type === 'sdk-script') node.props.onReady()
  })
  render()
  calls.length = 0
  function linkTarget(action) {
    if (action === 'map') return new Element()
    const link = new Element()
    link.dataset[action === 'dot' ? 'mapxMarkerLink' : 'mapxQuickView'] = 'true'
    link.root = markerRoot
    return new Element(link)
  }
  function click(action, options = {}) {
    const event = {
      target: linkTarget(action),
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
    click,
    pointer,
    markerRoot,
    unmount: () => slots.forEach((slot) => slot?.cleanup?.()),
    api,
    getMarkerHtml: context.exports.getMarkerHtml,
    startMapGesture: (options = {}) =>
      visit(tree, (node) => {
        if (node.props?.onPointerDownCapture)
          node.props.onPointerDownCapture({ isPrimary: true, button: 0, ...options })
      }),
    finishMapGesture: (options = {}) =>
      visit(tree, (node) => {
        if (node.props?.onPointerUpCapture) node.props.onPointerUpCapture({ isPrimary: true, button: 0, ...options })
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

test('price opens details immediately and preserves camera when opening and closing the modal', () => {
  for (const width of [390, 820, 1440]) {
    const h = harness(width)
    const event = h.click('price')
    assert.ok(event.prevented && event.stopped)
    assert.deepEqual(h.selected, [listing.id])
    h.render({ previewListingId: listing.id, currentHoverID: listing.id })
    assert.equal(h.navigation[0][0], '/real-estate-listings/land-sutthisan')
    assert.equal(h.navigation[0][1].scroll, false)
    h.changePath('/real-estate-listings/land-sutthisan')
    h.changePath('/properties/map')
    assert.deepEqual(h.calls, [])
  }
})

test('dot then price follows the same two-stage flow and modified clicks keep native link behavior', () => {
  const h = harness(820)
  h.click('dot')
  h.render({ previewListingId: listing.id, currentHoverID: listing.id })
  h.click('price')
  assert.deepEqual(h.selected, [listing.id])
  assert.equal(h.navigation.length, 1)
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { button: 1 }]) {
    const event = h.click('price', options)
    assert.equal(event.prevented, false)
  }
  assert.equal(h.navigation.length, 1)
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
  assert.match(html, /data-mapx-quick-view="true"[\s\S]*aria-haspopup="dialog"/)
  assert.match(html, /class="mapx-price-pill">315,000,000 บาท<\/span>/)
  assert.doesNotMatch(html, /\stitle=|<svg/)
  assert.ok(!html.includes('<script>'))
  const legacy = h.getMarkerHtml(listing, '315,000,000 บาท', false, true, false, false)
  assert.equal((legacy.match(/<a\s/g) || []).length, 1)
})

test('map interaction callback runs after a completed primary gesture without moving the camera', () => {
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

test('native touch selects and activates a dot, then opens its price once even when the SDK suppresses clicks', () => {
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
    assert.equal(h.navigation.length, 1)
    assert.equal(h.navigation[0][0], '/real-estate-listings/land-sutthisan')
    assert.equal(h.navigation[0][1].scroll, false)
    assert.deepEqual(h.selected, [listing.id])
    assert.deepEqual(h.calls, [], 'tap activation never pans or zooms the map')
    assert.equal(h.api.location(), center)
  }
})

test('native taps on an already-visible price open details directly without requiring a dot tap', () => {
  const h = harness(390)
  h.pointer('pointerdown', 'price')
  h.pointer('pointerup', 'price')
  h.render()
  assert.deepEqual(h.selected, [listing.id])
  assert.equal(h.navigation.length, 1)
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
  assert.equal(h.navigation.length, 2, 'keyboard activation is never suppressed')
  h.pointer('pointerdown', 'price', { pointerType: 'mouse' })
  h.click('price', { detail: 1 })
  assert.equal(h.navigation.length, 3, 'mouse activation works immediately after touch')
  h.pointer('pointerdown', 'price')
  h.pointer('pointerup', 'price')
  h.unmount()
  h.render()
  assert.equal(h.navigation.length, 3)
})
