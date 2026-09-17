import type { PropertyListingMedia } from './propertySearch'

// Use the publisher's media labels; never infer a floor plan from its filename.
export function isPropertyPlan(item: PropertyListingMedia) {
  return (
    ['floor_plan', 'floor-plan', 'site_plan', 'plan'].includes(item.role_code) ||
    /^(?:แปลน|แบบแปลน|ผังอาคาร|ผังรูปแปลง|floor\s*plan|site\s*plan)/i.test(item.title.trim())
  )
}

export function propertyPreviewImages(media: PropertyListingMedia[]) {
  const photos = media.filter(
    (item) => item.media_type === 'image' && !isPropertyPlan(item) && item.role_code !== 'map'
  )
  const cover = photos.find((item) => item.is_primary || item.role_code === 'cover') || photos[0]
  const interior = photos.find(
    (item) => item !== cover && /ภายใน|ห้องนั่งเล่น|ห้องรับแขก|living|interior/i.test(item.title)
  )
  return [
    ...new Set(
      [cover, interior, ...photos].filter((item): item is PropertyListingMedia => Boolean(item)).map((item) => item.url)
    ),
  ].slice(0, 3)
}

const descriptionHeadings = new Set([
  'รายละเอียดทรัพย์',
  'ทำเลและการเดินทาง',
  'ข้อควรทราบเกี่ยวกับทรัพย์',
  'ราคาและการติดต่อ',
  'Property details',
  'Location and access',
  'Property notes',
  'Price and contact',
])

export const isPropertyLocationHeading = (heading: string) =>
  heading === 'ทำเลและการเดินทาง' || heading === 'Location and access'

export function propertyDescriptionSections(text: string) {
  const sections: Array<{ heading: string; paragraphs: string[] }> = []
  for (const paragraph of text
    .split(/\n\s*\n/)
    .map((value) => value.trim())
    .filter(Boolean)) {
    if (descriptionHeadings.has(paragraph)) sections.push({ heading: paragraph, paragraphs: [] })
    else if (/^(ข้อควรตรวจสอบสำคัญ|Important property note)\s*:/i.test(paragraph)) {
      sections.push({ heading: paragraph.slice(0, paragraph.indexOf(':')), paragraphs: [paragraph] })
    } else {
      if (!sections.length) sections.push({ heading: '', paragraphs: [] })
      sections[sections.length - 1].paragraphs.push(paragraph)
    }
  }
  return sections
}
