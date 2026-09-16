const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, globals, imports = {}) {
  const context = {
    exports: {},
    ...globals,
    require: (name) => {
      if (!(name in imports)) throw Error(`Unexpected import: ${name}`)
      return imports[name]
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

class ElementStub {
  constructor(tag = 'div', attrs = {}, parent = null) {
    this.tag = tag
    this.attrs = { ...attrs }
    this.dataset = {}
    this.parentElement = parent
    this.listeners = new Map()
    this.captures = new Set()
    this.scrollTop = 0
    this.offsetHeight = 700
    this.clientHeight = 700
    this.paddingBottom = '0px'
    this.properties = new Map()
    this.style = {
      setProperty: (key, value) => this.properties.set(key, value),
      removeProperty: (key) => this.properties.delete(key),
    }
  }
  closest(selector) {
    const matches = selector
      .split(',')
      .some((part) => (part.startsWith('[') ? part.slice(1, -1).split('=')[0] in this.attrs : part === this.tag))
    return matches ? this : this.parentElement?.closest(selector) || null
  }
  querySelector() {
    return this.probe || null
  }
  setAttribute(key, value) {
    this.attrs[key] = value
  }
  removeAttribute(key) {
    delete this.attrs[key]
  }
  getBoundingClientRect() {
    return { height: this.offsetHeight }
  }
  setPointerCapture(id) {
    this.captures.add(id)
  }
  hasPointerCapture(id) {
    return this.captures.has(id)
  }
  releasePointerCapture(id) {
    this.captures.delete(id)
  }
  addEventListener(type, listener, options) {
    this.listeners.set(type, { listener, options })
  }
  removeEventListener(type, listener) {
    if (this.listeners.get(type)?.listener === listener) this.listeners.delete(type)
  }
  dispatch(type, target, values = {}) {
    const event = {
      target,
      cancelable: true,
      detail: 1,
      ...values,
      preventDefault() {
        this.prevented = true
      },
      stopImmediatePropagation() {
        this.stopped = true
      },
    }
    this.listeners.get(type)?.listener(event)
    return event
  }
}

function environment({ width = 390, reducedMotion = false } = {}) {
  let time = 0,
    nextId = 0
  const jobs = new Map()
  const win = new ElementStub()
  win.innerHeight = 820
  win.matchMedia = (query) => ({
    matches: query.includes('reduced-motion') ? reducedMotion : width < 1024,
    addEventListener() {},
    removeEventListener() {},
  })
  const schedule = (fn, delay) => {
    jobs.set(++nextId, { fn, at: time + delay })
    return nextId
  }
  const globals = {
    Element: ElementStub,
    window: win,
    performance: { now: () => time },
    getComputedStyle: (node) => ({
      paddingBottom: node.paddingBottom,
      getPropertyValue: (key) => (key === '--mobile-panel-ceiling' ? '68px' : node.properties.get(key) || ''),
    }),
    setTimeout: schedule,
    clearTimeout: (id) => jobs.delete(id),
    requestAnimationFrame: (fn) => schedule(fn, 16),
    cancelAnimationFrame: (id) => jobs.delete(id),
  }
  const engine = load('src/lib/verticalSheetGesture.ts', globals)
  const root = new ElementStub()
  root.parentElement = new ElementStub()
  const handle = new ElementStub('button', { 'data-sheet-drag-handle': '' }, root)
  handle.paddingBottom = '8px'
  root.probe = handle
  const scroller = new ElementStub('div', { 'data-sheet-scroll': '' }, root)
  const content = new ElementStub('a', {}, scroller)
  function advance(ms) {
    const until = time + ms
    while (true) {
      const due = [...jobs.entries()].filter(([, job]) => job.at <= until).sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) break
      time = due[1].at
      jobs.delete(due[0])
      due[1].fn()
    }
    time = until
  }
  const touches = (x, y) => [{ clientX: x, clientY: y }]
  const start = (target = handle, x = 0, y = 300) => root.dispatch('touchstart', target, { touches: touches(x, y) })
  const move = (x, y, ms = 40, values = {}) => {
    advance(ms)
    return root.dispatch('touchmove', content, { touches: touches(x, y), ...values })
  }
  const end = (pause = 0) => {
    advance(pause)
    return root.dispatch('touchend', content, { touches: [] })
  }
  return { engine, root, handle, scroller, content, globals, advance, start, move, end, jobs }
}

function dragHarness(config) {
  const h = environment(config)
  const events = []
  const options = {
    canDrag: (down, handle, atTop) => handle || (down && atTop),
    onStart: () => events.push(['start']),
    onMove: (dy) => events.push(['move', dy]),
    onEnd: (dy, velocity, cancelled) => events.push(['end', dy, velocity, cancelled]),
  }
  return { ...h, options, events, cleanup: h.engine.bindVerticalSheetDrag(h.root, () => options) }
}

test('a downward pull at the top follows the finger, settles once and suppresses its ghost click', () => {
  const h = dragHarness()
  assert.equal(h.root.listeners.get('touchmove').options.passive, false)
  h.start(h.content)
  assert.equal(h.move(0, 304).prevented, undefined)
  assert.equal(h.move(2, 340).prevented, true)
  h.move(2, 400)
  h.end(120)
  assert.deepEqual(h.events, [['start'], ['move', 40], ['move', 100], ['end', 100, 0, false]])
  assert.equal(h.root.dispatch('click', h.content).prevented, true)
  h.start(h.content)
  h.end()
  assert.equal(h.root.dispatch('click', h.content).prevented, undefined)
})

test('reading scrolled content, horizontal photos, non-cancelable scrolling and pinching stay native', () => {
  for (const kind of ['scrolled', 'horizontal', 'up', 'noncancelable', 'pinch']) {
    const h = dragHarness()
    if (kind === 'scrolled') h.scroller.scrollTop = 150
    h.start(h.content)
    if (kind === 'pinch') h.root.dispatch('touchstart', h.content, { touches: [{}, {}] })
    const event = h.move(kind === 'horizontal' ? 80 : 0, kind === 'up' ? 220 : 340, 40, {
      cancelable: kind !== 'noncancelable',
    })
    h.end()
    assert.equal(event.prevented, undefined, kind)
    assert.deepEqual(h.events, [], kind)
  }
})

test('a second finger or touch cancellation restores an active pull without committing it', () => {
  for (const type of ['touchstart', 'touchcancel']) {
    const h = dragHarness()
    h.start()
    h.move(0, 450)
    h.root.dispatch(type, h.handle, { touches: [{}, {}] })
    h.end()
    assert.deepEqual(h.events.at(-1), ['end', 150, 0, true])
    assert.equal(h.events.filter(([event]) => event === 'end').length, 1)
  }
})

test('header actions and form inputs are clickable; the results-toggle button itself can be dragged', () => {
  for (const tag of ['button', 'a', 'input', 'select', 'textarea']) {
    const h = dragHarness()
    const action = new ElementStub(tag, {}, h.handle)
    h.start(action)
    h.move(0, 380)
    h.end()
    assert.deepEqual(h.events, [], tag)
  }
  const h = dragHarness()
  h.start(h.handle)
  h.move(0, 220)
  h.end()
  assert.equal(h.events.at(-1)[1], -80)
  assert.equal(
    h.root.dispatch('click', h.handle, { detail: 0 }).prevented,
    undefined,
    'keyboard click remains available'
  )
})

test('mouse handle drags capture/release only their pointer; desktop and disabled sheets stay unchanged', () => {
  const h = dragHarness()
  const pointer = { pointerType: 'mouse', pointerId: 7, button: 0, isPrimary: true, clientX: 0, clientY: 300 }
  h.root.dispatch('pointerdown', h.handle, pointer)
  assert.ok(h.root.hasPointerCapture(7))
  h.advance(40)
  h.root.dispatch('pointermove', h.handle, { ...pointer, clientY: 370 })
  h.root.dispatch('pointerup', h.handle, { ...pointer, pointerId: 8 })
  assert.equal(h.events.length, 2)
  h.root.dispatch('pointercancel', h.handle, pointer)
  assert.equal(h.events.at(-1)[3], true)
  assert.ok(!h.root.hasPointerCapture(7))
  h.cleanup()
  assert.equal(h.root.listeners.size, 0)
  for (const config of [{ width: 1440 }, { disabled: true }]) {
    const other = dragHarness(config)
    other.options.enabled = !config.disabled
    other.start()
    other.move(0, 500)
    other.end()
    assert.deepEqual(other.events, [])
  }
})

test('short accidental pulls return, fast deliberate pulls dismiss, and snapping respects release momentum', () => {
  const { engine } = environment()
  assert.equal(engine.shouldDismissSheet(20, 2, 700), false)
  assert.equal(engine.shouldDismissSheet(70, 0.1, 700), false)
  assert.equal(engine.shouldDismissSheet(70, 0.7, 700), true)
  assert.equal(engine.shouldDismissSheet(130, 0, 700), true)
  const points = { peek: 84, full: 632 }
  assert.equal(engine.chooseSheetSnap(90, 0, points), 'peek')
  assert.equal(engine.chooseSheetSnap(410, 0, points), 'full')
  assert.equal(engine.chooseSheetSnap(410, -1.3, points), 'full')
  assert.equal(engine.chooseSheetSnap(410, 1.3, points), 'peek')
})

// Render hooks through their lifecycle and real DOM listener adapter, with a deterministic clock.
function hookHarness(kind, config = {}) {
  const h = environment(config)
  const slots = [],
    pending = []
  let cursor = 0,
    result,
    closed = 0,
    snap = config.snap || 'full',
    enabled = true
  const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
  const hooks = {
    useState(initial) {
      const index = cursor++
      if (!slots[index])
        slots[index] = {
          value: initial,
          setter: (value) => {
            slots[index].value = value
          },
        }
      return [slots[index].value, slots[index].setter]
    },
    useRef(value) {
      const i = cursor++
      return (slots[i] ||= { current: value })
    },
    useCallback(fn, deps) {
      const i = cursor++
      if (!equal(slots[i]?.deps, deps)) slots[i] = { fn, deps }
      return slots[i].fn
    },
    useEffect(fn, deps) {
      const i = cursor++
      if (!equal(slots[i]?.deps, deps))
        pending.push(() => {
          slots[i]?.cleanup?.()
          slots[i] = { deps, cleanup: fn() }
        })
    },
  }
  const hook = load('src/hooks/useMobileSheets.ts', h.globals, { react: hooks, '@/lib/verticalSheetGesture': h.engine })
  const photoChanges = []
  const photo = kind === 'photo' ? load('src/components/property-map/PropertyPhotoGallery.tsx', h.globals, {
    react: hooks,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    'next/image': { default: 'test-image' },
    '@headlessui/react': { Dialog: 'test-dialog', DialogPanel: 'test-panel', DialogBackdrop: 'test-backdrop', DialogTitle: 'test-title' },
    '@/components/property-map/MobileSheet.module.css': { default: {} },
    '@/hooks/useMobileSheets': hook,
    '@/hooks/useGalleryQuickClose': {},
    '@/lib/propertyMapPreview': {},
  }).FullPhotoDialog : null
  function photoNode(predicate) {
    let found
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit)
      if (!node?.props) return
      if (predicate(node)) found = node
      visit(node.props.children)
    }
    visit(result)
    assert.ok(found, 'full-photo control exists')
    return found
  }
  const photoPanel = () => photoNode((node) => node.type === 'test-panel')
  function render() {
    cursor = 0
    result =
      photo ? photo({
        images: Array.from({ length: config.imageCount || 7 }, (_, index) => `/photo-${index}.jpg`),
        title: 'Property', isThai: true, activeImage: 0,
        changeImage: (direction) => photoChanges.push(direction),
        onClose: () => { closed++ },
      }) : kind === 'modal'
        ? hook.useSwipeDismiss(() => {
            closed++
          }, enabled)
        : hook.useMapBottomSheet(snap, config.previewId, (value) => {
            snap = value
            render()
          })
    while (pending.length) pending.shift()()
  }
  render()
  const backdrop = new ElementStub()
  if (photo) {
    assert.equal(photoPanel().props['data-sheet-scroll'], true)
    h.root.attrs['data-sheet-scroll'] = ''
    photoPanel().props.ref(h.root)
    photoNode((node) => node.type === 'test-backdrop').props.ref(backdrop)
  } else {
    result.panelRef(h.root)
    result.backdropRef?.(backdrop)
  }
  render()
  const photoImage = new ElementStub('img', {}, h.root)
  let touch = { clientX: 100, clientY: 300 }
  const photoTouch = (type, touches, changedTouches = [touch], target = photoImage) => {
    const event = h.root.dispatch(type, target, { touches, changedTouches })
    const handler = { touchstart: 'onTouchStart', touchmove: 'onTouchMove', touchend: 'onTouchEnd', touchcancel: 'onTouchCancel' }[type]
    photoPanel().props[handler]?.(event)
    return event
  }
  return {
    ...h,
    backdrop,
    photoChanges,
    photoStart: () => photoTouch('touchstart', [touch]),
    photoMove: (dx, dy, ms = 40) => {
      h.advance(ms)
      touch = { clientX: 100 + dx, clientY: 300 + dy }
      return photoTouch('touchmove', [touch])
    },
    photoEnd: (pause = 0) => { h.advance(pause); return photoTouch('touchend', []) },
    photoCancel: () => photoTouch('touchcancel', []),
    photoPinch: () => photoTouch('touchstart', [touch, { clientX: 200, clientY: 350 }]),
    photoButton: (label) => photoNode((node) => node.type === 'button' && node.props['aria-label'] === label),
    get closed() {
      return closed
    },
    get snap() {
      return snap
    },
    get result() {
      return result
    },
    setEnabled(value) {
      enabled = value
      render()
    },
    changeSelection(id) {
      config.previewId = id
      render()
    },
    unmount() {
      slots.forEach((slot) => slot?.cleanup?.())
    },
  }
}

