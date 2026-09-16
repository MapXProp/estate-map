export const cleanMapPriceInput = (value: string) => value.replace(/\D/g, '').slice(0, 12)

export const formatMapPriceInput = (value: string) => (value ? Number(value).toLocaleString('en-US') : '')

export const mapPriceSuffixes = ['00', '000', '50', '500'] as const

// Append digits, without truncating a larger amount or filling an empty field with only zeros.
export const appendMapPriceSuffix = (value: string, suffix: (typeof mapPriceSuffixes)[number]) => {
  if (value && !/^\d+$/.test(value)) return value
  const next = `${value}${suffix}`
  return next.length <= 12 && Number(next) > 0 ? next : value
}
