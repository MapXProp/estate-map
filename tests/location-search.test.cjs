const assert=require('node:assert/strict'),{test}=require('node:test')
const model=require('./helpers/location-search.cjs')
const json=body=>({ok:true,json:async()=>body}),signal=()=>new AbortController().signal
const plain=value=>JSON.parse(JSON.stringify(value))
const place=(label,lat=13.8,lon=100.6,address='กรุงเทพมหานคร')=>({type:'longdo',label,query:label,description:'location',detail:address,place:{name:label,address,lat,lon,zoom:14}})

test('place, road and neighborhood suggestions are identical on the map and shared entry points',async()=>{
 const calls=[]
 const m=model(async url=>{calls.push(url);return json(url.startsWith('/api/location-autocomplete')?{suggestions:[place('ถนนลาดพร้าว'),place('เขตลาดพร้าว')]}:{})})
 const shared=await m.location.fetchLocationSearchSuggestions('ลาดพร้าว',signal())
 const map=await m.map.fetchMapSearchSuggestions('ลาดพร้าว','listings','unused',signal())
 assert.deepEqual(plain(map.map(row=>row.label)),plain(shared.map(row=>row.label)))
 assert.ok(shared.some(row=>row.label==='ถนนลาดพร้าว'))
 assert.ok(!shared.some(row=>row.stationId),'no additional local geography is injected')
 assert.equal(calls.length,2,'only Longdo and projects; the second entry point reuses the shared cache')
 assert.ok(!calls.some(url=>url.includes('search.longdo.com')),'REST lookup stays server-side')
})
test('station intent remains available for navigation but autocomplete does not inject local station rows',async()=>{
 const m=model()
 assert.equal(m.location.explicitTransitQuery('บางนา'),false)
 assert.equal(m.location.explicitTransitQuery('BTS บางนา'),true)
 assert.equal(m.location.explicitTransitQuery('N5'),true)
 const rows=m.location.mergeLocationSuggestions('บางนา',[],[place('บางนา')])
 assert.equal(rows[0].label,'บางนา');assert.ok(rows[0].place)
 assert.equal(m.location.mergeLocationSuggestions('BTS บางนา',[],[]).length,0)
})
test('homonymous places remain separate and known coordinates survive selection without losing filters',()=>{
 const {location}=model()
 const rows=location.mergeLocationSuggestions('วัดใหม่',[],[place('วัดใหม่',13.8,100.6,'กรุงเทพ'),place('วัดใหม่',18.8,98.9,'เชียงใหม่'),place('วัดใหม่',13.8,100.6,'กรุงเทพ')])
 assert.equal(rows.length,2)
 const url=new URL(location.locationSearchDestination('/properties/map?q=วัดใหม่&channel=business&category=business:warehouse&offer_type=rent&price_max=90000&station=old&project=old',rows[1]),'https://mapxprop.com')
 assert.equal(url.searchParams.get('lat'),'18.8');assert.equal(url.searchParams.get('lon'),'98.9')
 assert.equal(url.searchParams.get('search'),'location');assert.equal(url.searchParams.get('place'),'วัดใหม่')
 assert.equal(url.searchParams.get('price_max'),'90000');assert.equal(url.searchParams.get('offer_type'),'rent');assert.equal(url.searchParams.get('category'),'business:warehouse')
 assert.equal(url.searchParams.has('station'),false);assert.equal(url.searchParams.has('project'),false)
})
test('selecting a project keeps its identity and budget; the card catalogue remains a keyword search',()=>{
 const {location}=model(),project={public_project_id:'id',slug:'village',name_th:'หมู่บ้านตัวอย่าง',latitude:13.7,longitude:100.5}
 const url=new URL(location.locationSearchDestination('/properties/map?q=x&price_min=10000',{type:'project',label:'หมู่บ้านตัวอย่าง',project}),'https://mapxprop.com')
 assert.equal(url.searchParams.get('project'),'village');assert.equal(url.searchParams.get('map_mode'),'projects');assert.equal(url.searchParams.get('price_min'),'10000')
 assert.equal(url.searchParams.get('lat'),'13.7');assert.equal(url.searchParams.get('lon'),'100.5');assert.equal(url.searchParams.get('place'),'หมู่บ้านตัวอย่าง')
 const catalog='/real-estate-categories/all?q=SAM&offer_type=sale'
 assert.equal(location.locationSearchDestination(catalog,place('SAM')),catalog)
})

