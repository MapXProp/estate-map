const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

const filename = path.join(__dirname, '../src/components/property-home/DiscoveryHero.tsx')
const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const photos = [0, 1, 2].map((index) => ({ src: `/scene-${index}.jpg`, th: `บรรยากาศ ${index}`, en: `Space ${index}` }))
const nodes = (node) =>
  Array.isArray(node)
    ? node.flatMap(nodes)
    : node && typeof node === 'object'
      ? [node, ...nodes(node.props?.children)]
      : []

function mount({ reducedMotion = false, hidden = false, isThai = false } = {}) {
  const hooks = []
  const timers = new Map()
  const mediaListeners = new Set()
  const visibilityListeners = new Set()
  let cursor = 0
  let pending = []
  let now = 0
  let timerId = 0
  let tree
  const media = {
    matches: reducedMotion,
    addEventListener: (_, callback) => mediaListeners.add(callback),
    removeEventListener: (_, callback) => mediaListeners.delete(callback),
  }
  const document = {
    hidden,
    addEventListener: (_, callback) => visibilityListeners.add(callback),
    removeEventListener: (_, callback) => visibilityListeners.delete(callback),
  }
  const react = {
    useState(initial) {
      const index = cursor++
      hooks[index] ??= { value: initial }
      return [
        hooks[index].value,
        (value) => {
          hooks[index].value = typeof value === 'function' ? value(hooks[index].value) : value
        },
      ]
    },
    useEffect(effect, deps) {
      const index = cursor++
      const previous = hooks[index]
      if (!previous || deps.some((value, offset) => !Object.is(value, previous.deps[offset]))) {
        pending.push(() => {
          previous?.cleanup?.()
          hooks[index] = { deps, cleanup: effect() }
        })
      }
    },
    useSyncExternalStore(subscribe, read) {
      const index = cursor++
      hooks[index] ??= { cleanup: subscribe(() => render()) }
      return read()
    },
  }
  const imports = {
    'react/jsx-runtime': require('react/jsx-runtime'),
    react,
    'lucide-react': { Pause: 'test-pause-icon', Play: 'test-play-icon' },
    'next/image': { default: 'test-image' },
    './PropertyDiscovery.module.css': { default: new Proxy({}, { get: (_, key) => key }) },
  }
  const context = {
    exports: {},
    document,
    window: {
      matchMedia: () => media,
      setTimeout: (callback, delay) => {
        const id = ++timerId
        timers.set(id, { callback, at: now + delay })
        return id
      },
      clearTimeout: (id) => timers.delete(id),
    },
    require: (id) => {
      if (!(id in imports)) throw new Error(`Unexpected import: ${id}`)
      return imports[id]
    },
  }
  vm.runInNewContext(code, context, { filename })
  function render() {
    cursor = 0
    pending = []
    tree = context.exports.default({ photos, isThai, children: 'Fixed title', mapLink: 'Fixed map link' })
    for (const effect of pending) effect()
    return tree
  }
  function advance(milliseconds) {
    const end = now + milliseconds
    let next
    while ((next = [...timers].sort((a, b) => a[1].at - b[1].at)[0]) && next[1].at <= end) {
      now = next[1].at
      timers.delete(next[0])
      next[1].callback()
      render()
    }
    now = end
  }
  const find = (className) => nodes(tree).filter((node) => node.props?.className === className)
  const image = (index) => nodes(tree).filter((node) => node.type === 'test-image')[index]
  const imageEvent = (index, event) => {
    image(index).props[event]()
    render()
  }
  render()
  return {
    advance,
    root: () => tree,
    find,
    image,
    load: (index) => imageEvent(index, 'onLoad'),
    fail: (index) => imageEvent(index, 'onError'),
    loadAll: () => photos.forEach((_, index) => imageEvent(index, 'onLoad')),
    active: () => find('sceneButton').findIndex((node) => node.props['aria-pressed']),
    playing: () => tree.props['data-playing'],
    click: (className, index = 0) => {
      find(className)[index].props.onClick()
      render()
    },
    event: (name, event = {}) => {
      tree.props[name](event)
      render()
    },
    motion: (value) => {
      media.matches = value
      mediaListeners.forEach((callback) => callback())
    },
    visibility: (value) => {
      document.hidden = !value
      visibilityListeners.forEach((callback) => callback())
    },
    unmount: () => hooks.forEach((hook) => hook.cleanup?.()),
    timers,
    mediaListeners,
    visibilityListeners,
  }
}

