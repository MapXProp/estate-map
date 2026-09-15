const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function panel({ mobile = true, present = true, reduced = false } = {}) {
  const context = {
    exports: {},
    require: (name) =>
      ({
        'react/jsx-runtime': require('react/jsx-runtime'),
        '@/hooks/useMapAnchoredPreview': { useMapAnchoredPreview: () => null },
        'framer-motion': {
          motion: { aside: 'test-motion-aside' },
          useIsPresent: () => present,
          useReducedMotion: () => reduced,
        },
        './PropertyMapSearch.module.css': { default: { previewPanel: 'previewPanel' } },
      })[name],
  }
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, '../src/components/property-map/MapPreviewPanel.tsx'), 'utf8'),
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }
    ).outputText,
    context
  )
  return context.exports.default({ mobile, label: 'Selected property', children: 'photos and details' }).props
}

test('mobile preview enters and exits above the map and cannot receive clicks while leaving', () => {
  const props = panel()
  assert.equal(props['data-mobile-top-sheet'], true)
  assert.equal(props.initial.y, '-100%')
  assert.equal(props.animate.y, '0%')
  assert.equal(props.exit.y, '-100%')
  assert.equal(props.inert, false)
  assert.equal(panel({ present: false }).inert, true)
  assert.equal(props.children, 'photos and details')
})

test('desktop preview and reduced-motion preference do not slide the card', () => {
  for (const state of [{ mobile: false }, { reduced: true }]) {
    const props = panel(state)
    assert.equal(props.initial, false)
    assert.equal(props.exit.y, '0%')
    assert.equal(props.transition.duration, 0)
  }
})

test('compact preview measures only the existing header through the search row and follows resizing', () => {
  let top = 38,
    bottom = 188,
    navigationHeight = 96,
    resize,
    disconnected = false,
    cleanup
  const properties = {}
  const observed = []
  const search = {
    getBoundingClientRect: () => ({ top }),
    style: {
      setProperty: (key, value) => {
        properties[key] = value
      },
    },
  }
  const categories = { getBoundingClientRect: () => ({ height: navigationHeight }) }
  const areaControl = { getBoundingClientRect: () => ({ bottom }) }
  const refs = [search, categories, areaControl]
  let cursor = 0
  const events = new Map()
  const context = {
    exports: {},
    require: () => ({
      useRef: () => ({ current: refs[cursor++] }),
      useLayoutEffect: (effect) => {
        cleanup = effect()
      },
    }),
    ResizeObserver: class {
      constructor(callback) {
        resize = callback
      }
      observe(node) {
        observed.push(node)
      }
      disconnect() {
        disconnected = true
      }
    },
    window: {
      addEventListener: (event, handler) => events.set(event, handler),
      removeEventListener: (event) => events.delete(event),
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/hooks/useMapPreviewHeaderHeight.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context
  )
  context.exports.useMapPreviewHeaderHeight()
  assert.equal(properties['--mobile-preview-height'], '156px')
  assert.equal(properties['--map-navigation-height'], '96px')
  assert.deepEqual(observed, refs)
  // Same navigation/search height at a different page offset must not cover extra map.
  top = 0
  bottom = 150
  events.get('resize')()
  assert.equal(properties['--mobile-preview-height'], '156px')
  bottom = 170
  navigationHeight = 116
  resize()
  assert.equal(properties['--mobile-preview-height'], '176px')
  assert.equal(properties['--map-navigation-height'], '116px')
  navigationHeight = 44
  bottom = 98
  resize()
  assert.equal(properties['--map-navigation-height'], '44px')
  assert.equal(properties['--mobile-preview-height'], '104px')
  assert.deepEqual(Object.keys(properties).sort(), ['--map-navigation-height', '--mobile-preview-height'])
  cleanup()
  assert.equal(disconnected, true)
  assert.equal(events.size, 0)
})
