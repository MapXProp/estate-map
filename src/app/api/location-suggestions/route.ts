import { getLongdoApiKey, longdoNoStoreHeaders, takeLongdoQuota } from '@/lib/server/longdoQuota'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type LongdoSuggestionResponse = {
  data?: Array<{ w?: unknown }>
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().replace(/\s+/g, ' ') || ''
  if (Array.from(query).length < 3 || query.length > 120) {
    return NextResponse.json({ suggestions: [] }, { headers: longdoNoStoreHeaders })
  }

  const apiKey = getLongdoApiKey()
  if (!apiKey) {
    return NextResponse.json({ suggestions: [], unavailable: true }, { status: 503, headers: longdoNoStoreHeaders })
  }

  if (!takeLongdoQuota(request)) {
    return NextResponse.json(
      { suggestions: [], limited: true },
      { status: 429, headers: { ...longdoNoStoreHeaders, 'Retry-After': '60' } }
    )
  }

  try {
    const searchParams = new URLSearchParams({ keyword: query, limit: '6', key: apiKey })
    const response = await fetch(`https://search.longdo.com/mapsearch/json/suggest?${searchParams}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    })
    if (!response.ok) throw new Error(`Longdo suggest returned ${response.status}`)

    const result = (await response.json()) as LongdoSuggestionResponse
    const seen = new Set<string>()
    const suggestions = (result.data || [])
      .map((item) => (typeof item.w === 'string' ? item.w.trim() : ''))
      .filter((label) => {
        if (!label || label.length > 160) return false
        const key = label.toLocaleLowerCase('th-TH')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)
      .map((label) => ({ type: 'longdo', label, description: 'longdo', query: label }))

    return NextResponse.json({ suggestions }, { headers: longdoNoStoreHeaders })
  } catch {
    return NextResponse.json({ suggestions: [], unavailable: true }, { status: 502, headers: longdoNoStoreHeaders })
  }
}
