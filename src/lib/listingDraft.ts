import {
  getBusinessSpaceType,
  getDiscoveryChannel,
  getOfferType,
  getPropertyGroup,
  getPropertyType,
  getUseCase,
} from '@/data/propertyTaxonomy'
import { getAuthApiUrl } from './auth'

export const LISTING_DRAFT_KEY = 'mapxprop_listing_draft'

export type ListingDraftValue = string | string[]
export type ListingDraft = Record<string, ListingDraftValue>
export type ListingMediaType = 'image' | 'video' | '360'

export type ListingMediaInput = {
  url: string
  media_type: ListingMediaType
}

type CloudListingDraftResponse = {
  draft?: {
    data?: ListingDraft
    current_step?: number
    updated_at?: string
  } | null
}

export type CreateListingPayload = {
  discovery_channel_code?: string
  property_group_code?: string
  property_type_code: string
  accommodation_model?: string
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
  price_on_request?: boolean
  currency?: string
  usable_area_sqm?: string
  land_area_sqm?: string
  bedroom_count?: string
  bathroom_count?: string
  parking_count?: string
  max_occupants?: string
  floor_no?: string
  total_floors?: string
  furnishing_status?: string
  property_condition?: string
  occupancy_status?: string
  minimum_lease_months?: string
  pet_allowed?: boolean
  pet_policy_code?: string
  utilities_included?: boolean
  contact_name?: string
  contact_phone?: string
  contact_phone_secondary?: string
  contact_email?: string
  line_id?: string
  instagram_handle?: string
  contact_role_code?: string
  contact_authority_code?: string
  contact_organization_name?: string
  contact_organization_registration_no?: string
  address_line1?: string
  address_line2?: string
  road?: string
  province_name?: string
  district_name?: string
  subdistrict_name?: string
  postal_code?: string
  latitude?: string
  longitude?: string
  business_type_code?: string
  space_type_code?: string
  space_type_codes?: string[]
  target_tenant_type?: string
  price_unit?: string
  key_money_amount?: string
  event_booking_price?: string
  service_fee_monthly?: string
  allowed_business_types?: string[]
  amenities?: string[]
  category_details?: Record<string, string | boolean | string[]>
  media_urls?: string[]
  media_items?: ListingMediaInput[]
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

const CATEGORY_DETAIL_DRAFT_KEYS = [
  'usableAreaSqm',
  'landAreaSqm',
  'Bedroom',
  'Bathroom',
  'Parking',
  'floorNo',
  'totalFloors',
  'furnishingStatus',
  'propertyCondition',
  'occupancyStatus',
  'availableFrom',
  'yearBuilt',
  'renovatedYear',
  'tenureType',
  'facingDirection',
  'houseStyleCode',
  'unitPosition',
  'landWidthM',
  'landDepthM',
  'frontageM',
  'roadWidthM',
  'gatedCommunity',
  'projectCommonFeeMonthly',
  'kitchenType',
  'maidRoomCount',
  'privateGarden',
  'privatePool',
  'condoUnitType',
  'buildingTower',
  'balconyDirection',
  'viewType',
  'ownershipQuota',
  'commonFeeMonthly',
  'sinkingFundPerSqm',
  'hasBalcony',
  'buildingWidthM',
  'buildingDepthM',
  'hasMezzanine',
  'hasElevator',
  'signageSpace',
  'threePhasePower',
  'officeRoomCount',
  'meetingRoomCount',
  'hasPantry',
  'landAreaRai',
  'landAreaNgan',
  'landAreaSqWah',
  'titleDeedType',
  'landShape',
  'accessType',
  'roadSurface',
  'landFillStatus',
  'electricityAvailable',
  'waterAvailable',
  'drainageAvailable',
  'zoningColor',
  'currentLandUse',
  'existingStructures',
  'roomTypeCode',
  'availableRoomCount',
  'bathroomType',
  'roomInventoryDetails',
  'securityDepositAmount',
  'advanceRentMonths',
  'utilityDepositAmount',
  'waterBillingType',
  'waterRate',
  'electricityBillingType',
  'electricityRate',
  'utilitiesIncluded',
  'parkingFeeMonthly',
  'laundryAvailable',
  'Pets',
  'smokingPolicy',
  'foreignTenantAllowed',
  'visitorPolicy',
  'privateEntrance',
  'ownerLivesOnSite',
  'housekeepingFrequency',
  'receptionHours',
  'totalUnits',
  'occupiedUnits',
  'monthlyIncome',
  'monthlyExpenses',
  'buildingLicenseInfo',
  'curfewTime',
  'nearbyInstitution',
  'dormitoryLicenseNumber',
  'managingAgency',
  'occupancyRightType',
  'rightsTransferAllowed',
  'projectConditions',
  'commonFeeIncluded',
  'juristicRules',
  'cancellationPolicy',
  'commercialUseAllowed',
  'handoverCondition',
  'operatingHours',
  'separateEntrance',
  'cookingAllowed',
  'exhaustDuctAvailable',
  'greaseTrapAvailable',
  'workstationCapacity',
  'receptionArea',
  'serverRoom',
  'officeGrade',
  'officeLayout',
  'ceilingHeightM',
  'centralAirConditioning',
  'airConditioningHours',
  'raisedFloor',
  'accessControl',
  'backupGenerator',
  'freightElevator',
  'waterConnection',
  'footTrafficNotes',
  'warehouseType',
  'clearHeightM',
  'floorLoadKgSqm',
  'officeAreaSqm',
  'yardAreaSqm',
  'loadingDockCount',
  'driveInDoorCount',
  'maxTruckSize',
  'fireSprinkler',
  'temperatureControlled',
  'warehouseLicenseInfo',
  'factoryLicenseStatus',
  'factoryLicenseNumber',
  'industrialEstateName',
  'productionAreaSqm',
  'warehouseAreaSqm',
  'powerCapacityKva',
  'craneCapacityTon',
  'wastewaterTreatment',
  'airEmissionSystem',
  'hazardousMaterialsAllowed',
  'hospitalityPropertyType',
  'starRating',
  'currentOperationStatus',
  'operationalRoomCount',
  'averageOccupancyPercent',
  'averageDailyRate',
  'restaurantCount',
  'meetingCapacity',
  'hotelLicenseStatus',
  'hotelLicenseNumber',
  'managementContractStatus',
  'roomTypeSummary',
  'farRatio',
  'osrRatio',
  'amenities[]',
  'allowedBusinessTypes[]',
  'hotelFacilities[]',
  'sharedFacilities[]',
  'servicesIncluded[]',
  'residentGroups[]',
]

export const resetListingDetailsForCategoryChange = (nextChannel: string, nextPropertyType: string) => {
  if (typeof window === 'undefined') return

  const draft = getListingDraft()
  const currentChannel = text(draft.discovery_channel_code)
  const currentPropertyType = text(draft.property_type_code)
  if (
    (!currentChannel && !currentPropertyType) ||
    (currentChannel === nextChannel && currentPropertyType === nextPropertyType)
  ) {
    return
  }

  const next = { ...draft }
  CATEGORY_DETAIL_DRAFT_KEYS.forEach((key) => delete next[key])
  localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(next))
}

