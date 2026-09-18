const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const filename = path.join(__dirname, '../../src/lib/transitStations.ts')
const context = {
  exports: {},
  URLSearchParams,
  require: (id) => {
    const files = {
      '@/data/thailandTransitStations.json': '../../src/data/thailandTransitStations.json',
      '@/data/thailandTransitLines.json': '../../src/data/thailandTransitLines.json',
      '@/data/thailandTransitLineStations.json': '../../src/data/thailandTransitLineStations.json',
    }
    if (!(id in files)) throw Error(`Unexpected import ${id}`)
    return { default: require(files[id]) }
  },
}
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  context,
  { filename }
)
module.exports = context.exports
