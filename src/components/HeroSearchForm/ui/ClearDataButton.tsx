import { XMarkIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { FC } from 'react'

interface ClearDataButtonProps {
  onClick?: () => void
  className?: string
  ariaLabel?: string
  touchFriendly?: boolean
}

export const ClearDataButton: FC<ClearDataButtonProps> = ({
  onClick,
  className,
  ariaLabel = 'Clear selection',
  touchFriendly = false,
}) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={clsx(
        'invisible absolute top-1/2 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-transparent transition duration-100 group-data-open:visible hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[#176b50]/30 focus-visible:outline-none dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800',
        touchFriendly ? 'end-1.5 size-11 sm:end-2.5 sm:size-10' : 'end-2.5 size-6',
        className
      )}
    >
      <XMarkIcon className="size-4.5" />
    </button>
  )
}
