const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { load } = require('./helpers/property-prices.cjs')
const { default: Description } = load('src/components/PropertyDescription.tsx', {
  'react/jsx-runtime': require('react/jsx-runtime'),
  '@/lib/propertyDetailPresentation': load('src/lib/propertyDetailPresentation.ts'),
})
const render = (text, props = {}) => renderToStaticMarkup(React.createElement(Description, { text, sectioned: true, ...props }))
const assertFullyVisible = html => {
  assert.ok(!/<details\b|<summary\b|<button\b|aria-expanded|data-description-excerpt|line-clamp|max-height|overflow-hidden/.test(html), 'descriptions have no folding or clipping controls')
}

test('all information sections are plain headings with every paragraph visible exactly once', () => {
  const paragraphs = [
    'รายละเอียดทรัพย์', 'บ้านพร้อมอยู่', 'มีสวนหลังบ้าน',
    'ข้อควรทราบเกี่ยวกับทรัพย์', 'ตรวจสอบสภาพบ้านก่อนซื้อ',
    'ข้อควรตรวจสอบสำคัญ: ยืนยันแนวเขตกับผู้ขาย',
    'ราคาและการติดต่อ', 'ราคานี้ไม่รวมค่าธรรมเนียม',
    'ทำเลและการเดินทาง', 'ใกล้สถานีรถไฟฟ้า',
    'รายละเอียดเพิ่มเติม', 'ส่วนต่อเติมด้านหลัง',
  ]
  const html = render(paragraphs.join('\n\n'))
  assertFullyVisible(html)
  assert.equal((html.match(/<h3\b/g) || []).length, 5)
  for (const index of [1, 2, 4, 5, 7, 9, 11]) {
    assert.equal(html.split(paragraphs[index]).length - 1, 1, 'every paragraph is preserved exactly once')
  }
})

test('long descriptions retain their final paragraph without requiring an interaction', () => {
  const paragraphs = ['ข้อมูลยาว '.repeat(100), ...Array.from({ length: 12 }, (_, i) => `รายละเอียดส่วนที่ ${i + 1}`), 'รายละเอียดท้ายสุด']
  for (const sectioned of [true, false]) {
    const html = render(paragraphs.join('\n\n'), { sectioned })
    assertFullyVisible(html)
    assert.equal((html.match(/<p\b/g) || []).length, paragraphs.length)
    for (const text of paragraphs) assert.ok(html.includes(text.trim()))
  }
})

test('Thai and English headings keep their structure, including a leading important note', () => {
  for (const heading of ['รายละเอียดที่ดิน', 'รายละเอียดเพิ่มเติม', 'Property details', 'Land details', 'More details']) {
    const html = render(`${heading}\n\nDescription body\n\nProperty notes\n\nInspect before purchase`)
    assertFullyVisible(html)
    assert.match(html, /<h3\b[^>]*>Property notes<\/h3>/)
    assert.ok(html.includes('Description body') && html.includes('Inspect before purchase'))
  }
  const note = render('ข้อควรตรวจสอบสำคัญ: ตรวจสอบเอกสารก่อนซื้อ')
  assertFullyVisible(note)
  assert.match(note, /<h3\b[^>]*>ข้อควรตรวจสอบสำคัญ<\/h3>/)
  assert.ok(note.includes('ตรวจสอบเอกสารก่อนซื้อ'))
})

test('empty and short descriptions never create empty controls or extra content', () => {
  for (const text of ['', 'ข้อความสั้น']) {
    const html = render(text)
    assertFullyVisible(html)
    assert.equal((html.match(/<p\b/g) || []).length, text ? 1 : 0)
  }
})
