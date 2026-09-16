const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, imports = {}, globals = {}) {
  const context = { exports: {}, FormData, URL, ...globals, require(id) {
    if (!(id in imports)) throw Error(`Unexpected dependency: ${id}`)
    return imports[id]
  } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context, { filename: file })
  return context.exports
}
const plain = value => JSON.parse(JSON.stringify(value))
const order = load('src/lib/listingMediaOrder.ts', { './listingPhotoOrder': load('src/lib/listingPhotoOrder.ts') })
const taxonomy = load('src/data/propertyTaxonomy.ts')
const formats = load('src/lib/listingMediaFormats.ts')
const draftLib = load('src/lib/listingDraft.ts', { '@/data/propertyTaxonomy': taxonomy, './auth': {}, './listingImageWatermark': {}, './listingMediaFormats': formats })
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate))
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)]
}
function hooks() {
  const slots = [], refs = [], dependencies = []
  let cursor = 0, refCursor = 0, effectCursor = 0, effects = []
  return {
    begin() { cursor = 0; refCursor = 0; effectCursor = 0; effects = [] },
    flush() { effects.forEach(fn => fn()) },
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next }] },
      useRef(initial) { return refs[refCursor++] ||= { current: initial } },
      useMemo: fn => fn(), useCallback: fn => fn,
      useEffect(fn, deps) { const i = effectCursor++; if (!dependencies[i] || !deps || deps.some((v, j) => v !== dependencies[i][j])) effects.push(fn); dependencies[i] = deps },
    },
  }
}
const file = (name, type = 'video/mp4') => ({ name, size: 123, lastModified: 456, type })
const token = order.listingMediaFileToken
const baseDraft = { property_type_code: 'land', 'offerTypes[]': ['sale'], contactName: 'Test publisher', selectedPhotoCount: '1', 'listingPhotoUrls[]': ['/existing.jpg'] }

function step3Fixture(options = {}) {
  let draft = { ...baseDraft, ...options.draft }, pending = { photos: [], videos: [], panoramas: [], floorPlans: [], ...options.pending }
  const h = hooks(), calls = [], router = { prefetch() {}, push(url) { calls.push(url) } }
  const page = load('src/app/(app)/(other-pages)/add-listing/3/page.tsx', {
    react: h.react, 'react/jsx-runtime': jsx, 'next/form': { default: 'form' }, 'next/navigation': { useRouter: () => router },
    '@heroicons/react/24/outline': {}, '@/hooks/useListingStepAnalytics': { useListingStepAnalytics() {} },
    '@/components/add-listing/EventDetailsPanel': { default: 'events' },
    '@/components/add-listing/ListingMediaGrid': { default: 'media-grid' },
    '@/components/add-listing/ListingMediaUpload': { default: 'media-upload' },
    '@/components/add-listing/ListingFlowProgressContext': { initialListingMediaProgress: {}, useListingFlowProgress: () => ({ pendingMedia: pending, setPendingMedia: next => { pending = typeof next === 'function' ? next(pending) : next }, setMediaProgress() {} }) },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'th', currency: 'THB' }) },
    '@/data/propertyTaxonomy': taxonomy, '@/lib/auth': { getApiBaseUrl: () => 'https://example.test', getStoredUser: () => null },
    '@/lib/listingContactProfile': { loadListingContactProfile: async () => null },
    '@/lib/listingDraft': { getListingDraft: () => draft, getListingDraftSummary: () => ({}), createListingSubmissionKey: () => 'fixture', saveListingStep(_step, data) { for (const key of new Set(data.keys())) draft[key] = key.endsWith('[]') ? data.getAll(key).filter(Boolean) : data.get(key); return draft } },
    '@/lib/listingFormValidation': { validateListingForm: () => true },
    '@/lib/listingMediaOrder': order,
    '@/lib/listingMediaFormats': formats,
    '@/lib/listingPublishValidation': { consumeListingPublishValidationIssue: () => null, validateListingDraftForPublish: () => null },
    '@/shared/Input': { default: 'input' }, '@/shared/Select': { default: 'select' }, '../FormItem': { default: 'form-item' },
  }, { requestAnimationFrame: fn => { fn(); return 1 }, cancelAnimationFrame() {}, URL: { createObjectURL: f => `blob:${f.name}`, revokeObjectURL() {} }, sessionStorage: { removeItem() {} } })
  let tree
  const render = () => { h.begin(); tree = page.default(); h.flush(); return tree }
  render(); render()
  return {
    render, calls, draft: () => draft, pending: () => pending,
    grid: kind => nodes(tree, n => n.type === 'media-grid' && n.props.kind === kind)[0].props,
    upload: kind => nodes(tree, n => n.type === 'media-upload' && n.props.kind === kind)[0].props,
    snapshot() { const data = new FormData(); nodes(tree, n => n.type === 'input' && n.props.type === 'hidden').forEach(n => data.append(n.props.name, n.props.value)); return data },
    submit: () => nodes(tree, n => n.type === 'form')[0].props.action(new FormData()),
  }
}

