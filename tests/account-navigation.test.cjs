const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')

function renderNavigation(pathname, role = 'member', locale = 'th') {
  const imports = {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@headlessui/react': require('@headlessui/react'),
    'lucide-react': require('lucide-react'),
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { usePathname: () => pathname },
    '@/components/account/AccountDashboard.module.css': { default: {} },
    '@/components/account/AccountAvatar': { default: ({ name }) => React.createElement('span', null, name?.[0]) },
    '@/components/preferences/PreferencesProvider': { usePreferences: () => ({ locale }) },
    '@/hooks/useAuth': { useAuth: () => ({ user: role ? { name: 'Member', role_code: role } : null }) },
  }
  const context = {
    exports: {},
    require: (id) => {
      if (!(id in imports)) throw new Error('Unexpected import: ' + id)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/app/(account)/PageNavigation.tsx'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context
  )
  return renderToStaticMarkup(React.createElement(context.exports.PageNavigation))
}

test('the same account navigation is available on all four main pages with exactly one active destination', () => {
  const routes = ['/account', '/account-listings', '/account-savelists', '/account-billing']
  for (const route of routes) {
    const html = renderNavigation(route)
    for (const href of [...routes, '/account-organizations', '/account-password'])
      assert.ok(html.includes(`href="${href}"`))
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1)
    assert.ok(html.includes('data-account-menu-trigger'))
    assert.ok(html.includes('aria-haspopup="dialog"'))
    assert.ok(html.includes('aria-expanded="false"'))
  }
})
test('administration links are only presented to super administrators', () => {
  for (const role of ['member', 'admin', 'moderator', 'support', 'super_admin']) {
    const html = renderNavigation('/account-listings', role)
    assert.equal(html.includes('href="/account-admin"'), role === 'super_admin')
    assert.equal(html.includes('href="/account-approvals"'), role === 'super_admin')
  }
})
test('guest pages keep their public discovery flow and navigation supports English', () => {
  assert.equal(renderNavigation('/account', null), '')
  assert.equal(renderNavigation('/account-savelists', null), '')
  const html = renderNavigation('/account-billing', 'member', 'en')
  assert.ok(html.includes('Plan &amp; billing'))
  assert.ok(html.includes('My listings'))
})
