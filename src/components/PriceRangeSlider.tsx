'use client'

import convertNumbThousand from '@/utils/convertNumbThousand'
import clsx from 'clsx'
import Slider from 'rc-slider'
import { useState } from 'react'

export const PriceRangeSlider = ({
  min,
  max,
  name = 'Price Range',
  className,
  onChange,
  defaultValue,
  inputMaxName = 'price_max',
  inputMinName = 'price_min',
  showTitle = true,
  currency = 'USD',
  step = 1,
  minLabel,
  maxLabel,
}: {
  min: number
  max: number
  name?: string
  className?: string
  onChange?: (value: number[]) => void
  defaultValue?: number[]
  inputMaxName?: string
  inputMinName?: string
  showTitle?: boolean
  currency?: 'USD' | 'THB'
  step?: number
  minLabel?: string
  maxLabel?: string
}) => {
  const [rangePrices, setRangePrices] = useState<number[]>([defaultValue?.[0] ?? min, defaultValue?.[1] ?? max])

  const formatPrice = (value: number) => {
    if (currency === 'THB') {
      if (value >= 1_000_000) {
        const millions = value / 1_000_000
        return `฿${Number.isInteger(millions) ? millions : millions.toFixed(1)} ล้าน`
      }
      return `฿${convertNumbThousand(value)}`
    }

    return value >= 1000 ? `$ ${convertNumbThousand(value / 1000)}k` : `$ ${value}`
  }

  return (
    <div className={clsx('relative flex flex-col gap-y-6', className)}>
      <div className="flex flex-col gap-y-5">
        {showTitle && <p className="font-medium">{name}</p>}
        <div className="px-2">
          <Slider
            range
            min={min}
            max={max}
            step={step}
            value={rangePrices} // Sử dụng value thay vì defaultValue để kiểm soát giá trị
            allowCross={false}
            onChange={(value) => {
              const newRange = value as [number, number]
              setRangePrices(newRange)
              onChange?.(newRange)
            }}
          />
        </div>
      </div>

      <div className="flex justify-between gap-x-5">
        <div className="flex-1">
          <div className="ps-4 text-xs/6 text-neutral-700 dark:text-neutral-300">
            {minLabel ?? (currency === 'THB' ? 'ราคาต่ำสุด' : 'Min price')}
          </div>
          <div className="relative mt-0.5 w-full rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-800">
            {formatPrice(rangePrices[0])}
          </div>
          <input type="hidden" name={inputMinName} value={rangePrices[0]} />
        </div>
        <div className="flex-1">
          <div className="ps-4 text-xs/6 text-neutral-700 dark:text-neutral-300">
            {maxLabel ?? (currency === 'THB' ? 'ราคาสูงสุด' : 'Max price')}
          </div>
          <div className="relative mt-0.5 w-full rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-800">
            {formatPrice(rangePrices[1])}
          </div>
          <input type="hidden" name={inputMaxName} value={rangePrices[1]} />
        </div>
      </div>
    </div>
  )
}
