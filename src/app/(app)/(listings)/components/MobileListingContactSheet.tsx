'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  CheckCircle2,
  ChevronRight,
  ContactRound,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShieldQuestion,
  X,
} from 'lucide-react'
import {
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

type VerificationStatus = 'unverified' | 'identity_verified' | 'authority_verified' | ''

interface MobileListingContactSheetProps {
  contactName: string
  roleLabel: string
  authorityLabel?: string
  organizationName?: string
  verificationStatus: VerificationStatus
  trusted?: boolean
  phone?: string
  secondaryPhone?: string
  email?: string
  lineId?: string
  instagramHandle?: string
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : value
}

const MobileListingContactSheet = ({
  contactName,
  roleLabel,
  authorityLabel,
  organizationName,
  verificationStatus,
  trusted = false,
  phone,
  secondaryPhone,
  email,
  lineId,
  instagramHandle,
}: MobileListingContactSheetProps) => {
  const [open, setOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const dragState = useRef({ startY: 0, lastY: 0, lastTime: 0, velocity: 0 })
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const touchStartYRef = useRef(0)
  const touchStartXRef = useRef(0)
  const touchStartTimeRef = useRef(0)
  const touchDragOffsetRef = useRef(0)
  const canStartTouchDragRef = useRef(false)
  const touchDragLockedRef = useRef(false)
  const lineHandle = lineId?.replace(/^@/, '') || ''
  const instagram = instagramHandle?.replace(/^@/, '') || ''
  const isAuthorityVerified = verificationStatus === 'authority_verified' || trusted
  const isIdentityVerified = verificationStatus === 'identity_verified'

  const verification = isAuthorityVerified
    ? {
        title: 'ตรวจสอบตัวตนและสิทธิแล้ว',
        description: 'ระบบตรวจสอบตัวตนและสิทธิในการลงประกาศแล้ว',
        icon: ShieldCheck,
        className: 'border-[#cfe5dc] bg-[#eff7f3] text-[#176b50]',
      }
    : isIdentityVerified
      ? {
          title: 'ยืนยันตัวตนแล้ว',
          description: 'ยืนยันตัวตนแล้ว แต่ยังไม่ได้ตรวจสอบสิทธิในการลงประกาศ',
          icon: CheckCircle2,
          className: 'border-amber-200 bg-amber-50 text-amber-700',
        }
      : {
          title: 'ยังไม่ได้รับการตรวจสอบ',
          description: 'บทบาทและความเกี่ยวข้องเป็นข้อมูลที่ผู้ลงประกาศระบุเอง',
          icon: ShieldQuestion,
          className: 'border-neutral-200 bg-neutral-50 text-neutral-600',
        }
  const VerificationIcon = verification.icon

  const closeSheet = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setOpen(false)
    setIsDragging(false)
    setIsDismissing(false)
    setDragOffset(0)
    touchDragOffsetRef.current = 0
    canStartTouchDragRef.current = false
    touchDragLockedRef.current = false
  }

  const dismissSheet = () => {
    if (isDismissing) return

    setIsDragging(false)
    setIsDismissing(true)
    setDragOffset(window.innerHeight)
    touchDragOffsetRef.current = window.innerHeight
    canStartTouchDragRef.current = false
    touchDragLockedRef.current = false

    dismissTimerRef.current = setTimeout(() => {
      // Keep the panel translated below the viewport while Headless UI removes
      // it. Resetting the transform here caused a one-frame white flash.
      setOpen(false)
      dismissTimerRef.current = null
    }, 220)
  }

  useEffect(
    () => () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    },
    []
  )

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isDismissing || !event.isPrimary || event.pointerType !== 'mouse' || event.button !== 0) return
    if ((event.target as HTMLElement).closest('button')) return
    const now = performance.now()
    dragState.current = { startY: event.clientY, lastY: event.clientY, lastTime: now, velocity: 0 }
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isDismissing || !isDragging || !event.isPrimary || event.pointerType !== 'mouse') return
    const offset = Math.max(0, event.clientY - dragState.current.startY)
    const now = performance.now()
    const elapsed = Math.max(1, now - dragState.current.lastTime)
    setDragOffset(offset)
    dragState.current.velocity = Math.max(0, event.clientY - dragState.current.lastY) / elapsed
    dragState.current.lastY = event.clientY
    dragState.current.lastTime = now
  }

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isDismissing || !isDragging || !event.isPrimary || event.pointerType !== 'mouse') return
    const now = performance.now()
    const elapsed = Math.max(1, now - dragState.current.lastTime)
    const velocity = Math.max(
      dragState.current.velocity,
      Math.max(0, event.clientY - dragState.current.lastY) / elapsed
    )
    const shouldClose = dragOffset >= 96 || velocity >= 0.55

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
    if (shouldClose) dismissSheet()
    else setDragOffset(0)
  }

  const handleDragCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
    setDragOffset(0)
  }

  const resetTouchDrag = () => {
    setIsDragging(false)
    setDragOffset(0)
    touchDragOffsetRef.current = 0
    canStartTouchDragRef.current = false
    touchDragLockedRef.current = false
  }

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (isDismissing || event.touches.length !== 1) return

    const touch = event.touches[0]
    const target = event.target as HTMLElement
    const startedOnDragHandle = Boolean(target.closest?.('[data-contact-drag-handle]'))

    touchStartYRef.current = touch.clientY
    touchStartXRef.current = touch.clientX
    touchStartTimeRef.current = performance.now()
    touchDragOffsetRef.current = 0
    touchDragLockedRef.current = false
    canStartTouchDragRef.current =
      startedOnDragHandle || (scrollContainerRef.current?.scrollTop ?? 0) <= 1
  }

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (isDismissing || !canStartTouchDragRef.current || event.touches.length !== 1) return

    const touch = event.touches[0]
    const deltaY = touch.clientY - touchStartYRef.current
    const deltaX = touch.clientX - touchStartXRef.current

    if (!touchDragLockedRef.current) {
      if (Math.abs(deltaY) < 6 && Math.abs(deltaX) < 6) return

      // Keep normal vertical scrolling and horizontal gestures intact. Once a
      // gesture chooses one path, it cannot change into a dismiss mid-swipe.
      if (deltaY <= 0 || Math.abs(deltaX) > deltaY) {
        canStartTouchDragRef.current = false
        return
      }

      touchDragLockedRef.current = true
      setIsDragging(true)
    }

    event.preventDefault()
    const nextOffset = Math.min(Math.max(0, deltaY) * 0.88, window.innerHeight)
    touchDragOffsetRef.current = nextOffset
    setDragOffset(nextOffset)
  }

  const handleTouchEnd = () => {
    if (!touchDragLockedRef.current) {
      resetTouchDrag()
      return
    }

    const elapsed = Math.max(performance.now() - touchStartTimeRef.current, 1)
    const offset = touchDragOffsetRef.current
    const velocity = offset / elapsed
    const shouldClose = offset > 110 || velocity > 0.55

    if (shouldClose) return dismissSheet()

    resetTouchDrag()
  }

  const handleTouchCancel = () => {
    resetTouchDrag()
  }

  const contactLinks = [
    ...(phone
      ? [
          {
            label: 'โทรศัพท์',
            value: formatPhone(phone),
            href: `tel:${phone.replace(/[^+\d]/g, '')}`,
            icon: Phone,
          },
        ]
      : []),
    ...(secondaryPhone
      ? [
          {
            label: 'โทรศัพท์สำรอง',
            value: formatPhone(secondaryPhone),
            href: `tel:${secondaryPhone.replace(/[^+\d]/g, '')}`,
            icon: Phone,
          },
        ]
      : []),
    ...(lineHandle
      ? [
          {
            label: 'LINE',
            value: `@${lineHandle}`,
            href: `https://line.me/R/ti/p/%40${encodeURIComponent(lineHandle)}`,
            icon: MessageCircle,
            external: true,
          },
        ]
      : []),
    ...(email
      ? [
          {
            label: 'อีเมล',
            value: email,
            href: `mailto:${email}`,
            icon: Mail,
          },
        ]
      : []),
    ...(instagram
      ? [
          {
            label: 'Instagram',
            value: `@${instagram}`,
            href: `https://www.instagram.com/${encodeURIComponent(instagram)}`,
            icon: Instagram,
            external: true,
          },
        ]
      : []),
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
          dismissTimerRef.current = null
          setIsDismissing(false)
          setIsDragging(false)
          setDragOffset(0)
          touchDragOffsetRef.current = 0
          setOpen(true)
        }}
        aria-label="ข้อมูลผู้ติดต่อ"
        aria-expanded={open}
        title="ข้อมูลผู้ติดต่อ"
        className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 outline-none transition [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#176b50]/30 focus-visible:ring-offset-2 active:scale-95"
      >
        <ContactRound className="size-[19px]" />
      </button>

      <Dialog open={open} onClose={closeSheet} className="relative z-[100] min-[744px]:hidden">
        <DialogBackdrop
          transition
          style={dragOffset > 0 ? { opacity: Math.max(0, 1 - dragOffset / 360) } : undefined}
          className="fixed inset-0 bg-neutral-950/45 transition duration-200 ease-out data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex items-end justify-center">
          <DialogPanel
            transition
            style={dragOffset > 0 ? { transform: `translate3d(0, ${dragOffset}px, 0)` } : undefined}
            className={`relative flex max-h-[86dvh] min-h-[68dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-18px_60px_rgba(15,23,42,0.20)] ease-out will-change-transform data-closed:translate-y-full ${
              isDragging
                ? 'transition-none'
                : isDismissing
                  ? 'transition-transform duration-[220ms] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]'
                  : 'transition duration-300'
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            <div
              data-contact-drag-handle
              className="shrink-0 cursor-grab touch-none px-4 pt-2.5 select-none active:cursor-grabbing"
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragCancel}
            >
              <div className="mx-auto h-1.5 w-11 rounded-full bg-neutral-200" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3 py-3">
                <div>
                  <DialogTitle className="text-lg font-semibold text-neutral-950">ข้อมูลผู้ลงประกาศ</DialogTitle>
                </div>
                <button
                  type="button"
                  onClick={closeSheet}
                  aria-label="ปิดข้อมูลผู้ติดต่อ"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              <section className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-[#176b50]">
                    <ContactRound className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500">ผู้ลงประกาศ</p>
                    <h2 className="mt-0.5 text-lg font-semibold text-neutral-950">{contactName || 'ไม่ระบุชื่อ'}</h2>
                    <p className="mt-1 text-sm font-medium text-[#176b50]">{roleLabel || 'ไม่ได้ระบุบทบาท'}</p>
                  </div>
                </div>

                <dl className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100 text-sm">
                  {authorityLabel && (
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-3">
                      <dt className="text-neutral-500">สิทธิลงประกาศจาก</dt>
                      <dd className="font-medium text-neutral-800">{authorityLabel}</dd>
                    </div>
                  )}
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-neutral-500">บริษัท / สังกัด</dt>
                    <dd className="font-medium text-neutral-800">{organizationName || 'ไม่ได้ระบุ'}</dd>
                  </div>
                </dl>
              </section>

              <section className={`mt-3 rounded-2xl border p-4 ${verification.className}`}>
                <div className="flex items-start gap-3">
                  <VerificationIcon className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <h2 className="font-semibold">{verification.title}</h2>
                    <p className="mt-1 text-xs leading-5 opacity-80">{verification.description}</p>
                  </div>
                </div>
              </section>

              <section className="mt-5">
                <h2 className="text-sm font-semibold text-neutral-950">ช่องทางติดต่อ</h2>
                {contactLinks.length > 0 ? (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    {contactLinks.map((item) => (
                      <a
                        key={`${item.label}-${item.value}`}
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className="flex min-h-14 items-center gap-3 border-b border-neutral-100 px-3.5 transition last:border-b-0 active:bg-neutral-50"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eff7f3] text-[#176b50]">
                          <item.icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-neutral-500">{item.label}</span>
                          <span className="block truncate text-sm font-semibold text-neutral-800">{item.value}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-neutral-300" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
                    ยังไม่มีช่องทางติดต่อเพิ่มเติม
                  </p>
                )}
              </section>

              <p className="mt-4 text-xs leading-5 text-neutral-400">
                ควรตรวจสอบเอกสารสิทธิและอำนาจของผู้ลงประกาศก่อนชำระเงินหรือทำสัญญา
              </p>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

export default MobileListingContactSheet
