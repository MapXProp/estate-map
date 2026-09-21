const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { load } = require('./helpers/property-prices.cjs')
const shared = {
  react: React,
  'react/jsx-runtime': require('react/jsx-runtime'),
  'lucide-react': require('lucide-react'),
  '@/lib/propertyDetailPresentation': load('src/lib/propertyDetailPresentation.ts'),
}
const { default: Description } = load('src/components/PropertyDescription.tsx', shared)
const render = (text, props = {}) => renderToStaticMarkup(React.createElement(Description, { text, collapsible: true, ...props }))

test('all information sections start open; only general description prose gets a preview', () => {
  const paragraphs = [
    'รายละเอียดทรัพย์', 'บ้านพร้อมอยู่', 'มีสวนหลังบ้าน',
    'ข้อควรทราบเกี่ยวกับทรัพย์', 'ตรวจสอบสภาพบ้านก่อนซื้อ',
    'ข้อควรตรวจสอบสำคัญ: ยืนยันแนวเขตกับผู้ขาย',
    'ราคาและการติดต่อ', 'ราคานี้ไม่รวมค่าธรรมเนียม',
    'ทำเลและการเดินทาง', 'ใกล้สถานีรถไฟฟ้า',
    'รายละเอียดเพิ่มเติม', 'ส่วนต่อเติมด้านหลัง',
  ]
  const html = render(paragraphs.join('\n\n'))
  const details = html.match(/<details\b[^>]*>/g)
  assert.equal(details.length, 5)
  for (const tag of details) assert.match(tag, /\bopen=""/)
  assert.equal((html.match(/data-description-excerpt/g) || []).length, 2)
  for (const paragraph of paragraphs.filter((_, i) => [1, 2, 4, 5, 7, 9, 11].includes(i))) {
    assert.equal(html.split(paragraph).length - 1, 1, 'every paragraph is preserved exactly once')
  }
  assert.ok(!html.includes('max-height'), 'SSR and no-JS visitors can read the complete description')
})

test('unstructured descriptions stay together, including a long first paragraph; empty content has no controls', () => {
  const paragraphs = ['ข้อมูลยาว '.repeat(100), 'ย่อหน้าที่สอง', 'รายละเอียดท้ายสุด']
  const html = render(paragraphs.join('\n\n'))
  assert.equal((html.match(/data-description-excerpt/g) || []).length, 1)
  assert.ok(!html.includes('<details'))
  for (const text of paragraphs) assert.ok(html.includes(text.trim()))
  assert.ok(!render('').includes('<button'))
  assert.ok(!render('').includes('<details'))
})

test('Thai and English description headings are recognized without hiding a leading important note', () => {
  for (const heading of ['รายละเอียดที่ดิน', 'รายละเอียดเพิ่มเติม', 'Property details', 'Land details', 'More details']) {
    const html = render(`${heading}\n\nDescription body\n\nProperty notes\n\nInspect before purchase`)
    assert.match(html, /data-description-excerpt/)
    assert.ok(!html.includes(`<summary>${heading}`))
    assert.match(html, /<details open=""/)
    assert.ok(html.includes('Inspect before purchase'))
  }
  const note = render('ข้อควรตรวจสอบสำคัญ: ตรวจสอบเอกสารก่อนซื้อ')
  assert.match(note, /<details open=""/)
  assert.ok(!note.includes('data-description-excerpt'))
})

test('map preview consumers still receive their complete, unclipped description', () => {
  const html = render('รายละเอียดทรัพย์\n\nบ้านพร้อมอยู่\n\nProperty notes\n\nComplete final paragraph', { collapsible: false })
  assert.ok(html.includes('Complete final paragraph'))
  assert.ok(!html.includes('data-description-excerpt'))
  assert.ok(!html.includes('<details'))
})

