'use client'

import PropertyPrices from '@/components/PropertyPrices'
import { propertyOfferLabel, type PropertyPrice } from '@/lib/propertyPrices'
import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
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
    <>
      <div ref={spacerRef} className={styles.spacer} data-listing-action-spacer aria-hidden="true" />
      <div ref={barRef} className={styles.bar} data-listing-contact-bar>
        <div className={styles.inner}>
          <div className={styles.summary}>
            <div className={styles.price}>
              {prices.length === 1 && <p className={styles.label}>{propertyOfferLabel(prices[0].offerType, isThai)}</p>}
              <PropertyPrices prices={prices} variant="compact" />
              {priceNote && prices.length === 1 && <p className={styles.note}>{priceNote}</p>}
            </div>
            {quickContact && (
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
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.map}>
                <MapPin size={20} aria-hidden="true" />
                {isThai ? 'ดูแผนที่' : 'View map'}
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
