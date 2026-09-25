const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const context = { exports: {}, Date, Event }
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/analyticsConsent.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  context
)
const consent = context.exports

test('consent parsing rejects malformed, stale, future and unsupported choices', () => {
  const now = Date.now()
  for (const raw of [
    null,
    'invalid',
    '{}',
    JSON.stringify({ version: 2, analytics: true, updatedAt: now }),
    JSON.stringify({ version: 1, analytics: 'true', updatedAt: now }),
    JSON.stringify({ version: 1, analytics: true, updatedAt: now + 1 }),
    JSON.stringify({ version: 1, analytics: true, updatedAt: now - consent.CONSENT_MAX_AGE }),
  ])
    assert.equal(consent.parseCookieChoice(raw, now), null)
  for (const analytics of [true, false])
    assert.equal(
      consent.parseCookieChoice(JSON.stringify({ version: 1, analytics, updatedAt: now }), now).analytics,
      analytics
    )
})
test('storage errors fail closed, but an explicit current-session choice still works', () => {
  const events = []
  const win = {
    localStorage: {
      getItem() {
        throw Error('blocked')
      },
      setItem() {
        throw Error('blocked')
      },
    },
    dispatchEvent: (event) => events.push(event.type),
  }
  assert.equal(consent.hasAnalyticsConsent(win), false)
  consent.saveCookieChoice(true, win)
  assert.equal(consent.hasAnalyticsConsent(win), true)
  consent.saveCookieChoice(false, win)
  assert.equal(consent.hasAnalyticsConsent(win), false)
  assert.deepEqual(events, [consent.COOKIE_CONSENT_EVENT, consent.COOKIE_CONSENT_EVENT])
})
test('choice persists with a version and expiry timestamp', () => {
  const values = new Map()
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) }
  consent.saveCookieChoice(true, { localStorage: storage, dispatchEvent() {} })
  assert.equal(consent.hasAnalyticsConsent({ localStorage: storage }), true)
  const record = JSON.parse(values.get(consent.COOKIE_CONSENT_KEY))
  assert.equal(record.version, 1)
  assert.equal(typeof record.updatedAt, 'number')
})
test('cookie cleanup targets analytics only, including parent domains', () => {
  const writes = []
  const doc = {
    get cookie() {
      return '_ga=one; _ga_TEST=two; _gid=three; mapxprop_access=keep; theme=keep'
    },
    set cookie(value) {
      writes.push(value)
    },
  }
  consent.clearAnalyticsCookies(doc, 'www.mapxprop.com')
  assert.ok(writes.some((value) => value.includes('domain=mapxprop.com')))
  assert.ok(writes.every((value) => value.startsWith('_ga') || value.startsWith('_gid')))
  assert.ok(writes.every((value) => value.includes('Max-Age=0')))
})
