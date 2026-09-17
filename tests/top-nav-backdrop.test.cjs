const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function harness(initialBottom, hasBoundary = true) {
  let bottom = initialBottom, state = null, effect, cleanup, dependencies, frameId = 0
  const frames = new Map()
  const writes = []
  const properties = {}
  const boundary = { getBoundingClientRect: () => ({ bottom }) }
  const anchor = { current: { closest: () => hasBoundary ? boundary : null } }
  const backdrop = { style: { setProperty: (name, value) => { properties[name] = value; writes.push(value) } } }
  const window = {
    innerHeight: 800,
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId },
    cancelAnimationFrame(id) { frames.delete(id) },
  }
  const imports = {
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@headlessui/react': { Portal: 'portal', PopoverBackdrop: 'backdrop' },
    react: {
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
      useRef: () => anchor,
      useState: () => [state, next => { state = next }],
      useLayoutEffect(callback, deps) {
        if (!dependencies || dependencies[0] !== deps[0]) { effect = callback; dependencies = deps }
      },
    },
  }
  const filename = path.join(__dirname, '../src/components/Header/TopNavPopoverBackdrop.tsx')
  const context = { exports: {}, window, require: name => imports[name] }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context)
  function render() {
    const tree = context.exports.default()
    if (effect) { cleanup?.(); cleanup = effect(); effect = undefined }
    return tree.props.children[1].props.children
  }
  let surface = render()
  return {
    get top() { return properties['--top-nav-backdrop-top'] },
    writes, frames,
    open() { surface.props.ref(backdrop); surface = render() },
    close() { surface.props.ref(null); surface = render() },
    move(nextBottom, height = window.innerHeight) {
      bottom = nextBottom
      window.innerHeight = height
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach(callback => callback())
    },
    unmount() { cleanup?.() },
  }
}

test('backdrop meets the actual header edge and follows resized rows, scrolling and mobile transforms', () => {
  const h = harness(72.5)
  assert.equal(h.frames.size, 0, 'closed menus do not measure the header')
  h.open()
  assert.equal(h.top, '72.5px', 'preserve fractional edges without a seam')
  for (const bottom of [80, 64, 56, 128, 43.25, 0]) {
    h.move(bottom)
    assert.equal(h.top, `${bottom}px`)
  }
  const writes = h.writes.length
  h.move(0)
  assert.equal(h.writes.length, writes, 'stationary headers do not cause style writes')
  h.unmount()
  assert.equal(h.frames.size, 0)
})

test('offscreen edges stay within the viewport and reopening starts at the current header edge', () => {
  const h = harness(-20)
  h.open()
  assert.equal(h.top, '0px')
  h.move(900, 400)
  assert.equal(h.top, '400px')
  h.close()
  assert.equal(h.frames.size, 0)
  h.move(58)
  h.open()
  assert.equal(h.top, '58px')
  h.unmount()
  assert.equal(h.frames.size, 0)
})

test('preferences opened outside a top nav retain their default backdrop without a guessed offset', () => {
  const h = harness(80, false)
  h.open()
  assert.equal(h.top, undefined)
  assert.equal(h.frames.size, 0)
  h.unmount()
})
