const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, imports = {}) {
  const context = {
    exports: {},
    require: (id) => {
      if (!(id in imports)) throw Error(`Unexpected import: ${id}`)
      return imports[id]
    },
  }
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(__dirname, '../..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    context
  )
  return context.exports
}
const prices = load('src/lib/propertyPrices.ts')
const money = load('src/lib/currency.ts')
const preferences = (locale = 'th') => ({
  locale,
  formatCurrencyFrom: (amount, currency = 'THB', options = {}) =>
    money.formatMoney(amount, { currency, locale, ...options }),
})
const component = (provider = { usePreferences: () => preferences() }) =>
  load('src/components/PropertyPrices.tsx', {
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@/components/preferences/PreferencesProvider': provider,
    '@/lib/propertyPrices': prices,
  })
module.exports = { prices, component, preferences, load }