test('photos, videos and panoramas reorder mixed saved/new media and remove the correct file', async () => {
  for (const [kind, key, field] of [['photo', 'photos', 'Photo'], ['video', 'videos', 'Video'], ['panorama', 'panoramas', 'Panorama']]) {
    const a = file(`${kind}-a`), b = file(`${kind}-b`)
    const h = step3Fixture({ draft: { [`listing${field}Urls[]`]: ['/saved-a', '/saved-b'] }, pending: { [key]: [a, b] } })
    h.grid(kind).onMove(3, 0); h.render()
    assert.deepEqual(plain(h.grid(kind).items.map(i => i.token)), [token(b), 'url:/saved-a', 'url:/saved-b', token(a)])
    h.grid(kind).onRemove(1); h.render()
    h.grid(kind).onRemove(2); h.render()
    assert.deepEqual(plain(h.grid(kind).items.map(i => i.token)), [token(b), 'url:/saved-b'])
    assert.deepEqual(plain(h.pending()[key].map(f => f.name)), [b.name])
    assert.deepEqual(h.snapshot().getAll(`listing${field}Order[]`), [token(b), 'url:/saved-b'])
    assert.deepEqual(h.snapshot().getAll(`listing${field}Urls[]`), ['/saved-b'])
    await h.submit()
    assert.deepEqual(plain(h.draft()[`listing${field}Order[]`]), [token(b), 'url:/saved-b'])
    assert.deepEqual(h.calls, ['/add-listing/4'])
    const reopened = step3Fixture({ draft: h.draft(), pending: h.pending() })
    assert.deepEqual(plain(reopened.grid(kind).items.map(i => i.token)), [token(b), 'url:/saved-b'])
  }
})

test('adding files appends without disturbing the chosen order, deduplicates and respects limits', () => {
  for (const [kind, key, field, limit] of [['photo', 'photos', 'Photo', 10], ['video', 'videos', 'Video', 4], ['panorama', 'panoramas', 'Panorama', 4]]) {
    const type = kind === 'video' ? 'video/mp4' : 'image/jpeg'
    const a = file('a', type), b = file('b', type)
    const h = step3Fixture({ draft: { [`listing${field}Urls[]`]: ['/saved'] }, pending: { [key]: [a] } })
    h.grid(kind).onMove(1, 0); h.render()
    const event = { target: { files: [a, b, ...Array.from({ length: 12 }, (_, i) => file(`extra${i}`, type))], value: 'selection' } }
    h.upload(kind).onChange(event); h.render()
    assert.equal(event.target.value, '')
    assert.equal(h.grid(kind).items.length, limit)
    assert.deepEqual(plain(h.grid(kind).items.slice(0, 3).map(i => i.token)), [token(a), 'url:/saved', token(b)])
    while (h.grid(kind).items.length) { h.grid(kind).onRemove(0); h.render() }
    assert.deepEqual(h.snapshot().getAll(`listing${field}Order[]`), [''])
    assert.deepEqual(h.snapshot().getAll(`listing${field}Urls[]`), [''])
  }
})

