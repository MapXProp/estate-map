const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/propertyMapPriceInput.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context)
const { cleanMapPriceInput, formatMapPriceInput, appendMapPriceSuffix, mapPriceSuffixes } = context.exports

test('prices retain raw baht values while formatted/pasted amounts stay readable', () => {
  assert.equal(cleanMapPriceInput('60,000 บาท'), '60000')
  assert.equal(formatMapPriceInput('60000'), '60,000')
  assert.equal(formatMapPriceInput(''), '')
  assert.equal(formatMapPriceInput('0'), '0')
  assert.equal(cleanMapPriceInput('123456789012345'), '123456789012')
})

test('the four shortcuts append digits instead of replacing or adding to an amount', () => {
  assert.deepEqual(Array.from(mapPriceSuffixes), ['00', '000', '50', '500'])
  assert.equal(appendMapPriceSuffix('20', '00'), '2000')
  assert.equal(appendMapPriceSuffix('60', '000'), '60000')
  assert.equal(appendMapPriceSuffix('20', '50'), '2050')
  assert.equal(appendMapPriceSuffix('20', '500'), '20500')
  assert.equal(appendMapPriceSuffix('', '50'), '50')
  assert.equal(appendMapPriceSuffix('', '500'), '500')
})

test('shortcuts never fill only zeros or truncate an amount past the 12-digit limit', () => {
  for (const suffix of ['00', '000'])
    for (const value of ['', '0', '000']) assert.equal(appendMapPriceSuffix(value, suffix), value)
  for (const suffix of mapPriceSuffixes) {
    const boundary = '9'.repeat(12 - suffix.length)
    assert.equal(appendMapPriceSuffix(boundary, suffix), `${boundary}${suffix}`)
    const tooLong = `${boundary}9`
    assert.equal(appendMapPriceSuffix(tooLong, suffix), tooLong)
    assert.equal(appendMapPriceSuffix('20,000', suffix), '20,000')
  }
})
