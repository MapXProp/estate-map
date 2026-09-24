'use client'

import PropertyPrices from '@/components/PropertyPrices'
import { propertyOfferLabel, type PropertyPrice } from '@/lib/propertyPrices'
import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { ListingContactSheetContext } from './ListingContactSheetContext'
import styles from './MobileListingActionBar.module.css'

interface Props {
  prices: PropertyPrice[]
  isThai: boolean
  priceNote?: string
  mapUrl?: string | null
  quickContact?: { kind: string; href: string }
  children?: ReactNode
}

export default function MobileListingActionBar({ prices, isThai, priceNote, mapUrl, quickContact, children }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [lift, setLift] = useState(0)
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const finishDrag = (event: PointerEvent<HTMLButtonElement>, cancel = false) => {
    const state = drag.current
    if (!state) return
    drag.current = null
    suppressClick.current = state.moved
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    setLift(0)
    if (!cancel && state.y - event.clientY > 32 && Math.abs(event.clientX - state.x) < state.y - event.clientY) {
      event.currentTarget.focus()
      setOpen(true)
    }
  }

  useEffect(() => {
    const bar = barRef.current
    const spacer = spacerRef.current
    if (!bar || !spacer) return
    const measure = () => {
      spacer.style.height = `${bar.getBoundingClientRect().height}px`
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  return (
    <ListingContactSheetContext.Provider value={{ open, setOpen }}>
      <div ref={spacerRef} className={styles.spacer} data-listing-action-spacer aria-hidden="true" />
      <div ref={barRef} className={styles.bar} data-listing-contact-bar style={{ transform: `translateY(${-lift}px)` }}>
        {children && (
          <button
            type="button"
            className={styles.grip}
            data-listing-drag-handle
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={isThai ? 'เลื่อนขึ้นหรือแตะเพื่อดูช่องทางติดต่อ' : 'Swipe up or tap for contact details'}
            onClick={() => {
              if (!suppressClick.current) setOpen(true)
              suppressClick.current = false
            }}
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return
              suppressClick.current = false
              drag.current = { x: event.clientX, y: event.clientY, moved: false }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (!drag.current) return
              const distance = drag.current.y - event.clientY
              if (Math.abs(distance) > 6) drag.current.moved = true
              setLift(Math.min(48, Math.max(0, distance) * 0.5))
            }}
            onPointerUp={(event) => finishDrag(event)}
            onPointerCancel={(event) => finishDrag(event, true)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setOpen(true)
              }
            }}
          >
            <span aria-hidden="true" />
          </button>
        )}
        <div className={styles.inner} data-dual={prices.length > 1}>
          <div className={styles.summary}>
            <div className={styles.price}>
              {prices.length === 1 && <p className={styles.label}>{propertyOfferLabel(prices[0].offerType, isThai)}</p>}
              <PropertyPrices prices={prices} variant="compact" />
              {priceNote && prices.length === 1 && <p className={styles.note}>{priceNote}</p>}
            </div>
            {quickContact && !children && (
              <a
                href={quickContact.href}
                target={quickContact.kind === 'line' ? '_blank' : undefined}
                rel={quickContact.kind === 'line' ? 'noopener noreferrer' : undefined}
                className={styles.quickContact}
                aria-label={quickContact.kind === 'phone' ? (isThai ? 'โทรหาผู้ประกาศ' : 'Call advertiser') : 'LINE'}
              >
                {quickContact.kind === 'phone' ? (
                  <Phone size={18} aria-hidden="true" />
                ) : (
                  <MessageCircle size={18} aria-hidden="true" />
                )}
                {quickContact.kind === 'phone' ? (isThai ? 'โทร' : 'Call') : 'LINE'}
              </a>
            )}
          </div>
          <div className={styles.actions} data-has-contact={Boolean(children)} data-has-map={Boolean(mapUrl)}>
            {children && <div className={styles.contact}>{children}</div>}
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.map}
                aria-label={isThai ? 'ดูแผนที่' : 'View map'}
              >
                <MapPin size={20} aria-hidden="true" />
                <span>{isThai ? 'ดูแผนที่' : 'View map'}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </ListingContactSheetContext.Provider>
  )
}
