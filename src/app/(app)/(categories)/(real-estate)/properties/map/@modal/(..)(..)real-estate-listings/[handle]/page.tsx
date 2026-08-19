import RealEstateListingPage from '@/app/(app)/(listings)/real-estate-listings/[handle]/page'
import { getRealEstateListingByHandle } from '@/data/listings'
import { notFound } from 'next/navigation'
import FullPropertyDetailView from '../../../components/FullPropertyDetailView'
import PropertyPreviewModal from '../../../components/PropertyPreviewModal'

type PageProps = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ view?: string | string[] }>
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { handle } = await params
  const { view } = await searchParams
  const listing = await getRealEstateListingByHandle(handle)

  if (!listing?.id) notFound()

  if (view === 'full') {
    return (
      <FullPropertyDetailView>
        <div className="container">
          <RealEstateListingPage params={Promise.resolve({ handle })} />
        </div>
      </FullPropertyDetailView>
    )
  }

  return <PropertyPreviewModal listing={listing} />
}

export default Page
