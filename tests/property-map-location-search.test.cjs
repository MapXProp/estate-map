const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

const model = (fetch) => require('./helpers/location-search.cjs')(fetch).map
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

test('a village displays its preferred Thai name while its English name and aliases remain searchable', () => {
  const m = model()
  const village = {
    ...project('nimittra'),
    name_th: 'หมู่บ้านนิมิตรา',
    name_en: 'Nimittra',
    display_name: 'หมู่บ้านนิมิตรา',
    aliases: ['Nimittra Bang Kruai'],
  }
  assert.equal(m.projectSearchSuggestion(village).label, 'หมู่บ้านนิมิตรา')
  for (const query of ['หมู่บ้านนิมิตรา', 'Nimittra', 'Nimittra Bang Kruai'])
    assert.equal(m.preferredMapProject(query, [village, project('condo')]), village)
  assert.equal(m.projectSearchSuggestion(project('condo')).label, 'The Address Sathorn')
})

test('listing and project modes show the same place-first list with registered project identity', async () => {
  const m = model(async (url) => url.startsWith('/apix/projects?')
    ? json({ projects: [project('address'), project('address')] })
    : json({ suggestions: [{type:'location',label:'Sathorn Road', query:'Sathorn Road',description:'location',place:{name:'Sathorn Road',address:'Bangkok',lat:13.7,lon:100.5}}] }))
  const first = await m.fetchMapSearchSuggestions('Sathorn', 'projects', '', signal())
  const second = await m.fetchMapSearchSuggestions('Sathorn', 'listings', '', signal())
  assert.deepEqual(plain(first), plain(second))
  assert.equal(first[0].label, 'Sathorn Road')
  assert.equal(first[0].place.lon,100.5)
  assert.equal(first.filter(x=>x.kind==='project').length,1)
  assert.equal(first.find(x=>x.kind==='project').project.public_project_id,'address')
})

test('autocomplete uses only same-origin services and degrades to the remaining source on failure', async () => {
  for (const failed of ['project','place']) {
    const urls = []
    const m = model(async url => {
      urls.push(url)
      if (url.startsWith('/apix/projects?')) {
        if (failed === 'project') throw Error('Unavailable')
        return json({projects:[project('address')]})
      }
      if (failed === 'place') throw Error('Unavailable')
      return json({suggestions:[{type:'location',label:'Sathorn Road',query:'Sathorn Road',description:'location'}]})
    })
    const rows = await m.fetchMapSearchSuggestions('Sathorn','listings','',signal())
    assert.ok(rows.some(row=> failed === 'project' ? row.label === 'Sathorn Road' : row.kind === 'project'))
    assert.ok(urls.every(url=>url.startsWith('/')))
  }
})

test('Enter selects a unique name or alias but leaves ambiguous projects for the user to choose', () => {
  const m = model()
  const address = project('address')
  const other = { ...project('other'), name_th: 'โครงการอื่น', name_en: 'Another project', aliases: [] }
  assert.equal(m.preferredMapProject('THE ADDRESS SATHORN', [other, address]), address)
  assert.equal(m.preferredMapProject('The Address Sathon', [other, address]), address)
  assert.equal(m.preferredMapProject('ดิ แอดเดรส สาทร', [other, address]), address)
  assert.equal(m.preferredMapProject('Address', [address]), undefined)
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

test('place fallback rejects invalid coordinates and uses the same-origin resolver and selected language', async () => {
  for(const place of [{lat:null,lon:''},{lat:' ',lon:100},{lat:91,lon:100},{lat:13,lon:181},undefined]) {
    const m=model(async()=>json({place}))
    assert.equal(await m.searchMapPlace('park','',true,signal()),undefined)
  }
  let requested
  const m=model(async url=>{requested=new URL(url,'https://mapxprop.com');return json({place:{name:'Park',address:'',lat:13.73,lon:100.54,zoom:15}})})
  assert.deepEqual(plain(await m.searchMapPlace('park','',false,signal())),{name:'Park',address:'',lat:13.73,lon:100.54,zoom:15})
  assert.equal(requested.pathname,'/api/location-search')
  assert.equal(requested.searchParams.get('locale'),'en')
})

test('province searches use a wide area view without depending on listings or a provider response', async () => {
  const m = model(() => {
    throw Error('No network needed for a known province')
  })
  for (const query of ['สุราษฎร์ธานี', 'Surat Thani', 'surat-thani']) {
    const place = await m.resolveMapSearchPlace(query, 'test', true, signal())
    assert.deepEqual(plain(place), { name: 'สุราษฎร์ธานี', address: '', lat: 9.1382, lon: 99.3217, zoom: 10 })
  }
})

test('registered project names and aliases use their exact coordinates even if external geocoding has no match', async () => {
  const mall = {
    ...project('emsphere', 'commercial_complex'),
    name_th: 'เอ็มสเฟียร์',
    name_en: 'Emsphere',
    display_name: 'Emsphere',
    aliases: ['EM MARKET HALL'],
    latitude: 13.732147,
    longitude: 100.56654,
  }
  const m = model(async (url) => {
    assert.ok(url.startsWith('/apix/projects?'), 'exact project does not need external geocoding')
    return json({ projects: [mall] })
  })
  for (const query of ['EM MARKET HALL', 'Emsphere', 'เอ็มสเฟียร์']) {
    const place = await m.resolveMapSearchPlace(query, 'test', true, signal())
    assert.equal(place.name, 'Emsphere')
    assert.equal(place.lat, mall.latitude)
    assert.equal(place.lon, mall.longitude)
    assert.equal(place.zoom, 16)
  }
})

test('a partial project match does not hijack a district search, and project service failure still allows places', async () => {
  for (const fail of [false, true]) {
    const m = model(async (url) => {
      if (url.startsWith('/apix/')) {
        if (fail) throw Error('Project service unavailable')
        return json({ projects: [{ ...project('address'), latitude: 14, longitude: 101 }] })
      }
      return json({ place: { name: 'เขตสาทร กรุงเทพมหานคร', lat: 13.71368, lon: 100.52715 } })
    })
    const place = await m.resolveMapSearchPlace('สาทร', 'test', true, signal())
    assert.equal(place.lat, 13.71368)
    assert.equal(place.zoom, 13)
  }
})

test('missing, ambiguous or invalid project coordinates fall back to place search without inventing coordinates', async () => {
  for (const projects of [
    [],
    [project('missing')],
    [{ ...project('bad'), latitude: NaN, longitude: 100 }],
    [project('duplicate1'), project('duplicate2')],
  ]) {
    const m = model(async (url) => json(url.startsWith('/apix/') ? { projects } : { data: [] }))
    assert.equal(await m.resolveMapSearchPlace('The Address Sathorn', 'test', true, signal()), undefined)
  }
})

test('an aborted destination cannot continue to geocoding after a late project response', async () => {
  let release,
    count = 0
  const controller = new AbortController()
  const m = model(async () => {
    count++
    await new Promise((resolve) => {
      release = resolve
    })
    return json({ projects: [] })
  })
  const pending = m.resolveMapSearchPlace('Old query', 'test', true, controller.signal)
  controller.abort()
  release()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(count, 1)
})
