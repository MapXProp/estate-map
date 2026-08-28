'use client'

import {
  RealEstateHeroSearchForm,
  type RealEstateSearchTab,
} from '@/components/HeroSearchForm/RealEstateHeroSearchForm'
import type { PropertySiteMode } from '@/components/property-home/PropertyHomeSearch'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const ChannelHomeSearch = ({ mode }: { mode: Exclude<PropertySiteMode, 'all'> }) => {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<RealEstateSearchTab>(mode)

  useEffect(() => {
    setSelectedTab(mode)
  }, [mode])

  const handleTabChange = (tab: RealEstateSearchTab) => {
    setSelectedTab(tab)

    if (tab === 'all') return

    // RealEstateHeroSearchForm persists the selected channel before this
    // callback runs; this wrapper only handles the channel navigation.
    router.push(`/${tab}`)
  }

  return (
    <section
      className="container hidden pt-3 min-[744px]:block min-[744px]:pt-4 lg:pt-5"
      aria-label="ค้นหาอสังหาริมทรัพย์"
    >
      <div className="mx-auto max-w-[1180px]">
        <RealEstateHeroSearchForm
          formStyle="default"
          selectedTab={selectedTab}
          onSelectedTabChange={handleTabChange}
          responsive
        />
      </div>
    </section>
  )
}

export default ChannelHomeSearch
