const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

function model(fetchPropertySearch) {
  const context = { exports: {}, require: id => id === './propertySearch' ? { fetchPropertySearch } : {} }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/propertyMapProjects.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context)
  return context.exports
}
const listing = { id: '1', projectPublicId: 'project-a', projectSlug: 'address', projectName: 'The Address', projectCategory: 'condominium', map: { lat: 13.7, lng: 100.5 } }
const plain = value => JSON.parse(JSON.stringify(value))

test('only registered membership groups pins; names and shared coordinates cannot merge unrelated buildings', () => {
  const rows = [listing, { ...listing, id: '2' }, { ...listing, id: '3', projectPublicId: 'project-b' }, { ...listing, id: '4', projectPublicId: '' }]
  const groups = model().groupMapProjects(rows)
  assert.equal(groups.length, 2)
  assert.deepEqual(plain(groups[0].listingIds), ['1','2'])
  assert.deepEqual(plain(groups[1].listingIds), ['3'])
  assert.deepEqual(plain(model().groupMapProjects([...rows].reverse())), plain(groups), 'search ordering never moves the project pin')
})

test('official project coordinate anchors units at different coordinates; unknown centers never invent a midpoint', () => {
  const separate = [listing, {...listing, id:'2', map:{lat:13.8,lng:100.6}}]
  assert.equal(model().groupMapProjects(separate).length, 2)
  const group = model().groupMapProjects(separate.map(row=>({...row,projectLatitude:13.72,projectLongitude:100.52})))
  assert.equal(group.length, 1)
  assert.deepEqual(plain(group[0].location), {lat:13.72,lon:100.52})
})

test('all project pages load independently of map filters, including units with no map coordinate', async () => {
  const calls=[]
  const rows=Array.from({length:125},(_,id)=>({public_listing_id:`unit-${id}`,project_public_id:'project-a'}))
  const m=model(async (query,signal,options)=>{calls.push({query,options});return {listings:rows.slice(options.offset,options.offset+60),total:rows.length}})
  assert.equal((await m.fetchMapProjectListings('project-a', new AbortController().signal)).length,125)
  assert.deepEqual(calls.map(call=>call.options.offset),[0,60,120])
  assert.ok(calls.every(call=>call.query==='' && call.options.project==='project-a' && !call.options.view && !call.options.offerTypes && !call.options.propertyTypes))
})

test('a stale API, broken pagination, or an empty identity cannot show unrelated listings as project units', async () => {
  const signal=new AbortController().signal
  await assert.rejects(model().fetchMapProjectListings('',signal),/Missing project/)
  await assert.rejects(model(async()=>({listings:[{public_listing_id:'x',project_public_id:'project-b'}],total:1})).fetchMapProjectListings('project-a',signal),/membership/)
  await assert.rejects(model(async()=>({listings:[{public_listing_id:'x',project_public_id:'project-a'}],total:2})).fetchMapProjectListings('project-a',signal),/pagination/)
  await assert.rejects(model(async()=>({listings:[],total:2})).fetchMapProjectListings('project-a',signal),/Incomplete/)
  assert.equal((await model(async()=>({listings:[],total:0})).fetchMapProjectListings('project-a',signal)).length,0)
})

test('sale and rent tabs include dual-offer listings and recognize price-on-request offers', () => {
  const m=model()
  assert.equal(m.hasProjectOffer({sale_price:8000000,rent_price_monthly:30000},'sale'),true)
  assert.equal(m.hasProjectOffer({sale_price:8000000,rent_price_monthly:30000},'rent'),true)
  assert.equal(m.hasProjectOffer({offer_type:'rent'},'rent'),true)
  assert.equal(m.hasProjectOffer({offer_type:'sale'},'rent'),false)
})
