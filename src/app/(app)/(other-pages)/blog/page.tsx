import BgGlassmorphism from '@/components/BgGlassmorphism'
import SectionGridPosts from '@/components/blog/SectionGridPosts'
import SectionMagazine5 from '@/components/blog/SectionMagazine5'
import JsonLd from '@/components/seo/JsonLd'
import { getBlogPosts } from '@/data/data'
import { collectionPageStructuredData, createPageMetadata } from '@/lib/seo'
import { Metadata } from 'next'
import React from 'react'

const pageInfo = {
  title: 'บทความความรู้อสังหา สัญญาเช่า ซื้อบ้าน ระยะร่น และผังเมือง',
  description:
    'อ่านความรู้อสังหากับ MapxProp ตั้งแต่การทำสัญญาเช่าห้องและซื้อบ้าน ไปจนถึงระยะร่นอาคารและสีผังเมือง พร้อมรายการตรวจสอบและแหล่งข้อมูลทางการ',
  path: '/blog',
}
export const metadata: Metadata = createPageMetadata(pageInfo)

const BlogPage: React.FC = async () => {
  const blogPosts = await getBlogPosts()

  return (
    <div>
      <JsonLd
        data={collectionPageStructuredData(
          pageInfo,
          blogPosts.map((post) => ({ name: post.title, path: `/blog/${post.handle}` })),
          [
            { name: 'หน้าแรก', path: '/' },
            { name: 'บทความ', path: '/blog' },
          ]
        )}
      />
      <BgGlassmorphism />
      <div className="relative container">
        <header className="pt-8 sm:pt-12">
          <h1 className="text-2xl font-semibold text-neutral-950 sm:text-3xl dark:text-neutral-50">
            เรื่องอสังหา เข้าใจได้ง่ายขึ้น
          </h1>
          <p className="mt-3 text-sm leading-7 text-neutral-500 sm:text-base dark:text-neutral-400">
            อ่านก่อนซื้อ เช่า และเลือกที่ดิน ให้ตัดสินใจได้มั่นใจขึ้น
          </p>
        </header>
        <div className="pt-8 pb-12 sm:pt-12 lg:pb-16">
          <SectionMagazine5 posts={blogPosts} />
        </div>
        <SectionGridPosts posts={blogPosts} className="border-t border-neutral-200 py-12 lg:py-16 dark:border-neutral-700" />
      </div>
    </div>
  )
}

export default BlogPage
