import type { DiscoveryChannelCode } from '@/data/propertyTaxonomy'

export type HeaderOfferType = 'sale' | 'rent'
export const defaultHeaderOffers: HeaderOfferType[] = ['sale', 'rent']

export function toggleHeaderOffer(offers: HeaderOfferType[], offer: HeaderOfferType): HeaderOfferType[] {
  if (!offers.includes(offer)) return [...offers, offer]
  return offers.length > 1 ? offers.filter((value) => value !== offer) : offers
}

export function getHeaderMapSearchUrl(query: string, channel: DiscoveryChannelCode, offers: HeaderOfferType[]) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  params.set('channel', channel)
  const selected = [...new Set(offers)].filter((offer) => offer === 'sale' || offer === 'rent')
  ;(selected.length ? selected : defaultHeaderOffers).forEach((offer) => params.append('offer_type', offer))
  return `/properties/map?${params}`
}

export const getPropertyHeaderLayout = (value: string | null) =>
  value === 'classic' ? ('classic' as const) : ('search-first' as const)
