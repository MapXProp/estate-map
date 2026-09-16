export const cleanMapPriceInput = (value: string) => value.replace(/\D/g, '').slice(0, 12)

export const formatMapPriceInput = (value: string) => (value ? Number(value).toLocaleString('en-US') : '')

// Never truncate a larger amount or turn an empty field into a price.
export const appendMapPriceZeros = (value: string) =>
  /^\d{1,9}$/.test(value) && Number(value) > 0 ? `${value}000` : value

export const getMapPricePresets = (offers: readonly string[]) => {
  if (offers.length && offers.every((offer) => offer === 'rent' || offer === 'sublease'))
    return [10000, 20000, 30000, 60000]
  if (offers.length && offers.every((offer) => offer === 'sale' || offer === 'business_transfer'))
    return [1000000, 3000000, 5000000, 10000000]
  return [20000, 60000, 1000000, 3000000]
}

export const formatMapPricePreset = (value: number, th: boolean) =>
  value >= 1000000 ? `${value / 1000000}${th ? ' ล้าน' : 'M'}` : formatMapPriceInput(String(value))