test('selection accepts additional image/video formats and missing MIME types, while reporting rejected files', () => {
  for (const [kind, names] of [['photo', ['a.AVIF','b.GIF','c.BMP','d.JFIF']], ['video', ['a.M4V','b.MOV','c.MP4','d.WEBM']], ['panorama', ['a.avif','b.bmp','c.gif']]]) {
    const h = step3Fixture()
    h.upload(kind).onChange({ target: { files: [...names.map(name => file(name, '')), file('not-media.pdf', 'application/pdf')], value: 'selected' } })
    h.render()
    assert.ok(h.upload(kind).error.includes('not-media.pdf'))
    assert.equal(h.grid(kind).items.length, names.length + (kind === 'photo' ? 1 : 0))
    h.upload(kind).onChange({ target: { files: [file('empty', '')], value: '' } }); h.render()
    assert.ok(h.upload(kind).error.includes('empty'))
  }
})

test('media card buttons reorder/remove in both languages without submitting; edge and upload states disable controls', () => {
  for (const isThai of [true, false]) for (const kind of ['photo', 'video', 'panorama']) {
    const h = hooks(), moves = [], removed = []
    const component = load('src/components/add-listing/ListingMediaGrid.tsx', { react: h.react, 'react/jsx-runtime': jsx, '@heroicons/react/24/outline': {} }).default
    const props = { kind, isThai, items: ['a','b','c'].map(token => ({ token, url: `/${token}` })), onMove: (...args) => moves.push(args), onRemove: i => removed.push(i) }
    h.begin(); const tree = component(props)
    const cards = nodes(tree, n => n.props?.['data-media-token'])
    const buttons = card => nodes(card, n => n.type === 'button')
    assert.ok(buttons(tree).every(b => b.props.type === 'button' && b.props['aria-label']))
    assert.equal(buttons(cards[0]).at(-2).props.disabled, true)
    assert.equal(buttons(cards[2]).at(-1).props.disabled, true)
    buttons(cards[1]).at(-2).props.onClick()
    buttons(cards[1]).at(-1).props.onClick()
    buttons(cards[1]).find(b => /^(ลบ|Remove)/.test(b.props['aria-label'])).props.onClick()
    assert.deepEqual(moves, [[1,0],[1,2]])
    assert.deepEqual(removed, [1])
    if (kind === 'photo') { buttons(cards[2])[0].props.onClick(); assert.deepEqual(moves.at(-1), [2,0]) }
    h.begin(); assert.ok(buttons(component({ ...props, disabled: true })).every(b => b.props.disabled))
    if (kind === 'video') assert.ok(nodes(tree, n => n.type === 'video').every(n => n.props.playsInline && n.props.controls))
  }
})

function submissionFixture({ draft: initial, pending: initialPending, failName } = {}) {
  let draft = { ...baseDraft, ...initial }, pending = { photos: [], videos: [], panoramas: [], floorPlans: [], ...initialPending }
  const h = hooks(), uploads = [], published = [], snapshots = []
  let run, failed = false
  const component = load('src/app/(app)/(other-pages)/add-listing/4/page.tsx', {
    react: { ...h.react, useCallback(fn) { if (fn.constructor.name === 'AsyncFunction') run = fn; return fn } },
    'react/jsx-runtime': jsx, 'next/navigation': { useRouter: () => ({ replace() {} }) },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'en' }) },
    '@/components/add-listing/ListingFlowProgressContext': { initialListingMediaProgress: {}, initialListingPendingMedia: { photos: [], videos: [], panoramas: [], floorPlans: [] }, useListingFlowProgress: () => ({ pendingMedia: pending, mediaProgress: {}, setPendingMedia: next => { pending = typeof next === 'function' ? next(pending) : next }, setMediaProgress() {} }) },
    '@/lib/listingContactProfile': { saveListingContactProfile: async () => {} },
    '@/lib/listingDraft': {
      getListingDraft: () => draft, saveListingDraftToCloud: async () => {}, clearCloudListingDraft: async () => {}, clearListingDraft() {}, ListingMediaUploadError: class extends Error {},
      saveListingStep(_step, data) { for (const key of new Set(data.keys())) draft[key] = key.endsWith('[]') ? data.getAll(key).filter(Boolean) : data.get(key); snapshots.push(plain(draft)); return draft },
      async uploadListingMedia([file], mediaType) { uploads.push(file.name); if (file.name === failName && !failed) { failed = true; throw Error('Interrupted') } return [`/${mediaType}/${file.name}`] },
      async publishListingDraft() { published.push(draftLib.buildCreateListingPayload(draft)); return { slug: 'fixture', public_listing_id: 'fixture-id' } },
    },
    '@/lib/listingMediaOrder': order, '@/lib/listingFunnelAnalytics': { trackListingFunnel: () => true },
    '@/lib/listingPublishValidation': { validateListingDraftForPublish: () => null },
    '@/shared/ButtonPrimary': {}, '@/shared/ButtonSecondary': {}, '@heroicons/react/24/outline': {},
  }, { sessionStorage: { setItem() {} } })
  const render = () => { h.begin(); component.default() }
  render()
  return { run: () => run(), render, uploads, published, snapshots, pending: () => pending, draft: () => draft }
}

