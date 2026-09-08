export type MoneyLocale = 'th' | 'en'

type FormatMoneyOptions = {
  currency?: string
  locale?: MoneyLocale
  compact?: boolean
  maximumFractionDigits?: number
  approximate?: boolean
}

export const getCurrencyAffixes = (currency = 'THB') => {
  const normalizedCurrency = currency.toUpperCase()

  if (normalizedCurrency === 'USD') return { prefix: '$', suffix: '' }
  if (normalizedCurrency === 'THB') return { prefix: '', suffix: 'บาท' }

  return { prefix: '', suffix: normalizedCurrency }
}

export const formatMoney = (amount: number, options: FormatMoneyOptions = {}) => {
  const currency = (options.currency || 'THB').toUpperCase()
  const locale = options.locale || 'th'
  const formattedAmount = new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    notation: options.compact ? 'compact' : 'standard',
    maximumFractionDigits: options.maximumFractionDigits ?? (currency === 'USD' && Math.abs(amount) < 100 ? 2 : 0),
  }).format(amount)
  const { prefix, suffix } = getCurrencyAffixes(currency)
  const suffixSeparator = options.compact && locale === 'th' ? '' : ' '
  const formatted = prefix ? `${prefix}${formattedAmount}` : `${formattedAmount}${suffixSeparator}${suffix}`

  return options.approximate ? `≈ ${formatted}` : formatted
}
