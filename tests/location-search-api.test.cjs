const assert = require('node:assert/strict')
const {test} = require('node:test')
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript')
const transit = require('./helpers/transit-stations.cjs')
function route(name, fetch, quota = () => true) {
  const modules = {'@/lib/transitStations':transit,
    '@/lib/placeAutocomplete':require('./helpers/property-prices.cjs').load('src/lib/placeAutocomplete.ts'),
    '@/lib/server/longdoQuota':{getLongdoApiKey:()=> 'test',longdoNoStoreHeaders:{'Cache-Control':'no-store'},takeLongdoQuota:quota},
    'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200,headers:options.headers})}}}
  const preset = {exports:{}}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/propertyMapLocations.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,preset)
  modules['@/lib/propertyMapLocations'] = preset.exports
  const ctx={exports:{},fetch,URLSearchParams,AbortSignal,require:name=>{assert.ok(name in modules,name);return modules[name]}}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,`../src/app/api/${name}/route.ts`),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ctx)
  return (q,extra={})=>ctx.exports.GET({nextUrl:new URL('https://mapxprop.com/api?'+new URLSearchParams({q,...extra}))})
}
const json=body=>({ok:true,json:async()=>body})
test('provider suggestions carry exact coordinates and addresses, retain homonyms and deduplicate anonymous road segments',async()=>{
 let calls=0,quota=0
 const get=route('location-suggestions',async()=>{calls++;return json({data:[
  {name:'ถนนตัวอย่าง',lat:13.8,lon:100.5},{name:'ถนนตัวอย่าง',lat:13.9,lon:100.6},
  {name:'วัดใหม่',address:'เชียงใหม่',lat:18.8,lon:98.9},{name:'วัดใหม่',address:'กรุงเทพ',lat:13.8,lon:100.6},
  {name:'วัดใหม่',address:'กรุงเทพ',lat:13.8,lon:100.6},{name:'invalid',lat:0,lon:0},{name:'missing',lat:null,lon:100},
 ]})},()=>{quota++;return true})
 const result=await get('ตัวอย่าง')
 assert.equal(result.status,200);assert.equal(result.body.suggestions.length,3)
 assert.equal(result.body.suggestions[0].place.zoom,14)
 assert.equal(result.body.suggestions[1].detail,'เชียงใหม่');assert.equal(result.body.suggestions[1].place.lon,98.9)
 await get('ตัวอย่าง');assert.equal(calls,1);assert.equal(quota,1,'cached suggestions do not spend quota')
})
test('stale provider keywords and invalid coordinates never become clickable destinations',async()=>{
 const get=route('location-suggestions',async()=>json({meta:{keyword:'old'},data:[{name:'old',lat:13.8,lon:100.5}]}))
 assert.equal((await get('new')).body.suggestions.length,0)
})
test('empty, excessively long and station code queries do not call the external provider',async()=>{
 const get=route('location-suggestions',()=>{throw Error('Unexpected provider call')},()=>{throw Error('Unexpected quota use')})
 assert.equal((await get('')).body.suggestions.length,0)
 assert.equal((await get('a'.repeat(121))).body.suggestions.length,0)
 assert.equal((await get('N5')).body.suggestions[0].stationId,'bts-n5')
})
test('quota and provider failures return explicit temporary errors',async()=>{
 assert.equal((await route('location-suggestions',()=>{throw Error('Unexpected fetch')},()=>false)('สาทร')).status,429)
 assert.equal((await route('location-suggestions',()=>{throw Error('Offline')})('สาทร')).status,502)
})
test('bare Bang Na resolves the district while explicitly asking for BTS resolves the station',async()=>{
 let calls=0
 const get=route('location-search',async()=>{calls++;return json({data:[{name:'เขตบางนา กรุงเทพมหานคร',lat:13.666,lon:100.619}]})})
 const district=await get('บางนา')
 assert.equal(district.body.place.zoom,13);assert.equal(district.body.place.lat,13.666)
 const station=await get('BTS บางนา')
 assert.equal(station.body.place.lat,transit.getTransitStation('bts-e13').latitude)
 assert.equal(calls,1)
})

