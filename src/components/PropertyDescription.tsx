const headings = new Set([
  'รายละเอียดทรัพย์',
  'ทำเลและการเดินทาง',
  'ข้อควรทราบเกี่ยวกับทรัพย์',
  'ราคาและการติดต่อ',
  'Property details',
  'Location and access',
  'Property notes',
  'Price and contact',
])

export default function PropertyDescription({ text, className = '' }: { text: string; className?: string }) {
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
