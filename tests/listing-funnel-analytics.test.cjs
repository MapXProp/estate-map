const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function load(file, dependencies = {}, globals = {}) {
  const context = {
    exports: {}, URL, Set, Date, FormData, Error,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    ...globals,
  }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context, { filename: file })
  return context.exports
}
const plain = (value) => JSON.parse(JSON.stringify(value))
const contact = load('src/lib/contactAnalytics.ts')
const taxonomy = load('src/data/propertyTaxonomy.ts')
const analytics = load('src/lib/listingFunnelAnalytics.ts', {
  '@/data/propertyTaxonomy': taxonomy,
  './contactAnalytics': contact,
})
const gaId = 'G-SL2JTL4WE7'
const publicId = '87d4abdf-c7db-4a72-8d63-f4131f702bb8'
const draft = { property_type_code: 'land', submissionKey: 'local-submission-1' }
function storage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
}
const fixtureWindow = (sessionStorage = storage()) => ({
  location: { href: 'https://mapxprop.com/add-listing/1?new=1', origin: 'https://mapxprop.com' },
  sessionStorage,
})
const events = (win) => plain((win.dataLayer || []).map((args) => Array.from(args)).filter((args) => args[0] === 'event'))
const record = (win, action, value = draft) => analytics.recordListingFunnelEvent(action, value, win, gaId)

test('all four steps queue before tag loading, with one config and no manual extra page views', () => {
  const win = fixtureWindow()
  for (const step of [1, 2, 3, 4]) assert.equal(record(win, { kind: 'step', step }), true)
  contact.initializeAnalytics(gaId, win)
  assert.equal(win.dataLayer.filter((args) => args[0] === 'config').length, 1)
  assert.deepEqual(events(win).map((item) => item[1]), [1, 2, 3, 4].map((n) => `listing_create_step_${n}`))
  assert.deepEqual(events(win).map((item) => item[2].step_name), ['property_type', 'details', 'media_price_contact', 'upload_publish'])
  assert.equal(events(win)[0][2].page_location, 'https://mapxprop.com/add-listing/1')
})

test('editing, auth interruption and failure remain separate from the creation success funnel', () => {
  const win = fixtureWindow()
  const editing = { ...draft, editingPublicListingId: publicId }
  record(win, { kind: 'step', step: 2 }, editing)
  record(win, { kind: 'auth' })
  record(win, { kind: 'error', stage: 'upload' })
  record(win, { kind: 'success', listingId: publicId }, editing)
  assert.deepEqual(events(win).map((item) => item[1]), ['listing_edit_step_2', 'listing_create_auth_required', 'listing_create_error', 'listing_edit_success'])
  assert.equal(events(win)[2][2].failure_stage, 'upload')
})

test('only allowlisted metadata is sent; private draft data and submission keys never leave the browser', () => {
  const win = fixtureWindow()
  record(win, { kind: 'success', listingId: publicId }, {
    ...draft, listingTitle: 'Private title', listingDescription: 'Private description',
    contactName: 'Private name', contactEmail: 'private@example.test', contactPhone: '0811111111',
    lineId: 'private-line', latMapPosition: '13.123456', lngMapPosition: '100.98765',
    state: 'Private address', salePrice: '999999999', 'listingPhotoUrls[]': ['https://example.test/private-photo.jpg'],
    draftOwnerPublicUserId: 'private-user-id',
  })
  assert.deepEqual(events(win)[0][2], {
    flow_mode: 'create', step_number: 4, step_name: 'upload_publish', property_type: 'land',
    listing_id: publicId, send_to: gaId, page_location: 'https://mapxprop.com/add-listing/4',
  })
  const event = analytics.buildListingFunnelEvent({ kind: 'step', step: 1 }, { property_type_code: 'private@example.test' })
  assert.equal(event.params.property_type, undefined)
  for (const action of [{ kind: 'step', step: 5 }, { kind: 'error', stage: 'private error text' }, { kind: 'success', listingId: 'private@example.test' }]) {
    assert.equal(record(win, action), false)
  }
  assert.equal(events(win).length, 1)
})

