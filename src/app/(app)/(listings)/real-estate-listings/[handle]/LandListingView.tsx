import BtnLikeIcon from '@/components/BtnLikeIcon'
import ListingImageFallback from '@/components/ListingImageFallback'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import {
  Building2,
  CarFront,
  ChevronDown,
  ExternalLink,
  LandPlot,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
  SplitSquareVertical,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react'
import HeaderGallery, { type PropertyMediaItem } from '../../components/HeaderGallery'

const numericDetail = (listing: PropertyListingDetail, key: string) => {
  const value = listing.category_details?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const booleanDetail = (listing: PropertyListingDetail, key: string) => listing.category_details?.[key] === true

const textDetail = (listing: PropertyListingDetail, key: string) => {
  const value = listing.category_details?.[key]
  return typeof value === 'string' ? value : ''
}

type FeatureCard = { title_th?: unknown; body_th?: unknown }

const getFeatureCards = (listing: PropertyListingDetail) => {
  const block = listing.content_blocks?.find((item) => item.code === 'land_highlights' && item.type === 'feature_cards')
  const items = Array.isArray(block?.content)
    ? block.content
        .filter((item): item is FeatureCard => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          title: typeof item.title_th === 'string' ? item.title_th : '',
          body: typeof item.body_th === 'string' ? item.body_th : '',
        }))
        .filter((item) => item.title && item.body)
    : []

  return { heading: block?.heading_th || '', items }
}

const formatThaiNumber = (value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 })

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : value
}

