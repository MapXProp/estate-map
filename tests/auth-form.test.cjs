const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')

const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/authForm.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context)
const { isStrongPassword, passwordRequirements, safeAuthRedirect } = context.exports

test('registration accepts complete passwords and rejects each missing requirement', () => {
  assert.equal(isStrongPassword('Safe123!'), true)
  for (const password of ['', 'Aa1!', 'safe123!', 'SAFE123!', 'Safepass!', 'Safe1234']) {
    assert.equal(isStrongPassword(password), false, password)
  }
})

test('spaces and non-Latin letters cannot substitute for the symbol required by the server', () => {
  assert.equal(isStrongPassword('Safe123 '), false)
  assert.equal(isStrongPassword('Safe123ก'), false)
  assert.equal(isStrongPassword('Safe123€'), true)
})

test('readable password guidance shows the missing requirement', () => {
  const state = passwordRequirements('Safe1234')
  assert.equal(state.length, true)
  assert.equal(state.letters, true)
  assert.equal(state.numberAndSymbol, false)
})

test('auth returns to internal listing paths without losing query or hash', () => {
  const redirect = '/add-listing/3?draft=123&channel=homes#photos'
  assert.equal(safeAuthRedirect(redirect), redirect)
})

test('auth rejects external, protocol-relative and backslash redirects', () => {
  for (const redirect of [undefined, '', 'https://example.com', '//example.com', '/\\example.com', '/\n/example.com']) {
    assert.equal(safeAuthRedirect(redirect), '/account')
    assert.equal(safeAuthRedirect(redirect, '/homes'), '/homes')
  }
})
