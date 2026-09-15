const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/lib/propertyMapLocationSearch.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText
function model(fetch) {
  const context = {
    exports: {},
    URLSearchParams,
    fetch,
    require: () => ({ getAuthApiUrl: (value) => '/apix/' + value }),
  }
  vm.runInNewContext(source, context)
  return context.exports
}
const signal = () => new AbortController().signal
const json = (body) => ({ ok: true, json: async () => body })
const project = (id, category = 'condominium') => ({
  public_project_id: id,
  slug: id,
  name_th: 'ดิ แอดเดรส สาทร',
  name_en: 'The Address Sathorn',
  aliases: ['The Address Sathon'],
  project_category: category,
  listing_count: 2,
})
const plain = (value) => JSON.parse(JSON.stringify(value))

test('project mode ranks all registered project types before places and deduplicates each source', async () => {
  const projects = ['condominium', 'housing_estate', 'commercial_complex'].map((type, i) => project(String(i), type))
  const m = model(async (url) =>
    url.startsWith('/apix/')
      ? json({ projects: [...projects, projects[0], { name_th: 'Missing identity' }] })
      : json({ data: [{ w: 'Sathorn Road' }, { w: ' sathorn road ' }, { w: '' }] })
  )
  const suggestions = await m.fetchMapSearchSuggestions('Address', 'projects', 'test', signal())
  assert.equal(suggestions[0].label, 'The Address Sathorn')
  assert.deepEqual(plain(suggestions.map((row) => row.kind)), ['project', 'project', 'project', 'place', 'place'])
  assert.deepEqual(plain(suggestions.slice(0, 3).map((row) => row.project.project_category)), [
    'condominium',
    'housing_estate',
    'commercial_complex',
  ])
  assert.equal(
    suggestions[0].project.latitude,
    undefined,
    'a registered project without coordinates is still searchable'
  )
  assert.equal(suggestions.at(-1).direct, true, 'explicit place search remains available even with project matches')
})

test('listing mode searches places only and honors a stale provider keyword', async () => {
  const urls = []
  const m = model(async (url) => {
    urls.push(url)
    return json({ meta: { keyword: 'previous' }, data: [{ w: 'Wrong place' }] })
  })
  assert.equal((await m.fetchMapSearchSuggestions('current', 'listings', 'test', signal())).length, 0)
  assert.equal(urls.length, 1)
  assert.ok(urls[0].startsWith('https://search.longdo.com/'))
})

test('either source can fail without hiding results from the other', async () => {
  for (const failedSource of ['projects', 'places']) {
    const m = model(async (url) => {
      const isProject = url.startsWith('/apix/')
      if (isProject === (failedSource === 'projects')) throw new Error('Unavailable')
      return json(isProject ? { projects: [project('address')] } : { data: [{ w: 'Sathorn Road' }] })
    })
    const suggestions = await m.fetchMapSearchSuggestions('Address', 'projects', 'test', signal())
    assert.ok(
      suggestions.some((row) => (failedSource === 'places' ? row.kind === 'project' : row.label === 'Sathorn Road'))
    )
    assert.ok(suggestions.some((row) => row.kind === 'place' && row.direct))
  }
})

test('Enter selects a unique name or alias but leaves ambiguous projects for the user to choose', () => {
  const m = model()
  const address = project('address')
  const other = { ...project('other'), name_th: 'โครงการอื่น', name_en: 'Another project', aliases: [] }
  assert.equal(m.preferredMapProject('THE ADDRESS SATHORN', [other, address]), address)
  assert.equal(m.preferredMapProject('The Address Sathon', [other, address]), address)
  assert.equal(m.preferredMapProject('ดิ แอดเดรส สาทร', [other, address]), address)
  assert.equal(m.preferredMapProject('Address', [address]), address)
  assert.equal(m.preferredMapProject('Address', [address, other]), undefined)
  assert.equal(m.preferredMapProject('The Address Sathorn', [address, project('duplicate-name')]), undefined)
})

test('aborted search cannot return late project, suggestion or geocoding results even if transport ignores abort', async () => {
  for (const kind of ['projects', 'suggestions', 'place']) {
    const controller = new AbortController()
    let release
    const pending = new Promise((resolve) => {
      release = resolve
    })
    const m = model(async () => {
      await pending
      return json({ projects: [project('old')], data: [{ w: 'Old place', lat: 14, lon: 100 }] })
    })
    const result =
      kind === 'projects'
        ? m.searchMapProjects('old', controller.signal)
        : kind === 'suggestions'
          ? m.fetchMapSearchSuggestions('old', 'projects', 'test', controller.signal)
          : m.searchMapPlace('old', 'test', true, controller.signal)
    controller.abort()
    release()
    await assert.rejects(result, { name: 'AbortError' })
  }
})

test('place fallback rejects empty, invalid and out-of-range coordinates and uses the selected language', async () => {
  let requested
  const m = model(async (url) => {
    requested = new URL(url)
    return json({
      data: [
        { lat: null, lon: '' },
        { lat: ' ', lon: 100 },
        { lat: 91, lon: 100 },
        { lat: 13, lon: 181 },
        { name: 'Park', lat: '13.73', lon: '100.54' },
      ],
    })
  })
  assert.deepEqual(plain(await m.searchMapPlace('park', 'test', false, signal())), {
    name: 'Park',
    address: '',
    lat: 13.73,
    lon: 100.54,
  })
  assert.equal(requested.searchParams.get('locale'), 'en')
})
