import { getOfferType, getPropertyGroup, getPropertyType, getUseCase } from '@/data/propertyTaxonomy'
import { getAuthApiUrl } from './auth'

export const LISTING_DRAFT_KEY = 'mapxprop_listing_draft'

export type ListingDraftValue = string | string[]
export type ListingDraft = Record<string, ListingDraftValue>

export type CreateListingPayload = {
  property_group_code?: string
  property_type_code: string
  listing_scope?: string
  use_case_codes?: string[]
  offer_types?: string[]
  usage_type: string
  listing_type: string
  title: string
  description?: string
  custom_project_name?: string
  custom_unit_number?: string
  sale_price?: string
  rent_price_monthly?: string
  rent_price_daily?: string
  price_negotiable?: boolean
  usable_area_sqm?: string
  land_area_sqm?: string
  bedroom_count?: string
  bathroom_count?: string
  parking_count?: string
  max_occupants?: string
  floor_no?: string
  total_floors?: string
  furnishing_status?: string
  minimum_lease_months?: string
  pet_allowed?: boolean
  pet_policy_code?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  line_id?: string
  address_line1?: string
  address_line2?: string
  postal_code?: string
  latitude?: string
  longitude?: string
  business_type_code?: string
  space_type_code?: string
  target_tenant_type?: string
  price_unit?: string
  key_money_amount?: string
  service_fee_monthly?: string
  allowed_business_types?: string[]
  amenities?: string[]
}

export type CreateListingResponse = {
  success?: boolean
  public_listing_id?: string
  slug?: string
  status?: string
  error?: string
}

export const getListingDraft = (): ListingDraft => {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = localStorage.getItem(LISTING_DRAFT_KEY)
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw) as ListingDraft
  } catch {
    localStorage.removeItem(LISTING_DRAFT_KEY)
    return {}
  }
}

export const clearListingDraft = () => {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem(LISTING_DRAFT_KEY)
}

export const saveListingStep = (step: number, formData: FormData) => {
  if (typeof window === 'undefined') {
    return
  }

  const current = getListingDraft()
  const next: ListingDraft = { ...current, lastStep: String(step) }

  for (const key of Array.from(formData.keys())) {
    const values = formData
      .getAll(key)
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)

    if (values.length === 0) {
      delete next[key]
      continue
    }

    next[key] = key.endsWith('[]') ? values : values[0]
  }

  localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(next))
}

export const publishListingDraft = async () => {
  const payload = buildCreateListingPayload(getListingDraft())

  const response = await fetch(getAuthApiUrl('listings'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => ({}))) as CreateListingResponse
  if (!response.ok) {
    throw new Error(data.error || 'Cannot publish listing right now')
  }

  return data
}

export const buildCreateListingPayload = (draft: ListingDraft): CreateListingPayload => {
  const title = text(draft.listingTitle) || text(draft.placeName) || 'New property listing'
  const descriptionParts = [text(draft.listingDescription), text(draft['place-description'])].filter(Boolean)
  const listingType = text(draft.listing_type) || 'rent'
  const useCaseCodes = values(draft['useCaseCodes[]']).length
    ? values(draft['useCaseCodes[]'])
    : mapLegacyUsageToUseCases(text(draft.usage_type))
  const offerTypeCodes = values(draft['offerTypes[]']).length
    ? values(draft['offerTypes[]'])
    : offersFromLegacy(listingType)
  const allowedBusinessTypes = [
    ...values(draft['allowedBusinessTypes[]']),
    ...useCaseCodes.filter((code) => code !== 'residential'),
  ].filter((value, index, all) => all.indexOf(value) === index)

  return {
    property_group_code: normalizeCode(text(draft.property_group_code)),
    property_type_code: normalizeCode(text(draft.property_type_code) || text(draft.propertyType) || 'condo'),
    listing_scope: normalizeCode(text(draft.listing_scope)) || 'whole_property',
    use_case_codes: useCaseCodes.map(normalizeCode),
    offer_types: offerTypeCodes.map(normalizeCode),
    usage_type: normalizeCode(text(draft.usage_type) || inferUsageType(draft)),
    listing_type: normalizeCode(listingType),
    title,
    description: descriptionParts.join('\n\n'),
    custom_project_name: text(draft.placeName),
    custom_unit_number: text(draft['room-number']),
    sale_price: text(draft.salePrice),
    rent_price_monthly: text(draft.rentPriceMonthly || draft['base-price1']),
    rent_price_daily: text(draft.rentPriceDaily || draft['base-price2']),
    price_negotiable: text(draft.priceNegotiable) === 'yes',
    usable_area_sqm: text(draft.usableAreaSqm || draft.acreage),
    land_area_sqm: text(draft.landAreaSqm),
    bedroom_count: text(draft.Bedroom),
    bathroom_count: text(draft.Bathroom),
    parking_count: text(draft.Parking),
    max_occupants: text(draft.Guests),
    floor_no: text(draft.floorNo),
    total_floors: text(draft.totalFloors),
    furnishing_status: normalizeCode(text(draft.furnishingStatus)),
    minimum_lease_months: text(draft.minimumLeaseMonths || draft['Nights-min']),
    pet_allowed: text(draft.Pets) !== 'not',
    pet_policy_code: normalizeCode(text(draft.Pets)),
    contact_name: text(draft.contactName),
    contact_phone: text(draft.contactPhone),
    contact_email: text(draft.contactEmail),
    line_id: text(draft.lineId),
    address_line1: text(draft.Street),
    address_line2: [text(draft.subdistrict), text(draft.city), text(draft.state)].filter(Boolean).join(', '),
    postal_code: text(draft.Postal),
    latitude: text(draft.latMapPosition),
    longitude: text(draft.lngMapPosition),
    business_type_code: normalizeCode(text(draft.business_type_code)),
    space_type_code: normalizeCode(text(draft.space_type_code)),
    price_unit: normalizeCode(text(draft.price_unit)) || (listingType.includes('rent') ? 'month' : ''),
    key_money_amount: text(draft.keyMoneyAmount),
    service_fee_monthly: text(draft.serviceFeeMonthly),
    allowed_business_types: allowedBusinessTypes,
    amenities: [
      ...values(draft['amenities[]']),
      ...values(draft['otherAmenities[]']),
      ...values(draft['safeAmenities[]']),
    ],
  }
}

