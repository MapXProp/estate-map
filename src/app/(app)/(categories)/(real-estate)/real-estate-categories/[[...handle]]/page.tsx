import PropertyCardH from '@/components/PropertyCardH'
import PropertyListingResultsHeader from '@/components/property-home/PropertyListingResultsHeader'
import PropertySearchResults from '@/components/property-home/PropertySearchResults'
import { getRealEstateCategoryByHandle } from '@/data/categories'
import { getRealEstateListings } from '@/data/listings'
import { Divider } from '@/shared/divider'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ handle?: string[] }> }): Promise<Metadata> {
  const { handle } = await params
  const category = await getRealEstateCategoryByHandle(handle?.[0])
  if (!category) {
    return {
      title: 'Collection not found',
      description: 'The collection you are looking for does not exist.',
    }
  }
  const { name, description } = category
  return { title: name, description }
}

const Page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ handle?: string[] }>
  searchParams: Promise<{ q?: string }>
}) => {
  const { handle } = await params
  const { q } = await searchParams

  if (q?.trim()) {
    return <PropertySearchResults query={q.trim()} />
  }

  const category = await getRealEstateCategoryByHandle(handle?.[0])
  const listings = await getRealEstateListings()

  if (!category?.id) {
    return redirect('/real-estate-categories/all')
  }

  return (
    <div className="pb-28">
      <div className="relative container pt-8 sm:pt-10 lg:pt-14">
        <PropertyListingResultsHeader count={listings.length} categoryHandle={category.handle} />
        <Divider className="my-8 md:mb-12" />

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {listings.map((listing) => (
            <PropertyCardH key={listing.id} data={listing} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Page
