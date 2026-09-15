const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function harness() {
  let enabled = true,
    now = 0,
    sequence = 0,
    previousDeps,
    cleanup
  const timers = new Map(),
    searches = []
  const onSearch = (bounds) => searches.push(bounds)
  const context = {
    exports: {},
    window: { matchMedia: () => ({ matches: enabled }) },
    setTimeout(fn, ms) {
      const id = ++sequence
      timers.set(id, { fn, at: now + ms })
      return id
    },
    clearTimeout(id) {
      timers.delete(id)
    },
    require: (id) => {
      assert.equal(id, 'react')
      return {
        useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
        useEffect(effect, deps) {
          if (previousDeps && deps.every((value, i) => value === previousDeps[i])) return
          cleanup?.()
          previousDeps = deps
          cleanup = effect()
        },
      }
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/hooks/useMapAutoAreaSearch.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context
  )
  return {
    searches,
    render(viewport, automatic = true) {
      enabled = automatic
      return context.exports.useMapAutoAreaSearch(viewport, onSearch)
    },
    advance(ms) {
      now += ms
      for (const [id, timer] of timers)
        if (timer.at <= now) {
          timers.delete(id)
          timer.fn()
        }
    },
    unmount() {
      cleanup?.()
    },
  }
}
const viewport = (value) => ({
  center: { lat: value, lon: 100.5 },
  zoom: 15,
  bounds: { minLat: value, maxLat: value + 1, minLon: 100, maxLon: 101 },
})

test('initial automatic search waits for a usable viewport and then selects its area', () => {
  const h = harness(),
    first = { ...viewport(13), initial: true }
  assert.equal(h.render(undefined), true)
  h.advance(1000)
  assert.equal(h.searches.length, 0)
  h.render(first)
  h.advance(699)
  assert.equal(h.searches.length, 0)
  h.advance(1)
  assert.deepEqual(h.searches, [first.bounds])
})

test('continuous pan and zoom changes produce one search for the final area after settling', () => {
  const h = harness(),
    final = { ...viewport(15), zoom: 17 }
  h.render(viewport(13))
  h.advance(500)
  h.render(viewport(14))
  h.advance(500)
  h.render(final)
  h.advance(699)
  assert.equal(h.searches.length, 0)
  h.advance(1)
  assert.deepEqual(h.searches, [final.bounds])
  h.advance(5000)
  assert.equal(h.searches.length, 1, 'there is no periodic reload')
})

test('phone mode cancels pending automatic work and never searches on pan', () => {
  const h = harness(),
    next = viewport(13)
  h.render(next)
  h.advance(400)
  assert.equal(h.render(next, false), false)
  h.advance(1000)
  h.render(viewport(14), false)
  h.advance(1000)
  assert.equal(h.searches.length, 0)
})

test('switching to automatic mode searches the current area and leaving the page cancels work', () => {
  const h = harness(),
    next = viewport(13)
  h.render(next, false)
  h.render(next, true)
  h.advance(700)
  assert.deepEqual(h.searches, [next.bounds])
  h.render(viewport(14))
  h.unmount()
  h.advance(700)
  assert.equal(h.searches.length, 1)
})
