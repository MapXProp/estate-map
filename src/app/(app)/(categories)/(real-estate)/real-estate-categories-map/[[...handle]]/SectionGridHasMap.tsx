'use client'

import ListingFilterTabs from '@/components/ListingFilterTabs'
import PropertyCard from '@/components/PropertyCard'
import { TRealEstateCategory } from '@/data/categories'
import { TRealEstateListing } from '@/data/listings'
import { TPropertyMapFilterOptions } from '@/data/propertyMapFilters'
import { Divider } from '@/shared/divider'
import Pagination from '@/shared/Pagination'
import convertNumbThousand from '@/utils/convertNumbThousand'
import clsx from 'clsx'
import { FC, useState } from 'react'
import MapFixedSection from '../../../MapFixedSection'

interface Props {
  className?: string
  listings: TRealEstateListing[]
  category: TRealEstateCategory
  filterOptions: TPropertyMapFilterOptions
  query?: string
}

const SectionGridHasMap: FC<Props> = ({ className, listings, category, filterOptions, query = '' }) => {
  const [currentHoverID, setCurrentHoverID] = useState<string>('')

  return (
    <div className={clsx('relative flex min-h-screen gap-4 xl:gap-6', className)}>
      <div className="flex w-full flex-col gap-y-4 pt-5 pb-32 lg:flex-[62_1_0%] lg:gap-y-5 lg:pt-6 lg:pb-20 xl:flex-[68_1_0%]">
        <div id="heading" className="flex items-end justify-between gap-4 lg:pe-5 xl:pe-0">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#176b50]">ค้นหาอสังหาบนแผนที่</p>
            <h1 className="mt-1 text-xl font-semibold text-neutral-950 dark:text-white">
              {query ? `ผลการค้นหา “${query}”` : `พบ ${convertNumbThousand(category.count)} ประกาศ`}
              {!query && category.handle !== 'all' ? ` ใน ${category.name}` : null}
            </h1>
            {query && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                พบ {convertNumbThousand(category.count)} ประกาศที่อาจตรงกับคำค้น
              </p>
            )}
          </div>
          <button
            type="button"
            className="hidden shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 transition hover:border-[#aacbbb] hover:text-[#12513f] min-[744px]:block dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            เรียง: แนะนำ
          </button>
        </div>
        <div className="hidden pe-5 min-[744px]:block xl:pe-0">
          <ListingFilterTabs filterOptions={filterOptions} variant="property-map" visibleFilterCount={4} />
        </div>
        <Divider />
        <div className="grid grid-cols-2 gap-x-2 gap-y-6 lg:grid-cols-3 lg:gap-x-3 lg:gap-y-8 lg:pe-5 xl:grid-cols-4 xl:gap-x-4 xl:pe-0">
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              onMouseEnter={() => setCurrentHoverID(listing.id)}
              onMouseLeave={() => setCurrentHoverID('')}
            >
              <PropertyCard data={listing} autoPlayGallery autoPlayDelay={(index % 4) * 320} compactMobile />
            </div>
          ))}
        </div>
        <div className="mt-16 flex items-center">
          <Pagination />
        </div>
      </div>

      <MapFixedSection
        closeButtonHref={`/real-estate-categories/${category.handle}#heading`}
        currentHoverID={currentHoverID}
        listings={listings}
        listingType="RealEstates"
        splitAtLg
        resultCount={category.count}
      />
    </div>
  )
}

export default SectionGridHasMap