export const getListingDraftSummary = () => {
  const draft = getListingDraft()
  const payload = buildCreateListingPayload(draft)

  return {
    draft,
    payload,
    propertyType: propertyTypeLabel(payload.property_type_code),
    propertyGroup: propertyGroupLabel(payload.property_group_code),
    listingScope: listingScopeLabel(payload.listing_scope),
    listingType: offerTypeLabels(payload.offer_types, payload.listing_type),
    usageType: formatUseCaseLabels(payload.use_case_codes, payload.usage_type),
    price: priceSummary(payload),
    location: [payload.address_line1, payload.address_line2, payload.postal_code].filter(Boolean).join(', '),
  }
}

const text = (value: ListingDraftValue | undefined) => {
  if (Array.isArray(value)) {
    return value[0] || ''
  }
  return value || ''
}

const values = (value: ListingDraftValue | undefined) => {
  if (!value) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

const normalizeCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const inferUsageType = (draft: ListingDraft) => {
  const propertyType = normalizeCode(text(draft.property_type_code) || text(draft.propertyType))
  if (propertyType === 'shophouse' || propertyType === 'home_office') {
    return 'mixed'
  }
  if (['office', 'warehouse', 'factory'].includes(propertyType)) {
    return 'business'
  }
  return 'residence'
}

const propertyTypeLabel = (value: string) => {
  const taxonomyType = getPropertyType(value)
  if (taxonomyType) {
    return taxonomyType.nameTh
  }

  const labels: Record<string, string> = {
    condo: 'Condo',
    house: 'House',
    townhouse: 'Townhouse',
    shophouse: 'Shophouse / ตึกแถว',
    home_office: 'Home office',
    apartment: 'Apartment',
    office: 'Office',
    warehouse: 'Warehouse',
    factory: 'Factory',
    land: 'Land',
  }
  return labels[value] || value
}

const propertyGroupLabel = (value?: string) => (value ? getPropertyGroup(value)?.nameTh || value : '')
const listingScopeLabel = (value?: string) => {
  const labels: Record<string, string> = {
    single_unit: 'ห้องหรือยูนิตเดียว',
    whole_property: 'ทั้งหลังหรือทั้งอาคาร',
    multi_unit: 'หลายห้องหรือหลายยูนิต',
    land_plot: 'แปลงที่ดิน',
    space_slot: 'พื้นที่ย่อย ล็อก หรือคีออส',
  }
  return value ? labels[value] || value : ''
}

const legacyListingTypeLabel = (value: string) => {
  const labels: Record<string, string> = {
    sale: 'For sale',
    rent: 'For rent',
    sale_and_rent: 'Sale and rent',
    lease: 'Lease',
    sublease: 'Sublease',
    business_transfer: 'Business transfer',
  }
  return labels[value] || value
}

const legacyUsageTypeLabel = (value: string) => {
  const labels: Record<string, string> = {
    residence: 'Residence',
    business: 'Business',
    mixed: 'Mixed use',
  }
  return labels[value] || value
}

const offerTypeLabels = (values: string[] | undefined, fallback: string) => {
  if (!values?.length) return legacyListingTypeLabel(fallback)
  return values.map((value) => getOfferType(value)?.nameTh || value).join(' + ')
}

const formatUseCaseLabels = (values: string[] | undefined, fallback: string) => {
  if (!values?.length) return legacyUsageTypeLabel(fallback)
  return values.map((value) => getUseCase(value)?.nameTh || value).join(', ')
}

const offersFromLegacy = (listingType: string) => {
  if (listingType === 'sale_and_rent') return ['sale', 'rent']
  return listingType ? [listingType] : ['rent']
}

const mapLegacyUsageToUseCases = (usageType: string) => {
  if (usageType === 'business') return ['office']
  if (usageType === 'mixed') return ['residential', 'office']
  return ['residential']
}

const priceSummary = (payload: CreateListingPayload) => {
  const prices: string[] = []
  if (payload.sale_price) prices.push(`ขาย ${payload.sale_price} บาท`)
  if (payload.rent_price_monthly) prices.push(`เช่า ${payload.rent_price_monthly} บาท/เดือน`)
  if (payload.rent_price_daily) prices.push(`เช่า ${payload.rent_price_daily} บาท/วัน`)
  if (payload.key_money_amount && payload.offer_types?.includes('business_transfer')) {
    prices.push(`เซ้ง ${payload.key_money_amount} บาท`)
  }
  return prices.join(' · ') || 'ยังไม่ระบุราคา'
}
