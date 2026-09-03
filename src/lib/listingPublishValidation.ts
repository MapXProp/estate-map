import {
  getBusinessSpaceType,
  getDiscoveryChannel,
  getPropertyType,
  type ListingScopeCode,
  type OfferTypeCode,
  type UseCaseCode,
} from '@/data/propertyTaxonomy'
import type { ListingDraft, ListingDraftValue } from './listingDraft'

export const LISTING_PUBLISH_VALIDATION_ISSUE_KEY = 'mapxprop_listing_publish_validation_issue'

export type ListingPublishValidationIssue = {
  code: string
  step: 1 | 2 | 3
  section?: number
  target?: 'field' | 'location' | 'wizard'
  fieldName?: string
  messageTh: string
  messageEn: string
}

const text = (value: ListingDraftValue | undefined) => (Array.isArray(value) ? value[0] || '' : value || '').trim()

const values = (value: ListingDraftValue | undefined) =>
  (value ? (Array.isArray(value) ? value : [value]) : []).map((item) => item.trim()).filter(Boolean)

const issue = (
  code: string,
  step: 1 | 2 | 3,
  messageTh: string,
  messageEn: string,
  options: Pick<ListingPublishValidationIssue, 'section' | 'target' | 'fieldName'> = {}
): ListingPublishValidationIssue => ({ code, step, messageTh, messageEn, ...options })

const parseNumber = (value: string) => Number(value.replaceAll(',', '').trim())
const isPositiveNumber = (value: string) => Number.isFinite(parseNumber(value)) && parseNumber(value) > 0
const isNonNegativeNumber = (value: string) => Number.isFinite(parseNumber(value)) && parseNumber(value) >= 0
const isNonNegativeInteger = (value: string) => {
  const parsed = parseNumber(value)
  return Number.isInteger(parsed) && parsed >= 0
}
const isPositiveInteger = (value: string) => {
  const parsed = parseNumber(value)
  return Number.isInteger(parsed) && parsed > 0
}

