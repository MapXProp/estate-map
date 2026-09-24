import { TBlogPost } from '@/data/data'
import Link from 'next/link'
import { FC } from 'react'

interface PostCardMetaProps {
  className?: string
  hiddenAvatar?: boolean
  author: TBlogPost['author']
  date: string
  datetime: string
}

const PostCardMeta: FC<PostCardMetaProps> = ({
  className = 'leading-none',
  hiddenAvatar = false,
  author,
  date,
  datetime,
}) => {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-y-2 text-xs text-neutral-800 sm:text-sm dark:text-neutral-200 ${className}`}
    >
      <Link href="/about" className="relative flex shrink-0 items-center space-x-2">
        {!hiddenAvatar && (
          <span
            aria-hidden="true"
            className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-50 font-serif font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          >
            M
          </span>
        )}
        <span className="block font-medium text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white">
          {author?.name}
        </span>
      </Link>
      <>
        <span className="mx-[6px] font-medium text-neutral-500 dark:text-neutral-400">·</span>
        <time dateTime={datetime} className="font-normal text-neutral-500 dark:text-neutral-400">
          {date}
        </time>
      </>
    </div>
  )
}

export default PostCardMeta