test('modal returns after a short pull and closes once only after its exit animation', () => {
  const h = hookHarness('modal')
  h.start(h.content)
  h.move(0, 355, 200)
  assert.equal(h.root.properties.get('--sheet-offset'), '52.25px')
  h.end(120)
  assert.equal(h.root.properties.get('--sheet-offset'), '0px')
  h.advance(300)
  assert.equal(h.closed, 0)
  h.start(h.content)
  h.move(0, 450, 200)
  h.end()
  assert.equal(h.closed, 0)
  assert.equal(h.root.attrs['data-sheet-closing'], 'true')
  assert.equal(h.backdrop.properties.get('--sheet-backdrop'), '0')
  h.result.dismiss()
  h.advance(260)
  assert.equal(h.closed, 1)
})

test('nested galleries disable modal swipes; cancelled pulls and unmounted transitions cannot navigate', () => {
  const h = hookHarness('modal')
  h.setEnabled(false)
  h.start(h.content)
  assert.equal(h.move(0, 480).prevented, undefined)
  h.end()
  h.advance(300)
  assert.equal(h.closed, 0)
  h.setEnabled(true)
  h.start(h.content)
  h.move(0, 480)
  h.root.dispatch('touchcancel', h.content)
  assert.equal(h.root.properties.get('--sheet-offset'), '0px')
  h.result.dismiss()
  h.unmount()
  h.advance(300)
  assert.equal(h.closed, 0)
  assert.equal(h.root.listeners.size, 0)
})