export const validateListingDraftForPublish = (draft: ListingDraft): ListingPublishValidationIssue | null => {
  const channel = getDiscoveryChannel(text(draft.discovery_channel_code))
  if (!channel) {
    return issue('discovery_channel_required', 1, 'กรุณาเลือกหมวดหลักของประกาศ', 'Choose a main listing category.', {
      section: 1,
      target: 'wizard',
    })
  }

  const propertyType = getPropertyType(text(draft.property_type_code))
  if (!propertyType || !channel.propertyTypeCodes.includes(propertyType.code)) {
    return issue('property_type_required', 1, 'กรุณาเลือกประเภททรัพย์', 'Choose a property type.', {
      section: 2,
      target: 'wizard',
    })
  }

  if (text(draft.property_group_code) !== propertyType.groupCode) {
    return issue('property_group_invalid', 1, 'กรุณาเลือกประเภททรัพย์ใหม่อีกครั้ง', 'Choose the property type again.', {
      section: 2,
      target: 'wizard',
    })
  }

  if (propertyType.code === 'apartment' && !['standard', 'serviced'].includes(text(draft.accommodation_model))) {
    return issue('accommodation_model_required', 1, 'กรุณาเลือกรูปแบบอพาร์ตเมนต์', 'Choose an apartment model.', {
      section: 2,
      target: 'wizard',
    })
  }

  const spaceTypes = [text(draft.space_type_code), ...values(draft['spaceTypeCodes[]'])].filter(
    (value, index, all) => Boolean(value) && all.indexOf(value) === index
  )
  if (propertyType.supportsBusinessSpaceType && !spaceTypes.length) {
    return issue('business_space_type_required', 1, 'กรุณาเลือกรูปแบบพื้นที่ค้าขาย', 'Choose a business space type.', {
      section: 2,
      target: 'wizard',
    })
  }
  if (
    spaceTypes.length > 2 ||
    spaceTypes.some((spaceType) => !getBusinessSpaceType(spaceType)) ||
    (!propertyType.supportsBusinessSpaceType && spaceTypes.length > 0)
  ) {
    return issue(
      'business_space_type_invalid',
      1,
      'กรุณาเลือกรูปแบบพื้นที่ค้าขายใหม่อีกครั้ง',
      'Choose the business space type again.',
      {
        section: 2,
        target: 'wizard',
      }
    )
  }

  if (!propertyType.allowedScopes.includes(text(draft.listing_scope) as ListingScopeCode)) {
    return issue('listing_scope_required', 1, 'กรุณาเลือกลักษณะพื้นที่ของประกาศ', 'Choose the listing scope.', {
      section: 3,
      target: 'wizard',
    })
  }

  const useCases = values(draft['useCaseCodes[]'])
  if (useCases.some((value) => !propertyType.allowedUseCases.includes(value as UseCaseCode))) {
    return issue('use_case_invalid', 1, 'กรุณาเลือกการใช้งานของทรัพย์ใหม่อีกครั้ง', 'Choose the property uses again.', {
      section: 3,
      target: 'wizard',
    })
  }

  const offerTypes = values(draft['offerTypes[]']).map((value) =>
    value === 'event_booking' ? 'contact_organizer' : value
  )
  if (!offerTypes.length || offerTypes.some((value) => !propertyType.allowedOffers.includes(value as OfferTypeCode))) {
    return issue(
      'offer_type_required',
      1,
      'กรุณาเลือกรูปแบบการประกาศอย่างน้อยหนึ่งรายการ',
      'Choose at least one listing option.',
      {
        section: 3,
        target: 'wizard',
      }
    )
  }
  if (offerTypes.includes('contact_organizer') && offerTypes.length > 1) {
    return issue(
      'contact_organizer_exclusive',
      1,
      'เลือก “ติดต่อผู้จัดงาน” เพียงรายการเดียว หรือเลือกรูปแบบที่มีราคา',
      'Choose “Contact organizer” by itself, or choose a priced listing option.',
      { section: 3, target: 'wizard' }
    )
  }

  if (!text(draft.listingTitle)) {
    return issue('listing_title_required', 1, 'กรุณากรอกหัวข้อประกาศ', 'Enter a listing title.', {
      section: 4,
      target: 'field',
      fieldName: 'listingTitle',
    })
  }

  if (Array.from(text(draft.listingTitle)).length > 160) {
    return issue(
      'listing_title_too_long',
      1,
      'หัวข้อประกาศต้องไม่เกิน 160 ตัวอักษร',
      'The listing title must not exceed 160 characters.',
      {
        section: 4,
        target: 'field',
        fieldName: 'listingTitle',
      }
    )
  }

  if (!text(draft.listingDescription)) {
    return issue('listing_description_required', 1, 'กรุณากรอกรายละเอียดประกาศ', 'Enter the listing description.', {
      section: 4,
      target: 'field',
      fieldName: 'listingDescription',
    })
  }

  if (Array.from(text(draft.listingDescription)).length > 1000) {
    return issue(
      'listing_description_too_long',
      1,
      'รายละเอียดประกาศต้องไม่เกิน 1,000 ตัวอักษร',
      'The listing description must not exceed 1,000 characters.',
      { section: 4, target: 'field', fieldName: 'listingDescription' }
    )
  }

  const latitude = parseNumber(text(draft.latMapPosition))
  const longitude = parseNumber(text(draft.lngMapPosition))
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return issue(
      'location_required',
      2,
      'กรุณาค้นหาสถานที่หรือแตะแผนที่เพื่อยืนยันตำแหน่งอสังหา',
      'Search for the place or tap the map to confirm the property location.',
      { target: 'location' }
    )
  }

  if (!text(draft.state)) {
    return issue('province_required', 2, 'กรุณากรอกจังหวัด', 'Enter the province.', {
      target: 'field',
      fieldName: 'state',
    })
  }

  const postalCode = text(draft.Postal)
  if (postalCode && !/^\d{5}$/.test(postalCode)) {
    return issue('postal_code_invalid', 2, 'กรุณากรอกรหัสไปรษณีย์ 5 หลัก', 'Enter a 5-digit postal code.', {
      target: 'field',
      fieldName: 'Postal',
    })
  }

  for (const [fieldName, value, labelTh, labelEn] of [
    ['landAreaSqm', text(draft.landAreaSqm), 'ขนาดที่ดิน', 'land area'],
    ['usableAreaSqm', text(draft.usableAreaSqm || draft.acreage), 'พื้นที่ใช้สอย', 'usable area'],
  ] as const) {
    if (value && !isPositiveNumber(value)) {
      return issue(`${fieldName}_invalid`, 2, `กรุณาตรวจสอบ${labelTh}`, `Enter a valid ${labelEn}.`, {
        target: 'field',
        fieldName,
      })
    }
  }

  for (const [fieldName, value, labelTh, labelEn] of [
    ['Bedroom', text(draft.Bedroom), 'จำนวนห้องนอน', 'bedroom count'],
    ['Bathroom', text(draft.Bathroom), 'จำนวนห้องน้ำ', 'bathroom count'],
    ['Parking', text(draft.Parking), 'จำนวนที่จอดรถ', 'parking count'],
    ['floorNo', text(draft.floorNo), 'ชั้นที่', 'floor number'],
  ] as const) {
    if (value && !isNonNegativeInteger(value)) {
      return issue(`${fieldName}_invalid`, 2, `กรุณาตรวจสอบ${labelTh}`, `Enter a valid ${labelEn}.`, {
        target: 'field',
        fieldName,
      })
    }
  }

  const totalFloors = text(draft.totalFloors)
  if (totalFloors && !isPositiveInteger(totalFloors)) {
    return issue('total_floors_invalid', 2, 'กรุณาตรวจสอบจำนวนชั้นทั้งหมด', 'Enter a valid total floor count.', {
      target: 'field',
      fieldName: 'totalFloors',
    })
  }
  if (text(draft.floorNo) && totalFloors && parseNumber(text(draft.floorNo)) > parseNumber(totalFloors)) {
    return issue(
      'floor_exceeds_total',
      2,
      'ชั้นที่ต้องไม่มากกว่าจำนวนชั้นทั้งหมด',
      'Floor number cannot exceed total floors.',
      {
        target: 'field',
        fieldName: 'floorNo',
      }
    )
  }

  const isTemporarySpace = spaceTypes.includes('event_booth')
  const priceOnRequest =
    offerTypes.includes('contact_organizer') || (!isTemporarySpace && text(draft.priceOnRequest) === 'yes')
  if (!priceOnRequest) {
    const requiredPrices: Array<[boolean, string, string, string, string]> = [
      [offerTypes.includes('sale'), 'salePrice', text(draft.salePrice), 'กรุณากรอกราคาขาย', 'Enter the sale price.'],
      [
        !isTemporarySpace && (offerTypes.includes('rent') || offerTypes.includes('sublease')),
        'rentPriceMonthly',
        text(draft.rentPriceMonthly),
        'กรุณากรอกค่าเช่ารายเดือน',
        'Enter the monthly rent.',
      ],
      [
        isTemporarySpace && (offerTypes.includes('rent') || offerTypes.includes('sublease')),
        'temporarySpacePrice',
        text(draft.temporarySpacePrice),
        'กรุณากรอกค่าเช่าพื้นที่ชั่วคราว',
        'Enter the temporary-space rental price.',
      ],
      [
        offerTypes.includes('business_transfer'),
        'keyMoneyAmount',
        text(draft.keyMoneyAmount),
        'กรุณากรอกราคาเซ้งหรือค่าโอนสิทธิ',
        'Enter the transfer price.',
      ],
    ]
    for (const [required, fieldName, value, messageTh, messageEn] of requiredPrices) {
      if (required && !value)
        return issue(`${fieldName}_required`, 3, messageTh, messageEn, { target: 'field', fieldName })
      if (value && !isNonNegativeNumber(value)) {
        return issue(`${fieldName}_invalid`, 3, 'กรุณากรอกราคาเป็นตัวเลขที่ถูกต้อง', 'Enter a valid numeric price.', {
          target: 'field',
          fieldName,
        })
      }
    }
    if (
      isTemporarySpace &&
      (offerTypes.includes('rent') || offerTypes.includes('sublease')) &&
      !isPositiveInteger(text(draft.temporarySpaceDurationDays))
    ) {
      return issue(
        'temporarySpaceDurationDays_required',
        3,
        'กรุณาระบุจำนวนวันที่รวมในค่าเช่า',
        'Enter the number of days included in the rental price.',
        { target: 'field', fieldName: 'temporarySpaceDurationDays' }
      )
    }
  }

  if (!['THB', 'USD'].includes(text(draft.currency).toUpperCase())) {
    return issue('currency_invalid', 3, 'กรุณาเลือกสกุลเงิน', 'Choose a currency.', {
      target: 'field',
      fieldName: 'currency',
    })
  }

  const role = text(draft.contactRoleCode)
  const allowedRoles = [
    'owner',
    'owner_representative',
    'independent_broker',
    'agency_broker',
    'developer_investor_representative',
    'property_manager',
  ]
  if (!allowedRoles.includes(role)) {
    return issue('contact_role_required', 3, 'กรุณาเลือกบทบาทของผู้ติดต่อ', 'Choose the contact role.', {
      target: 'field',
      fieldName: 'contactRoleCode',
    })
  }

  const authority = text(draft.contactAuthorityCode)
  const allowedAuthorities = [
    'property_owner',
    'brokerage_company',
    'developer_project',
    'investor_asset_holder',
    'co_broker',
    'property_management_company',
  ]
  if (role !== 'owner' && !allowedAuthorities.includes(authority)) {
    return issue(
      'contact_authority_required',
      3,
      'กรุณาเลือกแหล่งที่มาของสิทธิลงประกาศ',
      'Choose the authority source.',
      {
        target: 'field',
        fieldName: 'contactAuthorityCode',
      }
    )
  }

  const organizationName = text(draft.contactOrganizationName)
  if (['agency_broker', 'developer_investor_representative'].includes(role) && !organizationName) {
    return issue(
      'contact_organization_required',
      3,
      'กรุณากรอกบริษัทหรือสังกัด',
      'Enter the company or organization.',
      {
        target: 'field',
        fieldName: 'contactOrganizationName',
      }
    )
  }
  if (text(draft.contactOrganizationRegistrationNo) && !organizationName) {
    return issue(
      'contact_organization_for_registration_required',
      3,
      'กรุณากรอกบริษัทหรือสังกัดของเลขทะเบียนนี้',
      'Enter the company or organization for this registration number.',
      { target: 'field', fieldName: 'contactOrganizationName' }
    )
  }
  if (Array.from(organizationName).length > 160) {
    return issue(
      'contact_organization_too_long',
      3,
      'ชื่อบริษัทหรือสังกัดต้องไม่เกิน 160 ตัวอักษร',
      'The company or organization must not exceed 160 characters.',
      {
        target: 'field',
        fieldName: 'contactOrganizationName',
      }
    )
  }
  if (text(draft.contactOrganizationRegistrationNo).length > 64) {
    return issue(
      'contact_registration_too_long',
      3,
      'เลขทะเบียนนิติบุคคลต้องไม่เกิน 64 ตัวอักษร',
      'The company registration number must not exceed 64 characters.',
      {
        target: 'field',
        fieldName: 'contactOrganizationRegistrationNo',
      }
    )
  }

  if (!text(draft.contactName)) {
    return issue('contact_name_required', 3, 'กรุณากรอกชื่อผู้ติดต่อ', 'Enter the contact name.', {
      target: 'field',
      fieldName: 'contactName',
    })
  }
  if (!text(draft.contactPhone)) {
    return issue('contact_phone_required', 3, 'กรุณากรอกเบอร์โทรศัพท์', 'Enter the phone number.', {
      target: 'field',
      fieldName: 'contactPhone',
    })
  }

  const contactEmail = text(draft.contactEmail)
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return issue('contact_email_invalid', 3, 'กรุณาตรวจสอบรูปแบบอีเมล', 'Enter a valid email address.', {
      target: 'field',
      fieldName: 'contactEmail',
    })
  }

  const instagramHandle = text(draft.instagramHandle)
    .replace(/^@/, '')
    .replace(/^https:\/\/(?:www\.)?instagram\.com\//i, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
  if (instagramHandle && (instagramHandle.length > 30 || !/^[a-z0-9._]+$/.test(instagramHandle))) {
    return issue('instagram_invalid', 3, 'กรุณาตรวจสอบชื่อผู้ใช้ Instagram', 'Enter a valid Instagram username.', {
      target: 'field',
      fieldName: 'instagramHandle',
    })
  }

  return null
}

export const listingValidationMessage = (validationIssue: ListingPublishValidationIssue, locale: 'th' | 'en') =>
  locale === 'th' ? validationIssue.messageTh : validationIssue.messageEn

export const storeListingPublishValidationIssue = (validationIssue: ListingPublishValidationIssue) => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LISTING_PUBLISH_VALIDATION_ISSUE_KEY, JSON.stringify(validationIssue))
}

export const consumeListingPublishValidationIssue = () => {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(LISTING_PUBLISH_VALIDATION_ISSUE_KEY)
  sessionStorage.removeItem(LISTING_PUBLISH_VALIDATION_ISSUE_KEY)
  if (!raw) return null

  try {
    const validationIssue = JSON.parse(raw) as ListingPublishValidationIssue
    if (![1, 2, 3].includes(validationIssue.step) || !validationIssue.code) return null
    return validationIssue
  } catch {
    return null
  }
}
