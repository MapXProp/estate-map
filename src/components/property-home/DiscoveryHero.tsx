'use client'

import { Pause, Play } from 'lucide-react'
import Image from 'next/image'
import { type CSSProperties, type ReactNode, useEffect, useState, useSyncExternalStore } from 'react'
import styles from './PropertyDiscovery.module.css'

export type DiscoveryPhoto = {
  src: string
  th: string
  en: string
  position?: string
  mobilePosition?: string
}

const INTERVAL = 6000
const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const readReducedMotion = () => window.matchMedia(reducedMotionQuery).matches
const readVisibility = () => !document.hidden
const serverReducedMotion = () => true
const serverVisibility = () => false

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(reducedMotionQuery)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener('visibilitychange', callback)
  return () => document.removeEventListener('visibilitychange', callback)
}

export default function DiscoveryHero({
  photos,
  isThai,
  children,
  mapLink,
}: {
  photos: readonly DiscoveryPhoto[]
  isThai: boolean
  children: ReactNode
  mapLink: ReactNode
}) {
  const [active, setActive] = useState(0)
  const [loaded, setLoaded] = useState<number[]>([])
  const [failed, setFailed] = useState<number[]>([])
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribeMotion, readReducedMotion, serverReducedMotion)
  const visible = useSyncExternalStore(subscribeVisibility, readVisibility, serverVisibility)
  const next = Array.from({ length: photos.length - 1 }, (_, offset) => (active + offset + 1) % photos.length).find(
    (index) => loaded.includes(index) && !failed.includes(index)
  )
  const playing = !paused && !reducedMotion && visible && !hovered && !focused && next !== undefined

  useEffect(() => {
    if (!playing || next === undefined) return
    const timer = window.setTimeout(() => setActive(next), INTERVAL)
    return () => window.clearTimeout(timer)
  }, [playing, active, next])

  const currentPhoto = photos[active]

  return (
    <div
      className={styles.hero}
      role="region"
      aria-roledescription={isThai ? 'ชุดภาพบรรยากาศ' : 'carousel'}
      aria-label={isThai ? 'สำรวจบรรยากาศของพื้นที่' : 'Explore the spaces'}
      data-discovery-carousel
      data-playing={playing}
      style={{ '--hero-interval': `${INTERVAL}ms` } as CSSProperties}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovered(true)
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      {photos.map((photo, index) => (
        <div
          key={photo.src}
          className={styles.heroSlide}
          data-active={index === active}
          data-failed={failed.includes(index)}
          aria-hidden="true"
          style={
            {
              '--slide-position': photo.position ?? 'var(--home-photo-position)',
              '--slide-mobile-position': photo.mobilePosition ?? 'var(--home-photo-mobile-position)',
            } as CSSProperties
          }
        >
          <Image
            src={photo.src}
            alt=""
            fill
            preload={index === 0}
            loading={index === 0 ? undefined : 'eager'}
            fetchPriority={index === 0 ? undefined : 'low'}
            sizes="(max-width: 1280px) 100vw, 1280px"
            className={styles.heroPhoto}
            onLoad={() => {
              setLoaded((previous) => (previous.includes(index) ? previous : [...previous, index]))
              if (failed.includes(active)) setActive(index)
            }}
            onError={() => {
              setFailed((previous) => (previous.includes(index) ? previous : [...previous, index]))
              if (index === active && next !== undefined) setActive(next)
            }}
          />
        </div>
      ))}
      <div className={styles.heroShade} />
      <div className={styles.heroCopy}>
        {children}
        <div className={styles.heroControls} role="group" aria-label={isThai ? 'เลือกภาพบรรยากาศ' : 'Choose a scene'}>
          {photos.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              className={styles.sceneButton}
              aria-label={isThai ? `ภาพ ${index + 1}: ${photo.th}` : `Scene ${index + 1}: ${photo.en}`}
              aria-pressed={index === active}
              disabled={!loaded.includes(index) || failed.includes(index)}
              onClick={() => {
                setPaused(true)
                setActive(index)
              }}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.sceneTrack} aria-hidden="true">
                <span className={styles.sceneProgress} />
              </span>
            </button>
          ))}
          {!reducedMotion && photos.length > 1 && (
            <button
              type="button"
              className={styles.playButton}
              aria-label={
                paused
                  ? isThai
                    ? 'เล่นภาพอัตโนมัติ'
                    : 'Play slideshow'
                  : isThai
                    ? 'หยุดภาพอัตโนมัติ'
                    : 'Pause slideshow'
              }
              onClick={() => setPaused((previous) => !previous)}
            >
              {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            </button>
          )}
        </div>
        <span className="sr-only" aria-live={paused || reducedMotion ? 'polite' : 'off'} aria-atomic="true">
          {isThai
            ? `ภาพ ${active + 1} จาก ${photos.length}: ${currentPhoto.th}`
            : `Scene ${active + 1} of ${photos.length}: ${currentPhoto.en}`}
        </span>
      </div>
      {mapLink}
    </div>
  )
}
