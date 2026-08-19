import { Bath, BedDouble, Building2, Check, MapPin, Maximize2, Phone } from 'lucide-react'
import MobileReturnToResultsButton from './MobileReturnToResultsButton'

interface Props {
  title: string
  category: string
  price: string
  address: string
  bedrooms: number
  bathrooms: number
  area: number
  maxGuests: number
  phone?: string
}

const MobilePropertyOverview = ({
  title,
  category,
  price,
  address,
  bedrooms,
  bathrooms,
  area,
  maxGuests,
  phone,
}: Props) => {
  const facts = [
    { label: 'ห้องนอน', value: bedrooms, icon: BedDouble },
    { label: 'ห้องน้ำ', value: bathrooms, icon: Bath },
    { label: 'ตร.ม.', value: area, icon: Maximize2 },
    { label: 'รองรับ', value: `${maxGuests} คน`, icon: Building2 },
  ]
  const highlights = ['ข้อมูลประกาศครบถ้วน', 'ติดต่อผู้ลงประกาศได้โดยตรง', 'ดูตำแหน่งและบริเวณใกล้เคียงได้']

  return (
    <>
      <section className="-mx-1 rounded-t-[28px] bg-white px-1 pt-5 pb-7 min-[744px]:hidden dark:bg-neutral-950">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#eaf5f0] px-3 py-1.5 text-xs font-semibold text-[#176b50]">{category}</span>
          <span className="rounded-full bg-[#eaf5f0] px-3 py-1.5 text-xs font-semibold text-[#176b50]">
            ตรวจสอบแล้ว
          </span>
          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            เจ้าของลงเอง
          </span>
        </div>

        <h1 className="mt-4 text-[1.65rem] leading-[1.25] font-semibold tracking-[-0.02em] text-neutral-950 dark:text-white">
          {title}
        </h1>
        <p className="mt-3 text-[1.55rem] leading-none font-bold text-[#123f32] dark:text-[#65b99e]">{price}</p>

        <a href="#property-location" className="mt-4 flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" aria-hidden="true" />
          <span className="min-w-0 flex-1 leading-6">{address}</span>
          <span className="shrink-0 font-semibold text-[#176b50]">ดูแผนที่</span>
        </a>

        <div className="mt-5 grid grid-cols-4 overflow-hidden rounded-2xl border border-[#dfe9e5] bg-[#f8fbf9] dark:border-neutral-700 dark:bg-neutral-900">
          {facts.map((fact, index) => (
            <div
              key={fact.label}
              className={`flex min-w-0 flex-col items-center px-1.5 py-3.5 text-center ${index ? 'border-s border-[#e2ebe7] dark:border-neutral-700' : ''}`}
            >
              <fact.icon className="size-5 text-[#176b50]" strokeWidth={1.7} aria-hidden="true" />
              <strong className="mt-1.5 text-sm text-neutral-950 dark:text-white">{fact.value}</strong>
              <span className="mt-0.5 text-[0.68rem] text-neutral-500">{fact.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">จุดเด่นของประกาศ</h2>
          <div className="mt-3 space-y-3">
            {highlights.map((highlight) => (
              <div key={highlight} className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eaf5f0] text-[#176b50]">
                  <Check className="size-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur min-[744px]:hidden dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="mx-auto grid max-w-lg grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2.5">
          <a
            href={phone ? `tel:${phone}` : '#contact-owner'}
            aria-label="โทรหาผู้ลงประกาศ"
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#cfe0d9] text-[#176b50] transition active:scale-95"
          >
            <Phone className="size-5" aria-hidden="true" />
          </a>
          <MobileReturnToResultsButton />
          <a
            href="#contact-owner"
            className="flex min-h-12 min-w-0 items-center justify-center rounded-full bg-[#123f32] px-4 text-sm font-semibold whitespace-nowrap text-white shadow-[0_7px_18px_rgba(18,63,50,0.22)] transition active:scale-[0.98]"
          >
            นัดชม
          </a>
        </div>
      </div>
    </>
  )
}

export default MobilePropertyOverview