test('desktop and reduced-motion close buttons navigate immediately', () => {
  for (const config of [{ width: 1440 }, { reducedMotion: true }]) {
    const h = hookHarness('modal', config)
    h.result.dismiss()
    assert.equal(h.closed, 1)
    assert.equal(h.jobs.size, 0)
  }
})

test('one modest upward pull opens the sheet fully without an intermediate stop or premature state changes', () => {
  const h = hookHarness('bottom', { snap: 'peek' })
  h.root.offsetHeight = 84
  h.start()
  h.move(0, 240, 400)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '144px')
  assert.equal(h.snap, 'peek')
  h.end(120)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '632px')
  assert.equal(h.root.attrs['data-sheet-settling'], 'true')
  h.advance(260)
  assert.equal(h.snap, 'full')
  assert.equal(h.root.properties.has('--mobile-sheet-height'), false)
  h.root.offsetHeight = 632
  h.start()
  h.move(0, 360, 400)
  h.end()
  h.advance(260)
  assert.equal(h.snap, 'peek')
})

test('full-sheet content scrolls natively; a handle pull collapses even with content scrolled', () => {
  const h = hookHarness('bottom', { snap: 'full' })
  h.root.offsetHeight = 632
  h.start(h.content)
  assert.equal(h.move(0, 150).prevented, undefined)
  h.end()
  h.scroller.scrollTop = 170
  h.start(h.content)
  assert.equal(h.move(0, 470).prevented, undefined)
  h.end()
  h.start()
  h.move(0, 540, 120)
  h.end()
  h.advance(260)
  assert.equal(h.snap, 'peek')
  assert.equal(h.scroller.scrollTop, 170)
})

