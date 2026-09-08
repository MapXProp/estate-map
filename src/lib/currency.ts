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
  const maximumFractionDigits = options.maximumFractionDigits ?? (currency === 'USD' && Math.abs(amount) < 100 ? 2 : 0)

  if (currency === 'THB' && locale === 'th' && options.compact && Math.abs(amount) >= 1_000_000) {
    const scale = Math.abs(amount) >= 1_000_000_000 ? 1_000_000_000 : 1_000_000
    const unit = scale === 1_000_000_000 ? 'พันล้านบาท' : 'ล้านบาท'
    const scaledAmount = new Intl.NumberFormat('th-TH', {
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
    }).format(amount / scale)
    const formatted = `${scaledAmount} ${unit}`

    return options.approximate ? `≈ ${formatted}` : formatted
  }

  const formattedAmount = new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    notation: options.compact ? 'compact' : 'standard',
    maximumFractionDigits,
  }).format(amount)
  const { prefix, suffix } = getCurrencyAffixes(currency)
  const formatted = prefix ? `${prefix}${formattedAmount}` : `${formattedAmount} ${suffix}`

  return options.approximate ? `≈ ${formatted}` : formatted
}
