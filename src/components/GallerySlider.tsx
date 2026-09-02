'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { ButtonCircle } from '@/shared/Button'
import { variants } from '@/utils/animationVariants'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useSwipeable } from 'react-swipeable'

interface GallerySliderProps {
  className?: string
  galleryImgs: (
    | {
        src: string
        width: number
        height: number
      }
    | string
  )[]
  ratioClass?: string
  href?: string
  imageClass?: string
  galleryClass?: string
  navigation?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  autoPlayDelay?: number
  hoverAutoPlay?: boolean
  hoverAutoPlayInterval?: number
  hoverAutoPlayDelay?: number
  hoverAutoPlayLimit?: number
  instantImageChange?: boolean
  openInNewTab?: boolean
  emptyFallback?: ReactNode
}

export default function GallerySlider({
  className,
  galleryImgs,
  ratioClass = 'aspect-w-4 aspect-h-3',
  imageClass,
  galleryClass,
  href = '/stay-listings/the-handle',
  navigation = true,
  autoPlay = false,
  autoPlayInterval = 2500,
  autoPlayDelay = 0,
  hoverAutoPlay = false,
  hoverAutoPlayInterval = 1800,
  hoverAutoPlayDelay = 900,
  hoverAutoPlayLimit = 4,
  instantImageChange = false,
  openInNewTab = false,
  emptyFallback,
}: GallerySliderProps) {
  const { locale } = usePreferences()
  const sliderRef = useRef<HTMLDivElement>(null)
  const manualPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isManuallyPaused, setIsManuallyPaused] = useState(false)
  const [failedImage, setFailedImage] = useState('')
  const images = galleryImgs
  const hoverPreviewImageCount = Math.min(images.length, Math.max(1, hoverAutoPlayLimit))

  const pauseAfterInteraction = useCallback(() => {
    setIsManuallyPaused(true)
    if (manualPauseTimerRef.current) clearTimeout(manualPauseTimerRef.current)
    manualPauseTimerRef.current = setTimeout(() => setIsManuallyPaused(false), 6000)
  }, [])

  const showNextImage = useCallback(() => {
    if (images.length < 2) return
    setDirection(process.env.NEXT_PUBLIC_THEME_DIR === 'rtl' ? -1 : 1)
    setIndex((currentIndex) => (currentIndex + 1) % images.length)
  }, [images.length])

  function changePhotoId(newVal: number) {
    if (newVal > index) {
      setDirection(process.env.NEXT_PUBLIC_THEME_DIR === 'rtl' ? -1 : 1)
    } else {
      setDirection(process.env.NEXT_PUBLIC_THEME_DIR === 'rtl' ? 1 : -1)
    }
    setIndex(newVal)
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      pauseAfterInteraction()
      if (process.env.NEXT_PUBLIC_THEME_DIR === 'rtl') {
        if (index > 0) {
          changePhotoId(index - 1)
        }
      } else if (index < images?.length - 1) {
        changePhotoId(index + 1)
      }
    },
    onSwipedRight: () => {
      pauseAfterInteraction()
      if (process.env.NEXT_PUBLIC_THEME_DIR === 'rtl') {
        if (index < images?.length - 1) {
          changePhotoId(index + 1)
        }
      } else if (index > 0) {
        changePhotoId(index - 1)
      }
    },
    trackMouse: true,
  })
  const { ref: swipeRef, ...swipeHandlers } = handlers

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: '120px',
      threshold: 0.05,
    })
    observer.observe(slider)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)
    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    const updatePageVisibility = () => setIsPageVisible(document.visibilityState === 'visible')
    updatePageVisibility()
    document.addEventListener('visibilitychange', updatePageVisibility)
    return () => document.removeEventListener('visibilitychange', updatePageVisibility)
  }, [])

  useEffect(() => {
    if (
      !autoPlay ||
      images.length < 2 ||
      isHovered ||
      isFocused ||
      !isVisible ||
      !isPageVisible ||
      prefersReducedMotion ||
      isManuallyPaused
    ) {
      return
    }

    let intervalId: ReturnType<typeof setInterval> | undefined
    const startTimer = setTimeout(() => {
      showNextImage()
      intervalId = setInterval(showNextImage, autoPlayInterval)
    }, autoPlayInterval + autoPlayDelay)

    return () => {
      clearTimeout(startTimer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [
    autoPlay,
    autoPlayDelay,
    autoPlayInterval,
    images.length,
    isFocused,
    isHovered,
    isManuallyPaused,
    isPageVisible,
    isVisible,
    prefersReducedMotion,
    showNextImage,
  ])

  useEffect(() => {
    if (
      !hoverAutoPlay ||
      !isHovered ||
      hoverPreviewImageCount < 2 ||
      !isVisible ||
      !isPageVisible ||
      prefersReducedMotion ||
      isManuallyPaused
    ) {
      return
    }

    const showNextHoverImage = () => {
      setDirection(0)
      setIndex((currentIndex) => (currentIndex + 1) % hoverPreviewImageCount)
    }

    let intervalId: ReturnType<typeof setInterval> | undefined
    const startTimer = setTimeout(() => {
      showNextHoverImage()
      intervalId = setInterval(showNextHoverImage, hoverAutoPlayInterval)
    }, hoverAutoPlayDelay)

    return () => {
      clearTimeout(startTimer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [
    hoverAutoPlay,
    hoverAutoPlayDelay,
    hoverAutoPlayInterval,
    hoverPreviewImageCount,
    isHovered,
    isManuallyPaused,
    isPageVisible,
    isVisible,
    prefersReducedMotion,
  ])

  useEffect(
    () => () => {
      if (manualPauseTimerRef.current) clearTimeout(manualPauseTimerRef.current)
    },
    []
  )

  let currentImage = images[index]
  const currentImageKey = typeof currentImage === 'string' ? currentImage : currentImage?.src || ''
  const hasCurrentImage = Boolean(currentImageKey && failedImage !== currentImageKey)
  const currentImageContent = hasCurrentImage ? (
    <Image
      src={currentImage}
      fill
      alt="listing card gallery"
      className={clsx(`rounded-xl object-cover`, imageClass)}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setLoaded(false)
        setFailedImage(currentImageKey)
      }}
      sizes="(max-width: 1025px) 100vw, 25vw"
    />
  ) : (
    emptyFallback
  )

  return (
    <MotionConfig
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
    >
      <div
        ref={(element) => {
          sliderRef.current = element
          swipeRef(element)
        }}
        className={clsx(`group/cardGallerySlider group relative`, className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          if (hoverAutoPlay) {
            setDirection(0)
            setIndex(0)
          }
        }}
        onFocusCapture={() => setIsFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false)
        }}
        onPointerDown={pauseAfterInteraction}
        {...swipeHandlers}
      >
        {/* Main image */}
        <div className={clsx(`w-full overflow-hidden rounded-xl`, galleryClass)}>
          <Link
            href={href}
            target={openInNewTab ? '_blank' : undefined}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            className={clsx(`relative flex items-center justify-center`, ratioClass)}
          >
            {instantImageChange ? (
              <div key={currentImageKey || index} className="absolute inset-0">
                {currentImageContent}
              </div>
            ) : (
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={index}
                  custom={direction}
                  variants={variants(340, 1)}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  {currentImageContent}
                </motion.div>
              </AnimatePresence>
            )}
          </Link>
        </div>

        {/* Buttons + bottom nav bar */}
        <>
          {/* Buttons */}
          {hasCurrentImage && loaded && navigation && (
            <div className="opacity-0 transition-opacity group-hover/cardGallerySlider:opacity-100">
              {index > 0 && (
                <div className="absolute start-3 top-[calc(50%-1rem)]">
                  <ButtonCircle
                    color="white"
                    aria-label={locale === 'th' ? 'รูปก่อนหน้า' : 'Previous image'}
                    onClick={() => {
                      pauseAfterInteraction()
                      changePhotoId(index - 1)
                    }}
                    className={'size-8!'}
                  >
                    <ChevronLeftIcon className="size-4! rtl:rotate-180" />
                  </ButtonCircle>
                </div>
              )}
              {index + 1 < images.length && (
                <div className="absolute end-3 top-[calc(50%-1rem)]">
                  <ButtonCircle
                    color="white"
                    aria-label={locale === 'th' ? 'รูปถัดไป' : 'Next image'}
                    onClick={() => {
                      pauseAfterInteraction()
                      changePhotoId(index + 1)
                    }}
                    className={'size-8!'}
                  >
                    <ChevronRightIcon className="size-4! rtl:rotate-180" />
                  </ButtonCircle>
                </div>
              )}
            </div>
          )}

          {/* Bottom Nav bar */}
          {hasCurrentImage && images.length > 1 ? (
            <>
              <div className="absolute inset-x-0 bottom-0 h-10 rounded-b-xl bg-linear-to-t from-neutral-900 opacity-50"></div>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center justify-center gap-x-1.5">
                {images.map((_, i) => (
                  <button
                    type="button"
                    aria-label={`${locale === 'th' ? 'ดูรูปที่' : 'View image'} ${i + 1}`}
                    className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/60'}`}
                    onClick={() => {
                      pauseAfterInteraction()
                      changePhotoId(i)
                    }}
                    key={i}
                  />
                ))}
              </div>
            </>
          ) : null}
        </>
      </div>
    </MotionConfig>
  )
}