test('list snapping respects safe areas and search clearance; cancellation restores the current level', () => {
  const h = hookHarness('bottom', { previewId: 'listing-6' })
  h.root.offsetHeight = 632
  h.root.paddingBottom = '34px'
  h.start()
  h.move(0, -800)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '632px')
  h.root.dispatch('touchcancel', h.handle)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '632px')
  h.advance(280)
  assert.equal(h.snap, 'full')
  h.start()
  h.move(0, 1100)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '118px')
  h.end()
  h.advance(260)
  assert.equal(h.snap, 'peek')
})

test('list snapping leaves room for overlaid navigation without reducing the map surface', () => {
  const h = hookHarness('bottom', { snap: 'peek' })
  h.root.properties.set('--map-navigation-height', '100px')
  h.root.offsetHeight = 84
  h.start()
  h.move(0, -800)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '532px')
  assert.equal(h.root.parentElement.clientHeight, 700)
  h.end()
  h.advance(260)
  assert.equal(h.snap, 'full')
})

test('a project sheet keeps the same map clearance while being dragged and when settled', () => {
  const h = hookHarness('bottom', { snap: 'peek' })
  h.root.dataset.projectOpen = 'true'
  h.root.offsetHeight = 84
  h.start()
  h.move(0, -800)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), `${820 * .48}px`)
  h.end()
  h.advance(260)
  assert.equal(h.snap, 'full')
})

