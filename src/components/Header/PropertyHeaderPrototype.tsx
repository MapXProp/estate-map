import { getCurrencies, getLanguages } from '@/data/navigation'
import { Button } from '@/shared/Button'
import Logo from '@/shared/Logo'
import { Map } from 'lucide-react'
import Link from 'next/link'
import AvatarDropdown from './AvatarDropdown'
import CurrLangDropdown from './CurrLangDropdown'
import NotifyDropdown from './NotifyDropdown'
import PropertyMegaMenu from './PropertyMegaMenu'

const offerLinks = [
  ['ซื้อ', 'sale'],
  ['เช่า', 'rent'],
  ['เซ้ง', 'business_transfer'],
] as const

const PropertyHeaderPrototype = async () => {
  const currencies = await getCurrencies()
  const languages = await getLanguages()

  return (
    <header className="relative">
      <div className="container">
        <div className="flex h-20 items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex min-w-0 items-center gap-2 min-[900px]:gap-4">
            <Logo className="w-20 min-[1100px]:w-24" />
            <div className="hidden h-7 border-l border-neutral-200 min-[900px]:block dark:border-neutral-700" />
            <nav aria-label="เมนูค้นหาอสังหาริมทรัพย์" className="flex items-center gap-0.5">
              {offerLinks.map(([label, value]) => (
                <Link
                  key={value}
                  href={`/real-estate-categories/all?offer_type=${value}`}
                  className="rounded-full px-2.5 py-2.5 text-sm font-semibold whitespace-nowrap text-neutral-700 transition hover:bg-neutral-100 hover:text-[#176b50] min-[1100px]:px-3.5 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-300"
                >
                  {label}
                </Link>
              ))}
              <PropertyMegaMenu />
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 min-[1100px]:gap-3">
            <Link
              href="/real-estate-categories-map/all"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-[#176b50] min-[1100px]:flex dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-emerald-300"
            >
              <Map className="size-4" />
              แผนที่
            </Link>
            <CurrLangDropdown currencies={currencies} languages={languages} className="hidden min-[900px]:block" />
            <Button
              className="button-fire-border min-h-10 rounded-full px-4! py-2! font-sarabun! text-sm! font-semibold whitespace-nowrap shadow-md min-[1100px]:px-5! min-[1100px]:shadow-lg"
              color="light"
              href="/add-listing/1"
            >
              ลงประกาศ ฟรี
            </Button>
            <NotifyDropdown className="hidden min-[900px]:block" />
            <AvatarDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}

export default PropertyHeaderPrototype
