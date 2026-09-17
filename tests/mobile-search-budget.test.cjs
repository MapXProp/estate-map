const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports, globals = {}) {
  const context = {
    exports: {},
    ...globals,
    require(id) {
      assert.ok(id in imports, id)
      return imports[id]
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
const prices = load('src/lib/propertyMapPriceInput.ts', {})

function harness(props = {}) {
  const slots = [],
    applied = []
  let cursor = 0,
    tree,
    closeCount = 0,
    swipe
  const Component = load('src/components/property-home/MobileSearchBudgetSheet.tsx', {
    react: {
      useState(initial) {
        const i = cursor++
        if (!(i in slots)) slots[i] = initial
        return [
          slots[i],
          (next) => {
            slots[i] = typeof next === 'function' ? next(slots[i]) : next
          },
        ]
      },
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    '@headlessui/react': { Dialog: 'dialog', DialogBackdrop: 'backdrop', DialogPanel: 'panel', DialogTitle: 'title' },
    '@/lib/propertyMapPriceInput': prices,
    '@/components/property-map/MobileSheet.module.css': { default: {} },
    '@/hooks/useMobileSearchViewport': { useMobileSearchViewport: () => null },
    '@/hooks/useMobileSheets': {
      useSwipeDismiss(onClose, enabled) {
        swipe = { enabled, onClose }
        return { panelRef: null, backdropRef: null, dismiss: onClose }
      },
    },
  }).default
  function render() {
    cursor = 0
    tree = Component({
      value: { minPrice: '', maxPrice: '' },
      offerType: '',
      rentalRooms: false,
      th: true,
      ...props,
      onApply: (value) => applied.push(JSON.parse(JSON.stringify(value))),
      onClose: () => closeCount++,
    })
  }
  function nodes(predicate) {
    const found = []
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit)
      if (!node?.props) return
      if (predicate(node)) found.push(node)
      visit(node.props.children)
    }
    visit(tree)
    return found
  }
  function one(predicate) {
    const found = nodes(predicate)
    assert.equal(found.length, 1)
    return found[0]
  }
  const data = (name, value) => one((node) => node.props[name] === value)
  const field = (key) => data('data-mobile-budget-price', key)
  function click(node) {
    node.props.onClick()
    render()
  }
  function type(key, value) {
    field(key).props.onFocus()
    render()
    field(key).props.onChange({ target: { value } })
    render()
  }
  render()
  return { render, nodes, one, data, field, click, type, applied, closeCount: () => closeCount, swipe: () => swipe }
}

test('arbitrary prices support suffix entry, comma formatting and exact values when confirming', () => {
  const h = harness({ offerType: 'rent' })
  h.type('minPrice', '20')
  h.click(h.data('data-mobile-budget-suffix', '000'))
  h.type('maxPrice', '60')
  h.click(h.data('data-mobile-budget-suffix', '000'))
  h.field('maxPrice').props.onBlur()
  h.render()
  assert.equal(h.field('maxPrice').props.value, '60,000')
  assert.equal(h.applied.length, 0)
  h.click(h.data('data-mobile-budget-done', true))
  assert.deepEqual(h.applied, [{ minPrice: '20000', maxPrice: '60000' }])
  assert.equal(h.closeCount(), 1)
})

test('X, backdrop/Escape and swipe apply the current valid budget and keep an empty bound unlimited', () => {
  for (const method of ['x', 'dialog', 'swipe']) {
    const h = harness({ value: { minPrice: '123456789', maxPrice: '' } })
    if (method === 'x') h.click(h.one((node) => node.props['aria-label'] === 'ปิดงบประมาณ'))
    if (method === 'dialog') h.one((node) => node.type === 'dialog').props.onClose()
    if (method === 'swipe') {
      assert.equal(h.swipe().enabled, true)
      h.swipe().onClose()
    }
    assert.deepEqual(h.applied, [{ minPrice: '123456789', maxPrice: '' }])
    assert.equal(h.closeCount(), 1)
  }
})

test('reversed bounds cannot be applied or swiped away; correction and clearing restore dismissal', () => {
  const h = harness({ value: { minPrice: '60000', maxPrice: '20000' } })
  assert.equal(h.data('data-mobile-budget-done', true).props.disabled, true)
  assert.equal(h.swipe().enabled, false)
  assert.equal(h.nodes((node) => node.props.role === 'alert').length, 1)
  h.one((node) => node.type === 'dialog').props.onClose()
  assert.equal(h.closeCount(), 0)
  h.type('maxPrice', '80,000')
  assert.equal(h.data('data-mobile-budget-done', true).props.disabled, false)
  h.click(h.data('data-mobile-budget-clear', true))
  h.click(h.data('data-mobile-budget-done', true))
  assert.deepEqual(h.applied, [{ minPrice: '', maxPrice: '' }])
})

test('suggested maximums follow buy/rent; choosing one clears an old minimum and supports both offers without a forced selection', () => {
  for (const [offerType, rentalRooms, maximum] of [
    ['sale', false, 3000000],
    ['rent', false, 20000],
    ['rent', true, 5000],
  ]) {
    const h = harness({ offerType, rentalRooms, value: { minPrice: '100', maxPrice: '' } })
    h.click(h.data('data-mobile-budget-maximum', maximum))
    h.click(h.data('data-mobile-budget-done', true))
    assert.deepEqual(h.applied, [{ minPrice: '', maxPrice: String(maximum) }])
  }
  const h = harness()
  assert.equal(h.nodes((node) => node.type === 'input').length, 2)
  assert.equal(h.data('data-mobile-budget-suffix', '00').props.disabled, true)
  h.type('maxPrice', '900000000000')
  assert.equal(h.data('data-mobile-budget-suffix', '000').props.disabled, true)
  h.click(h.data('data-mobile-budget-done', true))
  assert.equal(h.applied[0].maxPrice, '900000000000')
})

test('visible viewport follows keyboard height and offset, ignores pinch zoom and cleans up listeners', () => {
  let effect
  const listeners = new Map(),
    values = new Map()
  const ref = { current: { style: { setProperty: (key, value) => values.set(key, value) } } }
  const viewport = {
    height: 800,
    offsetTop: 0,
    scale: 1,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  }
  const hook = load(
    'src/hooks/useMobileSearchViewport.ts',
    {
      react: {
        useRef: () => ref,
        useEffect: (fn) => {
          effect = fn
        },
      },
    },
    { window: { visualViewport: viewport } }
  ).useMobileSearchViewport
  hook(true)
  const cleanup = effect()
  assert.equal(values.get('--search-viewport-height'), '800px')
  viewport.height = 350
  viewport.offsetTop = 12
  listeners.get('resize')()
  assert.equal(values.get('--search-viewport-height'), '350px')
  assert.equal(values.get('--search-viewport-top'), '12px')
  viewport.scale = 2
  viewport.height = 200
  listeners.get('resize')()
  assert.equal(values.get('--search-viewport-height'), '350px')
  cleanup()
  assert.equal(listeners.size, 0)
})
