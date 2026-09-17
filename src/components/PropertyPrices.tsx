'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { propertyOfferLabel, propertyPriceText, type PropertyPrice } from '@/lib/propertyPrices'

export default function PropertyPrices({
  prices,
  variant = 'card',
  className = '',
}: {
  prices: PropertyPrice[]
  variant?: 'card' | 'compact' | 'detail'
  className?: string
}) {
  const { locale, formatCurrencyFrom } = usePreferences()
  const th = locale === 'th'
  const dual = prices.length > 1
  return (
    <div
      data-property-prices={prices.length}
      className={`min-w-0 ${dual ? (variant === 'detail' ? 'space-y-3' : 'space-y-0.5') : ''} ${className}`}
    >
      {prices.map((price, index) => (
        <div
          key={`${price.offerType}-${index}`}
          data-property-price-offer={price.offerType}
          className={variant === 'detail' ? 'min-w-0' : 'flex min-w-0 flex-wrap items-baseline gap-x-1.5'}
        >
          {dual && (
            <span
              className={`${variant === 'detail' ? 'mb-0.5 block text-xs' : 'shrink-0 text-[11px]'} font-normal text-neutral-500 dark:text-neutral-400`}
            >
              {propertyOfferLabel(price.offerType, th)}
            </span>
          )}
          <span
            className={`font-semibold [overflow-wrap:anywhere] ${variant === 'compact' ? 'text-sm leading-5' : variant === 'detail' ? 'text-2xl leading-8' : 'text-base leading-6'}`}
          >
            {propertyPriceText(price, th, formatCurrencyFrom)}
          </span>
        </div>
      ))}
    </div>
  )
}