test('confirmed saves are deduplicated across retries and reloads, but separate submissions still count', () => {
  const shared = storage()
  const first = fixtureWindow(shared)
  const success = { kind: 'success', listingId: publicId }
  assert.equal(record(first, success), true)
  assert.equal(record(first, success), false)
  const reload = fixtureWindow(shared)
  assert.equal(record(reload, success), false)
  assert.equal(record(reload, success, { ...draft, editingPublicListingId: publicId }), true)
  assert.equal(record(reload, success, { ...draft, editingPublicListingId: publicId, submissionKey: 'second-edit' }), true)
  assert.equal(record(reload, { kind: 'success', listingId: 'another-public-id' }), true)
})

test('blocked browser storage uses in-memory deduplication and telemetry errors cannot break the form', () => {
  const win = fixtureWindow({ getItem() { throw new Error('Blocked') }, setItem() { throw new Error('Blocked') } })
  assert.equal(record(win, { kind: 'success', listingId: publicId }), true)
  assert.equal(record(win, { kind: 'success', listingId: publicId }), false)
  win.gtag = () => { throw new Error('Tag unavailable') }
  assert.equal(record(win, { kind: 'step', step: 2 }), false)
  assert.equal(analytics.recordListingFunnelEvent({ kind: 'step', step: 1 }, draft, fixtureWindow(), ''), false)
})

test('step hook waits for a real form, ignores re-renders/effect replay, and records a later revisit', () => {
  const win = fixtureWindow()
  let ref = { current: false }
  let effect
  const hook = load('src/hooks/useListingStepAnalytics.ts', {
    react: { useRef: () => ref, useEffect: (callback) => { effect = callback } },
    '@/lib/listingDraft': { getListingDraft: () => draft },
    '@/lib/listingFunnelAnalytics': { trackListingFunnel: (action, value) => record(win, action, value) },
  }).useListingStepAnalytics
  hook(2, false); effect()
  assert.equal(events(win).length, 0)
  hook(2, true); effect(); effect()
  hook(2, true); effect()
  assert.equal(events(win).length, 1)
  ref = { current: false }
  hook(2, true); effect()
  assert.equal(events(win).length, 2)
})

// Execute the real step-4 component callback with React, API and storage boundaries
// replaced. These tests cannot upload files, publish listings or call Analytics.
function submissionHarness(options = {}) {
  const win = fixtureWindow()
  let value = { ...draft, ...(options.draft || {}) }
  if (options.empty) value = {}
  const states = [], refs = []
  let stateIndex = 0, refIndex = 0, effects = [], process
  const calls = { publish: 0, upload: 0, replaced: [] }
  const progress = { phase: 'idle', totalCount: 0, completedCount: 0 }
  const pending = { photos: [], videos: [], panoramas: [], floorPlans: [], ...options.pending }
  const react = {
    useState(initial) {
      const index = stateIndex++
      if (!(index in states)) states[index] = initial
      return [states[index], (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next }]
    },
    useRef(initial) { return refs[refIndex++] ||= { current: initial } },
    useEffect(callback) { effects.push(callback) },
    useMemo(callback) { return callback() },
    useCallback(callback) { if (callback.constructor.name === 'AsyncFunction') process = callback; return callback },
  }
  const session = storage()
  if (options.restored) session.setItem('submission-result', JSON.stringify({ publicListingId: publicId, slug: 'fixture', draft: value }))
  if (options.finalizeFailure) session.setItem = () => { throw new Error('Storage full') }
  const page = load('src/app/(app)/(other-pages)/add-listing/4/page.tsx', {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'next/navigation': { useRouter: () => ({ replace: (url) => calls.replaced.push(url) }) },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale: 'en' }) },
    '@/components/add-listing/ListingFlowProgressContext': {
      initialListingMediaProgress: progress, initialListingPendingMedia: pending,
      useListingFlowProgress: () => ({ pendingMedia: pending, mediaProgress: progress, setPendingMedia() {}, setMediaProgress() {} }),
    },
    '@/lib/listingContactProfile': { saveListingContactProfile: async () => {} },
    '@/lib/listingDraft': {
      LISTING_SUBMISSION_RESULT_KEY: 'submission-result', ListingMediaUploadError: class extends Error {},
      getListingDraft: () => value, saveListingStep: () => value, saveListingDraftToCloud: async () => {},
      clearCloudListingDraft: async () => {}, clearListingDraft() {},
      uploadListingMedia: async () => { calls.upload++; throw new Error('Private filename upload error') },
      publishListingDraft: async () => {
        calls.publish++
        return options.publish ? options.publish(calls.publish) : { slug: 'fixture', public_listing_id: publicId }
      },
    },
    '@/lib/listingFunnelAnalytics': { trackListingFunnel: (action, current) => record(win, action, current) },
    '@/lib/listingPhotoOrder': {
      normalizeListingPhotoOrder: (_order, urls) => urls,
      listingPhotoURLsFromOrder: (urls) => urls,
    },
    '@/lib/listingPublishValidation': { validateListingDraftForPublish: () => options.validation || null, storeListingPublishValidationIssue() {} },
    '@/shared/ButtonPrimary': {}, '@/shared/ButtonSecondary': {}, '@heroicons/react/24/outline': {},
  }, { sessionStorage: session })
  function render() { stateIndex = 0; refIndex = 0; effects = []; page.default() }
  render()
  return { win, calls, run: () => process(), render, effects: () => effects.forEach((callback) => callback()), states }
}