export const saveListingStep = (step: number, formData: FormData): ListingDraft => {
  if (typeof window === 'undefined') {
    return {}
  }

  const current = getListingDraft()
  const next: ListingDraft = { ...current, lastStep: String(step), updatedAt: new Date().toISOString() }

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
  return next
}

export const saveListingDraftToCloud = async (draft: ListingDraft = getListingDraft()) => {
  if (Object.keys(draft).length === 0) {
    return null
  }

  const response = await fetch(getAuthApiUrl('listing-draft'), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: draft,
      current_step: Number(text(draft.lastStep) || '1'),
    }),
  })

  if (!response.ok) {
    throw new Error('Cannot save listing draft right now')
  }

  return (await response.json().catch(() => ({}))) as CloudListingDraftResponse
}

export const loadListingDraftFromCloud = async () => {
  const response = await fetch(getAuthApiUrl('listing-draft'), {
    cache: 'no-store',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Cannot load listing draft right now')
  }

  const result = (await response.json()) as CloudListingDraftResponse
  return result.draft ?? null
}

export const syncListingDraftAfterAuth = async () => {
  if (typeof window === 'undefined') {
    return {}
  }

  const localDraft = getListingDraft()
  if (Object.keys(localDraft).length > 0) {
    await saveListingDraftToCloud(localDraft)
    return localDraft
  }

  const cloudDraft = await loadListingDraftFromCloud()
  if (!cloudDraft?.data || Object.keys(cloudDraft.data).length === 0) {
    return {}
  }

  localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(cloudDraft.data))
  return cloudDraft.data
}

