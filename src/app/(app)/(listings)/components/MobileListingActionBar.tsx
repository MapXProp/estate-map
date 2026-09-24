'use client'

import PropertyPrices from '@/components/PropertyPrices'
import { useKeyboardFocus } from '@/hooks/useKeyboardFocus'
import { propertyOfferLabel, type PropertyPrice } from '@/lib/propertyPrices'
import { bindVerticalSheetDrag } from '@/lib/verticalSheetGesture'
import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ListingContactSheetContext } from './ListingContactSheetContext'
import styles from './MobileListingActionBar.module.css'

interface Props {
  prices: PropertyPrice[]
  isThai: boolean
  priceNote?: string
  mapUrl?: string | null
  quickContact?: { kind: string; href: string }
  children?: ReactNode
  placement?: 'page' | 'sheet'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function MobileListingActionBar({
  prices,
  isThai,
  priceNote,
  mapUrl,
  quickContact,
  children,
  placement = 'page',
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const [localOpen, setLocalOpen] = useState(false)
  const open = controlledOpen ?? localOpen
  const setOpen = useCallback(
    (value: boolean) => {
      setLocalOpen(value)
      onOpenChange?.(value)
    },
    [onOpenChange]
  )
  const maxWidth = placement === 'sheet' ? 1023 : 1099
  const keyboardFocus = useKeyboardFocus()
  const hasContact = Boolean(children)
  useEffect(() => {
    const bar = barRef.current
    if (!bar || !hasContact) return
    return bindVerticalSheetDrag(bar, () => ({
      maxWidth,
      canDrag: (down) => !down,
      onStart: () => bar.setAttribute('data-sheet-dragging', 'true'),
      onMove: (dy) => bar.style.setProperty('--dock-offset', `${Math.max(-80, Math.min(0, dy * 0.6))}px`),
      onEnd: (dy, _velocity, cancelled) => {
        bar.removeAttribute('data-sheet-dragging')
        bar.style.removeProperty('--dock-offset')
        if (!cancelled && dy < -32) {
          bar.querySelector<HTMLButtonElement>('[data-listing-drag-handle]')?.focus()
          setOpen(true)
        }
      },
    }))
  }, [hasContact, maxWidth, setOpen])

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
      {placement === 'page' && (
        <div ref={spacerRef} className={styles.spacer} data-listing-action-spacer aria-hidden="true" />
      )}
      <div
        ref={barRef}
        className={styles.bar}
        data-listing-contact-bar
        data-placement={placement}
        data-sheet-drag-root
        data-sheet-scroll
        data-keyboard-focus={keyboardFocus || undefined}
      >
        {children && (
          <button
            type="button"
            className={styles.grip}
            data-listing-drag-handle
            data-sheet-drag-handle
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={isThai ? 'เลื่อนขึ้นหรือแตะเพื่อดูช่องทางติดต่อ' : 'Swipe up or tap for contact details'}
            onClick={() => setOpen(true)}
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
            <div className={styles.price} data-sheet-drag-handle>
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
