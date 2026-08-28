import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import { FC } from 'react'

const styles = {
  base: 'absolute z-10 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-primary-600 text-neutral-50 hover:bg-primary-700 focus:outline-hidden cursor-pointer',
  default: 'size-16 end-2 xl:end-4',
  small: 'size-14 end-2',
}

interface Props {
  className?: string
  fieldStyle: 'default' | 'small'
  label?: string
  responsive?: boolean
}

export const ButtonSubmit: FC<Props> = ({ className, fieldStyle = 'default', label = 'ค้นหา', responsive = false }) => {
  return (
    <button
      type="submit"
      aria-label={label}
      className={clsx(
        responsive
          ? 'relative z-10 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary-600 text-neutral-50 hover:bg-primary-700 focus:outline-hidden min-[744px]:absolute min-[744px]:end-2 min-[744px]:top-1/2 min-[744px]:size-16 min-[744px]:-translate-y-1/2 min-[744px]:rounded-full xl:end-4'
          : [styles.base, styles[fieldStyle]],
        className
      )}
    >
      <HugeiconsIcon icon={Search01Icon} size={24} />
      {responsive && <span className="text-sm font-semibold min-[744px]:sr-only">{label}</span>}
    </button>
  )
}
