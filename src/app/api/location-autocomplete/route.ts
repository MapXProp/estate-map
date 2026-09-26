import { longdoWordSuggestions, PLACE_AUTOCOMPLETE_MIN_LENGTH, placeSearchLocale } from '@/lib/placeAutocomplete'
import { getLongdoApiKey, longdoNoStoreHeaders, takeLongdoQuota } from '@/lib/server/longdoQuota'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const cache = new Map<string, { expires: number; suggestions: ReturnType<typeof longdoWordSuggestions> }>()

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().replace(/\s+/g, ' ') || ''
  const headers = longdoNoStoreHeaders
  if (Array.from(query).length < PLACE_AUTOCOMPLETE_MIN_LENGTH || query.length > 120)
    return NextResponse.json({ suggestions: [] }, { headers })
  const locale = placeSearchLocale(query, request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'th')
  const cacheKey = `${locale}:${query.toLocaleLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) return NextResponse.json({ suggestions: cached.suggestions }, { headers })
  const key = getLongdoApiKey()
  if (!key) return NextResponse.json({ suggestions: [], unavailable: true }, { status: 503, headers })
  if (!takeLongdoQuota(request))
    return NextResponse.json(
      { suggestions: [], limited: true },
      { status: 429, headers: { ...headers, 'Retry-After': '60' } }
    )
  try {
    // The Suggest index returns Thai/English completions from the input itself.
    // Its highlighted HTML is deliberately ignored; render plain words only.
    const params = new URLSearchParams({ keyword: query, limit: '12', key })
    const response = await fetch('https://search.longdo.com/mapsearch/json/suggest?' + params, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    })
    if (!response.ok) throw new Error('Provider unavailable')
    const result = (await response.json()) as { meta?: { keyword?: string }; data?: unknown }
    const suggestions =
      result.meta?.keyword && result.meta.keyword !== query ? [] : longdoWordSuggestions(result.data, locale)
    cache.set(cacheKey, { expires: Date.now() + (suggestions.length ? 300000 : 30000), suggestions })
    if (cache.size > 150) cache.delete(cache.keys().next().value!)
    return NextResponse.json({ suggestions }, { headers })
  } catch {
    return NextResponse.json({ suggestions: [], unavailable: true }, { status: 502, headers })
  }
}