test('step 4 counts entry before the request resolves and success only after the API confirms a public listing', async () => {
  let resolve
  const result = new Promise((done) => { resolve = done })
  const h = submissionHarness({ publish: () => result })
  const running = h.run()
  await new Promise(setImmediate)
  assert.equal(h.calls.publish, 1)
  assert.deepEqual(events(h.win).map((item) => item[1]), ['listing_create_step_4'])
  resolve({ slug: 'fixture', public_listing_id: publicId })
  await running
  assert.deepEqual(events(h.win).map((item) => item[1]), ['listing_create_step_4', 'listing_create_success'])
})

test('failed publishing and a retry count one step view, an error and one eventual success', async () => {
  const h = submissionHarness({ publish: async (attempt) => {
    if (attempt === 1) throw new Error('Private server error')
    return { slug: 'fixture', public_listing_id: publicId }
  } })
  await h.run(); await h.run()
  assert.deepEqual(events(h.win).map((item) => item[1]), ['listing_create_step_4', 'listing_create_error', 'listing_create_success'])
  assert.equal(events(h.win)[1][2].failure_stage, 'publish')
  assert.ok(!JSON.stringify(events(h.win)).includes('Private'))
})

test('empty/invalid drafts, missing files, failed uploads and malformed responses cannot create conversions', async () => {
  const cases = [
    [{ empty: true }, 'missing_draft', 0],
    [{ validation: { step: 2 } }, 'validation', 0],
    [{ draft: { selectedPhotoCount: '1' } }, 'files', 0],
    [{ pending: { photos: [{ name: 'private.jpg' }] } }, 'upload', 0],
    [{ publish: async () => ({ slug: 'fixture' }) }, 'publish', 1],
    [{ publish: async () => ({ public_listing_id: publicId }) }, 'publish', 1],
  ]
  for (const [options, failure, publishes] of cases) {
    const h = submissionHarness(options)
    await h.run()
    assert.equal(h.calls.publish, publishes)
    assert.equal(events(h.win).some((item) => item[1].endsWith('_success')), false)
    assert.equal(events(h.win).find((item) => item[1].endsWith('_error'))[2].failure_stage, failure)
    if (options.validation) assert.deepEqual(h.calls.replaced, ['/add-listing/2'])
  }
})

test('a confirmed API save remains a conversion if browser finalization fails; retry does not duplicate it', async () => {
  const h = submissionHarness({ finalizeFailure: true })
  await h.run(); await h.run()
  assert.equal(events(h.win).filter((item) => item[1] === 'listing_create_success').length, 1)
  assert.equal(events(h.win).at(-1)[2].failure_stage, 'finalize')
})

test('opening a restored success screen does not publish again or generate a fresh step/conversion', () => {
  const h = submissionHarness({ restored: true })
  h.effects(); h.render(); h.effects()
  assert.equal(h.calls.publish, 0)
  assert.equal(events(h.win).length, 0)
  assert.equal(h.states[0], 'success')
})