test('autocomplete uses Suggest for English prefixes, returns plain words without invented coordinates, and caches',async()=>{
 let count=0
 const get=route('location-autocomplete',async url=>{
  count++;const u=new URL(url);assert.equal(u.pathname,'/mapsearch/json/suggest');assert.equal(u.searchParams.get('keyword'),'thon')
  return json({meta:{keyword:'thon'},data:[{w:'Thong Lo',d:'<script>bad</script>',s:'poi_r'},{w:'Thong Lo',s:'poi_r'},{w:'Thon Buri',s:'poi_a'},{w:12},{lat:1,lon:1}]})
 })
 for(const q of ['','t','th','กข','x'.repeat(121)]) assert.equal((await get(q)).body.suggestions.length,0)
 assert.equal(count,0)
 const r=await get('thon');assert.equal(r.body.suggestions.length,2)
 assert.equal(r.body.suggestions[0].detail,'Road / soi');assert.equal(r.body.suggestions[0].place,undefined)
 assert.equal(r.body.suggestions[0].label,'Thong Lo');assert.equal(JSON.stringify(r.body).includes('<script>'),false)
 await get('thon');assert.equal(count,1)
})

test('Thai suggestions stay Thai, malformed or stale results stay empty, and provider errors remain retryable',async()=>{
 const get=route('location-autocomplete',async()=>json({data:[{w:'ทองหล่อ',s:'poi_r'}]}))
 assert.equal((await get('ทอง')).body.suggestions[0].detail,'ถนน / ซอย')
 for(const body of [{data:{}},{meta:{keyword:'old'},data:[{w:'Old'}]}])
  assert.equal((await route('location-autocomplete',async()=>json(body))('new')).body.suggestions.length,0)
 assert.equal((await route('location-autocomplete',async()=>{throw Error('Offline')})('thon')).status,502)
 assert.equal((await route('location-autocomplete',async()=>{throw Error('Should not run')},()=>false)('thon')).status,429)
})

test('selecting an English Longdo station uses provider coordinates and English addresses without local station substitution',async()=>{
 let requested
 const get=route('location-suggestions',async url=>{
  requested=new URL(url)
  return json({data:[{name:'BTS Chong Non Si Station (S3)',address:'Si Lom, Bang Rak, Bangkok',lat:13.7237,lon:100.5293}]})
 })
 const rows=(await get('BTS Chong Non Si Station (S3)',{source:'longdo'})).body.suggestions
 assert.equal(requested.searchParams.get('locale'),'en');assert.equal(rows[0].place.lat,13.7237)
 assert.equal(rows[0].stationId,undefined);assert.equal(rows[0].detail,'Si Lom, Bang Rak, Bangkok')
})

test('English road segments collapse only when their labels and addresses are indistinguishable',async()=>{
 const get=route('location-suggestions',async()=>json({data:[
  {name:'Sukhumvit Road',address:'Bangkok',lat:13.7,lon:100.5},
  {name:'Sukhumvit Road',address:'Bangkok',lat:13.8,lon:100.6},
  {name:'Sukhumvit Road',address:'Samut Prakan',lat:13.6,lon:100.7},
 ]}))
 const rows=(await get('Sukhumvit Road',{source:'longdo'})).body.suggestions
 assert.equal(rows.length,2);assert.equal(rows[0].place.zoom,14)
})

test('map resolution prefers the chosen full name over an incidental match and requests the input language',async()=>{
 let url
 const get=route('location-search',async value=>{url=new URL(value);return json({data:[
  {name:'Shop near Thonglor',lat:13.6,lon:100.4},
  {name:'Thonglor Place',address:'Bangkok',lat:13.7,lon:100.5},
 ]})})
 const result=await get('Thonglor Place',{locale:'th'})
 assert.equal(url.searchParams.get('locale'),'en');assert.equal(result.body.place.lat,13.7)
})
