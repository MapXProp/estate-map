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
const { cleanMapPriceInput, formatMapPriceInput, appendMapPriceZeros, getMapPricePresets, formatMapPricePreset } = context.exports

test('prices retain raw baht values while formatted/pasted amounts stay readable', () => {
  assert.equal(cleanMapPriceInput('60,000 บาท'), '60000')
  assert.equal(formatMapPriceInput('60000'), '60,000')
  assert.equal(formatMapPriceInput(''), '')
  assert.equal(formatMapPriceInput('0'), '0')
  assert.equal(cleanMapPriceInput('123456789012345'), '123456789012')
})

test('adding zeros is explicit and never invents or truncates a price', () => {
  assert.equal(appendMapPriceZeros('20'), '20000')
  assert.equal(appendMapPriceZeros('60'), '60000')
  assert.equal(appendMapPriceZeros('20000'), '20000000')
  assert.equal(appendMapPriceZeros('999999999'), '999999999000')
  for (const value of ['', '0', '000', '9999999999', '999999999999'])
    assert.equal(appendMapPriceZeros(value), value)
})

test('rent, purchase and mixed searches get explicit presets without changing their currency or billing period', () => {
  assert.deepEqual(Array.from(getMapPricePresets(['rent'])), [10000, 20000, 30000, 60000])
  assert.deepEqual(Array.from(getMapPricePresets(['rent', 'sublease'])), [10000, 20000, 30000, 60000])
  assert.deepEqual(Array.from(getMapPricePresets(['sale'])), [1000000, 3000000, 5000000, 10000000])
  for (const offers of [[], ['sale', 'rent']])
    assert.deepEqual(Array.from(getMapPricePresets(offers)), [20000, 60000, 1000000, 3000000])
  assert.equal(formatMapPricePreset(20000, true), '20,000')
  assert.equal(formatMapPricePreset(1000000, true), '1 ล้าน')
  assert.equal(formatMapPricePreset(1000000, false), '1M')
})
