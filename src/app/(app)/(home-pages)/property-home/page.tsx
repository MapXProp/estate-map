import PropertyHomeSearch from '@/components/property-home/PropertyHomeSearch'
import PropertyListingShowcase from '@/components/property-home/PropertyListingShowcase'
import heroImage from '@/images/hero-right-3.png'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Factory,
  House,
  LandPlot,
  MapPin,
  ShieldCheck,
  Store,
  Utensils,
  Warehouse,
} from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ค้นหาอสังหาริมทรัพย์สำหรับชีวิตและธุรกิจ',
  description:
    'ค้นหาบ้าน คอนโด ตึกแถว พื้นที่ค้าขาย สำนักงาน โกดัง โรงงาน และที่ดินทั่วประเทศไทย ตามทำเล ประเภท การใช้งาน และงบประมาณ',
}

const propertyGroups = [
  {
    title: 'ที่อยู่อาศัย',
    description: 'บ้าน คอนโด ทาวน์เฮาส์ อพาร์ตเมนต์ และหอพัก',
    href: '/real-estate-categories/all?property_group=residential',
    icon: House,
    tone: 'bg-[#edf6f1] text-[#176b50] dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  {
    title: 'อยู่และทำธุรกิจ',
    description: 'ตึกแถว อาคารพาณิชย์ และโฮมออฟฟิศ',
    href: '/real-estate-categories/all?property_group=mixed_use',
    icon: Building2,
    tone: 'bg-[#f4f1e7] text-[#78672f] dark:bg-yellow-950/50 dark:text-yellow-200',
  },
  {
    title: 'ธุรกิจและอุตสาหกรรม',
    description: 'พื้นที่ค้าขาย สำนักงาน โกดัง และโรงงาน',
    href: '/real-estate-categories/all?property_group=commercial',
    icon: Warehouse,
    tone: 'bg-[#eef1f7] text-[#455a82] dark:bg-blue-950/50 dark:text-blue-200',
  },
  {
    title: 'ที่ดิน',
    description: 'ที่ดินเปล่า หรือที่ดินพร้อมสิ่งปลูกสร้าง',
    href: '/real-estate-categories/all?property_group=land',
    icon: LandPlot,
    tone: 'bg-[#f6eee7] text-[#8a5e3a] dark:bg-orange-950/50 dark:text-orange-200',
  },
]

const useCaseHighlights = [
  {
    title: 'เปิดร้านอาหารหรือคาเฟ่',
    description: 'ค้นหาพื้นที่ที่มีน้ำ ท่อน้ำทิ้ง และรองรับครัว',
    href: '/real-estate-categories/all?use_case=food_service',
    icon: Utensils,
  },
  {
    title: 'ทำสำนักงานหรือโฮมออฟฟิศ',
    description: 'เลือกได้ทั้งออฟฟิศโดยตรง บ้าน และตึกแถวที่อนุญาต',
    href: '/real-estate-categories/all?use_case=office',
    icon: Briefcase,
  },
  {
    title: 'เก็บหรือกระจายสินค้า',
    description: 'โกดัง คลังสินค้า และพื้นที่ที่รถขนส่งเข้าถึงได้',
    href: '/real-estate-categories/all?use_case=storage',
    icon: Warehouse,
  },
  {
    title: 'ผลิตสินค้าและโรงงาน',
    description: 'พื้นที่อุตสาหกรรม พร้อมข้อมูลไฟฟ้าและการขนส่ง',
    href: '/real-estate-categories/all?use_case=industrial',
    icon: Factory,
  },
  {
    title: 'เปิดร้านหรือพื้นที่ขายของ',
    description: 'ร้าน Standalone คีออส ล็อกตลาด และพื้นที่ค้าปลีก',
    href: '/real-estate-categories/all?use_case=retail',
    icon: Store,
  },
  {
    title: 'สร้างบ้านหรือทำเกษตร',
    description: 'ค้นหาที่ดินตามการใช้งาน ถนน และสาธารณูปโภค',
    href: '/real-estate-categories/all?use_case=agriculture',
    icon: LandPlot,
  },
]

