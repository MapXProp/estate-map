export type PropertyPrice = {
  offerType: string
  amount?: number
  currency?: string
  unit?: string
}

type PriceSource = {
  sale_price?: number
  rent_price_monthly?: number
  offer_type?: string
  offer_amount?: number
  offer_price_unit?: string
  price_unit?: string
  currency?: string
  price_on_request?: boolean
  category_details?: Record<string, unknown>
}

const positive = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

// Search and detail responses carry the same sale/monthly-rent fields. Other
// offers retain their own period (day, week, event, transfer, etc.).
export function getPropertyPrices(source: PriceSource): PropertyPrice[] {
  const prices: PropertyPrice[] = []
  const currency = source.currency || 'THB'
  if (source.price_on_request || source.category_details?.price_on_request === true) {
    return [{ offerType: source.offer_type || '', currency }]
  }
  if (positive(source.sale_price))
    prices.push({ offerType: 'sale', amount: source.sale_price, currency, unit: 'total' })
  if (positive(source.rent_price_monthly))
    prices.push({
      offerType: source.offer_type === 'sublease' ? 'sublease' : 'rent',
      amount: source.rent_price_monthly,
      currency,
      unit: 'month',
    })
  const offerType = source.offer_type || ''
  if (
    positive(source.offer_amount) &&
    (!prices.length || (offerType && !prices.some((price) => price.offerType === offerType)))
  ) {
    prices.push({
      offerType,
      amount: source.offer_amount,
      currency,
      unit: source.offer_price_unit || source.price_unit,
    })
  }
  return prices.length ? prices : [{ offerType, currency }]
}

export function filterPropertyPrices(prices: PropertyPrice[], offers: string[] | null = []) {
  // The search API returns null when no buy/rent intent was selected.
  if (!offers?.length) return prices
  const selected = prices.filter(
    (price) =>
      offers.includes(price.offerType) ||
      (offers.includes('rent') && ['sublease', 'contact_organizer', 'event_booking'].includes(price.offerType))
  )
  return selected.length ? selected : [{ offerType: offers[0], currency: prices[0]?.currency }]
}

export function getMapListingPrices(listing: {
  prices?: PropertyPrice[]
  priceAmount?: number
  priceCurrency?: string
  priceUnit?: string
  priceLabel?: string
  salePrice?: number
  rentPriceMonthly?: number
  offerTypes?: string[]
}): PropertyPrice[] {
  if (listing.prices) return listing.prices
  return getPropertyPrices({
    sale_price: listing.salePrice,
    rent_price_monthly: listing.rentPriceMonthly,
    offer_type: listing.offerTypes?.[0],
    offer_amount: listing.priceAmount,
    currency: listing.priceCurrency,
    price_unit: listing.priceUnit,
    price_on_request: Boolean(listing.priceLabel),
  })
}

export function propertyOfferLabel(offer: string, th: boolean) {
  const labels: Record<string, [string, string]> = {
    sale: ['ขาย', 'Sale'],
    rent: ['เช่า', 'Rent'],
    sublease: ['เช่าช่วง', 'Sublease'],
    business_transfer: ['เซ้ง', 'Transfer'],
    contact_organizer: ['ติดต่อผู้จัดงาน', 'Contact organizer'],
    event_booking: ['เช่า', 'Rent'],
  }
  return labels[offer]?.[th ? 0 : 1] || ''
}

export const propertyOffersLabel = (prices: PropertyPrice[], th: boolean) =>
  [...new Set(prices.map((price) => propertyOfferLabel(price.offerType, th)).filter(Boolean))].join(' / ')

export function propertyPricePeriod(unit: string | undefined, th: boolean) {
  const labels: Record<string, [string, string]> = {
    month: ['/เดือน', '/mo'],
    day: ['/วัน', '/day'],
    week: ['/สัปดาห์', '/wk'],
    event_period: ['/งาน', '/event'],
    year: ['/ปี', '/yr'],
  }
  return labels[unit || '']?.[th ? 0 : 1] || ''
}

export type PropertyAmountFormatter = (amount: number, currency?: string, options?: { compact?: boolean }) => string

export function propertyPriceText(price: PropertyPrice, th: boolean, format: PropertyAmountFormatter, compact = false) {
  if (!positive(price.amount))
    return ['contact_organizer', 'event_booking'].includes(price.offerType)
      ? th
        ? 'ติดต่อผู้จัดงาน'
        : 'Contact organizer'
      : th
        ? 'สอบถามราคา'
        : 'Price on request'
  return `${format(price.amount, price.currency, { compact: compact && price.amount >= 1_000_000 })}${propertyPricePeriod(price.unit, th)}`
}

export function propertyPricesText(
  prices: PropertyPrice[],
  th: boolean,
  format: PropertyAmountFormatter,
  compact = false
) {
  return prices
    .map(
      (price) =>
        `${prices.length > 1 ? `${propertyOfferLabel(price.offerType, th)} ` : ''}${propertyPriceText(price, th, format, compact)}`
    )
    .join('\n')
}

// Map pins identify rental prices by their period and keep the exact amount visible.
export function propertyPinPricesText(prices: PropertyPrice[], th: boolean, format: PropertyAmountFormatter) {
  return prices.map((price) => propertyPriceText(price, th, format)).join('\n')
}