function harness({ height = 280, lineHeight = 28, isThai = true, observer = true } = {}) {
  const slots = []
  let cursor = 0, effects = [], cleanup, resizeCallback, observed, disconnected = false, fontReady
  let measurements = 0
  const listeners = new Map()
  const content = { getBoundingClientRect: () => { measurements++; return { height } } }
  const hooks = {
    useRef: () => { const i = cursor++; return slots[i] ??= { current: content } },
    useId: () => 'description-test',
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = initial
      return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next }]
    },
    useEffect(effect) { const i = cursor++; if (!slots[i]) { slots[i] = true; effects.push(effect) } },
  }
  const context = {
    exports: {},
    require: id => id === 'react' ? hooks : shared[id],
    window: {
      getComputedStyle: () => ({ lineHeight: `${lineHeight}px` }),
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name) },
    },
    document: { fonts: { ready: { then: fn => { fontReady = fn } } } },
    ...(observer ? { ResizeObserver: class {
      constructor(fn) { resizeCallback = fn }
      observe(node) { observed = node }
      disconnect() { disconnected = true }
    } } : {}),
  }
  vm.runInNewContext(ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../src/components/PropertyDescription.tsx'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }
  ).outputText, context)
  const Excerpt = context.exports.DescriptionExcerpt
  let tree
  const render = () => { cursor = 0; tree = Excerpt({ paragraphs: ['First paragraph', 'Last paragraph'], isThai }) }
  const nodes = () => {
    const result = []
    const visit = node => {
      if (Array.isArray(node)) return node.forEach(visit)
      if (!node?.props) return
      result.push(node)
      visit(node.props.children)
    }
    visit(tree)
    return result
  }
  render()
  effects.forEach(effect => { cleanup = effect() })
  render()
  return {
    button: () => nodes().find(node => node.type === 'button')?.props,
    preview: () => nodes().find(node => node.props.id === 'description-test').props,
    paragraphs: () => nodes().filter(node => node.type === 'p').map(node => node.props.children),
    click() { this.button().onClick(); render() },
    resize(nextHeight, nextLineHeight = lineHeight) { height = nextHeight; lineHeight = nextLineHeight; (resizeCallback || listeners.get('resize'))(); render() },
    fonts(nextHeight) { height = nextHeight; fontReady(); render() },
    cleanup() { cleanup(); const before = measurements; fontReady(); assert.equal(measurements, before); assert.equal(listeners.size, 0); if (observer) assert.equal(disconnected, true) },
    observed: () => observed === content,
  }
}

test('short and exactly seven-line descriptions have no read-more button', () => {
  for (const height of [28, 84, 196, 196.5]) {
    const view = harness({ height })
    assert.equal(view.button(), undefined)
    assert.equal(view.preview().style, undefined)
    view.cleanup()
  }
})

test('long descriptions preview seven lines, expand and collapse accessibly without removing any text', () => {
  const view = harness()
  assert.equal(view.preview().style.maxHeight, '7lh')
  assert.equal(view.button()['aria-expanded'], false)
  assert.equal(view.button()['aria-controls'], view.preview().id)
  assert.equal(view.button().children[0], 'อ่านเพิ่มเติม')
  assert.deepEqual(view.paragraphs(), ['First paragraph', 'Last paragraph'])
  view.click()
  assert.equal(view.preview().style, undefined)
  assert.equal(view.button()['aria-expanded'], true)
  assert.equal(view.button().children[0], 'แสดงน้อยลง')
  view.click()
  assert.equal(view.preview().style.maxHeight, '7lh')
  assert.deepEqual(view.paragraphs(), ['First paragraph', 'Last paragraph'])
  view.cleanup()
})

test('responsive wrapping and font loading determine overflow and preserve an explicit expansion', () => {
  const view = harness({ height: 168 })
  assert.equal(view.observed(), true)
  view.resize(252)
  assert.equal(view.button()['aria-expanded'], false)
  view.click()
  view.resize(140)
  assert.equal(view.button(), undefined)
  view.resize(280)
  assert.equal(view.button()['aria-expanded'], true)
  view.click()
  view.fonts(180)
  assert.equal(view.button(), undefined)
  view.resize(350, 42)
  assert.equal(view.preview().style.maxHeight, '7lh')
  view.cleanup()
})

test('English controls and the window-resize fallback work without ResizeObserver', () => {
  const view = harness({ isThai: false, observer: false })
  assert.equal(view.button().children[0], 'Read more')
  view.click()
  assert.equal(view.button().children[0], 'Show less')
  view.resize(56)
  assert.equal(view.button(), undefined)
  view.cleanup()
})
