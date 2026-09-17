const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports, globals = {}) {
  const context = {
    exports: {},
    URL,
    ...globals,
    require: (id) => {
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
const contacts = load('src/lib/propertyPreviewDetails.ts', {})
function harness(props = {}) {
  let cursor = 0,
    tree,
    now = 0,
    timerId = 0
  const slots = [],
    timers = new Map(),
    changes = [],
    cleanups = []
  const hooks = {
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
    useRef(initial) {
      const i = cursor++
      return (slots[i] ??= { current: initial })
    },
    useEffect(fn) {
      const i = cursor++
      if (!slots[i]) {
        slots[i] = true
        cleanups.push(fn())
      }
    },
  }
  const Sheet = load(
    'src/app/(app)/(listings)/components/MobileListingContactSheet.tsx',
    {
      react: hooks,
      'react/jsx-runtime': require('react/jsx-runtime'),
      'lucide-react': require('lucide-react'),
      '@headlessui/react': {
        Dialog: 'dialog',
        DialogPanel: 'panel',
        DialogBackdrop: 'backdrop',
        DialogTitle: 'heading',
      },
      'next/link': { default: 'link' },
      '@/lib/propertyPreviewDetails': contacts,
    },
    {
      window: { innerHeight: 800 },
      performance: { now: () => now },
      setTimeout: (callback, delay) => {
        timers.set(++timerId, { callback, at: now + delay })
        return timerId
      },
      clearTimeout: (id) => timers.delete(id),
    }
  ).default
  const render = () => {
    cursor = 0
    tree = Sheet({
      contactName: 'ฝ่ายขาย SAM',
      roleLabel: 'ผู้รับมอบอำนาจจากเจ้าของ',
      verificationStatus: 'identity_verified',
      organizationName: 'SAM',
      organizationPublicId: 'sam-public',
      authorityLabel: 'เจ้าของทรัพย์โดยตรง',
      phone: '02-686-1888',
      secondaryPhone: '1443',
      email: 'sales@sam.or.th',
      lineId: '@samline',
      instagramHandle: 'sam.test',
      websiteUrl: 'https://www.sam.or.th',
      triggerLabel: 'ติดต่อ',
      showOnTablet: true,
      analyticsListingId: 'public-1280',
      ...props,
      onOpenChange: (open) => changes.push(open),
    })
  }
  const nodes = (predicate) => {
    const result = []
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit)
      if (!node?.props) return
      if (predicate(node)) result.push(node)
      visit(node.props.children)
    }
    visit(tree)
    return result
  }
  const one = (predicate) => {
    const result = nodes(predicate)
    assert.equal(result.length, 1)
    return result[0].props
  }
  const dialog = () => one((node) => node.type === 'dialog')
  const panel = () => one((node) => node.type === 'panel')
  render()
  return {
    changes,
    nodes,
    one,
    dialog,
    panel,
    render,
    open() {
      one((node) => node.type === 'button' && node.props['aria-expanded'] !== undefined).onClick()
      render()
    },
    close() {
      dialog().onClose()
      render()
    },
    advance(ms) {
      now += ms
      for (const [id, timer] of [...timers])
        if (timer.at <= now) {
          timers.delete(id)
          timer.callback()
        }
      render()
    },
    touchStart(x = 100, y = 100) {
      panel().onTouchStart({ touches: [{ clientX: x, clientY: y }], target: { closest: () => ({}) } })
      render()
    },
    touchMove(x, y) {
      panel().onTouchMove({ touches: [{ clientX: x, clientY: y }], preventDefault() {} })
      render()
    },
    touchEnd() {
      panel().onTouchEnd()
      render()
    },
    text: () =>
      nodes((node) => typeof node.props.children === 'string')
        .map((node) => node.props.children)
        .join(' '),
    unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
  }
}

test('contact button opens identity, affiliation and real channels without initiating a call', () => {
  const h = harness()
  assert.equal(h.dialog().open, false)
  h.open()
  assert.equal(h.dialog().open, true)
  for (const text of ['ฝ่ายขาย SAM', 'ผู้รับมอบอำนาจจากเจ้าของ', 'เจ้าของทรัพย์โดยตรง', 'ยืนยันตัวตนแล้ว'])
    assert.ok(h.text().includes(text), text)
  assert.equal(h.one((n) => n.type === 'link').href, '/organizations/sam-public')
  assert.equal(h.dialog()['data-analytics-listing-id'], 'public-1280')
  assert.deepEqual(
    h.nodes((n) => n.type === 'a').map((n) => n.props.href),
    [
      'tel:026861888',
      'tel:1443',
      'https://line.me/R/ti/p/%40samline',
      'mailto:sales@sam.or.th',
      'https://www.instagram.com/sam.test/',
      'https://www.sam.or.th/',
    ]
  )
  h.close()
  assert.equal(h.dialog().open, false)
  assert.deepEqual(h.changes, [true, false])
})

test('pulling down closes only the contact sheet after its animation and it can be opened again', () => {
  const h = harness()
  h.open()
  h.touchStart()
  h.advance(100)
  h.touchMove(100, 300)
  h.touchEnd()
  assert.equal(h.dialog().open, true)
  assert.deepEqual(h.changes, [true], 'parent remains suspended throughout the closing animation')
  h.advance(220)
  assert.equal(h.dialog().open, false)
  assert.deepEqual(h.changes, [true, false])
  h.open()
  assert.equal(h.dialog().open, true)
  assert.equal(h.panel().style, undefined, 'reopening resets the off-screen transform')
  h.unmount()
})

test('upward and horizontal browsing gestures keep contact details open', () => {
  for (const [x, y] of [
    [100, 50],
    [250, 120],
  ]) {
    const h = harness()
    h.open()
    h.touchStart()
    h.advance(100)
    h.touchMove(x, y)
    h.touchEnd()
    h.advance(300)
    assert.equal(h.dialog().open, true)
    assert.deepEqual(h.changes, [true])
  }
})

test('personal LINE IDs and supported LINE links stay intact; missing contacts show an honest empty state', () => {
  for (const line of ['personal.line', '@official', 'https://lin.ee/example']) {
    const h = harness({ lineId: line })
    h.open()
    const link = h.nodes((n) => n.type === 'a' && n.props.href.includes('lin'))[0].props
    assert.equal(link.href, line.startsWith('https:') ? line : `https://line.me/R/ti/p/${encodeURIComponent(line)}`)
  }
  const h = harness({
    contactName: '',
    roleLabel: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    lineId: '',
    instagramHandle: '',
    websiteUrl: '',
    verificationStatus: '',
    trusted: false,
  })
  h.open()
  assert.equal(h.nodes((n) => n.type === 'a').length, 0)
  assert.ok(h.text().includes('ยังไม่มีช่องทางติดต่อเพิ่มเติม'))
  assert.ok(h.text().includes('ยังไม่ได้รับการตรวจสอบ'))
})

test('existing icon triggers remain available and new tablet/English contact sheets stay operable', () => {
  const icon = harness({ triggerLabel: undefined, showOnTablet: false })
  icon.open()
  assert.equal(icon.dialog().open, true)
  const english = harness({ isThai: false, triggerLabel: 'Contact' })
  english.open()
  assert.ok(english.text().includes('Advertiser details'))
  assert.ok(english.text().includes('Contact channels'))
  english.one((n) => n.type === 'button' && n.props['aria-label'] === 'Close contact details').onClick()
  english.render()
  assert.equal(english.dialog().open, false)
})
