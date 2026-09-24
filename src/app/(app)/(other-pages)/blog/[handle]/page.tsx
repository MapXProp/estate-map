import PostCard1 from '@/components/blog/PostCard1'
import PostCardMeta from '@/components/blog/PostCardMeta'
import JsonLd from '@/components/seo/JsonLd'
import { BLOG_PUBLISHED_AT } from '@/data/blogPosts'
import { getBlogPosts, getBlogPostsByHandle } from '@/data/data'
import { absoluteUrl, breadcrumbStructuredData, createPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ handle: string }> }

export async function generateStaticParams() {
  return (await getBlogPosts()).map(({ handle }) => ({ handle }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostsByHandle((await params).handle)
  if (!post) notFound()
  const metadata = createPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.handle}`,
    images: [post.featuredImage.src],
    type: 'article',
  })
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: BLOG_PUBLISHED_AT,
      modifiedTime: post.updatedAt,
      authors: [absoluteUrl('/about')],
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const post = await getBlogPostsByHandle((await params).handle)
  if (!post) notFound()
  const relatedPosts = (await getBlogPosts()).filter((item) => post.relatedHandles.includes(item.handle))

  return (
    <div className="container pt-6 pb-16 sm:pt-10 lg:pb-24">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            '@id': absoluteUrl(`/blog/${post.handle}#article`),
            headline: post.title,
            description: post.excerpt,
            mainEntityOfPage: absoluteUrl(`/blog/${post.handle}`),
            image: [absoluteUrl(post.featuredImage.src)],
            inLanguage: 'th-TH',
            datePublished: BLOG_PUBLISHED_AT,
            dateModified: post.updatedAt,
            author: { '@type': 'Organization', name: 'MapxProp', url: absoluteUrl('/about') },
            publisher: { '@type': 'Organization', name: 'MapxProp', url: absoluteUrl('/') },
            citation: post.sources.map((source) => source.url),
          },
          {
            '@context': 'https://schema.org',
            ...breadcrumbStructuredData([
              { name: 'หน้าแรก', path: '/' },
              { name: 'บทความ', path: '/blog' },
              { name: post.title, path: `/blog/${post.handle}` },
            ]),
          },
        ]}
      />
      <nav aria-label="เส้นทางบทความ" className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/blog" className="inline-flex min-h-11 items-center hover:text-emerald-700">
          ← บทความทั้งหมด
        </Link>
      </nav>

      <article>
        <header className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">{post.category.title}</p>
          <h1 className="text-2xl leading-relaxed font-semibold text-neutral-950 sm:text-4xl sm:leading-relaxed dark:text-neutral-50">
            {post.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-neutral-600 sm:text-lg sm:leading-8 dark:text-neutral-300">
            {post.excerpt}
          </p>
          <div className="my-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <PostCardMeta author={post.author} date={post.date} datetime={post.datetime} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{post.timeToRead}</span>
          </div>
        </header>

        <figure className="mx-auto my-8 max-w-5xl">
          <div className="relative aspect-16/9 overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src={post.featuredImage}
              alt={post.featuredImage.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            ภาพประกอบบทความ
          </figcaption>
        </figure>

        <div className="mx-auto max-w-3xl">
          <p className="text-base leading-8 text-neutral-700 sm:text-lg sm:leading-9 dark:text-neutral-200">
            {post.intro}
          </p>
          <aside className="my-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">ก่อนเริ่ม อ่านตรงนี้</p>
            <p className="leading-8 text-neutral-800 dark:text-neutral-200">{post.takeaway}</p>
          </aside>
          <nav aria-label="สารบัญบทความ" className="mb-10 border-y border-neutral-200 py-5 dark:border-neutral-700">
            <p className="mb-2 text-sm font-semibold">ในบทความนี้</p>
            <ul className="space-y-1 text-sm">
              {post.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-block py-2 text-neutral-600 underline-offset-4 hover:text-emerald-700 hover:underline dark:text-neutral-300"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-10 text-base leading-8 text-neutral-700 sm:text-lg sm:leading-9 dark:text-neutral-200">
            {post.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="mb-4 text-xl leading-relaxed font-semibold text-neutral-950 sm:text-2xl sm:leading-relaxed dark:text-neutral-50">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-4">
                    {paragraph}
                  </p>
                ))}
                {section.table && (
                  <div className="my-5 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <table className="w-full table-fixed text-left text-sm leading-7">
                      <caption className="sr-only">{section.title}</caption>
                      <thead className="bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                          {section.table.headings.map((heading) => (
                            <th
                              scope="col"
                              key={heading}
                              className="p-3 font-semibold text-neutral-900 sm:p-4 dark:text-neutral-100"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row[0]} className="border-t border-neutral-200 dark:border-neutral-700">
                            {row.map((cell, index) =>
                              index === 0 ? (
                                <th scope="row" key={cell} className="p-3 font-medium sm:p-4">
                                  {cell}
                                </th>
                              ) : (
                                <td key={cell} className="p-3 sm:p-4">
                                  {cell}
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.bullets && (
                  <ul className="my-4 list-disc space-y-3 pl-6 marker:text-emerald-600">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.sourceIds && (
                  <p className="mt-4 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                    อ้างอิง:{' '}
                    {section.sourceIds.map((id, index) => {
                      const source = post.sources.find((item) => item.id === id)!
                      return (
                        <span key={id}>
                          {index > 0 && ' · '}
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2"
                          >
                            {source.title}
                          </a>
                        </span>
                      )
                    })}
                  </p>
                )}
              </section>
            ))}
          </div>

          <footer className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-700">
            <h2 className="text-lg font-semibold">แหล่งข้อมูลและเอกสารอ่านต่อ</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7">
              {post.sources.map((source) => (
                <li key={source.id}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 underline underline-offset-4 dark:text-emerald-300"
                  >
                    {source.title} ↗
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-7 text-neutral-500 dark:text-neutral-400">
              เรียบเรียงและตรวจแหล่งข้อมูลวันที่ {post.date} บทความนี้เป็นความรู้ทั่วไป เงื่อนไขจริงขึ้นกับสัญญา
              ประเภททรัพย์ และกฎหมายที่ใช้กับพื้นที่
              ควรให้ผู้เชี่ยวชาญหรือหน่วยงานที่เกี่ยวข้องตรวจกรณีของคุณก่อนลงนามหรือก่อสร้าง
            </p>
          </footer>
        </div>
      </article>

      <section
        aria-labelledby="related-articles"
        className="mt-16 border-t border-neutral-200 pt-10 dark:border-neutral-700"
      >
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h2 id="related-articles" className="text-2xl font-semibold">
            อ่านต่อเรื่องที่เกี่ยวข้อง
          </h2>
          <Link href="/blog" className="py-3 text-sm text-emerald-700 dark:text-emerald-300">
            ดูบทความทั้งหมด →
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {relatedPosts.map((item) => (
            <PostCard1 key={item.id} post={item} size="sm" />
          ))}
        </div>
      </section>
    </div>
  )
}
