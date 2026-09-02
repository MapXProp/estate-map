'use client'

import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { FC, useState } from 'react'
import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'

interface BtnLikeIconProps {
  className?: string
  colorClass?: string
  sizeClass?: string
  isLiked?: boolean
  listingIdentifier?: string
}

const BtnLikeIcon: FC<BtnLikeIconProps> = ({
  className,
  colorClass = 'text-white bg-black/30 hover:bg-black/50',
  sizeClass = 'w-8 h-8',
  isLiked = false,
  listingIdentifier,
}) => {
  const [likedState, setLikedState] = useState(isLiked)
  const savedListings = useSavedListings()
  const usesSavedListings = Boolean(listingIdentifier)
  const liked = usesSavedListings ? savedListings.isSaved(listingIdentifier) : likedState
  const busy = usesSavedListings ? savedListings.isBusy(listingIdentifier) : false

  return (
    <button
      type="button"
      className={clsx(
        `flex cursor-pointer items-center justify-center rounded-full border-0 p-0 transition-colors disabled:cursor-wait disabled:opacity-70`,
        className,
        colorClass,
        sizeClass,
        liked && 'text-red-500'
      )}
      aria-pressed={liked}
      aria-label={liked ? 'นำออกจากที่บันทึกไว้' : 'บันทึกประกาศ'}
      disabled={busy}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (listingIdentifier) void savedListings.toggleSaved(listingIdentifier)
        else setLikedState((current) => !current)
      }}
    >
      {liked ? <HeartIconSolid className="size-5" /> : <HeartIcon className="size-5" />}
    </button>
  )
}

export default BtnLikeIcon
