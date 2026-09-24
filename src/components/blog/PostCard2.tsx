import { TBlogPost } from '@/data/data'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'
import PostCardMeta from './PostCardMeta'

interface Props {
  className?: string
  post: TBlogPost
}

const PostCard2: FC<Props> = ({ className, post }) => {
  const { handle, title, excerpt: description, date, datetime, featuredImage: image, author } = post

  return (
    <div className={`relative flex justify-between gap-x-4 sm:gap-x-8 ${className || ''}`}>
      <div className="flex min-w-0 flex-1 flex-col py-2">
        <h2 className={`nc-card-title block text-base font-semibold`}>
          <Link href={'/blog/' + handle} className="line-clamp-3 leading-relaxed" title={title}>
            {title}
          </Link>
        </h2>
        <span className="my-3 hidden text-neutral-500 sm:block dark:text-neutral-400">
          <span className="line-clamp-2">{description}</span>
        </span>
        <time dateTime={datetime} className="mt-3 block text-xs text-neutral-500 sm:hidden dark:text-neutral-400">
          {date}
        </time>
        <div className="mt-auto hidden sm:block">
          <PostCardMeta author={author} date={date} datetime={datetime} />
        </div>
      </div>

      <Link href={'/blog/' + handle} aria-label={title} className="relative block min-h-32 w-1/3 shrink-0">
        {image?.src && (
          <Image alt={title} src={image} className="rounded-xl object-cover sm:rounded-3xl" sizes="400px" fill />
        )}
      </Link>
    </div>
  )
}

export default PostCard2
