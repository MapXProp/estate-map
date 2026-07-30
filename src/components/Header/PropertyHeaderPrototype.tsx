import { getCurrencies, getLanguages } from '@/data/navigation'
import PropertyHeaderContent from './PropertyHeaderContent'

const PropertyHeaderPrototype = async () => {
  const currencies = await getCurrencies()
  const languages = await getLanguages()

  return <PropertyHeaderContent currencies={currencies} languages={languages} />
}

export default PropertyHeaderPrototype