test('selecting a property cancels an unfinished list expansion so it cannot cover the new top preview', () => {
  const h = hookHarness('bottom', { snap: 'peek' })
  h.root.offsetHeight = 84
  h.start()
  h.move(0, -70, 400)
  h.end(120)
  assert.equal(h.root.attrs['data-sheet-settling'], 'true')
  h.changeSelection('listing-7')
  h.advance(300)
  assert.equal(h.snap, 'peek')
  assert.equal(h.root.properties.has('--mobile-sheet-height'), false)
})

test('the full-size photo follows a downward pull and returns to its gallery after the exit animation', () => {
  for (const imageCount of [1, 7]) {
    const h = hookHarness('photo', { imageCount })
    h.photoStart()
    assert.equal(h.photoMove(2, 150, 250).prevented, true)
    assert.equal(h.root.properties.get('--sheet-offset'), '142.5px')
    assert.ok(Number(h.backdrop.properties.get('--sheet-backdrop')) < 1)
    h.photoEnd()
    assert.equal(h.closed, 0)
    h.advance(260)
    assert.equal(h.closed, 1)
    assert.deepEqual(h.photoChanges, [])
    assert.equal(h.root.dispatch('click', h.content).prevented, true)
    h.unmount()
  }
})

test('short, upward and cancelled photo pulls settle without closing or switching photos', () => {
  for (const gesture of ['short', 'up', 'cancel', 'pinch']) {
    const h = hookHarness('photo')
    h.photoStart()
    h.photoMove(0, gesture === 'up' ? -160 : gesture === 'short' ? 40 : 160, 400)
    if (gesture === 'cancel') h.photoCancel()
    if (gesture === 'pinch') h.photoPinch()
    h.photoEnd(120)
    h.advance(300)
    assert.equal(h.closed, 0, gesture)
    assert.deepEqual(h.photoChanges, [])
    if (gesture !== 'up') assert.equal(h.root.properties.get('--sheet-offset'), '0px')
    h.unmount()
  }
})

test('horizontal photo gestures navigate once while downward gestures cannot turn into photo changes', () => {
  for (const dx of [-80, 80]) {
    const h = hookHarness('photo')
    h.photoStart()
    assert.equal(h.photoMove(dx, 3).prevented, undefined)
    h.photoEnd()
    assert.deepEqual(h.photoChanges, [dx < 0 ? 1 : -1])
    h.advance(300)
    assert.equal(h.closed, 0)
    h.unmount()
  }
  const h = hookHarness('photo')
  h.photoStart()
  h.photoMove(0, 30, 200)
  h.photoMove(150, 35, 200)
  h.photoEnd(120)
  h.advance(300)
  assert.deepEqual(h.photoChanges, [], 'a vertical pull keeps its original intent')
  assert.equal(h.closed, 0)
  h.unmount()
})

test('full-photo controls remain clickable and unmounting cancels pending dismissal', () => {
  const h = hookHarness('photo')
  for (const label of ['กลับไปแกลเลอรี', 'รูปก่อนหน้า', 'รูปถัดไป'])
    assert.equal(h.photoButton(label).props['data-sheet-no-drag'], true)
  h.photoButton('รูปก่อนหน้า').props.onClick()
  h.photoButton('รูปถัดไป').props.onClick()
  assert.deepEqual(h.photoChanges, [-1, 1])
  h.photoButton('กลับไปแกลเลอรี').props.onClick()
  h.unmount()
  h.advance(300)
  assert.equal(h.closed, 0)
  assert.equal(h.root.listeners.size, 0)
})

test('full-photo dismissal respects reduced motion and desktop controls', () => {
  const reduced = hookHarness('photo', { reducedMotion: true })
  reduced.photoStart()
  reduced.photoMove(0, 150, 400)
  reduced.photoEnd()
  assert.equal(reduced.closed, 1)
  assert.equal(reduced.jobs.size, 0)
  reduced.unmount()
  const desktop = hookHarness('photo', { width: 1440 })
  desktop.photoStart()
  desktop.photoMove(0, 150)
  desktop.photoEnd()
  assert.equal(desktop.closed, 0)
  desktop.photoButton('กลับไปแกลเลอรี').props.onClick()
  assert.equal(desktop.closed, 1)
  desktop.unmount()
})
