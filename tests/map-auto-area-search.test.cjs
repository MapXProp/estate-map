const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function harness() {
  let now = 0,
    sequence = 0,
    previousDeps,
    cleanup
  const timers = new Map(),
    searches = []
  const onSearch = (bounds) => searches.push(bounds)
  const context = {
    exports: {},
    window: { matchMedia: () => ({ matches: false }) },
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
    render(viewport) {
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

test('phones enable automatic search too, waiting for a usable viewport before selecting its area', () => {
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

test('losing a usable viewport cancels pending work until the map becomes available again', () => {
  const h = harness(),
    next = viewport(13)
  h.render(next)
  h.advance(400)
  assert.equal(h.render(undefined), true)
  h.advance(1000)
  assert.equal(h.searches.length, 0)
  h.render(next)
  h.advance(700)
  assert.deepEqual(h.searches, [next.bounds])
})

test('leaving the page cancels pending automatic work', () => {
  const h = harness(),
    next = viewport(13)
  h.render(next)
  h.advance(700)
  assert.deepEqual(h.searches, [next.bounds])
  h.render(viewport(14))
  h.unmount()
  h.advance(700)
  assert.equal(h.searches.length, 1)
})
