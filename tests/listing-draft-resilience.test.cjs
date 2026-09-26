const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm')
const { test } = require('node:test'), ts = require('typescript')
function load(file, imports = {}, globals = {}) {
  const context = { exports:{}, FormData, AbortController, setTimeout, clearTimeout, ...globals,
    require(id) { if (!(id in imports)) throw Error(id); return imports[id] } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText,context)
  return context.exports
}
const taxonomy = load('src/data/propertyTaxonomy.ts')
function setup(fetch, globals = {}) {
  const map = new Map(), storage = {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}
  let user = {public_user_id:'owner'}
  const draft = {listingTitle:'Original',updatedAt:new Date().toISOString(),submissionKey:'same-key'}
  const write = data => storage.setItem('mapxprop_listing_draft',JSON.stringify(data))
  write(draft)
  const api = load('src/lib/listingDraft.ts',{
    '@/data/propertyTaxonomy':taxonomy,'./listingImageWatermark':{},'./listingMediaFormats':{},
    './auth':{fetchWithAuthRetry:fetch,getAuthApiUrl:p=>'/apix/'+p,getStoredUser:()=>user},
  },{window:{},localStorage:storage,sessionStorage:storage,...globals})
  return {api,draft,write,read:()=>JSON.parse(storage.getItem('mapxprop_listing_draft')||'{}'),switchUser:()=>{user={public_user_id:'other'}}}
}
const response = () => ({ok:true,json:async()=>({updated_at:new Date().toISOString()})})
test('a slow cloud autosave cannot overwrite later edits, restore a cleared draft, or switch account ownership',async()=>{
  for(const action of ['edit','clear','switch']) {
    let release
    const h=setup(()=>new Promise(resolve=>{release=resolve}))
    const saving=h.api.saveListingDraftToCloud(h.draft)
    await new Promise(setImmediate)
    if(action==='edit') h.write({...h.draft,listingTitle:'Latest edit'})
    if(action==='clear') h.api.clearListingDraft()
    if(action==='switch') h.switchUser()
    const expected=h.read()
    release(response()); await saving
    assert.deepEqual(h.read(),expected,action)
  }
})
test('unchanged draft receives expiry metadata and saves newer queued changes',async()=>{
  let release, calls=0
  const h=setup(()=>{calls++;return calls===1?new Promise(resolve=>{release=resolve}):Promise.resolve(response())})
  const first=h.api.saveListingDraftToCloud(h.draft); await new Promise(setImmediate)
  const next={...h.draft,listingTitle:'Latest edit',updatedAt:new Date(Date.now()+1000).toISOString()}
  h.write(next); const second=h.api.saveListingDraftToCloud(next)
  release(response()); await first; await second
  assert.equal(calls,2); assert.equal(h.read().listingTitle,'Latest edit'); assert.equal(h.read().draftOwnerPublicUserId,'owner')
})
test('a stalled cloud request times out, preserves the draft and releases the queue for retry',async()=>{
  let first=true, signal
  const h=setup((_url,options)=>{signal=options.signal;if(first){first=false;return new Promise(()=>{})}return Promise.resolve(response())},
    {setTimeout:fn=>setTimeout(fn,5)})
  await assert.rejects(h.api.saveListingDraftToCloud(h.draft),/timed out/)
  assert.equal(signal.aborted,true); assert.equal(h.read().listingTitle,'Original')
  await h.api.saveListingDraftToCloud(h.draft)
  assert.equal(h.read().submissionKey,'same-key')
})
