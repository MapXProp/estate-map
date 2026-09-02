import clsx from 'clsx'
import { ImageOff } from 'lucide-react'

const ListingImageFallback = ({ className }: { className?: string }) => (
  <div
    role="img"
    aria-label="No property image"
    className={clsx(
      'flex h-full w-full items-center justify-center bg-[#f2f3f4] text-[#9ca3ad] dark:bg-neutral-800 dark:text-neutral-500',
      className
    )}
  >
    <ImageOff className="size-7 opacity-55" strokeWidth={1.35} aria-hidden="true" />
  </div>
)

export default ListingImageFallback
