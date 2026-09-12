import RealEstateListingPage from '@/app/(app)/(listings)/real-estate-listings/[handle]/page'
import { fetchPropertyListingDetail } from '@/lib/propertySearch'
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
  if (view === 'full') {
    return (
      <FullPropertyDetailView>
        <div className="container">
          <RealEstateListingPage params={Promise.resolve({ handle })} />
        </div>
      </FullPropertyDetailView>
    )
  }

  const listing = await fetchPropertyListingDetail(handle)
  if (!listing?.id) notFound()

  return <PropertyPreviewModal listing={listing} />
}

export default Page
