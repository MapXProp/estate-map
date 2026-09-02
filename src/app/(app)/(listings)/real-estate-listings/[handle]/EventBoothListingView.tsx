import BtnLikeIcon from '@/components/BtnLikeIcon'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import ListingImageFallback from '@/components/ListingImageFallback'
import { CalendarDays, CircleHelp, ExternalLink, MapPin, MessageCircle, Phone, ShieldCheck, Store, Users } from 'lucide-react'
import Image from 'next/image'

const formatThaiDate = (value: string) =>
  new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T00:00:00+07:00`)
  )

const EventBoothListingView = ({ listing }: { listing: PropertyListingDetail }) => {
  const event = listing.event!
  const image = listing.media.find((media) => media.is_primary) || listing.media[0]
  const fullAddress = [listing.address, listing.subdistrict, listing.district, listing.province, listing.postal_code]
    .filter(Boolean)
    .join(' ')
  const lineHandle = listing.line_id.replace(/^@/, '')
  const lineURL = lineHandle ? `https://line.me/R/ti/p/%40${encodeURIComponent(lineHandle)}` : ''
  const phoneURL = listing.contact_phone ? `tel:${listing.contact_phone.replace(/[^+\d]/g, '')}` : ''
  const isVerifiedOrganizer = event.organizer_verification_status === 'verified'

  return (
    <div className="pb-24 min-[744px]:pb-0">
      <main className="mx-auto max-w-screen-xl px-4 py-5 sm:px-6 min-[744px]:py-8 lg:px-8">
        <div className="grid gap-8 min-[900px]:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] min-[1100px]:gap-12">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-[#f6f7f5] shadow-sm">
              {image ? (
                <Image
                  src={image.url}
                  alt={image.alt_text || listing.title}
                  width={image.width || 1024}
                  height={image.height || 1536}
                  priority
                  className="mx-auto max-h-[760px] w-full object-contain"
                />
              ) : (
                <ListingImageFallback className="aspect-[2/3]" />
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">
              ข้อมูลจากประกาศสาธารณะของ {event.organizer_name} โปรดตรวจสอบรอบ ราคา และเงื่อนไขกับผู้จัดก่อนชำระเงิน
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#fff1eb] px-3 py-1 text-sm font-medium text-[#d94721]">พื้นที่ออกบูธ</span>
              <span className="rounded-full bg-[#eef7f3] px-3 py-1 text-sm font-medium text-[#176b50]">เปิดรับจอง</span>
            </div>
            <p className="mt-5 text-sm font-medium text-[#176b50]">{event.name}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="text-3xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                {listing.title}
              </h1>
              <BtnLikeIcon
                listingIdentifier={listing.slug || listing.public_listing_id}
                className="shrink-0"
                colorClass="border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                sizeClass="size-11"
              />
            </div>
            <div className="mt-4 flex items-start gap-2 text-sm leading-6 text-neutral-600 sm:text-base">
              <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
              <span>{fullAddress}</span>
            </div>

            <div className="mt-6 rounded-3xl border border-[#dce9e4] bg-[#f4f9f7] p-5">
              <p className="text-sm text-neutral-500">ราคาบูธ</p>
              <p className="mt-1 text-2xl font-semibold text-[#123f32]">สอบถามผู้จัด</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">ราคาและขนาดบูธอาจแตกต่างกันตามรอบและตำแหน่ง</p>
            </div>

            <section className="mt-8">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-[#176b50]" />
                <h2 className="text-xl font-semibold">รอบที่เปิดจอง</h2>
                <span className="text-sm text-neutral-500">{event.rounds.length} รอบ</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {event.rounds.map((round) => (
                  <div key={round.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-neutral-900">{round.label}</p>
                      <span className="rounded-full bg-[#eef7f3] px-2 py-1 text-xs text-[#176b50]">เปิดรับจอง</span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">
                      {formatThaiDate(round.starts_on)} – {formatThaiDate(round.ends_on)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 p-5">
                <div className="flex items-center gap-2 font-semibold"><Store className="size-5 text-[#176b50]" /> สินค้าที่เปิดรับ</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {event.accepted_product_categories.map((category) => (
                    <span key={category} className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">{category}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-neutral-200 p-5">
                <div className="flex items-center gap-2 font-semibold"><Users className="size-5 text-[#176b50]" /> กลุ่มลูกค้า</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
                  {event.audience_segments.map((audience) => <li key={audience}>• {audience}</li>)}
                </ul>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-[#f0dfce] bg-[#fffaf4] p-5">
              <div className="flex items-center gap-2 font-semibold"><CircleHelp className="size-5 text-[#d66a22]" /> ข้อมูลที่ควรถามก่อนจอง</div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">ราคา ขนาดและเลขบูธ แปลนพื้นที่ จุดไฟฟ้า/น้ำ เงื่อนไขการขายอาหาร และรอบที่ยังว่าง</p>
              {event.floor_plan_url && (
                <a href={event.floor_plan_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#176b50] hover:underline">
                  ขอข้อมูลและแปลนจากผู้จัด <ExternalLink className="size-4" />
                </a>
              )}
            </section>

            <section className="mt-8 rounded-3xl bg-[#123f32] p-6 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-white/70">ผู้ประสานงาน</p>
                {isVerifiedOrganizer && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/18">
                    <ShieldCheck className="size-3.5 text-[#9bd8c3]" />
                    ผู้จัดที่ MapxProp ตรวจสอบแล้ว
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-xl font-semibold">{event.organizer_name || listing.contact_name}</h2>
                {event.organizer_website_url && (
                  <a
                    href={event.organizer_website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-white/75 underline-offset-4 hover:text-white hover:underline"
                  >
                    เว็บไซต์ผู้จัด <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/75">{event.application_instructions}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {phoneURL && <a href={phoneURL} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 font-medium text-[#123f32]"><Phone className="size-4" /> โทร {listing.contact_phone}</a>}
                {lineURL && <a href={lineURL} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-5 font-medium hover:bg-white/10"><MessageCircle className="size-4" /> LINE {listing.line_id}</a>}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur min-[744px]:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          {lineURL && <a href={lineURL} target="_blank" rel="noopener noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#cddfd8] font-medium text-[#123f32]"><MessageCircle className="size-4" /> LINE</a>}
          {phoneURL && <a href={phoneURL} className="flex h-12 flex-[1.35] items-center justify-center gap-2 rounded-full bg-[#123f32] font-medium text-white"><Phone className="size-4" /> ติดต่อผู้จัด</a>}
        </div>
      </div>
    </div>
  )
}

export default EventBoothListingView
