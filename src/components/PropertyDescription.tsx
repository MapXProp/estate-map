'use client'

import {
  isPropertyLocationHeading,
  isPropertySummaryHeading,
  propertyDescriptionSections,
} from '@/lib/propertyDetailPresentation'
import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

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

// Measure the unclipped text so wrapping, font loading and viewport changes all
// determine whether a read-more control is needed. Without JS, all text is visible.
export function DescriptionExcerpt({ paragraphs, isThai }: { paragraphs: string[]; isThai: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const contentId = useId()
  const [canExpand, setCanExpand] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    let disposed = false
    const measure = () => {
      if (disposed) return
      const lineHeight = Number.parseFloat(window.getComputedStyle(content).lineHeight)
      setCanExpand(content.getBoundingClientRect().height > lineHeight * 7 + 1)
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    observer?.observe(content)
    window.addEventListener('resize', measure)
    void document.fonts?.ready.then(measure)
    return () => {
      disposed = true
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div data-description-excerpt>
      <div
        id={contentId}
        className="overflow-hidden leading-7"
        style={canExpand && !expanded ? { maxHeight: '7lh' } : undefined}
      >
        <div ref={contentRef} className="space-y-[1lh]">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="[overflow-wrap:anywhere] whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
      {canExpand && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-neutral-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:text-neutral-200"
        >
          {expanded ? (isThai ? 'แสดงน้อยลง' : 'Show less') : isThai ? 'อ่านเพิ่มเติม' : 'Read more'}
          <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}

export default function PropertyDescription({
  text,
  className = '',
  collapsible = false,
  isThai = true,
  separateLocation = false,
}: {
  text: string
  className?: string
  collapsible?: boolean
  isThai?: boolean
  separateLocation?: boolean
}) {
  if (collapsible) {
    const sections = propertyDescriptionSections(text).filter(
      (section) => !separateLocation || !isPropertyLocationHeading(section.heading)
    )
    const introduction = isPropertySummaryHeading(sections[0]?.heading ?? '') ? sections[0] : undefined
    const remaining = sections.filter((section) => section !== introduction && section.paragraphs.length)
    return (
      <div className={`text-neutral-600 dark:text-neutral-300 ${className}`} data-listing-description>
        {introduction && (
          <DescriptionExcerpt
            key={introduction.paragraphs.join('\n\n')}
            paragraphs={introduction.paragraphs}
            isThai={isThai}
          />
        )}
        {remaining.length > 0 && (
          <div className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {remaining.map((section, index) => (
              <details key={`${section.heading}-${index}`} open className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-neutral-900 dark:text-white [&::-webkit-details-marker]:hidden">
                  {section.heading || (isThai ? 'รายละเอียดเพิ่มเติม' : 'More details')}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-neutral-500 transition group-open:rotate-180"
                  />
                </summary>
                <div className="space-y-4 pb-5 leading-7">
                  {isPropertySummaryHeading(section.heading) ? (
                    <DescriptionExcerpt
                      key={section.paragraphs.join('\n\n')}
                      paragraphs={section.paragraphs}
                      isThai={isThai}
                    />
                  ) : (
                    section.paragraphs.map((paragraph, i) => (
                      <p key={i} className="[overflow-wrap:anywhere] whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))
                  )}
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
