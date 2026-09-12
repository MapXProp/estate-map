'use client'

import type { OfferTypeCode } from '@/data/propertyTaxonomy'
import { toggleMapOffer } from '@/lib/propertyMapSearch'
import { CloseButton, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Check, ChevronDown, RotateCcw, X } from 'lucide-react'
import styles from './MapOfferControls.module.css'
import legacy from './PropertyMapSearch.module.css'

const options: Array<{ value: OfferTypeCode; th: string; en: string }> = [
  { value: 'sale', th: 'ซื้อ', en: 'Buy' },
  { value: 'rent', th: 'เช่า', en: 'Rent' },
  { value: 'business_transfer', th: 'เซ้งกิจการ', en: 'Business transfer' },
  { value: 'sublease', th: 'เช่าช่วง', en: 'Sublease' },
]

export default function MapOfferControls({
  value,
  onChange,
  th,
  layout = 'compact',
  onReset,
  canReset = false,
}: {
  value: OfferTypeCode[]
  onChange: (value: OfferTypeCode[]) => void
  th: boolean
  layout?: 'compact' | 'classic'
  onReset?: () => void
  canReset?: boolean
}) {
  if (layout === 'classic')
    return (
      <div
        className={legacy.offers}
        role="group"
        data-map-offer-layout="classic"
        aria-label={th ? 'รูปแบบประกาศ เลือกได้หลายแบบ' : 'Listing offers, select one or more'}
      >
        <button
          type="button"
          data-map-offer-all
          aria-pressed={!value.length}
          onClick={() => onChange([])}
          className={!value.length ? legacy.selectedOffer : ''}
        >
          <span className={legacy.offerFill} aria-hidden="true" />
          <Check className={legacy.offerCheck} aria-hidden="true" strokeWidth={2.5} />
          <span className={legacy.offerLabel}>{th ? 'ทุกแบบ' : 'All'}</span>
        </button>
        {options.map((offer) => (
          <button
            key={offer.value}
            type="button"
            data-map-offer={offer.value}
            aria-pressed={value.includes(offer.value)}
            title={th ? offer.th : offer.en}
            aria-label={th ? offer.th : offer.en}
            onClick={() => onChange(toggleMapOffer(value, offer.value))}
            className={value.includes(offer.value) ? legacy.selectedOffer : ''}
          >
            <span className={legacy.offerFill} aria-hidden="true" />
            <Check className={legacy.offerCheck} aria-hidden="true" strokeWidth={2.5} />
            <span className={legacy.offerLabel}>
              {offer.value === 'business_transfer' ? (th ? 'เซ้ง' : 'Transfer') : th ? offer.th : offer.en}
            </span>
          </button>
        ))}
      </div>
    )

  const secondary = options.slice(2)
  const selectedOther = secondary.filter((offer) => value.includes(offer.value))
  const moreLabel = !value.length
    ? th
      ? 'ทุกแบบ'
      : 'All offers'
    : selectedOther.length === 1
      ? th
        ? selectedOther[0].th
        : selectedOther[0].en
      : th
        ? 'รูปแบบอื่น'
        : 'More offers'

  return (
    <div
      className={styles.controls}
      data-map-offer-layout="compact"
      role="group"
      aria-label={th ? 'รูปแบบประกาศ เลือกได้หลายแบบ' : 'Listing offers, select one or more'}
    >
      <div className={styles.primary}>
        {options.slice(0, 2).map((offer) => (
          <button
            key={offer.value}
            type="button"
            data-map-offer={offer.value}
            aria-pressed={value.includes(offer.value)}
            onClick={() => onChange(toggleMapOffer(value, offer.value))}
          >
            <span className={styles.check}>
              <Check aria-hidden="true" strokeWidth={2.5} />
            </span>
            {th ? offer.th : offer.en}
          </button>
        ))}
      </div>
      <Popover className={styles.more}>
        <PopoverButton
          className={styles.moreButton}
          data-map-more-offers
          data-active={selectedOther.length > 0 || !value.length || undefined}
          aria-label={th ? `รูปแบบอื่น: ${moreLabel} เลือกได้หลายแบบ` : `More offers: ${moreLabel}, select one or more`}
        >
          <span className={styles.moreLabelDesktop}>{moreLabel}</span>
          <span className={styles.moreLabelMobile}>
            {!value.length || selectedOther.length === 1 ? moreLabel : th ? 'อื่น' : 'More'}
          </span>
          {selectedOther.length > 1 && <span className={styles.count}>{selectedOther.length}</span>}
          <ChevronDown className={styles.chevron} aria-hidden="true" />
        </PopoverButton>
        <PopoverPanel anchor={{ to: 'bottom end', gap: 8, padding: 12 }} focus transition className={styles.panel}>
          <div className={styles.panelHeading}>
            <span>{th ? 'เลือกได้หลายรูปแบบ' : 'Select one or more'}</span>
            <CloseButton aria-label={th ? 'ปิดรูปแบบอื่น' : 'Close other offers'} className={styles.close}>
              <X aria-hidden="true" className="size-4" />
            </CloseButton>
          </div>
          {secondary.map((offer) => (
            <button
              key={offer.value}
              type="button"
              className={styles.option}
              data-map-offer={offer.value}
              aria-pressed={value.includes(offer.value)}
              onClick={() => onChange(toggleMapOffer(value, offer.value))}
            >
              <span className={styles.check}>
                <Check aria-hidden="true" strokeWidth={2.5} />
              </span>
              {th ? offer.th : offer.en}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.option} ${styles.all}`}
            data-map-offer-all
            aria-pressed={!value.length}
            onClick={() => onChange([])}
          >
            <span className={styles.check}>
              <Check aria-hidden="true" strokeWidth={2.5} />
            </span>
            {th ? 'ทุกแบบ' : 'All offers'}
          </button>
          {onReset && (
            <CloseButton
              className={`${styles.option} ${styles.mobileReset}`}
              data-map-mobile-reset
              disabled={!canReset}
              onClick={onReset}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {th ? 'คืนค่าเริ่มต้น' : 'Restore defaults'}
            </CloseButton>
          )}
        </PopoverPanel>
      </Popover>
    </div>
  )
}