export const clearCloudListingDraft = async () => {
  const response = await fetch(getAuthApiUrl('listing-draft'), {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok && response.status !== 404) {
    throw new Error('Cannot clear listing draft right now')
  }
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

export const uploadListingMedia = async (files: File[], mediaType: ListingMediaType) => {
  const urls: string[] = []
  const limit = mediaType === 'image' ? 10 : 4

  for (const file of files.slice(0, limit)) {
    const formData = new FormData()
    formData.set('file', file)
    formData.set('media_type', mediaType)
    const response = await fetch(getAuthApiUrl('listing-media'), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!response.ok || !data.url) {
      throw new Error(data.error || `Unable to upload ${file.name}`)
    }
    urls.push(data.url)
  }

  return urls
}

export const uploadListingPhotos = (files: File[]) => uploadListingMedia(files, 'image')

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
  const primarySpaceTypeCode = normalizeCode(text(draft.space_type_code))
  const spaceTypeCodes = [primarySpaceTypeCode, ...values(draft['spaceTypeCodes[]']).map(normalizeCode)].filter(
    (value, index, all) => Boolean(value) && all.indexOf(value) === index
  )
  const photoURLs = values(draft['listingPhotoUrls[]'])
  const videoURLs = values(draft['listingVideoUrls[]'])
  const panoramaURLs = values(draft['listingPanoramaUrls[]'])
  const petPolicyCode = normalizeCode(text(draft.Pets))

  return {
    discovery_channel_code: normalizeCode(text(draft.discovery_channel_code)),
    property_group_code: normalizeCode(text(draft.property_group_code)),
    property_type_code: normalizeCode(text(draft.property_type_code) || text(draft.propertyType) || 'condo'),
    accommodation_model: normalizeCode(text(draft.accommodation_model)),
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
    price_on_request: text(draft.priceOnRequest) === 'yes',
    currency: text(draft.currency) || 'THB',
    usable_area_sqm: text(draft.usableAreaSqm || draft.acreage),
    land_area_sqm: text(draft.landAreaSqm),
    bedroom_count: text(draft.Bedroom),
    bathroom_count: text(draft.Bathroom),
    parking_count: text(draft.Parking),
    max_occupants: text(draft.Guests),
    floor_no: text(draft.floorNo),
    total_floors: text(draft.totalFloors),
    furnishing_status: normalizeCode(text(draft.furnishingStatus)),
    property_condition: normalizeCode(text(draft.propertyCondition)),
    occupancy_status: normalizeCode(text(draft.occupancyStatus)),
    minimum_lease_months: text(draft.minimumLeaseMonths || draft['Nights-min']),
    pet_allowed: petPolicyCode === 'allowed' || petPolicyCode === 'case_by_case',
    pet_policy_code: petPolicyCode,
    utilities_included: text(draft.utilitiesIncluded) === 'yes',
    contact_name: text(draft.contactName),
    contact_phone: text(draft.contactPhone),
    contact_phone_secondary: text(draft.contactPhoneSecondary),
    contact_email: text(draft.contactEmail),
    line_id: text(draft.lineId),
    instagram_handle: text(draft.instagramHandle),
    contact_role_code: normalizeCode(text(draft.contactRoleCode)),
    contact_authority_code: normalizeCode(text(draft.contactAuthorityCode)),
    contact_organization_name: text(draft.contactOrganizationName),
    contact_organization_registration_no: text(draft.contactOrganizationRegistrationNo),
    address_line1: text(draft.Street),
    address_line2: [text(draft.subdistrict), text(draft.city), text(draft.state)].filter(Boolean).join(', '),
    road: text(draft.Street),
    province_name: text(draft.state),
    district_name: text(draft.city),
    subdistrict_name: text(draft.subdistrict),
    postal_code: text(draft.Postal),
    latitude: text(draft.latMapPosition),
    longitude: text(draft.lngMapPosition),
    business_type_code: normalizeCode(text(draft.business_type_code)),
    space_type_code: spaceTypeCodes[0] || '',
    space_type_codes: spaceTypeCodes,
    price_unit:
      normalizeCode(text(draft.price_unit)) ||
      (listingType === 'event_booking' ? 'event_round' : listingType.includes('rent') ? 'month' : ''),
    key_money_amount: text(draft.keyMoneyAmount),
    event_booking_price: text(draft.eventBookingPrice),
    service_fee_monthly: text(draft.serviceFeeMonthly),
    allowed_business_types: allowedBusinessTypes,
    amenities: [
      ...values(draft['amenities[]']),
      ...values(draft['otherAmenities[]']),
      ...values(draft['safeAmenities[]']),
    ],
    category_details: buildCategoryDetails(draft),
    media_urls: photoURLs,
    media_items: [
      ...photoURLs.map((url) => ({ url, media_type: 'image' as const })),
      ...videoURLs.map((url) => ({ url, media_type: 'video' as const })),
      ...panoramaURLs.map((url) => ({ url, media_type: '360' as const })),
    ],
  }
}

const buildCategoryDetails = (draft: ListingDraft): Record<string, string | boolean | string[]> => {
  const details: Record<string, string | boolean | string[]> = {
    details_status: 'structured',
    can_complete_later: true,
    discovery_channel_code: normalizeCode(text(draft.discovery_channel_code)),
    accommodation_model: normalizeCode(text(draft.accommodation_model)),
    selected_photo_count: text(draft.selectedPhotoCount),
    selected_video_count: text(draft.selectedVideoCount),
    selected_panorama_count: text(draft.selectedPanoramaCount),
  }

  const textFields: Array<[string, string, boolean?]> = [
    ['available_from', 'availableFrom'],
    ['year_built', 'yearBuilt'],
    ['renovated_year', 'renovatedYear'],
    ['tenure_type', 'tenureType', true],
    ['facing_direction', 'facingDirection', true],
    ['house_style_code', 'houseStyleCode', true],
    ['unit_position', 'unitPosition', true],
    ['land_width_m', 'landWidthM'],
    ['land_depth_m', 'landDepthM'],
    ['frontage_m', 'frontageM'],
    ['road_width_m', 'roadWidthM'],
    ['gated_community', 'gatedCommunity', true],
    ['project_common_fee_monthly', 'projectCommonFeeMonthly'],
    ['kitchen_type', 'kitchenType', true],
    ['maid_room_count', 'maidRoomCount'],
    ['private_garden', 'privateGarden', true],
    ['private_pool', 'privatePool', true],
    ['condo_unit_type', 'condoUnitType', true],
    ['building_tower', 'buildingTower'],
    ['balcony_direction', 'balconyDirection', true],
    ['view_type', 'viewType', true],
    ['ownership_quota', 'ownershipQuota', true],
    ['common_fee_monthly', 'commonFeeMonthly'],
    ['sinking_fund_per_sqm', 'sinkingFundPerSqm'],
    ['has_balcony', 'hasBalcony', true],
    ['building_width_m', 'buildingWidthM'],
    ['building_depth_m', 'buildingDepthM'],
    ['has_mezzanine', 'hasMezzanine', true],
    ['has_elevator', 'hasElevator', true],
    ['signage_space', 'signageSpace', true],
    ['three_phase_power', 'threePhasePower', true],
    ['office_room_count', 'officeRoomCount'],
    ['meeting_room_count', 'meetingRoomCount'],
    ['has_pantry', 'hasPantry', true],
    ['land_area_rai', 'landAreaRai'],
    ['land_area_ngan', 'landAreaNgan'],
    ['land_area_sq_wah', 'landAreaSqWah'],
    ['title_deed_type', 'titleDeedType', true],
    ['land_shape', 'landShape', true],
    ['access_type', 'accessType', true],
    ['road_surface', 'roadSurface', true],
    ['land_fill_status', 'landFillStatus', true],
    ['electricity_available', 'electricityAvailable', true],
    ['water_available', 'waterAvailable', true],
    ['drainage_available', 'drainageAvailable', true],
    ['zoning_color', 'zoningColor'],
    ['current_land_use', 'currentLandUse'],
    ['existing_structures', 'existingStructures'],
    ['room_type_code', 'roomTypeCode', true],
    ['available_room_count', 'availableRoomCount'],
    ['bathroom_type', 'bathroomType', true],
    ['room_inventory_details', 'roomInventoryDetails'],
    ['security_deposit_amount', 'securityDepositAmount'],
    ['advance_rent_months', 'advanceRentMonths'],
    ['utility_deposit_amount', 'utilityDepositAmount'],
    ['water_billing_type', 'waterBillingType', true],
    ['water_rate', 'waterRate'],
    ['electricity_billing_type', 'electricityBillingType', true],
    ['electricity_rate', 'electricityRate'],
    ['utilities_included', 'utilitiesIncluded', true],
    ['parking_fee_monthly', 'parkingFeeMonthly'],
    ['laundry_available', 'laundryAvailable', true],
    ['smoking_policy', 'smokingPolicy', true],
    ['foreign_tenant_allowed', 'foreignTenantAllowed', true],
    ['visitor_policy', 'visitorPolicy'],
    ['private_entrance', 'privateEntrance', true],
    ['owner_lives_on_site', 'ownerLivesOnSite', true],
    ['housekeeping_frequency', 'housekeepingFrequency'],
    ['reception_hours', 'receptionHours'],
    ['total_units', 'totalUnits'],
    ['occupied_units', 'occupiedUnits'],
    ['monthly_income', 'monthlyIncome'],
    ['monthly_expenses', 'monthlyExpenses'],
    ['building_license_info', 'buildingLicenseInfo'],
    ['curfew_time', 'curfewTime'],
    ['nearby_institution', 'nearbyInstitution'],
    ['dormitory_license_number', 'dormitoryLicenseNumber'],
    ['managing_agency', 'managingAgency'],
    ['occupancy_right_type', 'occupancyRightType', true],
    ['rights_transfer_allowed', 'rightsTransferAllowed', true],
    ['project_conditions', 'projectConditions'],
    ['common_fee_included', 'commonFeeIncluded', true],
    ['juristic_rules', 'juristicRules'],
    ['cancellation_policy', 'cancellationPolicy'],
    ['commercial_use_allowed', 'commercialUseAllowed', true],
    ['handover_condition', 'handoverCondition', true],
    ['operating_hours', 'operatingHours'],
    ['separate_entrance', 'separateEntrance', true],
    ['cooking_allowed', 'cookingAllowed', true],
    ['exhaust_duct_available', 'exhaustDuctAvailable', true],
    ['grease_trap_available', 'greaseTrapAvailable', true],
    ['workstation_capacity', 'workstationCapacity'],
    ['reception_area', 'receptionArea', true],
    ['server_room', 'serverRoom', true],
    ['office_grade', 'officeGrade', true],
    ['office_layout', 'officeLayout', true],
    ['ceiling_height_m', 'ceilingHeightM'],
    ['central_air_conditioning', 'centralAirConditioning', true],
    ['air_conditioning_hours', 'airConditioningHours'],
    ['raised_floor', 'raisedFloor', true],
    ['access_control', 'accessControl', true],
    ['backup_generator', 'backupGenerator', true],
    ['freight_elevator', 'freightElevator', true],
    ['water_connection', 'waterConnection', true],
    ['foot_traffic_notes', 'footTrafficNotes'],
    ['warehouse_type', 'warehouseType', true],
    ['clear_height_m', 'clearHeightM'],
    ['floor_load_kg_sqm', 'floorLoadKgSqm'],
    ['office_area_sqm', 'officeAreaSqm'],
    ['yard_area_sqm', 'yardAreaSqm'],
    ['loading_dock_count', 'loadingDockCount'],
    ['drive_in_door_count', 'driveInDoorCount'],
    ['max_truck_size', 'maxTruckSize', true],
    ['fire_sprinkler', 'fireSprinkler', true],
    ['temperature_controlled', 'temperatureControlled', true],
    ['warehouse_license_info', 'warehouseLicenseInfo'],
    ['factory_license_status', 'factoryLicenseStatus', true],
    ['factory_license_number', 'factoryLicenseNumber'],
    ['industrial_estate_name', 'industrialEstateName'],
    ['production_area_sqm', 'productionAreaSqm'],
    ['warehouse_area_sqm', 'warehouseAreaSqm'],
    ['power_capacity_kva', 'powerCapacityKva'],
    ['crane_capacity_ton', 'craneCapacityTon'],
    ['wastewater_treatment', 'wastewaterTreatment', true],
    ['air_emission_system', 'airEmissionSystem', true],
    ['hazardous_materials_allowed', 'hazardousMaterialsAllowed', true],
    ['hospitality_property_type', 'hospitalityPropertyType', true],
    ['star_rating', 'starRating'],
    ['current_operation_status', 'currentOperationStatus', true],
    ['operational_room_count', 'operationalRoomCount'],
    ['average_occupancy_percent', 'averageOccupancyPercent'],
    ['average_daily_rate', 'averageDailyRate'],
    ['restaurant_count', 'restaurantCount'],
    ['meeting_capacity', 'meetingCapacity'],
    ['hotel_license_status', 'hotelLicenseStatus', true],
    ['hotel_license_number', 'hotelLicenseNumber'],
    ['management_contract_status', 'managementContractStatus', true],
    ['room_type_summary', 'roomTypeSummary'],
    ['far_ratio', 'farRatio'],
    ['osr_ratio', 'osrRatio'],
  ]

  for (const [detailKey, draftKey, normalize] of textFields) {
    const value = text(draft[draftKey])
    if (value) details[detailKey] = normalize ? normalizeCode(value) : value
  }

  const arrayFields: Array<[string, string]> = [
    ['shared_facilities', 'sharedFacilities[]'],
    ['services_included', 'servicesIncluded[]'],
    ['resident_groups', 'residentGroups[]'],
    ['hotel_facilities', 'hotelFacilities[]'],
  ]
  for (const [detailKey, draftKey] of arrayFields) {
    const selected = values(draft[draftKey]).map(normalizeCode).filter(Boolean)
    if (selected.length) details[detailKey] = selected
  }

  return details
}

export const getListingDraftSummary = (locale: 'th' | 'en' = 'th') => {
  const draft = getListingDraft()
  const payload = buildCreateListingPayload(draft)

  return {
    draft,
    payload,
    discoveryChannel: discoveryChannelLabel(payload.discovery_channel_code, locale),
    propertyType:
      payload.property_type_code === 'apartment' && payload.accommodation_model === 'serviced'
        ? locale === 'th'
          ? 'เซอร์วิสอพาร์ตเมนต์'
          : 'Serviced apartment'
        : propertyTypeLabel(payload.property_type_code, locale),
    businessSpaceType: (payload.space_type_codes || [])
      .map(
        (code) => (locale === 'th' ? getBusinessSpaceType(code)?.nameTh : getBusinessSpaceType(code)?.nameEn) || code
      )
      .join(', '),
    propertyGroup: propertyGroupLabel(payload.property_group_code, locale),
    listingScope: listingScopeLabel(payload.listing_scope, locale),
    listingType: offerTypeLabels(payload.offer_types, payload.listing_type, locale),
    usageType: formatUseCaseLabels(payload.use_case_codes, payload.usage_type, locale),
    price: priceSummary(payload, locale),
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
  if (['office', 'warehouse', 'factory', 'hotel_resort'].includes(propertyType)) {
    return 'business'
  }
  return 'residence'
}

const propertyTypeLabel = (value: string, locale: 'th' | 'en' = 'th') => {
  const taxonomyType = getPropertyType(value)
  if (taxonomyType) {
    return locale === 'th' ? taxonomyType.nameTh : taxonomyType.nameEn
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
    hotel_resort: 'Hotel / resort property',
    land: 'Land',
  }
  return labels[value] || value
}

const propertyGroupLabel = (value: string | undefined, locale: 'th' | 'en') =>
  value ? (locale === 'th' ? getPropertyGroup(value)?.nameTh : getPropertyGroup(value)?.nameEn) || value : ''
const discoveryChannelLabel = (value: string | undefined, locale: 'th' | 'en') =>
  value ? (locale === 'th' ? getDiscoveryChannel(value)?.nameTh : getDiscoveryChannel(value)?.nameEn) || value : ''
const listingScopeLabel = (value: string | undefined, locale: 'th' | 'en') => {
  const labels: Record<string, { th: string; en: string }> = {
    single_unit: { th: 'ห้องหรือยูนิตเดียว', en: 'Single room or unit' },
    whole_property: { th: 'ทั้งหลังหรือทั้งอาคาร', en: 'Whole property or building' },
    multi_unit: { th: 'หลายห้องหรือหลายยูนิต', en: 'Multiple rooms or units' },
    land_plot: { th: 'แปลงที่ดิน', en: 'Land plot' },
    space_slot: { th: 'พื้นที่ย่อย ล็อก หรือคีออส', en: 'Stall, kiosk or small space' },
  }
  return value ? labels[value]?.[locale] || value : ''
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

const offerTypeLabels = (values: string[] | undefined, fallback: string, locale: 'th' | 'en') => {
  if (!values?.length) return legacyListingTypeLabel(fallback)
  return values
    .map((value) => (locale === 'th' ? getOfferType(value)?.nameTh : getOfferType(value)?.nameEn) || value)
    .join(' + ')
}

const formatUseCaseLabels = (values: string[] | undefined, fallback: string, locale: 'th' | 'en') => {
  if (!values?.length) return legacyUsageTypeLabel(fallback)
  return values
    .map((value) => (locale === 'th' ? getUseCase(value)?.nameTh : getUseCase(value)?.nameEn) || value)
    .join(', ')
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

const priceSummary = (payload: CreateListingPayload, locale: 'th' | 'en') => {
  if (payload.price_on_request) return locale === 'th' ? 'สอบถามราคา' : 'Price on request'
  const currency = payload.currency || 'THB'
  const unit = currency === 'THB' ? (locale === 'th' ? 'บาท' : 'THB') : currency
  const prices: string[] = []
  if (payload.sale_price)
    prices.push(locale === 'th' ? `ขาย ${payload.sale_price} ${unit}` : `Sale ${payload.sale_price} ${unit}`)
  if (payload.rent_price_monthly)
    prices.push(
      locale === 'th'
        ? `เช่า ${payload.rent_price_monthly} ${unit}/เดือน`
        : `Rent ${payload.rent_price_monthly} ${unit}/month`
    )
  if (payload.rent_price_daily)
    prices.push(
      locale === 'th' ? `เช่า ${payload.rent_price_daily} ${unit}/วัน` : `Rent ${payload.rent_price_daily} ${unit}/day`
    )
  if (payload.key_money_amount && payload.offer_types?.includes('business_transfer')) {
    prices.push(
      locale === 'th' ? `เซ้ง ${payload.key_money_amount} ${unit}` : `Transfer ${payload.key_money_amount} ${unit}`
    )
  }
  if (payload.event_booking_price && payload.offer_types?.includes('event_booking')) {
    prices.push(
      locale === 'th'
        ? `รอบงาน ${payload.event_booking_price} ${unit}`
        : `Event period ${payload.event_booking_price} ${unit}`
    )
  }
  return prices.join(' · ') || (locale === 'th' ? 'ยังไม่ระบุราคา' : 'Price not specified')
}
