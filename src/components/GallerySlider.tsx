'use client'

import { ButtonCircle } from '@/shared/Button'
import { variants } from '@/utils/animationVariants'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
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
}: GallerySliderProps) {
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
  const images = galleryImgs

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

  useEffect(
    () => () => {
      if (manualPauseTimerRef.current) clearTimeout(manualPauseTimerRef.current)
    },
    []
  )

  let currentImage = images[index]

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
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false)
        }}
        onPointerDown={pauseAfterInteraction}
        {...swipeHandlers}
      >
        {/* Main image */}
        <div className={clsx(`w-full overflow-hidden rounded-xl`, galleryClass)}>
          <Link href={href} className={clsx(`relative flex items-center justify-center`, ratioClass)}>
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
                <Image
                  src={currentImage || ''}
                  fill
                  alt="listing card gallery"
                  className={clsx(`rounded-xl object-cover`, imageClass)}
                  onLoad={() => setLoaded(true)}
                  sizes="(max-width: 1025px) 100vw, 25vw"
                />
              </motion.div>
            </AnimatePresence>
          </Link>
        </div>

        {/* Buttons + bottom nav bar */}
        <>
          {/* Buttons */}
          {loaded && navigation && (
            <div className="opacity-0 transition-opacity group-hover/cardGallerySlider:opacity-100">
              {index > 0 && (
                <div className="absolute start-3 top-[calc(50%-1rem)]">
                  <ButtonCircle
                    color="white"
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
          <div className="absolute inset-x-0 bottom-0 h-10 rounded-b-xl bg-linear-to-t from-neutral-900 opacity-50"></div>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center justify-center gap-x-1.5">
            {images.map((_, i) => (
              <button
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
      </div>
    </MotionConfig>
  )
}
