const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm')
const { test } = require('node:test'), ts = require('typescript'), React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
function load(file, imports = {}) {
  const context = { exports: {}, URL, require: id => { assert.ok(id in imports, id); return imports[id] } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, context)
  return context.exports
}
const gesture = load('src/lib/contactSheetGesture.ts')
const snap = (delta, velocity = 0, startHeight = 460) => gesture.contactSheetSnap({ startHeight, compactHeight: 460, expandedHeight: 780, delta, velocity })
test('sheet settles between compact, expanded and the persistent price dock', () => {
  assert.equal(snap(-180), 'expanded')
  assert.equal(snap(-12), 'compact')
  assert.equal(snap(160), 'closed')
  assert.equal(snap(220, 0, 780), 'compact')
  assert.equal(snap(30, 0, 780), 'expanded')
  assert.equal(snap(450, 0, 780), 'closed')
})
test('deliberate short flicks work in both directions without dismissing a tiny movement', () => {
  assert.equal(snap(-35, -0.8), 'expanded')
  assert.equal(snap(35, 0.8), 'closed')
  assert.equal(snap(35, 0.8, 780), 'compact')
  assert.equal(snap(3, 1), 'compact')
})
const Div = ({ children }) => React.createElement('div', null, children)
const Sheet = load('src/app/(app)/(listings)/components/MobileListingContactSheet.tsx', {
  react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
  'lucide-react': require('lucide-react'),
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  '@headlessui/react': { Dialog: Div, DialogPanel: Div, DialogBackdrop: () => null, DialogTitle: Div },
  '@/lib/contactSheetGesture': gesture,
  '@/lib/propertyPreviewDetails': load('src/lib/propertyPreviewDetails.ts'),
  './ListingContactSheetContext': { ListingContactSheetContext: React.createContext(null) },
  './MobileListingContactSheet.module.css': { default: new Proxy({}, { get: (_, key) => key }) },
}).default
const render = (props = {}) => renderToStaticMarkup(React.createElement(Sheet, { contactName: 'ฝ่ายขาย SAM', roleLabel: 'ตัวแทนโครงการ', verificationStatus: 'identity_verified', phone: '02-686-1888', lineId: '@samline', email: 'sales@example.com', ...props }))
test('compact contact view keeps primary actions visible and secondary details out of the first view', () => {
  const html = render()
  assert.ok(html.includes('ฝ่ายขาย SAM') && html.includes('ยืนยันตัวตนแล้ว'))
  assert.ok(html.includes('tel:026861888') && html.includes('02-686-1888'))
  assert.ok(html.includes('https://line.me/R/ti/p/%40samline'))
  assert.ok(!html.includes('mailto:'))
  assert.ok(html.includes('ช่องทางและข้อมูลเพิ่มเติม'))
})
test('email-only contacts stay immediately reachable and missing channels have no fake actions', () => {
  const emailOnly = render({ phone: '', lineId: '' })
  assert.ok(emailOnly.includes('mailto:sales@example.com'))
  const empty = render({ phone: '', lineId: '', email: '' })
  assert.ok(empty.includes('ยังไม่มีช่องทางติดต่อเพิ่มเติม'))
  assert.ok(!empty.includes('href='))
})
test('trust in an organization never invents verified authority for the individual contact', () => {
  const html = render({ trusted: true, verificationStatus: 'identity_verified' })
  assert.ok(html.includes('ยืนยันตัวตนแล้ว'))
  assert.ok(!html.includes('ตรวจสอบตัวตนและสิทธิแล้ว'))
  assert.ok(render({ verificationStatus: 'authority_verified' }).includes('ตรวจสอบตัวตนและสิทธิแล้ว'))
})
test('English labels and supported LINE links remain intact', () => {
  for (const lineId of ['personal.line', '@official', 'https://lin.ee/example']) {
    const html = render({ isThai: false, lineId })
    assert.ok(html.includes('Contact advertiser') && html.includes('More contacts and details'))
    assert.ok(html.includes(lineId.startsWith('https:') ? lineId : `https://line.me/R/ti/p/${encodeURIComponent(lineId)}`))
  }
})
