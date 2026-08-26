import type { PropertyListingDetail } from '@/lib/propertySearch'
import {
  Building2,
  CarFront,
  ExternalLink,
  LandPlot,
  Mail,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  SplitSquareVertical,
  Trees,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react'
import HeaderGallery, { type PropertyMediaItem } from '../../components/HeaderGallery'

const numericDetail = (listing: PropertyListingDetail, key: string, fallback: number) => {
  const value = listing.category_details?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const formatThaiNumber = (value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 })

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : value
}

const LandListingView = ({ listing }: { listing: PropertyListingDetail }) => {
  const images = listing.media.filter((item) => item.media_type === 'image').map((item) => item.url)
  const media: PropertyMediaItem[] = listing.media
    .filter((item) => ['image', '360', 'panorama'].includes(item.media_type))
    .map((item) => ({
      id: String(item.id),
      type: item.media_type === 'image' ? 'photo' : '360',
      url: item.url,
      thumbnailUrl: item.thumbnail_url,
      caption: item.title || item.alt_text,
    }))
  const landAreaSquareWah = numericDetail(listing, 'land_area_square_wah', (listing.land_area_sqm || 0) / 4)
  const plotCount = numericDetail(listing, 'plot_count', 2)
  const frontage = numericDetail(listing, 'road_frontage_meters', 87)
  const pricePerSquareWah = numericDetail(listing, 'price_per_square_wah', 450000)
  const offerAmount = listing.offer_amount || 0
  const fullAddress = [listing.address, listing.province].filter(Boolean).join(' ')
  const phoneURL = listing.contact_phone ? `tel:${listing.contact_phone.replace(/[^+\d]/g, '')}` : ''
  const emailURL = listing.contact_email ? `mailto:${listing.contact_email}` : ''
  const mapURL =
    listing.latitude && listing.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`
      : ''
  const descriptionParagraphs = listing.description.split(/\n{2,}/).filter(Boolean)

  return (
    <div className="pb-24 min-[744px]:pb-0">
      <main className="-mx-4 max-w-screen-xl px-3 py-4 sm:px-5 min-[744px]:mx-auto min-[744px]:px-6 min-[744px]:py-8 lg:px-8">
        <HeaderGallery images={images} media={media} gridType="grid2" />

        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50]">ขาย</span>
              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">ที่ดินเปล่า</span>
              <span className="rounded-full bg-[#fff7ed] px-3 py-1.5 text-sm font-medium text-[#c95a16]">ขายรวม 2 แปลง</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50]">
                <UserRoundCheck className="size-4" /> เจ้าของขายเอง
              </span>
              {listing.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50]">
                  <ShieldCheck className="size-4" /> ผู้ติดต่อเชื่อถือได้
                </span>
              )}
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-4xl lg:text-[42px]">
              {listing.title}
            </h1>
            <div className="mt-4 flex items-start gap-2 text-sm leading-6 text-neutral-600 sm:text-base">
              <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
              <span>{fullAddress}</span>
            </div>

            <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: LandPlot, value: `${formatThaiNumber(landAreaSquareWah)} ตร.ว.`, label: 'เนื้อที่รวม' },
                { icon: SplitSquareVertical, value: `${plotCount} แปลง`, label: 'แปลงติดกัน' },
                { icon: Ruler, value: `≈ ${frontage} ม.`, label: 'หน้ากว้างรวม' },
                { icon: Trees, value: 'ที่ดินเปล่า', label: 'ไม่มีสิ่งปลูกสร้าง' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <item.icon className="size-5 text-[#176b50]" aria-hidden="true" />
                  <p className="mt-3 text-lg font-semibold text-neutral-950">{item.value}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{item.label}</p>
                </div>
              ))}
            </section>

            <section className="mt-10 border-t border-neutral-200 pt-8">
              <h2 className="text-2xl font-semibold text-neutral-950">รายละเอียดที่ดิน</h2>
              <div className="mt-5 space-y-4 text-[15px] leading-7 text-neutral-700 sm:text-base">
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section className="mt-10 border-t border-neutral-200 pt-8">
              <h2 className="text-2xl font-semibold text-neutral-950">จุดเด่นของแปลง</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ['ที่ดินแปลงใหญ่ใจกลางเมือง', 'เนื้อที่รวม 700 ตารางวา เป็น 2 แปลงติดกันและขายพร้อมกัน'],
                  ['หน้ากว้างรวมประมาณ 87 เมตร', 'ทั้งสองแปลงมีแนวหน้าติดถนนภายในซอย เห็นรูปแปลงได้จากภาพประกอบ'],
                  ['บรรยากาศเงียบสงบ', 'ภายในซอยมีบ้านพักอาศัยและบ้านขนาดใหญ่ เหมาะกับผู้ใช้รถยนต์'],
                  ['เชื่อมต่อหลายย่าน', 'เดินทางไปสุทธิสาร รัชดาภิเษก ลาดพร้าว และพระราม 9 ได้'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl bg-[#f4f8f6] p-5">
                    <h3 className="font-semibold text-[#123f32]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10 border-t border-neutral-200 pt-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-950">
                    <CarFront className="size-5 text-[#176b50]" /> การเดินทางและสถานที่ใกล้เคียง
                  </h2>
                  <ul className="mt-4 space-y-2.5 text-sm leading-6 text-neutral-700">
                    {['MRT สุทธิสาร', 'ถนนรัชดาภิเษกและย่านลาดพร้าว', 'สถานเอกอัครราชทูตตุรกี', 'ศูนย์วัฒนธรรมแห่งประเทศไทย', 'Central Rama 9'].map(
                      (place) => (
                        <li key={place} className="flex gap-2.5">
                          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#176b50]" />
                          {place}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-950">
                    <WalletCards className="size-5 text-[#176b50]" /> ค่าใช้จ่ายและเงื่อนไข
                  </h2>
                  <ul className="mt-4 space-y-2.5 text-sm leading-6 text-neutral-700">
                    <li>ค่าธรรมเนียมการโอน ผู้ซื้อและผู้ขายออกคนละครึ่ง</li>
                    <li>ค่าใช้จ่ายและค่าธรรมเนียมอื่นที่เกี่ยวข้อง ผู้ซื้อเป็นผู้รับผิดชอบตามเงื่อนไขซื้อขาย</li>
                    <li>ค่านายหน้า 2%</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mt-10 rounded-3xl border border-[#dce9e4] bg-[#f7faf8] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-[#176b50]">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-950">ตำแหน่งที่ดิน</h2>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">พิกัด {listing.latitude}, {listing.longitude}</p>
                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    ตำแหน่งในประกาศใช้เพื่อช่วยนำทาง ผู้ซื้อควรตรวจสอบแนวเขต เลขที่โฉนด ผังเมือง และสิทธิทางกฎหมายก่อนทำสัญญา
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
              <p className="mt-2 text-sm font-medium text-[#176b50]">
                ฿{formatThaiNumber(pricePerSquareWah)} / ตร.ว.
              </p>
              <div className="my-5 border-t border-neutral-200" />
              <p className="font-semibold text-neutral-950">ติดต่อ {listing.contact_name}</p>
              <p className="mt-1 text-sm text-neutral-500">สอบถามรายละเอียดหรือนัดหมายดูที่ดิน</p>
              <div className="mt-5 grid gap-2.5">
                {phoneURL && (
                  <a href={phoneURL} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#176b50] px-5 font-semibold text-white transition hover:bg-[#145d46]">
                    <Phone className="size-4" /> โทร {formatPhone(listing.contact_phone)}
                  </a>
                )}
                {emailURL && (
                  <a href={emailURL} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 font-medium text-neutral-700 transition hover:bg-neutral-50">
                    <Mail className="size-4" /> ส่งอีเมล
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/96 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          {emailURL && (
            <a href={emailURL} aria-label="ส่งอีเมล" className="grid size-12 shrink-0 place-items-center rounded-full border border-[#cddfd8] text-[#176b50]">
              <Mail className="size-5" />
            </a>
          )}
          {phoneURL && (
            <a href={phoneURL} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#176b50] px-5 font-semibold text-white">
              <Phone className="size-4" /> โทรนัดดูที่ดิน
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default LandListingView
