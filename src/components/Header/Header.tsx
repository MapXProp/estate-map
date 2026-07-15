import { getStayCategories } from '@/data/categories'
import { getCurrencies, getLanguages, getNavMegaMenu } from '@/data/navigation'
import { Button } from '@/shared/Button'
import Logo from '@/shared/Logo'
import clsx from 'clsx'
import { FC } from 'react'
import AvatarDropdown from './AvatarDropdown'
import CategoriesDropdown from './CategoriesDropdown'
import CurrLangDropdown from './CurrLangDropdown'
import HamburgerBtnMenu from './HamburgerBtnMenu'
import MegaMenuPopover from './MegaMenuPopover'
import NotifyDropdown from './NotifyDropdown'
interface HeaderProps {
  hasBorderBottom?: boolean
  className?: string
}

const Header: FC<HeaderProps> = async ({ hasBorderBottom = true, className }) => {
  const megamenu = await getNavMegaMenu()
  const currencies = await getCurrencies()
  const languages = await getLanguages()
  const featuredCategory = (await getStayCategories())[7]

  return (
    <div className={clsx('relative', className)}>
      <div className="container">
        <div
          className={clsx(
            'flex h-20 justify-between gap-x-2.5 border-neutral-200 dark:border-neutral-700',
            hasBorderBottom && 'border-b',
            !hasBorderBottom && 'has-[.header-popover-full-panel]:border-b'
          )}
        >
          <div className="flex shrink-0 items-center justify-center gap-x-3 min-[744px]:gap-x-8">
            <Logo />
            <div className="hidden h-7 border-l border-neutral-200 min-[744px]:block dark:border-neutral-700"></div>
            <div className="hidden min-[744px]:block">
              <CategoriesDropdown />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-x-2 min-[744px]:gap-x-3 min-[1100px]:gap-x-6">
            <div className="block min-[744px]:hidden">
              <HamburgerBtnMenu />
            </div>
            <MegaMenuPopover megamenu={megamenu} featuredCategory={featuredCategory} />
            <CurrLangDropdown currencies={currencies} languages={languages} className="hidden min-[744px]:block" />
            <Button
              className="button-fire-border min-h-11 rounded-full px-4! py-2.5! font-sarabun! text-sm! font-bold whitespace-nowrap shadow-lg min-[744px]:-mx-1 min-[744px]:px-7! min-[744px]:py-3! min-[744px]:text-lg! min-[744px]:shadow-2xl"
              color="light"
              href={'/add-listing/1'}
            >
              ลงประกาศ ฟรี
            </Button>
            <NotifyDropdown className="hidden min-[744px]:block" />
            <AvatarDropdown />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
