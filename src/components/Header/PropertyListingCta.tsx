import Link from 'next/link'

type Props = {
  label?: string
  freeLabel?: string
  className?: string
}

const PropertyListingCta = ({
  label = 'ลงประกาศ',
  freeLabel = 'ฟรี',
  className = '',
}: Props) => {
  return (
    <Link
      href="/add-listing/1"
      className={`group relative inline-flex min-h-10 shrink-0 items-center gap-1.5 overflow-hidden rounded-full border border-orange-600/15 bg-gradient-to-r from-[#ff5a1f] to-[#ff7a00] py-1.5 ps-4 pe-2 text-sm font-semibold whitespace-nowrap text-white shadow-[0_5px_16px_rgba(249,91,20,0.27)] transition duration-200 before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:h-px before:bg-white/50 hover:from-[#f4511e] hover:to-[#ff8500] hover:shadow-[0_8px_22px_rgba(249,91,20,0.34)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 active:shadow-[0_3px_10px_rgba(249,91,20,0.24)] min-[1100px]:gap-2 min-[1100px]:ps-4.5 min-[1100px]:pe-2.5 dark:border-orange-300/20 dark:shadow-[0_5px_18px_rgba(249,91,20,0.2)] ${className}`}
    >
      <span className="relative">{label}</span>
      <span className="relative inline-flex min-h-6 items-center rounded-full bg-white/18 px-2 text-[11px] font-bold text-white ring-1 ring-white/25 transition group-hover:bg-white group-hover:text-orange-600">
        {freeLabel}
      </span>
    </Link>
  )
}

export default PropertyListingCta
