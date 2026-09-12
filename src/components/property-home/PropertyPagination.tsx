import { catalogPagePath } from '@/lib/propertyCatalog'
import Link from 'next/link'

export default function PropertyPagination({
  page,
  pages,
  basePath,
}: {
  page: number
  pages: number
  basePath: string
}) {
  if (pages <= 1) return null
  const visible = Array.from(new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))).sort(
    (a, b) => a - b
  )
  const href = (n: number) => (basePath.includes('?') ? `${basePath}&page=${n}` : catalogPagePath(basePath, n))
  return (
    <nav aria-label="หน้าประกาศ" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link
          rel="prev"
          href={href(page - 1)}
          prefetch={false}
          className="min-h-11 rounded-xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700"
        >
          ก่อนหน้า
        </Link>
      )}
      {visible.map((n, index) => (
        <span key={n} className="flex items-center gap-2">
          {index > 0 && n - visible[index - 1] > 1 && <span aria-hidden="true">…</span>}
          <Link
            href={href(n)}
            prefetch={false}
            aria-label={`หน้าที่ ${n}`}
            aria-current={n === page ? 'page' : undefined}
            className={`grid min-h-11 min-w-11 place-items-center rounded-xl border text-sm ${n === page ? 'border-[#176b50] bg-[#176b50] text-white' : 'border-neutral-200 dark:border-neutral-700'}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link
          rel="next"
          href={href(page + 1)}
          prefetch={false}
          className="min-h-11 rounded-xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700"
        >
          ถัดไป
        </Link>
      )}
    </nav>
  )
}