test('waits for ready photos, changes every six seconds and loops without moving fixed content', () => {
  const view = mount()
  view.advance(12000)
  assert.equal(view.active(), 0)
  assert.equal(view.playing(), false)
  view.loadAll()
  view.advance(5999)
  assert.equal(view.active(), 0)
  view.advance(1)
  assert.equal(view.active(), 1)
  view.advance(6000)
  assert.equal(view.active(), 2)
  view.advance(6000)
  assert.equal(view.active(), 0)
  assert.equal(view.find('heroCopy')[0].props.children[0], 'Fixed title')
  assert.equal(view.root().props.children.at(-1), 'Fixed map link')
  view.unmount()
  assert.equal(view.timers.size, 0)
  assert.equal(view.mediaListeners.size, 0)
  assert.equal(view.visibilityListeners.size, 0)
})

test('manual scene selection pauses until Play is chosen', () => {
  const view = mount()
  view.loadAll()
  view.click('sceneButton', 2)
  assert.equal(view.active(), 2)
  assert.equal(view.playing(), false)
  assert.equal(view.find('playButton')[0].props['aria-label'], 'Play slideshow')
  assert.equal(view.find('sr-only')[0].props['aria-live'], 'polite')
  view.advance(18000)
  assert.equal(view.active(), 2)
  view.click('playButton')
  assert.equal(view.find('sr-only')[0].props['aria-live'], 'off')
  view.advance(6000)
  assert.equal(view.active(), 0)
  view.click('playButton')
  view.advance(6000)
  assert.equal(view.active(), 0)
})

test('mouse hover and keyboard focus suspend autoplay; touch does not get stuck in hover', () => {
  const view = mount()
  view.loadAll()
  view.advance(5000)
  view.event('onPointerEnter', { pointerType: 'mouse' })
  view.advance(12000)
  assert.equal(view.active(), 0)
  view.event('onPointerLeave')
  view.advance(5999)
  assert.equal(view.active(), 0)
  view.advance(1)
  assert.equal(view.active(), 1)
  view.event('onFocusCapture')
  view.event('onBlurCapture', { currentTarget: { contains: () => true } })
  view.advance(6000)
  assert.equal(view.active(), 1)
  view.event('onBlurCapture', { currentTarget: { contains: () => false } })
  view.event('onPointerEnter', { pointerType: 'touch' })
  view.advance(6000)
  assert.equal(view.active(), 2)
})

test('hidden tabs suspend autoplay and returning starts a fresh reading interval', () => {
  const view = mount({ hidden: true })
  view.loadAll()
  view.advance(12000)
  assert.equal(view.active(), 0)
  view.visibility(true)
  view.advance(6000)
  assert.equal(view.active(), 1)
  view.advance(5000)
  view.visibility(false)
  view.advance(12000)
  assert.equal(view.active(), 1)
  view.visibility(true)
  view.advance(5999)
  assert.equal(view.active(), 1)
  view.advance(1)
  assert.equal(view.active(), 2)
})

test('reduced-motion preference supports manual scenes and reacts to preference changes', () => {
  const view = mount({ reducedMotion: true })
  view.loadAll()
  assert.equal(view.find('playButton').length, 0)
  view.advance(18000)
  assert.equal(view.active(), 0)
  view.click('sceneButton', 1)
  assert.equal(view.active(), 1)
  assert.equal(view.find('sr-only')[0].props['aria-live'], 'polite')
  view.motion(false)
  assert.equal(view.playing(), false, 'Manual pause persists when motion preference changes')
  view.click('playButton')
  assert.equal(view.playing(), true)
  view.motion(true)
  view.advance(12000)
  assert.equal(view.active(), 1)
})

test('skips unloaded or failed photos, recovers from a failed first photo and never loops a single valid photo', () => {
  const view = mount()
  view.fail(0)
  assert.equal(view.find('sceneButton')[0].props.disabled, true)
  view.load(2)
  assert.equal(view.active(), 2)
  view.advance(18000)
  assert.equal(view.active(), 2)
  assert.equal(view.playing(), false)
  view.load(1)
  view.advance(6000)
  assert.equal(view.active(), 1)
  view.fail(1)
  assert.equal(view.active(), 2)
  assert.equal(view.find('sceneButton')[1].props.disabled, true)
  assert.equal(view.playing(), false)
})

test('keeps first photo as preload, secondary photos low priority, with Thai and English controls', () => {
  for (const isThai of [true, false]) {
    const view = mount({ isThai })
    assert.equal(view.image(0).props.preload, true)
    assert.equal(view.image(1).props.preload, false)
    assert.equal(view.image(1).props.fetchPriority, 'low')
    assert.equal(view.find('sceneButton')[0].props['aria-label'], isThai ? 'ภาพ 1: บรรยากาศ 0' : 'Scene 1: Space 0')
    assert.equal(view.find('playButton')[0].props['aria-label'], isThai ? 'หยุดภาพอัตโนมัติ' : 'Pause slideshow')
    assert.equal(view.find('sr-only')[0].props['aria-live'], 'off')
  }
})
