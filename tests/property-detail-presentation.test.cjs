const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/propertyDetailPresentation.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
const { isPropertyPlan, propertyPreviewImages, propertyDescriptionSections } = context.exports
const image = (url, title = '', role_code = 'gallery') => ({ url, title, role_code, media_type: 'image', is_primary: false })
const plain = value => JSON.parse(JSON.stringify(value))

test('the preview shows the published cover, interior and another photo while keeping every source media item intact', () => {
  const media = [image('cover', 'ด้านหน้า', 'cover'), image('plan', 'ผังอาคารชั้นที่ 1'), image('road-map', 'แผนที่', 'map'), image('exterior', 'มุมกว้างหน้าอาคาร'), image('interior', 'โถงภายใน'), image('site-plan', '', 'site_plan')]
  const original = JSON.stringify(media)
  assert.deepEqual(plain(propertyPreviewImages(media)), ['cover', 'interior', 'exterior'])
  assert.equal(JSON.stringify(media), original)
  assert.equal(media.length, 6, 'plans and maps remain available to the full gallery')
})

test('one photo, duplicate URLs and media without photos do not create invented or repeated preview tiles', () => {
  assert.deepEqual(plain(propertyPreviewImages([image('only')])), ['only'])
  assert.deepEqual(plain(propertyPreviewImages([image('same'), image('same'), image('plan', '', 'floor_plan')])), ['same'])
  assert.deepEqual(plain(propertyPreviewImages([{...image('video'), media_type:'video'}, image('plan', 'Floor plan')])), [])
  assert.deepEqual(plain(propertyPreviewImages([])), [])
})

test('plan detection uses publisher roles or explicit captions, never filenames or a description of the neighborhood', () => {
  assert.equal(isPropertyPlan(image('photo', '', 'site_plan')), true)
  assert.equal(isPropertyPlan(image('photo', 'แบบแปลนอาคาร')), true)
  assert.equal(isPropertyPlan(image('photo', 'Floor plan — level 2')), true)
  assert.equal(isPropertyPlan(image('floor-plan.webp', 'บ้านในย่านผังเมืองสีแดง')), false)
})

test('description sections preserve every paragraph, important note and contact condition verbatim', () => {
  const paragraphs = ['รายละเอียดทรัพย์', 'อาคาร 3 ชั้น ต่อเติมเป็น 5 ชั้น', 'ข้อควรตรวจสอบสำคัญ: ตรวจทะเบียนอาคารกับผู้ขาย', 'ทำเลและการเดินทาง', 'ติดถนน\nใกล้สถานี', 'ราคาและการติดต่อ', 'ราคา 34,946,000 บาท ต้องยืนยันกับผู้ขาย']
  const groups = plain(propertyDescriptionSections(paragraphs.join('\n\n')))
  assert.deepEqual(groups.flatMap(g=>g.paragraphs), [paragraphs[1],paragraphs[2],paragraphs[4],paragraphs[6]])
  assert.equal(groups[1].heading, 'ข้อควรตรวจสอบสำคัญ')
  assert.equal(groups[3].heading, 'ราคาและการติดต่อ')
})

test('unstructured and English descriptions retain text and work without recognized headings', () => {
  assert.deepEqual(plain(propertyDescriptionSections('First paragraph\n\nSecond paragraph')), [{heading:'', paragraphs:['First paragraph','Second paragraph']}])
  assert.deepEqual(plain(propertyDescriptionSections('Property details\n\nA house\n\nProperty notes\n\nNeeds inspection')), [{heading:'Property details', paragraphs:['A house']},{heading:'Property notes', paragraphs:['Needs inspection']}])
  assert.deepEqual(plain(propertyDescriptionSections('  \n\n ')), [])
})