test('real publish flow retains interleaved media order, including after upload interruption and retry', async () => {
  const i1 = file('i1'), i2 = file('i2'), v1 = file('v1'), v2 = file('v2'), p1 = file('p1'), p2 = file('p2')
  const h = submissionFixture({
    draft: { 'listingPhotoUrls[]': ['/old-photo'], 'listingPhotoOrder[]': [token(i2), 'url:/old-photo', token(i1)], selectedPhotoCount: '3',
      'listingVideoUrls[]': ['/old-video'], 'listingVideoOrder[]': [token(v2), 'url:/old-video', token(v1)], selectedVideoCount: '3',
      'listingPanoramaUrls[]': ['/old-360'], 'listingPanoramaOrder[]': [token(p2), 'url:/old-360', token(p1)], selectedPanoramaCount: '3' },
    pending: { photos: [i1,i2], videos: [v1,v2], panoramas: [p1,p2] }, failName: 'v2',
  })
  await h.run()
  assert.equal(h.published.length, 0)
  assert.deepEqual(plain(h.draft()['listingVideoOrder[]']), [token(v2), 'url:/old-video', 'url:/video/v1'])
  assert.deepEqual(h.pending().videos.map(f => f.name), ['v2'])
  h.render(); await h.run()
  assert.deepEqual(h.uploads, ['i1','i2','v1','v2','v2','p1','p2'])
  assert.equal(h.published.length, 1)
  const media = plain(h.published[0].media_items)
  assert.deepEqual(media.filter(m => m.media_type === 'image').map(m => m.url), ['/image/i2','/old-photo','/image/i1'])
  assert.deepEqual(media.filter(m => m.media_type === 'video').map(m => m.url), ['/video/v2','/old-video','/video/v1'])
  assert.deepEqual(media.filter(m => m.media_type === '360').map(m => m.url), ['/360/p2','/old-360','/360/p1'])
  assert.ok(Object.values(h.pending()).every(files => files.length === 0))
})

test('existing-only media order is saved before publishing and legacy drafts keep their array order', async () => {
  for (const explicitOrder of [false, true]) {
    const draft = { 'listingVideoUrls[]': ['/v1','/v2'], 'listingPanoramaUrls[]': ['/p1','/p2'] }
    if (explicitOrder) Object.assign(draft, { 'listingVideoOrder[]': ['url:/v2','url:/v1'], 'listingPanoramaOrder[]': ['url:/p2','url:/p1'] })
    const h = submissionFixture({ draft }); await h.run()
    assert.deepEqual(h.uploads, [])
    const media = plain(h.published[0].media_items)
    assert.deepEqual(media.filter(m => m.media_type === 'video').map(m => m.url), explicitOrder ? ['/v2','/v1'] : ['/v1','/v2'])
    assert.deepEqual(media.filter(m => m.media_type === '360').map(m => m.url), explicitOrder ? ['/p2','/p1'] : ['/p1','/p2'])
  }
})
