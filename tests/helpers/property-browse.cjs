const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
function load(file, imports = {}, globals = {}) {
  const context = { exports: {}, URLSearchParams, AbortSignal, ...globals, require(id) {
    if (!(id in imports)) throw Error(`Unexpected import ${id}`)
    return imports[id]
  } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context)
  return context.exports
}
const taxonomy = load('src/data/propertyTaxonomy.ts')
const map = load('src/lib/propertyMapSearch.ts', { '@/data/propertyTaxonomy': taxonomy, './propertySearch': {} })
const catalog = load('src/lib/propertyCatalog.ts', { './seo': { absoluteUrl: path => `https://mapxprop.com${path}` } })
const browse = load('src/lib/propertyBrowse.ts', {
  '@/data/propertyTaxonomy': taxonomy, './propertyCatalog': catalog, './propertyMapSearch': map,
  './propertyPrices': load('src/lib/propertyPrices.ts'), './transitStations': require('./transit-stations.cjs'),
})
function server(fetch) { return load('src/lib/propertyBrowseServer.ts', {
  'server-only': {}, './auth': { getAuthApiUrl: route => `https://api.test/${route}` },
  './propertyBrowse': browse, './propertyCatalog': catalog, './propertyMapSearch': map,
}, { fetch }) }
const typeSelection = load('src/lib/browseTypeSelection.ts', { './propertyMapSearch': map })
module.exports = { ...browse, server, map, typeSelection }
