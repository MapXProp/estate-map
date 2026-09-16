'use client'

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export type ListingMediaPreview = { token: string; url: string; pending?: boolean }

type Props = {
  kind: 'photo' | 'video' | 'panorama'
  items: ListingMediaPreview[]
  isThai: boolean
  disabled?: boolean
  publisherName?: string
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}

const controlClass =
  'flex min-h-11 min-w-11 items-center justify-center gap-1 text-neutral-600 transition hover:bg-neutral-100 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#176b50] disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800'

export default function ListingMediaGrid({ kind, items, isThai, disabled, publisherName, onMove, onRemove }: Props) {
  const [announcement, setAnnouncement] = useState('')
  if (!items.length) return null
  const noun =
    kind === 'photo'
      ? isThai
        ? 'รูป'
        : 'Photo'
      : kind === 'video'
        ? isThai
          ? 'วิดีโอ'
          : 'Video'
        : isThai
          ? 'ภาพ 360°'
          : '360° photo'
  const move = (from: number, to: number) => {
    onMove(from, to)
    setAnnouncement(
      isThai ? `${noun} ${from + 1} ย้ายเป็นลำดับ ${to + 1}` : `${noun} ${from + 1} moved to position ${to + 1}`
    )
  }

  return (
    <div className="mt-4" data-listing-media-grid={kind}>
      <p className="mb-3 font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
        {isThai ? 'กดลูกศรเพื่อเรียงลำดับ' : 'Use the arrows to reorder'}
        {kind === 'photo' && (isThai ? ' · รูปแรกเป็นหน้าปก' : ' · First photo is the cover')}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map(({ token, url, pending }, index) => (
          <div
            key={token}
            data-media-token={token}
            className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-950">
              {kind === 'video' ? (
                <video
                  src={url}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                  aria-label={`${noun} ${index + 1}`}
                />
              ) : (
                <>
                  <img src={url} alt={`${noun} ${index + 1}`} className="h-full w-full object-cover" />
                  <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-neutral-950/65 px-2 py-1 font-sarabun text-[10px] leading-4 text-white">
                    {kind === 'photo' && index === 0 ? (isThai ? 'หน้าปก · 1' : 'Cover · 1') : `${noun} ${index + 1}`}
                  </span>
                  {kind === 'photo' && pending && (
                    <>
                      <span className="pointer-events-none absolute top-[23.8%] left-[27.5%] flex w-[28%] -translate-x-1/2 flex-col items-center text-center text-[#f3f4f6] opacity-50">
                        <span className="w-full truncate font-sans text-[6px] leading-none">
                          {publisherName?.trim() || (isThai ? 'ชื่อผู้ลงประกาศ' : 'Publisher')}
                        </span>
                        <img src="/M5-dark-small.webp" alt="" className="mt-px w-[56.5%]" />
                      </span>
                      <span className="pointer-events-none absolute right-[6%] bottom-[6.6%] flex w-[22.3%] flex-col items-center text-center text-[#f3f4f6] opacity-[0.68]">
                        <img src="/M5-dark-small.webp" alt="" className="w-full" />
                        <span className="mt-0.5 font-sans text-[5px] leading-none">mapxprop.com</span>
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex min-h-11 items-stretch border-t border-neutral-100 dark:border-neutral-800">
              {kind === 'photo' ? (
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, 0)}
                  className={`${controlClass} min-w-0 flex-1 px-1 font-sarabun text-xs ${index === 0 ? 'text-[#176b50] disabled:opacity-100 dark:text-emerald-300' : ''}`}
                  aria-label={
                    isThai
                      ? index === 0
                        ? 'ภาพหน้าปก'
                        : `ตั้งรูป ${index + 1} เป็นหน้าปก`
                      : index === 0
                        ? 'Cover photo'
                        : `Make photo ${index + 1} the cover`
                  }
                >
                  {index === 0 ? <CheckIcon className="size-4 shrink-0" /> : <PhotoIcon className="size-4 shrink-0" />}
                  <span>{index === 0 ? (isThai ? 'หน้าปก' : 'Cover') : isThai ? 'ตั้งปก' : 'Set cover'}</span>
                </button>
              ) : (
                <span className="flex min-w-0 flex-1 items-center px-2 font-sarabun text-xs text-neutral-600 dark:text-neutral-300">
                  {noun} {index + 1}
                </span>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onRemove(index)
                  setAnnouncement(isThai ? `ลบ${noun} ${index + 1} แล้ว` : `${noun} ${index + 1} removed`)
                }}
                className={`${controlClass} w-11 shrink-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30`}
                aria-label={isThai ? `ลบ${noun} ${index + 1}` : `Remove ${noun.toLowerCase()} ${index + 1}`}
              >
                <TrashIcon className="size-[18px]" />
              </button>
            </div>
            <div className="grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => move(index, index - 1)}
                className={controlClass}
                aria-label={
                  isThai ? `เลื่อน${noun} ${index + 1} ไปก่อนหน้า` : `Move ${noun.toLowerCase()} ${index + 1} earlier`
                }
              >
                <ArrowLeftIcon className="size-[18px]" />
              </button>
              <button
                type="button"
                disabled={disabled || index === items.length - 1}
                onClick={() => move(index, index + 1)}
                className={controlClass}
                aria-label={
                  isThai ? `เลื่อน${noun} ${index + 1} ไปถัดไป` : `Move ${noun.toLowerCase()} ${index + 1} later`
                }
              >
                <ArrowRightIcon className="size-[18px]" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}
