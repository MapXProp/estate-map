'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import BgGlassmorphism from '@/components/BgGlassmorphism'
import Image from 'next/image'

type AboutPageContentProps = {
  listingCount: number
  propertyTypeCount: number
  discoveryChannelCount: number
}

const aboutPropertyImages = [
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=84',
    alt: 'Modern detached house',
    className: 'mt-8 h-40 sm:h-56 lg:h-52 xl:h-60',
  },
  {
    src: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=84',
    alt: 'Condominium interior',
    className: 'h-52 sm:h-72 lg:h-[17rem] xl:h-[19rem]',
  },
  {
    src: 'https://images.unsplash.com/photo-1535401991746-da3d9055713e?auto=format&fit=crop&w=700&q=84',
    alt: 'Retail storefront',
    className: 'h-60 sm:h-80 lg:h-[19rem] xl:h-[22rem]',
  },
  {
    src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=700&q=84',
    alt: 'Office workspace with seating',
    className: 'h-52 sm:h-72 lg:h-[17rem] xl:h-[19rem]',
  },
  {
    src: 'https://images.unsplash.com/photo-1745757392529-c04da3b8a116?auto=format&fit=crop&w=700&q=84',
    alt: 'Vacant land plot',
    className: 'mt-8 h-40 sm:h-56 lg:h-52 xl:h-60',
  },
] as const

const aboutCopy = {
  th: {
    factsTitle: '🚀 ข้อมูลโดยสรุป',
    factsDescription: 'MapXProp ช่วยให้ค้นหาและลงประกาศพื้นที่สำหรับอยู่อาศัยและทำธุรกิจได้ง่ายขึ้น',
    listingLabel: 'ประกาศที่เผยแพร่บน MapXProp',
    channelLabel: 'เส้นทางการค้นหาหลัก — บ้าน ห้องเช่า และพื้นที่ธุรกิจ',
    propertyTypeLabel: 'ประเภททรัพย์ที่ค้นหาและลงประกาศได้',
    aboutTitle: '👋 เกี่ยวกับเรา',
    aboutDescription:
      'MapXProp คือพื้นที่สำหรับค้นหาและลงประกาศอสังหาริมทรัพย์ เรากำลังเตรียมเรื่องราวของเราไว้ให้คุณได้รู้จักมากขึ้นเร็ว ๆ นี้',
  },
  en: {
    factsTitle: '🚀 Fast Facts',
    factsDescription: 'MapXProp makes it easier to discover and list spaces for living and business.',
    listingLabel: 'Published listings on MapXProp',
    channelLabel: 'Main discovery paths — homes, rooms and business spaces',
    propertyTypeLabel: 'Property types available to search and list',
    aboutTitle: '👋 About Us.',
    aboutDescription:
      'MapXProp is a place to discover and list real estate. We are preparing our story so you can get to know us better soon.',
  },
} as const

const AboutPageContent = ({ listingCount, propertyTypeCount, discoveryChannelCount }: AboutPageContentProps) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const t = aboutCopy[isThai ? 'th' : 'en']
  const formatNumber = (value: number) => value.toLocaleString(isThai ? 'th-TH' : 'en-US')

  const facts = [
    { value: formatNumber(listingCount), label: t.listingLabel },
    { value: formatNumber(discoveryChannelCount), label: t.channelLabel },
    { value: formatNumber(propertyTypeCount), label: t.propertyTypeLabel },
  ]

  return (
    <main className="relative overflow-hidden py-14 sm:py-20 lg:py-24">
      <BgGlassmorphism />

      <div className="container relative flex flex-col gap-20 sm:gap-28 lg:gap-32">
        <section aria-labelledby="fast-facts-heading" className="order-2">
          <div className="max-w-2xl">
            <h1 id="fast-facts-heading" className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl/10 dark:text-white">
              {t.factsTitle}
            </h1>
            <p className="mt-3 text-base/7 text-neutral-600 sm:text-lg/8 dark:text-neutral-300">{t.factsDescription}</p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3 lg:mt-11 lg:gap-6 xl:gap-8">
            {facts.map((fact) => (
              <article
                key={fact.label}
                className="rounded-3xl border border-neutral-100 bg-neutral-50 p-6 shadow-[0_14px_35px_rgba(16,24,40,0.035)] sm:p-7 dark:border-neutral-800 dark:bg-neutral-800/80 dark:shadow-none"
              >
                <p className="text-3xl leading-none font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
                  {fact.value}
                </p>
                <p className="mt-4 text-sm/6 text-neutral-600 sm:text-base/7 dark:text-neutral-300">{fact.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="about-us-heading" className="relative order-1">
          <div className="relative flex flex-col items-center gap-10 text-center sm:gap-20 lg:flex-row lg:text-left">
            <div className="w-screen max-w-full xl:max-w-lg">
              <h2 id="about-us-heading" className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl dark:text-white">
                {t.aboutTitle}
              </h2>
              <p className="mt-7 text-base/7 text-neutral-600 xl:text-lg/8 dark:text-neutral-300">{t.aboutDescription}</p>
            </div>

            <div className="grow">
              <div className="flex items-start justify-center gap-1.5 sm:gap-3 lg:gap-4">
                {aboutPropertyImages.map((image, index) => (
                  <div
                    key={image.alt}
                    className={`relative w-[16%] shrink-0 overflow-hidden rounded-[18px] shadow-[0_12px_24px_rgba(15,23,42,0.14)] sm:rounded-[24px] lg:w-[15%] ${image.className}`}
                  >
                    <Image
                      fill
                      src={image.src}
                      alt={image.alt}
                      sizes="(max-width: 640px) 16vw, (max-width: 1024px) 15vw, 9vw"
                      className="object-cover"
                      priority={index < 2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AboutPageContent
