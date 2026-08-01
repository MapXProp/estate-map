import Link from 'next/link'

const MobilePropertyBrandMark = () => (
  <Link
    href="/"
    aria-label="MapxProp home"
    className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[13px] border border-[#0d352a] bg-[#123f32] shadow-[0_5px_14px_rgba(18,63,50,0.20)] transition active:scale-95 max-[339px]:hidden dark:border-emerald-800 dark:bg-emerald-200"
  >
    <span className="font-serif text-[20px] leading-none font-bold text-white dark:text-emerald-950">M</span>
    <span className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-[#ff6a2a] ring-1 ring-white/70" />
  </Link>
)

export default MobilePropertyBrandMark
