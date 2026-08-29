'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Button } from '@/shared/Button'
import { MapsLocation01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const PropertyListingResultsHeader = ({ count, categoryHandle }: { count: number; categoryHandle: string }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const formattedCount = count.toLocaleString(isThai ? 'th-TH' : 'en-US')

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-2.5 gap-y-5">
      <h1 id="heading" className="scroll-mt-20 text-lg font-semibold text-pretty sm:text-xl">
        {isThai ? `พบ ${formattedCount} ประกาศ` : `Over ${formattedCount} properties`}
      </h1>
      <Button color="white" className="ms-auto" href={`/real-estate-categories-map/${categoryHandle}`}>
        <span className="me-1">{isThai ? 'แสดงแผนที่' : 'Show map'}</span>
        <HugeiconsIcon icon={MapsLocation01Icon} size={20} color="currentColor" strokeWidth={1.5} />
      </Button>
    </div>
  )
}

export default PropertyListingResultsHeader
