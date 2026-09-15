'use client'

import type { OfferTypeCode } from '@/data/propertyTaxonomy'
import { toggleMapOffer } from '@/lib/propertyMapSearch'
import { Check, House, KeyRound, type LucideIcon } from 'lucide-react'
import styles from './MapOfferControls.module.css'

const options: Array<{ value: OfferTypeCode; th: string; en: string; icon: LucideIcon }> = [
  { value: 'sale', th: 'ซื้อ', en: 'Buy', icon: House },
  { value: 'rent', th: 'เช่า', en: 'Rent', icon: KeyRound },
]

export default function MapOfferControls({
  value,
  onChange,
  th,
  layout = 'compact',
}: {
  value: OfferTypeCode[]
  onChange: (value: OfferTypeCode[]) => void
  th: boolean
  layout?: 'compact' | 'classic'
}) {
  return (
    <div
      className={styles.controls}
      data-map-offer-layout={layout}
      role="group"
      aria-label={th ? 'ซื้อหรือเช่า เลือกได้ทั้งสองแบบ' : 'Buy or rent, select either or both'}
    >
      <div className={styles.primary}>
        {options.map((offer) => (
          <button
            key={offer.value}
            type="button"
            data-map-offer={offer.value}
            aria-pressed={value.includes(offer.value)}
            onClick={() => onChange(toggleMapOffer(value, offer.value))}
          >
            <offer.icon className={styles.offerIcon} aria-hidden="true" strokeWidth={2} />
            {th ? offer.th : offer.en}
            <span className={styles.check}>
              <Check aria-hidden="true" strokeWidth={2.5} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
