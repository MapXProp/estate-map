import { getPropertyType } from '@/data/propertyTaxonomy'
import { validModifiedDate } from './propertyCatalog'
import type { PropertyListingDetail } from './propertySearch'
import { absoluteUrl, cleanSeoText, SITE_URL } from './seo'

export const getListingPath = (handle: string) => `/real-estate-listings/${encodeURIComponent(handle)}`
export const getListingImages = (listing: PropertyListingDetail) => [
  ...new Set(
    listing.media
      .filter((item) => item.media_type === 'image' && item.url)
      .slice()
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((item) => absoluteUrl(item.url))
  ),
]

export const getListingSection = (listing: PropertyListingDetail) => {
  if (
    listing.usage_type === 'business' ||
    listing.event ||
    ['shophouse', 'home_office', 'office', 'retail_space', 'warehouse', 'factory', 'hotel_resort'].includes(
      listing.property_type_code
    )
  )
    return { name: 'พื้นที่ธุรกิจ', url: absoluteUrl('/business') }
  if (['rental_room', 'apartment', 'flat', 'dormitory', 'monthly_hotel'].includes(listing.property_type_code))
    return { name: 'ห้องเช่าและที่พัก', url: absoluteUrl('/rooms') }
  return { name: 'บ้านและที่อยู่อาศัย', url: absoluteUrl('/homes') }
}

const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
const priceOnRequest = (listing: PropertyListingDetail) =>
  listing.event?.price_on_request || listing.category_details?.price_on_request === true
export const getListingSeoDescription = (listing: PropertyListingDetail) => {
  const offer =
    ({ sale: 'ขาย', rent: 'ให้เช่า', sublease: 'ให้เช่าช่วง', business_transfer: 'เซ้ง' } as Record<string, string>)[
      listing.offer_type
    ] || ''
  const type =
    getPropertyType(listing.property_type_code)?.nameTh ||
    (listing.property_type_code === 'house' ? 'บ้าน' : 'อสังหาริมทรัพย์')
  const price =
    !priceOnRequest(listing) && positive(listing.offer_amount)
      ? `${listing.offer_amount.toLocaleString('th-TH')} ${listing.currency === 'THB' || !listing.currency ? 'บาท' : listing.currency}${({ month: '/เดือน', day: '/วัน', week: '/สัปดาห์', event_period: '/งาน' } as Record<string, string>)[listing.price_unit] || ''}`
      : 'สอบถามราคา'
  const area =
    listing.property_type_code === 'land' && positive(listing.land_area_sqm)
      ? `${(listing.land_area_sqm / 4).toLocaleString('th-TH')} ตร.ว.`
      : positive(listing.usable_area_sqm)
        ? `${listing.usable_area_sqm.toLocaleString('th-TH')} ตร.ม.`
        : ''
  return cleanSeoText(
    [
      `${offer}${type}`,
      listing.project_name,
      listing.address,
      listing.district,
      listing.province,
      area,
      price,
      'ดูรูป แผนที่ และข้อมูลติดต่อ',
    ]
      .filter(Boolean)
      .join(' · ')
  )
}

export const getListingStructuredData = (listing: PropertyListingDetail) => {
  const url = absoluteUrl(getListingPath(listing.slug))
  const images = getListingImages(listing)
  const section = getListingSection(listing)
  const residential = [
    'house',
    'detached_house',
    'semi_detached_house',
    'townhouse',
    'condo',
    'rental_room',
    'flat',
  ].includes(listing.property_type_code)
  const property = {
    '@type': residential
      ? ['condo', 'rental_room', 'flat'].includes(listing.property_type_code)
        ? 'Apartment'
        : 'House'
      : 'Place',
    '@id': `${url}#property`,
    name: listing.title,
    description: cleanSeoText(listing.description, 2000),
    identifier: listing.public_listing_id,
    image: images,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address || undefined,
      addressLocality: listing.district || undefined,
      addressRegion: listing.province || undefined,
      postalCode: listing.postal_code || undefined,
      addressCountry: 'TH',
    },
    ...(Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude)
      ? { geo: { '@type': 'GeoCoordinates', latitude: listing.latitude, longitude: listing.longitude } }
      : {}),
    ...(residential && positive(listing.usable_area_sqm)
      ? { floorSize: { '@type': 'QuantitativeValue', value: listing.usable_area_sqm, unitCode: 'MTK' } }
      : {}),
    ...(residential && positive(listing.bedroom_count) ? { numberOfBedrooms: listing.bedroom_count } : {}),
    ...(residential && positive(listing.bathroom_count) ? { numberOfBathroomsTotal: listing.bathroom_count } : {}),
    ...(positive(listing.land_area_sqm)
      ? {
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'เนื้อที่ดิน',
            value: listing.land_area_sqm,
            unitCode: 'MTK',
          },
        }
      : {}),
  }
  const offer = {
    '@type': 'Offer',
    '@id': `${url}#offer`,
    url,
    itemOffered: { '@id': `${url}#property` },
    businessFunction: ['rent', 'sublease'].includes(listing.offer_type)
      ? 'http://purl.org/goodrelations/v1#LeaseOut'
      : 'http://purl.org/goodrelations/v1#Sell',
    ...(!priceOnRequest(listing) && positive(listing.offer_amount)
      ? {
          price: listing.offer_amount,
          priceCurrency: listing.currency || 'THB',
          ...(listing.price_unit
            ? {
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: listing.offer_amount,
                  priceCurrency: listing.currency || 'THB',
                  unitText:
                    ({ month: 'เดือน', day: 'วัน', week: 'สัปดาห์', event_period: 'งาน' } as Record<string, string>)[
                      listing.price_unit
                    ] || listing.price_unit,
                },
              }
            : {}),
        }
      : {}),
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'MapxProp', item: absoluteUrl('/homes') },
          { '@type': 'ListItem', position: 2, name: section.name, item: section.url },
          { '@type': 'ListItem', position: 3, name: listing.title, item: url },
        ],
      },
      property,
      offer,
      {
        '@type': 'RealEstateListing',
        '@id': url,
        url,
        name: listing.title,
        description: cleanSeoText(listing.description, 2000),
        datePosted: listing.published_at,
        datePublished: listing.published_at,
        dateModified: validModifiedDate(listing)?.toISOString(),
        inLanguage: 'th-TH',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#property` },
        offers: { '@id': `${url}#offer` },
        primaryImageOfPage: images[0] ? { '@type': 'ImageObject', url: images[0] } : undefined,
      },
    ],
  }
}