const locations = [
  {
    name: 'กรุงเทพมหานคร',
    count: '4,280 ประกาศ',
    image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=85&w=1200&auto=format&fit=crop',
  },
  {
    name: 'เชียงใหม่',
    count: '1,240 ประกาศ',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=85&w=1200&auto=format&fit=crop',
  },
  {
    name: 'ชลบุรี',
    count: '1,865 ประกาศ',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=1200&auto=format&fit=crop',
  },
  {
    name: 'ภูเก็ต',
    count: '980 ประกาศ',
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=85&w=1200&auto=format&fit=crop',
  },
]

const PropertyHomePrototype = () => {
  return (
    <main className="overflow-hidden bg-white dark:bg-neutral-900">
      <section className="container pt-3 sm:pt-6 lg:pt-10">
        <div className="relative overflow-hidden rounded-[32px] bg-[#edf4f0] lg:rounded-[44px] dark:bg-[#10231d]">
          <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-700/15" />
          <div className="grid min-[744px]:min-h-[360px] min-[744px]:grid-cols-[1.05fr_0.95fr] lg:min-h-[420px] lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-8 min-[744px]:px-8 min-[744px]:py-10 sm:px-8 sm:py-9 lg:px-12 lg:py-12 xl:px-14">
              <h1 className="max-w-2xl text-[2.15rem]/[1.08] font-semibold tracking-[-0.035em] text-neutral-950 min-[744px]:text-[2.4rem]/[1.08] sm:text-4xl/[1.08] lg:text-5xl/[1.08] xl:text-6xl/[1.08] dark:text-white">
                พื้นที่ที่ใช่
                <br />
                <span className="text-[#176b50] dark:text-emerald-300">สำหรับชีวิตและธุรกิจ</span>
              </h1>
              <p className="mt-3 line-clamp-2 max-w-xl text-sm/6 text-neutral-600 min-[744px]:line-clamp-none sm:text-base/7 lg:text-lg/8 dark:text-neutral-300">
                ไม่ว่าคุณจะหาบ้าน ตึกแถว ร้านค้า โกดัง หรือที่ดิน MapxProp ช่วยค้นหาจากสิ่งที่คุณต้องการทำได้โดยตรง
              </p>
              <div className="mt-6 hidden flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 min-[744px]:flex dark:text-neutral-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[#176b50] dark:text-emerald-300" /> ข้อมูลตรงประเภททรัพย์
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-[#176b50] dark:text-emerald-300" /> มีสถานะยืนยันประกาศ
                </span>
              </div>
            </div>

            <div className="relative hidden min-h-full overflow-hidden min-[744px]:block">
              <Image
                fill
                priority
                src={heroImage}
                alt="พื้นที่อสังหาริมทรัพย์สำหรับชีวิตและธุรกิจ"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#edf4f0] via-transparent to-transparent dark:from-[#10231d]" />
            </div>
          </div>
        </div>

        <div className="relative z-20 mx-auto -mt-4 max-w-[1180px] px-2 min-[744px]:-mt-12 sm:-mt-6 sm:px-5 lg:-mt-14">
          <PropertyHomeSearch />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-700 dark:text-neutral-200">ค้นหายอดนิยม:</span>
            {[
              ['คอนโดใกล้รถไฟฟ้า', 'property_type=condo'],
              ['ตึกแถวทำร้านอาหาร', 'use_case=food_service'],
              ['โกดังสมุทรปราการ', 'property_type=warehouse'],
              ['ที่ดินเชียงใหม่', 'property_type=land'],
            ].map(([label, query]) => (
              <Link
                key={label}
                href={`/real-estate-categories/all?${query}`}
                className="hover:text-[#176b50] hover:underline dark:hover:text-emerald-300"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PropertyListingShowcase />

      <section className="container py-10 sm:py-14 lg:py-16">
        <div className="mb-6 flex items-end justify-between gap-5 sm:mb-8">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#176b50] dark:text-emerald-300">สำรวจจากทำเล</p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              เมืองที่คนกำลังค้นหา
            </h2>
          </div>
          <Link
            href="/real-estate-categories-map/all"
            className="hidden items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-[#176b50] sm:inline-flex dark:text-neutral-300 dark:hover:text-emerald-300"
          >
            ดูบนแผนที่ <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {locations.map((location) => (
            <Link
              key={location.name}
              href={`/real-estate-categories/all?location=${encodeURIComponent(location.name)}`}
              className="group relative w-[78vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-3xl bg-neutral-200 sm:w-auto sm:max-w-none"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  fill
                  src={location.image}
                  alt={`อสังหาริมทรัพย์ใน${location.name}`}
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="flex items-center gap-1.5 text-lg font-semibold">
                    <MapPin className="size-5" /> {location.name}
                  </p>
                  <p className="mt-1 text-sm text-white/75">{location.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/real-estate-categories-map/all"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-[#176b50] sm:hidden dark:text-neutral-300 dark:hover:text-emerald-300"
        >
          ดูบนแผนที่ <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="container pt-16 pb-8 sm:pt-20 lg:pt-24">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#176b50] dark:text-emerald-300">เริ่มจากภาพใหญ่ก่อน</p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              คุณกำลังมองหาพื้นที่แบบไหน
            </h2>
          </div>
          <p className="hidden max-w-md text-right text-sm text-neutral-500 lg:block dark:text-neutral-400">
            เราแสดงเพียง 4 กลุ่มหลัก แล้วค่อยเปิดรายละเอียดเมื่อคุณต้องการ
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {propertyGroups.map((group) => {
            const Icon = group.icon
            return (
              <Link
                key={group.title}
                href={group.href}
                className="group flex min-h-44 flex-col rounded-3xl border border-neutral-200 p-5 transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-200/50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:shadow-black/20"
              >
                <span className={`flex size-12 items-center justify-center rounded-2xl ${group.tone}`}>
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-neutral-950 dark:text-white">{group.title}</h3>
                <p className="mt-1 text-sm/6 text-neutral-500 dark:text-neutral-400">{group.description}</p>
                <ArrowRight className="mt-auto size-5 translate-x-0 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-[#176b50] dark:group-hover:text-emerald-300" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="bg-[#f5f7f4] py-16 sm:py-20 lg:py-24 dark:bg-neutral-950/60">
        <div className="container">
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold text-[#176b50] dark:text-emerald-300">
              ไม่ต้องรู้ชื่อประเภททรัพย์ก่อนก็ได้
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              ค้นหาจากสิ่งที่คุณอยากทำ
            </h2>
            <p className="mt-3 text-neutral-500 dark:text-neutral-400">
              ระบบจะค้นข้ามประเภททรัพย์ให้ เช่น “เปิดร้านอาหาร” อาจพบทั้งตึกแถว พื้นที่ค้าขาย และที่ดินที่เหมาะสม
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {useCaseHighlights.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4 transition hover:border-[#8fbfac] hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700"
                >
                  <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-[#e9f3ee] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                    <Icon className="size-6" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-950 dark:text-white">{item.title}</span>
                    <span className="mt-1 block text-sm/5 text-neutral-500 dark:text-neutral-400">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-[#176b50] dark:text-neutral-600 dark:group-hover:text-emerald-300" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container pb-20 lg:pb-28">
        <div className="relative overflow-hidden rounded-[32px] bg-[#123f32] px-6 py-10 text-white sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:px-14 dark:bg-emerald-950">
          <div className="pointer-events-none absolute -top-16 right-12 size-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-10 -bottom-32 size-72 rounded-full bg-emerald-300/10" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold text-emerald-200">สำหรับเจ้าของทรัพย์และผู้ประกอบการ</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">มีพื้นที่ดี ๆ ที่อยากให้คนค้นพบ?</h2>
            <p className="mt-3 text-emerald-50/75">
              ลงรายละเอียดครั้งเดียว ระบบช่วยจัดประกาศให้อยู่ในหมวดและการใช้งานที่คนค้นหาจริง
            </p>
          </div>
          <Link
            href="/add-listing/1"
            className="relative mt-7 inline-flex min-h-13 items-center justify-center rounded-full bg-white px-7 font-semibold text-[#123f32] shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-50 lg:mt-0"
          >
            ลงประกาศฟรี
          </Link>
        </div>
      </section>
    </main>
  )
}

export default PropertyHomePrototype
