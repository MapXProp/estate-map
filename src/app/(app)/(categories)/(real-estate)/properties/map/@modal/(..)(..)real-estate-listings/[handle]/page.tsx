import { getRealEstateListingByHandle } from '@/data/listings'
import { notFound } from 'next/navigation'
import PropertyPreviewModal from '../../../components/PropertyPreviewModal'

const Page = async ({ params }: { params: Promise<{ handle: string }> }) => {
  const { handle } = await params
  const listing = await getRealEstateListingByHandle(handle)

  if (!listing?.id) notFound()

  return <PropertyPreviewModal listing={listing} />
}

export default Page
