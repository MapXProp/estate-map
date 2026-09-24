const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')

function load(file, imports = {}) {
  const filename = path.join(__dirname, '..', file)
  const context = { exports: {}, process, require: (id) => {
    if (!(id in imports)) throw new Error(`Unexpected import: ${id}`)
    return imports[id]
  } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context, { filename })
  return context.exports
}
const content = load('src/data/blogPosts.ts')
const seo = load('src/lib/seo.ts')
const sitemap = load('src/lib/blogSitemap.ts', { './seo': seo })
const common = {
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  'next/image': { default: ({ src, alt }) => React.createElement('img', { src: src.src || src, alt }) },
}
const page = load('src/app/(app)/(other-pages)/blog/[handle]/page.tsx', {
  ...common,
  '@/data/blogPosts': content,
  '@/data/data': { getBlogPosts: async () => content.blogPosts, getBlogPostsByHandle: async (handle) => content.findBlogPost(handle) },
  '@/lib/seo': seo,
  'next/navigation': { notFound: () => { throw new Error('NOT_FOUND') } },
  '@/components/blog/PostCard1': { default: () => null },
  '@/components/blog/PostCardMeta': { default: () => null },
  '@/components/seo/JsonLd': { default: ({ data }) => React.createElement('script', { type: 'application/ld+json', dangerouslySetInnerHTML: { __html: JSON.stringify(data) } }) },
})

test('published articles have unique URLs, real local images and resolvable references', () => {
  const handles = content.blogPosts.map((post) => post.handle)
  assert.ok(handles.length >= 10)
  assert.equal(new Set(handles).size, handles.length)
  assert.equal(new Set(content.blogPosts.map((post) => post.featuredImage.src)).size, handles.length)
  for (const post of content.blogPosts) {
    assert.ok(post.featuredImage.src.startsWith('/images/blog/'))
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', post.featuredImage.src)))
    const ids = post.sections.map((section) => section.id)
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(post.sources.length)
    for (const section of post.sections) for (const id of section.sourceIds || []) assert.ok(post.sources.some((source) => source.id === id))
    for (const handle of post.relatedHandles) assert.ok(handle !== post.handle && content.findBlogPost(handle))
    assert.ok(Number.isFinite(Date.parse(post.datetime)))
    assert.ok(Date.parse(post.updatedAt) >= Date.parse(post.datetime), 'An update cannot precede publication')
  }
})

test('every article renders its own full body, accessible contents links and sources', async () => {
  for (const post of content.blogPosts) {
    const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ handle: post.handle }) }))
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    for (const section of post.sections) {
      assert.ok(html.includes(`href="#${section.id}"`))
      assert.ok(html.includes(`id="${section.id}"`))
    }
    assert.ok(html.includes('application/ld+json'))
    assert.ok(html.includes(post.intro))
    assert.doesNotMatch(html, /Lorem ipsum|Comments \(14\)|<form|blog-single|unsplash\.com/)
    const metadata = await page.generateMetadata({ params: Promise.resolve({ handle: post.handle }) })
    assert.equal(metadata.alternates.canonical, `/blog/${post.handle}`)
    assert.equal(metadata.robots.index, true)
    assert.equal(metadata.openGraph.publishedTime, post.datetime)
  }
})

test('blog sitemap follows new articles and later edits without changing publication dates', () => {
  const original = content.blogPosts[0]
  const newer = { ...content.blogPosts[1], handle: 'new-article', datetime: '2026-09-26', updatedAt: '2026-09-26' }
  const updated = { ...original, updatedAt: '2026-09-27' }
  const entries = sitemap.buildBlogSitemap([newer, updated])
  assert.equal(entries[0].url, seo.absoluteUrl('/blog'))
  assert.equal(entries[0].lastModified.toISOString(), '2026-09-27T00:00:00.000Z')
  assert.equal(entries[1].url, seo.absoluteUrl('/blog/new-article'))
  assert.equal(entries[1].lastModified.toISOString(), '2026-09-26T00:00:00.000Z')
  assert.deepEqual(Array.from(entries[2].images), [seo.absoluteUrl(original.featuredImage.src)])
  assert.equal(updated.datetime, original.datetime)
  assert.equal(sitemap.buildBlogSitemap([])[0].lastModified, undefined)
})

test('later publication uses the article date in both social metadata and structured data', async () => {
  const post = content.blogPosts[0]
  const previous = { datetime: post.datetime, updatedAt: post.updatedAt }
  try {
    post.datetime = '2026-09-26'
    post.updatedAt = '2026-09-27'
    const props = { params: Promise.resolve({ handle: post.handle }) }
    const metadata = await page.generateMetadata(props)
    const html = renderToStaticMarkup(await page.default(props))
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
    const article = schema.find((item) => item['@type'] === 'BlogPosting')
    assert.equal(metadata.openGraph.publishedTime, post.datetime)
    assert.equal(metadata.openGraph.modifiedTime, post.updatedAt)
    assert.equal(article.datePublished, post.datetime)
    assert.equal(article.dateModified, post.updatedAt)
    assert.equal(article.author.name, post.author.name)
    assert.equal(article.author.url, seo.absoluteUrl('/about'))
    assert.equal(article.publisher['@id'], seo.absoluteUrl('/#organization'))
  } finally {
    Object.assign(post, previous)
  }
})

test('public sitemap includes every article alongside the property sitemap', async () => {
  const route = load('src/app/sitemap.ts', {
    '@/data/blogPosts': content,
    '@/lib/blogSitemap': sitemap,
    '@/lib/propertySitemap': { buildPropertySitemap: () => [{ url: seo.absoluteUrl('/homes') }] },
    '@/lib/publicOrganizations': { getPublicOrganizations: async () => [] },
    '@/lib/publishedProperties': { getPublishedProperties: async () => [] },
  })
  const entries = await route.default()
  assert.equal(entries.length, content.blogPosts.length + 2)
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length)
  for (const post of content.blogPosts) {
    const entry = entries.find((item) => item.url === seo.absoluteUrl(`/blog/${post.handle}`))
    assert.equal(entry.lastModified.toISOString().slice(0, 10), post.updatedAt)
  }
})

test('retired demo and unknown article URLs return not-found instead of empty content', async () => {
  for (const handle of ['graduation-dresses-style-guide', 'not-a-real-article', '']) {
    const props = { params: Promise.resolve({ handle }) }
    await assert.rejects(page.default(props), /NOT_FOUND/)
    await assert.rejects(page.generateMetadata(props), /NOT_FOUND/)
  }
})

test('small featured-card title and image link to the same real article', () => {
  const Card = load('src/components/blog/PostCard2.tsx', {
    ...common, './PostCardMeta': { default: () => null },
  }).default
  const post = content.blogPosts[1]
  const html = renderToStaticMarkup(React.createElement(Card, { post }))
  assert.equal((html.match(new RegExp(`href="/blog/${post.handle}"`, 'g')) || []).length, 2)
  assert.doesNotMatch(html, /blog-single/)
})
