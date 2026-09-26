'use client'

import Image from 'next/image'
import { useState, type ReactNode } from 'react'

export default function AccountAvatar({
  src,
  name,
  className = '',
  fallback,
}: {
  src?: string
  name?: string
  className?: string
  fallback?: ReactNode
}) {
  const [failed, setFailed] = useState('')
  const valid = src && /^\/apix\/listing-media\/files\/\d+\/avatar-[a-z0-9]+\.jpg$/.test(src) && failed !== src
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}
      aria-hidden="true"
    >
      {valid ? (
        <Image
          src={src}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="size-full object-cover"
          onError={() => setFailed(src)}
        />
      ) : (
        fallback || Array.from(name || 'M')[0]
      )}
    </span>
  )
}
