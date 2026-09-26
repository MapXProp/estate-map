const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
function load(file, imports = {}, globals = {}) {
  const context = { exports: {}, File, Blob, FormData, URL, AbortController, setTimeout, clearTimeout, ...globals, require(id) { if (!(id in imports)) throw Error(id); return imports[id] } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context)
  return context.exports
}
const formats = load('src/lib/listingMediaFormats.ts')
const taxonomy = load('src/data/propertyTaxonomy.ts')
test('format rules normalize common aliases and empty MIME values without accepting arbitrary extensions', () => {
  for (const [name, type, kind, expected] of [
    ['photo.JFIF','','image','image/jpeg'], ['photo.AVIF','application/octet-stream','image','image/avif'],
    ['photo.bmp','image/x-ms-bmp','360','image/bmp'], ['tour.m4v','video/x-m4v','video','video/mp4'],
    ['tour.MOV','','video','video/quicktime'], ['tour.mp4','VIDEO/MP4','video','video/mp4'],
    ['fake.mp4','application/pdf','video',''], ['a.svg','image/svg+xml','image',''], ['a.heic','image/heic','image',''],
    ['constructor','','image',''], ['a.constructor','','video',''], ['jpg','','image',''],
  ]) assert.equal(formats.listingMediaMimeType({ name, type, size: 1 }, kind), expected)
  for (const kind of ['image','video','360']) {
    const type = kind === 'video' ? 'video/mp4' : 'image/jpeg'
    const max = formats.listingMediaMaxBytes(kind)
    assert.equal(formats.listingMediaFileIssue({ name: 'a', type, size: max }, kind), null)
    assert.equal(formats.listingMediaFileIssue({ name: 'a', type, size: max + 1 }, kind), 'file_too_large')
    assert.equal(formats.listingMediaFileIssue({ name: 'a', type, size: 0 }, kind), 'file_too_large')
  }
  assert.ok(formats.listingImageAccept.includes('.avif') && formats.listingImageAccept.includes('.bmp') && formats.listingImageAccept.includes('.gif'))
  assert.ok(formats.listingVideoAccept.includes('.m4v'))
})

test('uploader sends normalized video MIME types and prepared images/panoramas to storage', async () => {
  const sent = [], prepared = []
  const api = load('src/lib/listingDraft.ts', {
    '@/data/propertyTaxonomy': taxonomy, './listingMediaFormats': formats,
    './auth': { getAuthApiUrl: () => '/listing-media', fetchWithAuthRetry: async (_url, options) => { sent.push(options.body); return { ok: true, json: async () => ({ url: '/saved' }) } } },
    './listingImageWatermark': {
      applyListingImageWatermark: async (file, label) => { prepared.push(['image', file.type, label]); return new File(['raster'], 'converted.webp', { type: 'image/webp' }) },
      prepareListingPanorama: async file => { prepared.push(['360', file.type]); return new File(['raster'], 'panorama.webp', { type: 'image/webp' }) },
    },
  })
  for (const [name, mime] of [['a.avif','image/avif'],['a.gif','image/gif'],['a.bmp','image/bmp']]) {
    await api.uploadListingMedia([new File(['source'], name, { type: mime })], 'image', { watermarkLabel: 'Owner' })
    assert.equal(sent.at(-1).get('file').type, 'image/webp')
    assert.deepEqual(prepared.at(-1), ['image',mime,'Owner'])
  }
  await api.uploadListingMedia([new File(['source'], 'panorama.AVIF')], '360')
  assert.equal(sent.at(-1).get('media_type'), '360')
  assert.deepEqual(prepared.at(-1), ['360','image/avif'])
  for (const [name, type, normalized] of [['a.M4V','video/x-m4v','video/mp4'],['a.MOV','','video/quicktime']]) {
    await api.uploadListingMedia([new File(['source'], name, { type })], 'video')
    assert.equal(sent.at(-1).get('file').type, normalized)
    assert.equal(await sent.at(-1).get('file').text(), 'source')
  }
  const before = sent.length
  await assert.rejects(api.uploadListingMedia([new File(['bad'], 'document.pdf', { type: 'application/pdf' })], 'image'), error => error.code === 'unsupported_format')
  assert.equal(sent.length, before)
})

test('new panorama raster formats are converted without watermarks or aspect-ratio changes; ordinary panoramas pass through', async () => {
  let released = 0
  const encodings = [], drawings = []
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: (...args) => drawings.push(args) }), toBlob: (callback, type) => { encodings.push(type); callback(new Blob(['encoded'], { type })) } }
  const lib = load('src/lib/listingImageWatermark.ts', {}, {
    createImageBitmap: async () => ({ width: 4096, height: 2048, close() { released++ } }),
    document: { createElement: () => canvas },
  })
  for (const type of ['image/jpeg','image/png','image/webp']) {
    const original = new File(['source'], 'a', { type })
    assert.equal(await lib.prepareListingPanorama(original), original)
  }
  for (const type of ['image/avif','image/gif','image/bmp']) {
    const result = await lib.prepareListingPanorama(new File(['source'], 'panorama.avif', { type, lastModified: 7 }))
    assert.equal(result.type, 'image/webp')
    assert.equal(result.name, 'panorama.webp')
    assert.equal(result.lastModified, 7)
    assert.equal(canvas.width, 4096)
    assert.equal(canvas.height, 2048)
  }
  assert.equal(released, 3)
  assert.equal(drawings.length, 3)
  assert.deepEqual(encodings, ['image/webp','image/webp','image/webp'])
})

test('failed image decoding releases the temporary URL and never uploads undecoded content', async () => {
  const revoked = []
  const lib = load('src/lib/listingImageWatermark.ts', {}, {
    Image: class { async decode() { throw Error('Invalid image') } },
    URL: { createObjectURL: () => 'blob:fixture', revokeObjectURL: url => revoked.push(url) },
  })
  await assert.rejects(lib.prepareListingPanorama(new File(['invalid'], 'a.avif', { type: 'image/avif' })), /Invalid image/)
  assert.deepEqual(revoked, ['blob:fixture'])
})
