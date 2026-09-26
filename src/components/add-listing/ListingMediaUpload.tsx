'use client'

import {
  listingImageAccept,
  listingImageFormatsLabel,
  listingVideoAccept,
  listingVideoFormatsLabel,
} from '@/lib/listingMediaFormats'
import { CheckIcon, PhotoIcon, PlusIcon, VideoCameraIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline'
import type { ChangeEventHandler } from 'react'

type Props = {
  kind: 'photo' | 'video' | 'panorama'
  count: number
  limit: number
  isThai: boolean
  disabled?: boolean
  onChange: ChangeEventHandler<HTMLInputElement>
  error?: string
}

export default function ListingMediaUpload({ kind, count, limit, isThai, disabled, onChange, error }: Props) {
  const isFull = count >= limit
  const unavailable = isFull || disabled
  const config = {
    photo: {
      icon: PhotoIcon,
      name: 'listingPhotos',
      th: 'รูปภาพ',
      en: 'photos',
      size: 8,
      accept: listingImageAccept,
      formats: listingImageFormatsLabel,
    },
    video: {
      icon: VideoCameraIcon,
      name: 'listingVideos',
      th: 'วิดีโอ',
      en: 'videos',
      size: 50,
      accept: listingVideoAccept,
      formats: listingVideoFormatsLabel,
    },
    panorama: {
      icon: ViewfinderCircleIcon,
      name: 'listingPanoramas',
      th: 'ภาพ 360°',
      en: '360° photos',
      size: 15,
      accept: listingImageAccept,
      formats: listingImageFormatsLabel,
    },
  }[kind]
  const Icon = isFull ? CheckIcon : config.icon

  return (
    <div data-listing-field data-listing-label={isThai ? config.th : config.en}>
      <label
        data-listing-media-upload={kind}
        className={`relative flex min-h-20 items-center gap-3 rounded-2xl border border-dashed p-3 transition focus-within:ring-2 focus-within:ring-[#176b50]/40 sm:min-h-24 sm:p-4 ${unavailable ? 'cursor-default border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950' : 'cursor-pointer border-neutral-300 bg-neutral-50/60 hover:border-[#176b50] hover:bg-emerald-50/40 dark:border-neutral-600 dark:bg-neutral-950 dark:hover:border-emerald-600'}`}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#176b50] ring-1 ring-neutral-200/70 dark:bg-neutral-800 dark:text-emerald-300 dark:ring-neutral-700">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1 font-sarabun">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            <span>
              {isFull
                ? isThai
                  ? `เพิ่ม${config.th}ครบแล้ว`
                  : `${config.en} added`
                : isThai
                  ? `เพิ่ม${config.th}`
                  : `Add ${config.en}`}
            </span>
            <span className="text-xs font-normal text-neutral-500 tabular-nums dark:text-neutral-400">
              {count}/{limit}
            </span>
          </span>
          <span className="mt-1 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            {kind === 'photo' && (isThai ? 'อย่างน้อย 1 รูป · ' : 'At least 1 photo · ')}
            {config.formats} · {config.size} MB/{isThai ? 'ไฟล์' : 'file'}
          </span>
        </span>
        {!unavailable && <PlusIcon className="size-5 shrink-0 text-neutral-500" />}
        <input
          name={config.name}
          type="file"
          accept={config.accept}
          multiple
          disabled={unavailable}
          onChange={(event) => {
            const input = event.currentTarget
            const field = input.closest('[data-listing-field]')
            field?.removeAttribute('data-listing-invalid')
            const slot = field?.querySelector<HTMLElement>('[data-listing-validation-error]')
            if (slot) {
              slot.hidden = true
              slot.textContent = ''
              slot.removeAttribute('id')
            }
            input.removeAttribute('aria-invalid')
            if (input.dataset.listingPreviousDescribedby)
              input.setAttribute('aria-describedby', input.dataset.listingPreviousDescribedby)
            else input.removeAttribute('aria-describedby')
            delete input.dataset.listingPreviousDescribedby
            onChange(event)
          }}
          className="sr-only"
          aria-describedby={error ? `listing-${kind}-error` : undefined}
        />
      </label>
      <p
        hidden
        data-listing-validation-error
        role="alert"
        className="mt-2 font-sarabun text-xs leading-5 text-red-600 dark:text-red-400"
      />
      {error && (
        <p
          id={`listing-${kind}-error`}
          role="alert"
          className="mt-2 font-sarabun text-xs leading-5 text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  )
}
