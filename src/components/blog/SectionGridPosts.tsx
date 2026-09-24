import { TBlogPost } from '@/data/data'
import { Heading } from '@/shared/Heading'
import { FC } from 'react'
import PostCard1 from './PostCard1'

//
interface SectionLatestPostsProps {
  className?: string
  posts: TBlogPost[]
  heading?: string
}

const SectionGridPosts: FC<SectionLatestPostsProps> = ({
  className = '',
  posts,
  heading = 'ความรู้อสังหา อ่านต่อได้ที่นี่',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Heading level={2}>{heading}</Heading>
      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard1 size="sm" key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

export default SectionGridPosts
