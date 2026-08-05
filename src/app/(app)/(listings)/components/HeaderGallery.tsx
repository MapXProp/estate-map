'use client'

import { Button } from '@/shared/Button'
import ButtonClose from '@/shared/ButtonClose'
import T from '@/utils/getT'
import { CloseButton, Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Squares2X2Icon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, Heart } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

const EmblaCarousel = ({ images, option }: { images: string[]; option: EmblaOptionsType }) => {
  const [selectedIndex, setSelectedIndex] = useState(option.startIndex ?? 0)
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel({
    ...option,
    direction: process.env.NEXT_PUBLIC_THEME_DIR,
  })
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    ...option,
    containScroll: 'keepSnaps',
    dragFree: true,
    direction: process.env.NEXT_PUBLIC_THEME_DIR,
  })

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return
      emblaMainApi.scrollTo(index)
    },
    [emblaMainApi, emblaThumbsApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return
    setSelectedIndex(emblaMainApi.selectedScrollSnap())
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap())
  }, [emblaMainApi, emblaThumbsApi, setSelectedIndex])

  useEffect(() => {
    if (!emblaMainApi) return
    emblaMainApi.on('select', onSelect).on('reInit', onSelect)
    return () => {
      emblaMainApi.off('select', onSelect).off('reInit', onSelect)
    }
  }, [emblaMainApi, onSelect])

  return (
    <div className="relative size-full embla">
      <div className="embla__viewport relative mx-auto size-full overflow-hidden" ref={emblaMainRef}>
        <div className="embla__container size-full">
          {images.map((image, index) => (
            <div className="relative z-50 flex embla__slide basis-full items-center justify-center px-3 py-16 sm:px-10" key={index}>
              <Image
                alt={`รูปอสังหาริมทรัพย์ ${index + 1}`}
                src={image}
                width={1280}
                height={853}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                className="max-h-[calc(100dvh-8rem)] w-auto max-w-full object-contain"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-2.5 right-2.5 z-50 sm:top-4 sm:right-4">
            <CloseButton as={ButtonClose}>
              <span className="sr-only">Close</span>
            </CloseButton>
          </div>
          <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/12 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      <div className="embla-thumbs fixed inset-x-0 bottom-5 z-10 hidden sm:block">
        <div className="embla-thumbs__viewport mx-auto max-w-28" ref={emblaThumbsRef}>
          <div className="embla-thumbs__container flex">
            {images.map((image, index) => (
              <div
                key={index}
                className={clsx(
                  'relative flex aspect-5/3 w-24 shrink-0 items-center justify-center transition-[transform,filter] duration-300 ease-in-out',
                  index === selectedIndex
                    ? 'z-10 scale-125 overflow-hidden rounded-md brightness-100'
                    : 'brightness-50 hover:brightness-75'
                )}
                onClick={() => onThumbClick(index)}
              >
                <Image alt="Slide image" src={image} fill sizes="100px" className={'object-cover'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const MobilePhotoGallery = ({
  images,
  open,
  onClose,
  onOpenImage,
  initiallySaved,
}: {
  images: string[]
  open: boolean
  onClose: () => void
  onOpenImage: (index: number) => void
  initiallySaved: boolean
}) => {
  const [isSaved, setIsSaved] = useState(initiallySaved)

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 md:hidden">
      <DialogBackdrop className="fixed inset-0 bg-white" />
      <div className="fixed inset-0 overflow-y-auto bg-white">
        <DialogPanel className="min-h-full bg-white text-neutral-950">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-3 backdrop-blur">
            <button
              type="button"
              onClick={onClose}
              aria-label="กลับไปหน้ารายละเอียดอสังหา"
              className="flex size-11 items-center justify-center rounded-full transition hover:bg-neutral-100 active:bg-neutral-200"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <h2 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold whitespace-nowrap">
              รูปภาพทั้งหมด
            </h2>
            <button
              type="button"
              onClick={() => setIsSaved((saved) => !saved)}
              aria-pressed={isSaved}
              aria-label={isSaved ? 'นำออกจากรายการที่บันทึก' : 'บันทึกประกาศนี้'}
              className={clsx(
                'flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition hover:bg-neutral-100 active:bg-neutral-200',
                isSaved && 'text-rose-600'
              )}
            >
              <Heart className={clsx('size-5', isSaved && 'fill-current')} aria-hidden="true" />
              <span>{isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
            </button>
          </header>

          <main className="px-2.5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <h3 className="mb-4 px-0.5 text-lg font-semibold">แกลเลอรีรูปภาพ</h3>
            <div className="columns-2 gap-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => onOpenImage(index)}
                  aria-label={`เปิดรูปที่ ${index + 1} จาก ${images.length}`}
                  className={clsx(
                    'relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-xl bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
                    index % 5 === 1 || index % 5 === 3 ? 'aspect-[4/5]' : 'aspect-[4/3]'
                  )}
                >
                  <Image
                    src={image}
                    alt={`รูปอสังหาริมทรัพย์ ${index + 1}`}
                    fill
                    sizes="50vw"
                    priority={index < 4}
                    className="object-cover transition duration-200 active:scale-[0.98]"
                  />
                </button>
              ))}
            </div>
          </main>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

interface Props {
  images: string[]
  gridType?: 'grid1' | 'grid2' | 'grid3' | 'grid4'
  initiallySaved?: boolean
}
const HeaderGallery = ({ images, gridType = 'grid1', initiallySaved = false }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileGalleryOpen, setIsMobileGalleryOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  const handleOpenDialog = (index = 0) => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsMobileGalleryOpen(true)
      return
    }
    setStartIndex(index)
    setIsOpen(true)
  }

  const handleOpenMobileImage = (index: number) => {
    setStartIndex(index)
    setIsOpen(true)
  }

  return (
    <>
      {gridType === 'grid1' && <HeaderGalleryGrid1 images={images} handleOpenDialog={handleOpenDialog} />}
      {gridType === 'grid2' && <HeaderGalleryGrid2 images={images} handleOpenDialog={handleOpenDialog} />}
      {gridType === 'grid3' && <HeaderGalleryGrid3 images={images} handleOpenDialog={handleOpenDialog} />}
      {gridType === 'grid4' && <HeaderGalleryGrid4 images={images} handleOpenDialog={handleOpenDialog} />}

      <MobilePhotoGallery
        images={images}
        open={isMobileGalleryOpen}
        onClose={() => setIsMobileGalleryOpen(false)}
        onOpenImage={handleOpenMobileImage}
        initiallySaved={initiallySaved}
      />

      {/* Dialog for full-screen image gallery */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-[60]">
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <DialogBackdrop className="fixed inset-0 bg-black" />

        {/* Full-screen container to center the panel */}
        <div className="fixed inset-0 flex w-screen items-center justify-center">
          <DialogPanel
            transition
            className="relative mx-auto h-full w-full max-w-7xl flex-1 transition data-closed:opacity-0"
          >
            <EmblaCarousel images={images} option={{ startIndex, slidesToScroll: 1 }} />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

const HeaderGalleryGrid1 = ({
  images,
  handleOpenDialog,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
}) => {
  return (
    <header className="relative md:grid md:grid-cols-4 md:gap-2">
      <div className="relative aspect-4/5 size-full md:col-span-2 md:aspect-4/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            fill
            className="rounded-xl object-cover transition-[filter] hover:brightness-75"
            src={images[0]}
            alt="bigger"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>
      <div className="hidden md:col-span-2 md:grid md:grid-cols-2 md:gap-2">
        {images.slice(1, 5).map((item, index) => (
          <div className="relative aspect-2/2 size-full" key={index} onClick={() => handleOpenDialog(index + 1)}>
            <Image
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              src={item || ''}
              alt="others"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-3">
        <Button color="light" onClick={() => handleOpenDialog()}>
          <Squares2X2Icon className="h-5 w-5" />
          <span>{T['common']['Show all photos']}</span>
        </Button>
      </div>
    </header>
  )
}
const HeaderGalleryGrid2 = ({
  images,
  handleOpenDialog,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
}) => {
  const previewImages = images.slice(0, 5)

  return (
    <header className="relative">
      <div className="grid grid-cols-6 gap-1 overflow-hidden rounded-2xl bg-neutral-100 md:hidden">
        {previewImages.map((image, index) => {
          const isTopRow = index < 2
          const isLast = index === previewImages.length - 1

          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => handleOpenDialog(index)}
              aria-label={isLast ? `ดูรูปภาพทั้งหมด ${images.length} รูป` : `เปิดรูปที่ ${index + 1}`}
              className={clsx(
                'relative block min-w-0 overflow-hidden bg-neutral-200 focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#176b50]',
                isTopRow ? 'col-span-3 aspect-[4/3]' : 'col-span-2 aspect-square'
              )}
            >
              <Image
                alt={`รูปอสังหาริมทรัพย์ ${index + 1}`}
                src={image}
                fill
                sizes={isTopRow ? '50vw' : '34vw'}
                priority={index < 2}
                className="object-cover transition duration-200 active:scale-[0.98]"
              />
              {isLast && (
                <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/48 text-xl font-semibold text-white">
                  +{Math.max(images.length - 4, 1)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="hidden md:grid md:grid-cols-4">
        <div className="relative col-span-3 aspect-5/4 size-full" onClick={() => handleOpenDialog(0)}>
          {images[0] && (
            <Image
              alt=""
              src={images[0]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 1200px) 80vw, 80vw"
              priority
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-y-2 ps-2">
          {images.slice(1, 4).map((item, index) => (
            <div className="relative aspect-3/2 size-full" key={index} onClick={() => handleOpenDialog(index + 1)}>
              <Image
                alt=""
                src={item}
                fill
                className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
                sizes="33vw"
                priority
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 hidden md:block">
        <Button color="light" onClick={() => handleOpenDialog()}>
          <Squares2X2Icon className="h-5 w-5" />
          <span>{T['common']['Show all photos']}</span>
        </Button>
      </div>
    </header>
  )
}
const HeaderGalleryGrid3 = ({
  images,
  handleOpenDialog,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
}) => {
  return (
    <header className="relative md:grid md:grid-cols-3 md:gap-x-2">
      <div className="relative aspect-4/5 size-full md:aspect-3/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            alt=""
            src={images[0]}
            fill
            className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-1 md:gap-y-2">
        <div className="relative aspect-3/2 size-full" onClick={() => handleOpenDialog(1)}>
          {images[1] && (
            <Image
              alt=""
              src={images[1]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          )}
        </div>
        <div className="relative aspect-3/2 size-full" onClick={() => handleOpenDialog(2)}>
          {images[2] && (
            <Image
              alt=""
              src={images[2]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          )}
        </div>
      </div>

      <div className="relative hidden size-full md:block md:aspect-3/4" onClick={() => handleOpenDialog(3)}>
        {images[3] && (
          <Image
            alt=""
            src={images[3]}
            fill
            className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>

      <div className="absolute bottom-3 left-3">
        <Button color="light" onClick={() => handleOpenDialog()}>
          <Squares2X2Icon className="h-5 w-5" />
          <span>{T['common']['Show all photos']}</span>
        </Button>
      </div>
    </header>
  )
}
const HeaderGalleryGrid4 = ({
  images,
  handleOpenDialog,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
}) => {
  return (
    <header className="relative md:grid md:grid-cols-3 md:gap-x-2">
      <div className="relative aspect-4/5 size-full md:aspect-3/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            alt=""
            src={images[0]}
            fill
            className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>

      <div className="relative hidden aspect-4/5 size-full md:block md:aspect-3/4" onClick={() => handleOpenDialog(3)}>
        {images[3] && (
          <Image
            alt=""
            src={images[3]}
            fill
            className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-1 md:gap-y-2">
        <div className="relative aspect-3/2 size-full" onClick={() => handleOpenDialog(1)}>
          {images[1] && (
            <Image
              alt=""
              src={images[1]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          )}
        </div>
        <div className="relative aspect-3/2 size-full" onClick={() => handleOpenDialog(2)}>
          {images[2] && (
            <Image
              alt=""
              src={images[2]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          )}
        </div>
      </div>

      <div className="absolute bottom-3 left-3">
        <Button color="light" onClick={() => handleOpenDialog()}>
          <Squares2X2Icon className="h-5 w-5" />
          <span>{T['common']['Show all photos']}</span>
        </Button>
      </div>
    </header>
  )
}

export default HeaderGallery
