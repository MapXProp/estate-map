const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const context = { exports: {} }
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/mapPreviewPlacement.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  context
)
const place = context.exports.placeMapPreview
const bounds = { left: 12, top: 125, right: 1428, bottom: 888 }
const pin = (x, y) => ({ left: x - 60, right: x + 60, top: y - 42, bottom: y })

test('the preferred card sits above the selected price, with its arrow aimed at the pin', () => {
  const p = place(pin(780, 650), bounds, 420, 224)
  assert.equal(p.placement, 'above')
  assert.equal(p.top + 224 + 12, 608)
  assert.equal(p.left + p.arrow, 780)
})

test('near the search row the card flips below, and near either edge stays entirely on screen', () => {
  for (const x of [35, 780, 1400]) {
    const p = place(pin(x, 190), bounds, 420, 224)
    assert.equal(p.placement, 'below')
    assert.ok(p.top >= 202)
    assert.ok(p.left >= bounds.left && p.left + 420 <= bounds.right)
    assert.ok(p.arrow >= 22 && p.arrow <= 398)
  }
})

test('a short map uses space beside the pin without covering the pin or search', () => {
  const p = place(pin(400, 260), { ...bounds, bottom: 440 }, 420, 224)
  assert.equal(p.placement, 'beside')
  assert.ok(p.left >= 472)
  assert.ok(p.top >= bounds.top && p.top + 224 <= 440)
})

test('panning off screen hides the card; returning or resizing restores a valid location above the tablet sheet', () => {
  const tablet = { left: 12, top: 185, right: 808, bottom: 805 }
  assert.equal(place(pin(-100, 450), tablet, 420, 224), null)
  assert.equal(place(pin(400, 1000), tablet, 420, 224), null)
  const p = place(pin(405, 520), tablet, 420, 224)
  assert.ok(p.top >= tablet.top && p.top + 224 <= tablet.bottom)
  assert.ok(p.left >= tablet.left && p.left + 420 <= tablet.right)
  assert.equal(place(pin(405, 520), { ...tablet, bottom: 380 }, 420, 224), null)
})
