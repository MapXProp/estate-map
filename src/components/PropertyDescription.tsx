import {
  isPropertyLocationHeading,
  isPropertySummaryHeading,
  propertyDescriptionSections,
} from '@/lib/propertyDetailPresentation'
import { ChevronDown } from 'lucide-react'

const headings = new Set([
  'รายละเอียดทรัพย์',
  'รายละเอียดที่ดิน',
  'รายละเอียดเพิ่มเติม',
  'ทำเลและการเดินทาง',
  'ข้อควรทราบเกี่ยวกับทรัพย์',
  'ราคาและการติดต่อ',
  'Property details',
  'Land details',
  'More details',
  'Location and access',
  'Property notes',
  'Price and contact',
])

export default function PropertyDescription({
  text,
  className = '',
  sectioned = false,
  isThai = true,
  separateLocation = false,
}: {
  text: string
  className?: string
  sectioned?: boolean
  isThai?: boolean
  separateLocation?: boolean
}) {
  if (sectioned) {
    const sections = propertyDescriptionSections(text).filter(
      (section) => !separateLocation || !isPropertyLocationHeading(section.heading)
    )
    const introduction = isPropertySummaryHeading(sections[0]?.heading ?? '') ? sections[0] : undefined
    const remaining = sections.filter((section) => section !== introduction && section.paragraphs.length)
    return (
      <div className={`text-neutral-600 dark:text-neutral-300 ${className}`} data-listing-description>
        {introduction && (
          <div className="space-y-4 leading-7">
            {introduction.paragraphs.map((paragraph, index) => (
              <p key={index} className="[overflow-wrap:anywhere] whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {remaining.length > 0 && (
          <div className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {remaining.map((section, index) => (
              <details key={`${section.heading}-${index}`} open className="group/description">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded py-4 font-semibold text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:text-white [&::-webkit-details-marker]:hidden">
                  {section.heading || (isThai ? 'รายละเอียดเพิ่มเติม' : 'More details')}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-neutral-500 transition-transform group-open/description:rotate-180"
                  />
                </summary>
                <div className="space-y-4 pb-5 leading-7">
                  {section.paragraphs.map((paragraph, i) => (
                    <p key={i} className="[overflow-wrap:anywhere] whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className={`space-y-4 leading-7 text-neutral-600 dark:text-neutral-300 ${className}`}>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((paragraph, index) =>
          headings.has(paragraph.trim()) ? (
            <h3 key={index} className="pt-3 text-base font-semibold text-neutral-950 first:pt-0 dark:text-white">
              {paragraph}
            </h3>
          ) : (
            <p key={index} className="[overflow-wrap:anywhere] whitespace-pre-line">
              {paragraph}
            </p>
          )
        )}
    </div>
  )
}
