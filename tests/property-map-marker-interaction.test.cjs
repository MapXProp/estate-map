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
function harness(width) {
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
      this.classList = { toggle() {} }
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
    querySelectorAll() {
      return []
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
    setAttribute() {}
    getAttribute(name) {
      return name === 'href' ? '/real-estate-listings/land-sutthisan' : null
    }
  }
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
        if (node.props?.ref && !node.props.ref.current) node.props.ref.current = new Element()
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
    initialZoom: 14,
    exactCoordinates: true,
    onMarkerSelect: (id) => selected.push(id),
  })
  visit(tree, (node) => {
    if (node.type === 'sdk-script') node.props.onReady()
  })
  render()
  calls.length = 0
  function click(action, options = {}) {
    const link = new Element()
    link.dataset[action === 'dot' ? 'mapxMarkerLink' : 'mapxQuickView'] = 'true'
    link.root = { dataset: { mapxListingId: listing.id } }
    const event = {
      target: new Element(link),
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
  return {
    render,
    calls,
    navigation,
    selected,
    click,
    api,
    getMarkerHtml: context.exports.getMarkerHtml,
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
  h.finishMapGesture()
  assert.equal(completed, 0, 'do not resize underneath an unfinished tap')
  h.render()
  assert.equal(completed, 1)
  h.finishMapGesture({ isPrimary: false })
  h.finishMapGesture({ button: 2 })
  h.render()
  assert.equal(completed, 1)
  assert.deepEqual(h.calls, [])
})
