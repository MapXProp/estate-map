'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'
import { absoluteUrl } from '@/lib/seo'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Check, Copy, Heart, Share2 } from 'lucide-react'
import { useRef, useState, useSyncExternalStore } from 'react'
import styles from './ListingDetailActions.module.css'

const subscribe = () => () => {}
const canShare = () => typeof navigator.share === 'function'

export default function ListingDetailActions({ identifier, title }: { identifier: string; title: string }) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const saved = useSavedListings()
  const isSaved = saved.isSaved(identifier)
  const hasNativeShare = useSyncExternalStore(subscribe, canShare, () => false)
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'manual' | 'share-error'>('idle')
  const [sharing, setSharing] = useState(false)
  const linkInput = useRef<HTMLInputElement>(null)
  const url = absoluteUrl(`/real-estate-listings/${encodeURIComponent(identifier)}`)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setFeedback('copied')
    } catch {
      setFeedback('manual')
      linkInput.current?.focus()
      linkInput.current?.select()
    }
  }

  const shareViaApp = async () => {
    setSharing(true)
    setFeedback('idle')
    try {
      await navigator.share({ title, url })
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError')) {
        setFeedback('share-error')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div
      className={styles.actions}
      data-listing-detail-actions
      role="group"
      aria-label={th ? 'บันทึกและแชร์ประกาศ' : 'Save and share listing'}
    >
      <button
        type="button"
        data-listing-save
        aria-pressed={isSaved}
        aria-label={
          isSaved ? (th ? 'นำประกาศออกจากที่บันทึกไว้' : 'Remove saved listing') : th ? 'บันทึกประกาศ' : 'Save listing'
        }
        disabled={!saved.isReady || saved.isBusy(identifier)}
        onClick={() => void saved.toggleSaved(identifier)}
        className={`${styles.button} ${styles.save}`}
      >
        <Heart aria-hidden="true" className={isSaved ? 'fill-current' : ''} />
        <span>{isSaved ? (th ? 'บันทึกแล้ว' : 'Saved') : th ? 'บันทึก' : 'Save'}</span>
      </button>
      <Popover className={styles.share}>
        <PopoverButton className={styles.button} data-listing-share onClick={() => setFeedback('idle')}>
          <Share2 aria-hidden="true" />
          <span>{th ? 'แชร์' : 'Share'}</span>
        </PopoverButton>
        <PopoverPanel
          anchor={{ to: 'bottom end', gap: 8, padding: 12 }}
          className={styles.sharePanel}
          data-listing-share-panel
        >
          <p className={styles.shareHeading}>{th ? 'แชร์ประกาศ' : 'Share listing'}</p>
          <p className={styles.shareTitle}>{title}</p>
          <input
            ref={linkInput}
            readOnly
            value={url}
            aria-label={th ? 'ลิงก์ประกาศ' : 'Listing link'}
            onFocus={(event) => event.currentTarget.select()}
            className={styles.link}
          />
          <button type="button" onClick={() => void copyLink()} className={styles.shareOption} data-listing-copy-link>
            {feedback === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {feedback === 'copied' ? (th ? 'คัดลอกลิงก์แล้ว' : 'Link copied') : th ? 'คัดลอกลิงก์' : 'Copy link'}
          </button>
          {hasNativeShare && (
            <button
              type="button"
              onClick={() => void shareViaApp()}
              disabled={sharing}
              className={styles.shareOption}
              data-listing-native-share
            >
              <Share2 aria-hidden="true" />
              {th ? 'แชร์ผ่านแอป…' : 'Share with an app…'}
            </button>
          )}
          <p
            role="status"
            className={feedback === 'manual' || feedback === 'share-error' ? styles.feedback : 'sr-only'}
          >
            {feedback === 'copied'
              ? th
                ? 'คัดลอกลิงก์ประกาศแล้ว'
                : 'Listing link copied'
              : feedback === 'manual'
                ? th
                  ? 'เลือกลิงก์ไว้ให้แล้ว ใช้คำสั่งคัดลอกของอุปกรณ์ได้เลย'
                  : 'Link selected. Press and hold or use your copy shortcut.'
                : feedback === 'share-error'
                  ? th
                    ? 'เปิดเมนูแชร์ไม่ได้ คัดลอกลิงก์แทนได้ครับ'
                    : 'Sharing is unavailable. You can copy the link instead.'
                  : ''}
          </p>
        </PopoverPanel>
      </Popover>
    </div>
  )
}
