const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { test } = require('node:test')

function load(file, imports, globals = {}) {
  const context = { exports: {}, ...globals, require: (id) => {
    if (!(id in imports)) throw Error(`Unexpected import ${id}`)
    return imports[id]
  } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context)
  return context.exports
}

function harness(isThai = true) {
  const slots = [], cleanups = [], timers = new Map()
  let cursor = 0, tree, now = 0, nextTimer = 0, closed = 0, swipeEnabled
  const hooks = {
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
    useRef(initial) {
      const index = cursor++
      return slots[index] ??= { current: initial }
    },
    useCallback: (callback) => callback,
    useEffect(effect) {
      const index = cursor++
      if (!(index in slots)) { slots[index] = true; cleanups.push(effect()) }
    },
  }
  const quickClose = load('src/hooks/useGalleryQuickClose.ts', { react: hooks }, {
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { at: now + delay, callback }); return id },
    clearTimeout(id) { timers.delete(id) },
  })
  const Gallery = load('src/components/property-map/PropertyPhotoGallery.tsx', {
    react: hooks,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    'next/image': { default: 'test-image' },
    '@headlessui/react': { Dialog: 'test-dialog', DialogPanel: 'test-panel', DialogBackdrop: 'test-backdrop', DialogTitle: 'test-title' },
    '@/components/property-map/GallerySheet.module.css': { default: {} },
    '@/hooks/useGalleryQuickClose': quickClose,
    '@/hooks/useMobileSheets': { useSwipeDismiss(onClose, enabled) {
      swipeEnabled = enabled
      return { panelRef() {}, backdropRef() {}, dismiss: onClose }
    } },
    '@/lib/propertyMapPreview': load('src/lib/propertyMapPreview.ts', {}),
  }).default
  function render() {
    cursor = 0
    tree = Gallery({ images: Array.from({ length: 7 }, (_, i) => `/photo-${i}.jpg`), title: 'Listing', isThai, onClose: () => { closed++ } })
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
  const one = (predicate) => { const found = nodes(predicate); assert.equal(found.length, 1); return found[0] }
  const button = () => one((node) => node.props?.['data-property-gallery-quick-close'])
  render()
  return {
    nodes, button,
    closed: () => closed,
    swipeEnabled: () => swipeEnabled,
    pendingTimers: () => timers.size,
    click(node) { node.props.onClick(); render() },
    scroll(top) { one((node) => node.props?.['data-sheet-scroll']).props.onScroll({ currentTarget: { scrollTop: top } }); render() },
    advance(ms) {
      const until = now + ms
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0]
        if (!next) break
        now = next[1].at; timers.delete(next[0]); next[1].callback()
      }
      now = until; render()
    },
    backToGrid() { one((node) => typeof node.type === 'function' && 'activeImage' in node.props).props.onClose(); render() },
    unmount() { cleanups.forEach((cleanup) => cleanup?.()) },
  }
}

test('scrolling back up reveals a usable close button, while downward scroll and the top hide it', () => {
  const h = harness()
  assert.equal(h.button().props['aria-hidden'], true)
  assert.equal(h.button().props.tabIndex, -1)
  h.scroll(600)
  h.scroll(585)
  assert.equal(h.button().props['aria-hidden'], true)
  h.scroll(572)
  assert.equal(h.button().props['aria-hidden'], false)
  assert.equal(h.button().props.tabIndex, 0)
  h.scroll(600)
  assert.equal(h.button().props['aria-hidden'], true)
  assert.equal(h.pendingTimers(), 0)
  h.scroll(560)
  h.scroll(120)
  assert.equal(h.button().props['aria-hidden'], true)
  h.scroll(-10)
  assert.equal(h.button().props['aria-hidden'], true)
  assert.equal(h.closed(), 0)
})

test('the close button stays visible during continued upward scrolling and hides after 2.6 seconds idle', () => {
  const h = harness()
  h.scroll(700); h.scroll(650)
  h.advance(2500)
  assert.equal(h.button().props['aria-hidden'], false)
  h.scroll(610)
  h.advance(2500)
  assert.equal(h.button().props['aria-hidden'], false)
  h.advance(100)
  assert.equal(h.button().props['aria-hidden'], true)
  h.scroll(580)
  assert.equal(h.pendingTimers(), 1)
  h.unmount()
  assert.equal(h.pendingTimers(), 0)
})

test('the quick action closes only this gallery; full-size photos hide it and suspend sheet dismissal', () => {
  const h = harness()
  h.scroll(600); h.scroll(550)
  h.click(h.nodes((node) => node.type === 'button' && node.props['aria-label']?.startsWith('เปิดรูปที่'))[0])
  assert.equal(h.swipeEnabled(), false)
  assert.equal(h.button().props['aria-hidden'], true)
  assert.equal(h.pendingTimers(), 0)
  assert.equal(h.closed(), 0)
  h.backToGrid()
  assert.equal(h.swipeEnabled(), true)
  assert.equal(h.button().props['aria-hidden'], true)
  h.scroll(500)
  assert.equal(h.button().props['aria-hidden'], false)
  h.click(h.button())
  assert.equal(h.closed(), 1)
  assert.equal(h.pendingTimers(), 0)
})

test('quick close has an English label when the gallery is in English', () => {
  const h = harness(false)
  assert.equal(h.button().props['aria-label'], 'Close gallery')
  assert.equal(h.button().props.children[1], 'Close')
})
