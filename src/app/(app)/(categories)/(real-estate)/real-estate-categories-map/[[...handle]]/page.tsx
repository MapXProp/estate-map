import { getRealEstateCategoryByHandle } from '@/data/categories'
import { getRealEstateListings } from '@/data/listings'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import SectionGridHasMap from './SectionGridHasMap'

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
  searchParams: Promise<{ q?: string | string[] }>
}) => {
  const { handle } = await params
  const search = await searchParams
  const query = (Array.isArray(search.q) ? search.q[0] : search.q)?.trim() || ''
  const category = await getRealEstateCategoryByHandle(handle?.[0])
  const listings = await getRealEstateListings()

  if (!category?.id) {
    return redirect('/real-estate-categories/all')
  }

  return (
    <div className="container lg:max-w-none lg:ps-5 lg:pe-0 xl:ps-8 2xl:ps-10">
      <SectionGridHasMap listings={listings} category={category} query={query} />
    </div>
  )
}

export default Page
