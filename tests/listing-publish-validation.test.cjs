const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
function load(file, imports = {}) {
  const context = { exports: {}, require(id) { if (!(id in imports)) throw Error(id); return imports[id] } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context)
  return context.exports
}
const taxonomy = load('src/data/propertyTaxonomy.ts')
const { validateListingDraftForPublish: validate } = load('src/lib/listingPublishValidation.ts', { '@/data/propertyTaxonomy': taxonomy })
const valid = () => ({
  discovery_channel_code:'homes', property_type_code:'condo', property_group_code:'residential', listing_scope:'single_unit',
  'useCaseCodes[]':['residential'], 'offerTypes[]':['sale'], listingTitle:'คอนโดใกล้รถไฟฟ้า', listingDescription:'พร้อมเข้าอยู่',
  latMapPosition:'13.75', lngMapPosition:'100.5', state:'กรุงเทพมหานคร', salePrice:'2500000', currency:'THB',
  contactRoleCode:'owner', contactName:'ผู้ลงประกาศ', contactPhone:'0812345678', selectedPhotoCount:'1',
})
test('publishing requires a title, confirmed coordinates and a photo, with a useful return target', () => {
  assert.equal(validate(valid()), null)
  for (const [patch, code, step, field] of [
    [{listingTitle:'  '},'listing_title_required',1,'listingTitle'],
    [{listingTitle:'ก'.repeat(161)},'listing_title_too_long',1,'listingTitle'],
    [{latMapPosition:'',lngMapPosition:''},'location_required',2,undefined],
    [{latMapPosition:'NaN'},'location_required',2,undefined],
    [{selectedPhotoCount:'0'},'listing_photo_required',3,'listingPhotos'],
    [{selectedPhotoCount:'0','listingVideoUrls[]':['video.mp4'],'listingPanoramaUrls[]':['pano.jpg']},'listing_photo_required',3,'listingPhotos'],
    [{salePrice:''},'salePrice_required',3,'salePrice'],
    [{contactName:''},'contact_name_required',3,'contactName'],
    [{contactPhone:''},'contact_phone_required',3,'contactPhone'],
    [{contactEmail:'wrong@'},'contact_email_invalid',3,'contactEmail'],
  ]) {
    const result = validate({...valid(),...patch})
    assert.equal(result?.code,code); assert.equal(result.step,step); assert.equal(result.fieldName,field)
  }
})
test('saved photos remain valid when returning to edit, and optional details stay optional', () => {
  assert.equal(validate({...valid(),selectedPhotoCount:'0','listingPhotoUrls[]':['/saved.jpg']}),null)
  assert.equal(validate({...valid(),salePrice:'',priceOnRequest:'yes'}),null)
})
test('retail rent is validated before upload using the same positive-price rule as the API', () => {
  const retail = {...valid(),discovery_channel_code:'business',property_type_code:'retail_space',property_group_code:'commercial',
    listing_scope:'space_slot','useCaseCodes[]':['retail'],'offerTypes[]':['rent'],space_type_code:'standalone_shop',retailRentPrice:'0'}
  assert.equal(validate(retail)?.code,'retailRentPrice_invalid')
  assert.equal(validate({...retail,retailRentPrice:'1500'}),null)
})
