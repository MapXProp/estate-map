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
