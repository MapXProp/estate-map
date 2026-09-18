const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const filename = path.join(__dirname, '../../src/lib/transitStations.ts')
const context = {
  exports: {},
  URLSearchParams,
  require: (id) => {
    if (id !== '@/data/thailandTransitStations.json') throw Error(`Unexpected import ${id}`)
    return { default: require('../../src/data/thailandTransitStations.json') }
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
