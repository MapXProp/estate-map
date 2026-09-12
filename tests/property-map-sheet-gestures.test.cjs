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
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context
  )
  return context.exports
}

class ElementStub {
  constructor(tag = 'div', attrs = {}, parent = null) {
    this.tag = tag
    this.attrs = { ...attrs }
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
      getPropertyValue: (key) => (key === '--mobile-panel-ceiling' ? '68px' : ''),
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
  const points = { peek: 56, middle: 455, full: 632 }
  assert.equal(engine.chooseSheetSnap(90, 0, points), 'peek')
  assert.equal(engine.chooseSheetSnap(410, 0, points), 'middle')
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
    snap = config.snap || 'middle',
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
  function render() {
    cursor = 0
    result =
      kind === 'modal'
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
  result.panelRef(h.root)
  const backdrop = new ElementStub()
  result.backdropRef?.(backdrop)
  render()
  return {
    ...h,
    backdrop,
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

test('bottom sheet follows upward pulls from peek and settles at middle or full without premature state changes', () => {
  const h = hookHarness('bottom', { snap: 'peek' })
  h.root.offsetHeight = 56
  h.start()
  h.move(0, -70, 400)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '426px')
  assert.equal(h.snap, 'peek')
  h.end(120)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '455px')
  assert.equal(h.root.attrs['data-sheet-settling'], 'true')
  h.advance(260)
  assert.equal(h.snap, 'middle')
  assert.equal(h.root.properties.has('--mobile-sheet-height'), false)
  h.root.offsetHeight = 455
  h.start(h.content)
  h.move(0, 220, 60)
  h.end()
  h.advance(260)
  assert.equal(h.snap, 'full')
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

test('preview snapping respects safe areas and search clearance; cancellation restores the current level', () => {
  const h = hookHarness('bottom', { previewId: 'listing-6' })
  h.root.offsetHeight = 470
  h.root.paddingBottom = '34px'
  h.start()
  h.move(0, -800)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '632px')
  h.root.dispatch('touchcancel', h.handle)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '470px')
  h.advance(280)
  assert.equal(h.snap, 'middle')
  h.start()
  h.move(0, 1100)
  assert.equal(h.root.properties.get('--mobile-sheet-height'), '90px')
  h.end()
  h.advance(260)
  assert.equal(h.snap, 'peek')
})