test('a local text-only copy of a registered project cannot hide its selectable project identity',()=>{
 const {location}=model(),project={public_project_id:'emsphere',slug:'emsphere',name_th:'เอ็มสเฟียร์',name_en:'Emsphere',display_name:'Emsphere'}
 const rows=location.mergeLocationSuggestions('Emsphere',[{type:'location',label:'Emsphere',query:'Emsphere',description:'project'}],[],[project])
 assert.equal(rows.length,1);assert.equal(rows[0].project.public_project_id,'emsphere')
})
test('administrative text fallback preserves province/district context and invalid coordinates are not used',()=>{
 const {location}=model()
 const url=new URL(location.locationSearchDestination('/properties/map?q=บางนา',{type:'location',label:'บางนา · มหาราช · พระนครศรีอยุธยา',place:{lat:0,lon:0}}),'https://mapxprop.com')
 assert.equal(url.searchParams.get('q'),'บางนา มหาราช พระนครศรีอยุธยา');assert.equal(url.searchParams.has('lat'),false)
})
test('a failed provider leaves registered projects available without restoring local geography; abort prevents stale results',async()=>{
 const m=model(async url=>{if(url.startsWith('/api/'))throw Error('provider unavailable');return json({projects:[{public_project_id:'sathorn',name_th:'โครงการสาทร'}]})})
 const rows=await m.location.fetchLocationSearchSuggestions('สาทร',signal())
 assert.equal(rows.length,1);assert.equal(rows[0].project.public_project_id,'sathorn')
 let release;const wait=new Promise(resolve=>release=resolve),controller=new AbortController()
 const stale=model(async()=>{await wait;return json({suggestions:[place('old')]})})
 const result=stale.location.fetchLocationSearchSuggestions('old',controller.signal);controller.abort();release()
 await assert.rejects(result,{name:'AbortError'})
})
test('Thai numerals and combining marks remain meaningful for ranking',()=>{
 const {location}=model()
 assert.equal(location.locationSearchKey('พระราม ๙'),location.locationSearchKey('พระราม 9'))
 assert.notEqual(location.locationSearchKey('ป่า'),location.locationSearchKey('ปา'))
})

test('local database address groups and listing titles never enter autocomplete',()=>{
 const {location}=model()
 const local=['บางนา','บางนาง','บางนายสี'].map(label=>({type:'location',label,query:label,description:'subdistrict'}))
 const rows=location.mergeLocationSuggestions('บางนา',local,[place('เขตบางนา กรุงเทพมหานคร')])
 assert.equal(rows[0].label,'เขตบางนา กรุงเทพมหานคร')
 assert.equal(rows.length,1)
 assert.equal(location.mergeLocationSuggestions('test',[{type:'listing',label:'test',query:'test'}],[]).length,0)
})

test('one and two characters do not request either service; English prefixes retain English project names',async()=>{
 const calls=[]
 const m=model(async url=>{calls.push(url);return json(url.startsWith('/apix/projects')?{projects:[{public_project_id:'thong',name_th:'โครงการทองหล่อ',name_en:'Thonglor Residences'}]}:{suggestions:[{type:'longdo',label:'Thonglor Residences',query:'Thonglor Residences'},{type:'longdo',label:'Thon Buri',query:'Thon Buri'}]})})
 for(const q of ['t','th','กข'])assert.equal((await m.location.fetchLocationSearchSuggestions(q,signal())).length,0)
 assert.equal(calls.length,0)
 const rows=await m.location.fetchLocationSearchSuggestions('thon',signal())
 assert.equal(calls.length,2);assert.equal(rows[0].label,'Thonglor Residences')
 assert.equal(rows.filter(x=>x.label==='Thonglor Residences').length,1)
 assert.ok(rows[0].project);assert.ok(calls[0].includes('locale=en'))
})
