import type { DiscoveryChannelCode, PropertyTypeCode } from '@/data/propertyTaxonomy'
import { defaultHeaderOffers, getHeaderOffers, type HeaderOfferType } from './propertyHeaderSearch'
import { mapCategoryGroups, normalizeMapCategories } from './propertyMapSearch'

export type MobilePropertyCategory = {
  value: string
  channel: DiscoveryChannelCode
  label: string
  labelEn: string
  propertyType: PropertyTypeCode
  categoryIds: string[]
}

// Use the same choices and labels as Map, with its entire retail section in one card.
export const mobilePropertyCategories: MobilePropertyCategory[] = mapCategoryGroups.flatMap((group) =>
  group.sections.flatMap((section): MobilePropertyCategory[] =>
    section.id === 'retail'
      ? [
          {
            value: 'business:retail',
            channel: group.code,
            label: 'พื้นที่ขายของ',
            labelEn: 'Retail spaces',
            propertyType: 'retail_space',
            categoryIds: section.options.map((option) => option.id),
          },
        ]
      : section.options.map((option) => ({
          value: option.id,
          channel: group.code,
          label: option.nameTh,
          labelEn: option.nameEn,
          propertyType: option.propertyType as PropertyTypeCode,
          categoryIds: [option.id],
        }))
  )
)

export function getMobilePropertyMapSearchUrl({
  query,
  channel,
  selectedCategories,
  offerType = '',
  minPrice,
  maxPrice,
}: {
  query: string
  channel: DiscoveryChannelCode
  selectedCategories: readonly string[]
  offerType?: HeaderOfferType | ''
  minPrice?: number
  maxPrice?: number
}) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  params.set('channel', channel)
  const cards = mobilePropertyCategories.filter((card) => card.channel === channel)
  const selected = cards.filter((card) => selectedCategories.includes(card.value))
  normalizeMapCategories((selected.length ? selected : cards).flatMap((card) => card.categoryIds)).forEach((id) =>
    params.append('category', id)
  )
  getHeaderOffers(channel, offerType ? [offerType] : defaultHeaderOffers).forEach((offer) =>
    params.append('offer_type', offer)
  )
  if (typeof minPrice === 'number' && Number.isSafeInteger(minPrice) && minPrice > 0)
    params.set('price_min', String(minPrice))
  if (typeof maxPrice === 'number' && Number.isSafeInteger(maxPrice) && maxPrice > 0)
    params.set('price_max', String(maxPrice))
  return `/properties/map?${params}`
}
