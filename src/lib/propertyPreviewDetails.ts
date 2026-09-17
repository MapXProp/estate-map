import type { PropertyListingDetail } from './propertySearch'

export function getPropertyPreviewContacts(
  listing: Pick<
    PropertyListingDetail,
    | 'contact_phone'
    | 'contact_phone_secondary'
    | 'line_id'
    | 'contact_email'
    | 'instagram_handle'
    | 'organization_website_url'
  >
) {
  const contacts: Array<{
    kind: 'phone' | 'line' | 'email' | 'instagram' | 'website'
    label: string
    value: string
    href: string
  }> = []
  const phones = new Set<string>()
  for (const value of [listing.contact_phone, listing.contact_phone_secondary]) {
    const phone = value?.replace(/[^+\d]/g, '') || ''
    if (!/\d{3,}/.test(phone) || phones.has(phone)) continue
    phones.add(phone)
    contacts.push({ kind: 'phone', label: 'โทร', value: value.trim(), href: `tel:${phone}` })
  }
  const line = listing.line_id?.trim()
  if (line) {
    // Official accounts keep @; ordinary personal LINE IDs do not gain one.
    const href = /^https:\/\/(?:line\.me|lin\.ee)\//i.test(line)
      ? line
      : `https://line.me/R/ti/p/${encodeURIComponent(line)}`
    if (!/^https?:/i.test(line) || /^https:\/\/(?:line\.me|lin\.ee)\//i.test(line))
      contacts.push({ kind: 'line', label: 'LINE', value: line, href })
  }
  const email = listing.contact_email?.trim()
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    contacts.push({ kind: 'email', label: 'อีเมล', value: email, href: `mailto:${email}` })
  const instagram = listing.instagram_handle?.trim().replace(/^@/, '')
  if (instagram && /^[a-z\d._]+$/i.test(instagram))
    contacts.push({
      kind: 'instagram',
      label: 'Instagram',
      value: `@${instagram}`,
      href: `https://www.instagram.com/${encodeURIComponent(instagram)}/`,
    })
  const website = listing.organization_website_url?.trim()
  if (website) {
    try {
      const url = new URL(website)
      if (url.protocol === 'https:' || url.protocol === 'http:')
        contacts.push({ kind: 'website', label: 'เว็บไซต์', value: url.hostname, href: url.href })
    } catch {
      /* No link for malformed website data. */
    }
  }
  return contacts
}

export function getPropertyPreviewContactRole(code: string, isThai: boolean) {
  const labels: Record<string, [string, string]> = {
    owner: ['เจ้าของทรัพย์', 'Property owner'],
    owner_representative: ['ผู้รับมอบอำนาจจากเจ้าของ', 'Owner representative'],
    independent_broker: ['นายหน้าอิสระ', 'Independent agent'],
    agency_broker: ['นายหน้าสังกัดบริษัท', 'Agency agent'],
    developer_investor_representative: ['ตัวแทนโครงการ / นักลงทุน', 'Developer / investor representative'],
    property_manager: ['ผู้ดูแลทรัพย์ / ผู้จัดการอาคาร', 'Property manager'],
  }
  return labels[code]?.[isThai ? 0 : 1] || (isThai ? 'ผู้ลงประกาศ' : 'Advertiser')
}

export function getPropertyPreviewContactAuthority(code: string, isThai: boolean) {
  const labels: Record<string, [string, string]> = {
    self: ['ตนเอง', 'Self'],
    property_owner: ['เจ้าของทรัพย์โดยตรง', 'Property owner'],
    brokerage_company: ['บริษัทนายหน้าหรือทีม', 'Agency / team'],
    developer_project: ['โครงการ / ผู้พัฒนา', 'Developer'],
    investor_asset_holder: ['นักลงทุน / ผู้ถือทรัพย์', 'Investor / asset holder'],
    co_broker: ['นายหน้าร่วม (Co-broker)', 'Co-broker'],
    property_management_company: ['บริษัทบริหารทรัพย์', 'Property management company'],
  }
  return labels[code]?.[isThai ? 0 : 1] || ''
}

export function getPropertyPreviewFacts(listing: PropertyListingDetail, isThai: boolean) {
  const number = (value: number) => value.toLocaleString(isThai ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 })
  const facts: Array<{ label: string; value: string }> = []
  if (listing.land_area_sqm != null && listing.land_area_sqm > 0)
    facts.push({
      label: isThai ? 'ที่ดิน' : 'Land',
      value: `${number(listing.land_area_sqm / 4)} ${isThai ? 'ตร.ว.' : 'sq.wah'}`,
    })
  if (listing.usable_area_sqm != null && listing.usable_area_sqm > 0)
    facts.push({
      label: isThai ? 'พื้นที่ใช้สอย' : 'Usable area',
      value: `${number(listing.usable_area_sqm)} ${isThai ? 'ตร.ม.' : 'sq.m.'}`,
    })
  for (const [count, label] of [
    [listing.bedroom_count, isThai ? 'ห้องนอน' : 'Bedrooms'],
    [listing.bathroom_count, isThai ? 'ห้องน้ำ' : 'Bathrooms'],
    [listing.total_floors, isThai ? 'ชั้น' : 'Floors'],
    [listing.parking_count, isThai ? 'ที่จอดรถ' : 'Parking spaces'],
  ] as const) {
    if (count != null && count > 0) facts.push({ label, value: number(count) })
  }
  return facts
}
