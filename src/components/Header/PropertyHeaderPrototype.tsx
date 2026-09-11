import { Suspense } from 'react'
import PropertyHeaderContent from './PropertyHeaderContent'
import PropertyHeaderVariant from './PropertyHeaderVariant'

const PropertyHeaderPrototype = () => (
  <Suspense fallback={<PropertyHeaderContent />}>
    <PropertyHeaderVariant />
  </Suspense>
)

export default PropertyHeaderPrototype