const LandListingView = ({ listing }: { listing: PropertyListingDetail }) => {
  const images = listing.media.filter((item) => item.media_type === 'image').map((item) => item.url)
  const media: PropertyMediaItem[] = listing.media
    .filter((item) => ['image', 'video', '360', 'panorama'].includes(item.media_type))
    .map((item) => ({
      id: String(item.id),
      type: item.media_type === 'image' ? 'photo' : item.media_type === 'video' ? 'video' : '360',
      url: item.url,
      thumbnailUrl: item.thumbnail_url,
      caption: item.title || item.alt_text,
    }))
  const landAreaSquareWah = numericDetail(listing, 'land_area_square_wah') ?? (listing.land_area_sqm || 0) / 4
  const plotCount = numericDetail(listing, 'plot_count')
  const frontage = numericDetail(listing, 'road_frontage_meters')
  const pricePerSquareWah = numericDetail(listing, 'price_per_square_wah')
  const isVacantLand = booleanDetail(listing, 'vacant_land')
  const hasStructures = booleanDetail(listing, 'structures_present')
  const isSoldTogether = booleanDetail(listing, 'sale_together_only')
  const contactRole = contactRoleLabel(listing.contact_role_code)
  const isOwnerDirect = listing.contact_role_code === 'owner' || textDetail(listing, 'seller_type') === 'owner_direct'
  const isTrustedContact = listing.contact_role_code
    ? listing.contact_verification_status === 'authority_verified'
    : listing.is_verified || textDetail(listing, 'contact_trust_status') === 'verified'
  const featureCards = getFeatureCards(listing)
  const offerAmount = listing.offer_amount || 0
  const fullAddress = [listing.address, listing.province].filter(Boolean).join(' ')
  const phoneURL = listing.contact_phone ? `tel:${listing.contact_phone.replace(/[^+\d]/g, '')}` : ''
  const emailURL = listing.contact_email ? `mailto:${listing.contact_email}` : ''
  const lineHandle = listing.line_id.replace(/^@/, '')
  const lineURL = lineHandle ? `https://line.me/R/ti/p/%40${encodeURIComponent(lineHandle)}` : ''
  const mapURL =
    listing.latitude && listing.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`
      : ''
  const descriptionParagraphs = listing.description.split(/\n{2,}/).filter(Boolean)
  const factCards = [
    { icon: LandPlot, value: `${formatThaiNumber(landAreaSquareWah)} ตร.ว.`, label: 'เนื้อที่รวม' },
    ...(plotCount ? [{ icon: SplitSquareVertical, value: `${plotCount} แปลง`, label: 'แปลงติดกัน' }] : []),
    ...(frontage ? [{ icon: Ruler, value: `≈ ${frontage} ม.`, label: 'หน้ากว้างรวม' }] : []),
    ...(isVacantLand || !hasStructures ? [{ icon: LandPlot, value: 'ที่ดินเปล่า', label: 'ไม่มีสิ่งปลูกสร้าง' }] : []),
  ]

  return (
    <div className="pb-24 min-[744px]:pb-0">
      <main className="-mx-4 max-w-screen-xl px-3 pt-0 pb-4 min-[744px]:mx-auto min-[744px]:px-6 min-[744px]:py-8 sm:px-5 lg:px-8">
        <div className="px-1 pt-2 pb-4 min-[744px]:hidden">
          <div className="mb-1.5 flex min-h-10 items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium">
              <span className="text-[#176b50]">{listing.offer_type === 'sale' ? 'ขาย' : 'ให้เช่า'}</span>
              <span className="text-neutral-300" aria-hidden="true">
                ·
              </span>
              <span className="truncate text-neutral-500">{isVacantLand ? 'ที่ดินเปล่า' : 'ที่ดิน'}</span>
            </p>
            <BtnLikeIcon
              listingIdentifier={listing.slug || listing.public_listing_id}
              className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#176b50] [&>svg]:!size-[18px]"
              colorClass="bg-transparent text-neutral-500 hover:bg-neutral-100 active:bg-neutral-100"
              sizeClass="size-10"
            />
          </div>
          <h1 className="text-[1.625rem] leading-[1.28] font-semibold tracking-tight text-neutral-950">
            {listing.title}
          </h1>
          {fullAddress && (
            <div className="mt-2.5 flex items-start gap-2 text-sm leading-6 text-neutral-600">
              <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
              <span className="min-w-0">{fullAddress}</span>
            </div>
          )}
        </div>

        {media.length ? (
          <HeaderGallery
            images={images}
            media={media}
            listingIdentifier={listing.slug || listing.public_listing_id}
            gridType="grid2"
            imageAlt={listing.title}
            squareMobileCorners
            hideMobileFavorite
          />
        ) : (
          <ListingImageFallback className="aspect-[16/7] rounded-[28px]" />
        )}

        <div className="mt-0 grid gap-10 min-[744px]:mt-7 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-14">
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-col">
              <div className="order-2 hidden flex-wrap items-center gap-2 min-[744px]:order-1 min-[744px]:flex">
                {listing.offer_type === 'sale' && (
                  <span className="rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50]">
                    ขาย
                  </span>
                )}
                {isVacantLand && (
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                    ที่ดินเปล่า
                  </span>
                )}
                {isSoldTogether && plotCount && (
                  <span className="hidden rounded-full bg-[#fff7ed] px-3 py-1.5 text-sm font-medium text-[#c95a16] min-[744px]:inline-flex">
                    ขายรวม {plotCount} แปลง
                  </span>
                )}
                {isOwnerDirect && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50]">
                    <UserRoundCheck className="size-4" /> เจ้าของขายเอง
                  </span>
                )}
                {contactRole && !isOwnerDirect && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
                    <Building2 className="size-4" /> {contactRole}
                  </span>
                )}
                {isTrustedContact && (
                  <span className="hidden items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50] min-[744px]:inline-flex">
                    <ShieldCheck className="size-4" /> ผู้ติดต่อเชื่อถือได้
                  </span>
                )}
              </div>

              <div className="order-1 hidden min-[744px]:order-2 min-[744px]:mt-4 min-[744px]:block">
                <h1 className="max-w-4xl text-[1.625rem] leading-[1.28] font-semibold tracking-tight text-neutral-950 sm:text-[2rem] lg:text-[2.25rem]">
                  {listing.title}
                </h1>
                {fullAddress && (
                  <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-neutral-600 sm:text-base">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
                    <div className="min-w-0">
                      <span className="block">{fullAddress}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <section className="order-3 mt-5 grid grid-cols-2 gap-3 min-[744px]:order-none min-[744px]:mt-7 sm:grid-cols-4">
              {factCards.map((item) => (
                <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <item.icon className="size-5 text-[#176b50]" aria-hidden="true" />
                  <p className="mt-3 text-lg font-semibold text-neutral-950">{item.value}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{item.label}</p>
                </div>
              ))}
            </section>

            {(listing.contact_name || phoneURL || lineURL || emailURL) && (
              <details className="group order-2 mt-4 overflow-hidden rounded-2xl border border-[#dce9e4] bg-[#f7faf8] min-[744px]:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3 select-none [&::-webkit-details-marker]:hidden">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-[#176b50]">
                    {isOwnerDirect ? <UserRoundCheck className="size-4.5" /> : <Building2 className="size-4.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-500">
                      {isOwnerDirect ? 'เจ้าของขายเอง' : contactRole || 'ผู้ลงประกาศ'}
                    </p>
                    <p className="truncate text-sm font-semibold text-neutral-950">{listing.contact_name}</p>
                  </div>
                  {isTrustedContact && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#176b50]">
                      <ShieldCheck className="size-4" /> เชื่อถือได้
                    </span>
                  )}
                  <ChevronDown className="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t border-[#dce9e4] px-3 py-2">
                  {phoneURL && (
                    <a
                      href={phoneURL}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-2.5 transition hover:bg-white/80 active:bg-white"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#176b50]">
                        <Phone className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs text-neutral-500">โทรศัพท์</span>
                        <span className="block text-sm font-semibold text-neutral-800">
                          {formatPhone(listing.contact_phone)}
                        </span>
                      </span>
                    </a>
                  )}
                  {lineURL && (
                    <a
                      href={lineURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-12 items-center gap-3 rounded-xl px-2.5 transition hover:bg-white/80 active:bg-white"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#176b50]">
                        <MessageCircle className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs text-neutral-500">LINE</span>
                        <span className="block truncate text-sm font-semibold text-neutral-800">@{lineHandle}</span>
                      </span>
                    </a>
                  )}
                  {emailURL && (
                    <a
                      href={emailURL}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-2.5 transition hover:bg-white/80 active:bg-white"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#176b50]">
                        <Mail className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs text-neutral-500">อีเมล</span>
                        <span className="block truncate text-sm font-semibold text-neutral-800">
                          {listing.contact_email}
                        </span>
                      </span>
                    </a>
                  )}
                  {!phoneURL && !lineURL && !emailURL && (
                    <p className="px-2.5 py-3 text-sm text-neutral-500">ยังไม่มีข้อมูลติดต่อเพิ่มเติม</p>
                  )}
                </div>
              </details>
            )}

            <section className="order-1 mt-6 min-[744px]:order-none min-[744px]:mt-10 min-[744px]:border-t min-[744px]:border-neutral-200 min-[744px]:pt-8">
              <h2 className="text-xl font-semibold text-neutral-950 min-[744px]:text-2xl">รายละเอียดที่ดิน</h2>
              <div className="mt-5 space-y-4 text-[15px] leading-7 text-neutral-700 sm:text-base">
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            {featureCards.items.length > 0 && (
              <section className="order-4 mt-10 border-t border-neutral-200 pt-8 min-[744px]:order-none">
                <h2 className="text-2xl font-semibold text-neutral-950">{featureCards.heading}</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {featureCards.items.map((item) => (
                    <div key={item.title} className="rounded-2xl bg-[#f4f8f6] p-5">
                      <h3 className="font-semibold text-[#123f32]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">{item.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(listing.nearby_places.length > 0 || listing.transaction_terms.length > 0) && (
              <section className="order-5 mt-10 border-t border-neutral-200 pt-8 min-[744px]:order-none">
                <div className="grid gap-6 sm:grid-cols-2">
                  {listing.nearby_places.length > 0 && (
                    <div>
                      <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-950">
                        <CarFront className="size-5 text-[#176b50]" /> การเดินทางและสถานที่ใกล้เคียง
                      </h2>
                      <ul className="mt-4 space-y-2.5 text-sm leading-6 text-neutral-700">
                        {listing.nearby_places.map((place) => (
                          <li key={`${place.place_type_code}-${place.name_th}`} className="flex gap-2.5">
                            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#176b50]" />
                            {place.name_th}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {listing.transaction_terms.length > 0 && (
                    <div>
                      <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-950">
                        <WalletCards className="size-5 text-[#176b50]" /> ค่าใช้จ่ายและเงื่อนไข
                      </h2>
                      <ul className="mt-4 space-y-2.5 text-sm leading-6 text-neutral-700">
                        {listing.transaction_terms.map((term) => (
                          <li key={term.code}>
                            <span className="font-medium text-neutral-800">{term.label_th}</span> {term.value_th}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="order-6 mt-10 rounded-3xl border border-[#dce9e4] bg-[#f7faf8] p-5 min-[744px]:order-none sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-[#176b50]">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-950">ตำแหน่งที่ดิน</h2>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    พิกัด {listing.latitude}, {listing.longitude}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    ตำแหน่งในประกาศใช้เพื่อช่วยนำทาง ผู้ซื้อควรตรวจสอบแนวเขต เลขที่โฉนด ผังเมือง
                    และสิทธิทางกฎหมายก่อนทำสัญญา
                  </p>
                  {mapURL && (
                    <a
                      href={mapURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#176b50] hover:underline"
                    >
                      เปิดตำแหน่งบนแผนที่ <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_18px_55px_rgba(18,63,50,0.10)]">
              <p className="text-sm text-neutral-500">ราคาขายรวม</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
                ฿{formatThaiNumber(offerAmount)}
              </p>
              {pricePerSquareWah && (
                <p className="mt-2 text-sm font-medium text-[#176b50]">
                  ฿{formatThaiNumber(pricePerSquareWah)} / ตร.ว.
                </p>
              )}
              <div className="my-5 border-t border-neutral-200" />
              <p className="font-semibold text-neutral-950">ติดต่อ {listing.contact_name}</p>
              {contactRole && <p className="mt-1 text-sm font-medium text-neutral-700">{contactRole}</p>}
              {listing.contact_organization_name && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                  <Building2 className="size-4" /> {listing.contact_organization_name}
                </p>
              )}
              <p className="mt-2 text-xs text-neutral-500">
                {contactVerificationLabel(listing.contact_verification_status, isTrustedContact)}
              </p>
              <div className="mt-5 grid gap-2.5">
                {phoneURL && (
                  <a
                    href={phoneURL}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#176b50] px-5 font-semibold text-white transition hover:bg-[#145d46]"
                  >
                    <Phone className="size-4" /> โทร {formatPhone(listing.contact_phone)}
                  </a>
                )}
                {emailURL && (
                  <a
                    href={emailURL}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <Mail className="size-4" /> ส่งอีเมล
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {(phoneURL || emailURL || mapURL) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/96 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur min-[744px]:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] leading-none text-neutral-500">ราคาขาย</p>
              <p className="mt-1 truncate text-sm leading-none font-semibold text-neutral-950">
                ฿{formatThaiNumber(offerAmount)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {!phoneURL && emailURL && (
                <a
                  href={emailURL}
                  aria-label="ส่งอีเมล"
                  title="ส่งอีเมล"
                  className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition active:scale-95"
                >
                  <Mail className="size-[18px]" />
                </a>
              )}
              {phoneURL && (
                <a
                  href={phoneURL}
                  aria-label={isOwnerDirect ? 'โทรหาเจ้าของ' : 'โทรติดต่อ'}
                  title={isOwnerDirect ? 'โทรหาเจ้าของ' : 'โทรติดต่อ'}
                  className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition active:scale-95"
                >
                  <Phone className="size-[18px]" />
                </a>
              )}
              {mapURL && (
                <a
                  href={mapURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="ตำแหน่งอสังหา"
                  title="ตำแหน่งอสังหา"
                  className="grid size-10 place-items-center rounded-full border border-[#d7e5df] bg-[#f3f8f6] text-[#176b50] transition active:scale-95"
                >
                  <MapPin className="size-[18px]" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const contactRoleLabel = (value: string) => {
  const labels: Record<string, string> = {
    owner: 'เจ้าของทรัพย์',
    owner_representative: 'ผู้รับมอบอำนาจจากเจ้าของ',
    independent_broker: 'นายหน้าอิสระ',
    agency_broker: 'นายหน้าสังกัดบริษัท',
    developer_investor_representative: 'ตัวแทนโครงการ / นักลงทุน',
    property_manager: 'ผู้ดูแลทรัพย์ / ผู้จัดการอาคาร',
  }
  return labels[value] || ''
}

const contactVerificationLabel = (status: PropertyListingDetail['contact_verification_status'], isTrusted: boolean) => {
  if (isTrusted) return 'ตรวจสอบตัวตนและสิทธิแล้ว'
  if (status === 'identity_verified') return 'ยืนยันตัวตนแล้ว · ยังไม่ได้ยืนยันสิทธิในทรัพย์'
  return 'ข้อมูลบทบาทที่ผู้ลงประกาศระบุเอง · ยังไม่ Verified'
}

export default LandListingView
