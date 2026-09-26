const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript')
module.exports = function model(fetch = async () => ({ ok: true, json: async () => ({}) })) {
  const modules = {}
  function load(name) {
    if (name === './auth') return { getAuthApiUrl: value => '/apix/' + value }
    if (name === './transitStations') return require('./transit-stations.cjs')
    if (modules[name]) return modules[name]
    const context = { exports: {}, URL, URLSearchParams, AbortController, AbortSignal, Date, fetch, require: load }
    const file = path.join(__dirname, '../../src/lib', name.replace('./', '') + '.ts')
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
    return modules[name] = context.exports
  }
  return { location: load('./locationSearch'), map: load('./propertyMapLocationSearch'), search: load('./propertySearch') }
}
