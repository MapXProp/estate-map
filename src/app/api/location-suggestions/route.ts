import { getLongdoApiKey, longdoNoStoreHeaders, takeLongdoQuota } from '@/lib/server/longdoQuota'
import { getTransitSearchSuggestions } from '@/lib/transitStations'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
type Place = { name?: unknown; address?: unknown; lat?: unknown; lon?: unknown }
type Suggestion = {
  type: string
  label: string
  description: string
  query: string
  detail: string
  place: { name: string; address: string; lat: number; lon: number; zoom: number }
}
const cache = new Map<string, { expires: number; suggestions: Suggestion[] }>()

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().replace(/\s+/g, ' ') || ''
  if (query.length <= 120 && /(?:\b(?:bts|mrt|arl|srt|brt)\b|สถานี|รถไฟฟ้า|^[A-Z]{1,3}\d{1,2}$)/i.test(query)) {
    const stations = getTransitSearchSuggestions(query)
    if (stations.length) return NextResponse.json({ suggestions: stations }, { headers: longdoNoStoreHeaders })
  }
  if (Array.from(query).length < 3 || query.length > 120)
    return NextResponse.json({ suggestions: [] }, { headers: longdoNoStoreHeaders })
  const cacheKey = query.toLocaleLowerCase('th-TH')
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now())
    return NextResponse.json({ suggestions: cached.suggestions }, { headers: longdoNoStoreHeaders })
  const apiKey = getLongdoApiKey()
  if (!apiKey)
    return NextResponse.json({ suggestions: [], unavailable: true }, { status: 503, headers: longdoNoStoreHeaders })
  if (!takeLongdoQuota(request))
    return NextResponse.json(
      { suggestions: [], limited: true },
      { status: 429, headers: { ...longdoNoStoreHeaders, 'Retry-After': '60' } }
    )
  try {
    // Search returns the actual address and coordinates. Suggest returns only
    // words, which cannot distinguish two places sharing the same name.
    const params = new URLSearchParams({ keyword: query, limit: '12', locale: 'th', key: apiKey })
    const response = await fetch('https://search.longdo.com/mapsearch/json/search?' + params, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    })
    if (!response.ok) throw new Error('Location service unavailable')
    const result = (await response.json()) as { meta?: { keyword?: string }; data?: Place[] }
    if (result.meta?.keyword && result.meta.keyword !== query)
      return NextResponse.json({ suggestions: [] }, { headers: longdoNoStoreHeaders })
    const seen = new Set<string>()
    const unnamedRoads = new Set<string>()
    const suggestions: Suggestion[] = (result.data || [])
      .flatMap((item) => {
        if (
          typeof item.name !== 'string' ||
          !item.name.trim() ||
          item.lat == null ||
          item.lon == null ||
          item.lat === '' ||
          item.lon === ''
        )
          return []
        const lat = Number(item.lat),
          lon = Number(item.lon),
          name = item.name.trim(),
          address = typeof item.address === 'string' ? item.address.trim() : ''
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 5 || lat > 21 || lon < 97 || lon > 106) return []
        const key = name.toLocaleLowerCase('th-TH') + ':' + lat.toFixed(4) + ',' + lon.toFixed(4)
        if (seen.has(key)) return []
        seen.add(key)
        // A road geometry can yield multiple points with identical visible
        // labels. Keep one when no address distinguishes its road segments.
        if (!address && /^(?:ถนน|ทางหลวง)/.test(name)) {
          if (unnamedRoads.has(name)) return []
          unnamedRoads.add(name)
        }
        const zoom = /^(?:จ\.|จังหวัด)/.test(name)
          ? 10
          : /^(?:เขต|อ\.|อำเภอ)/.test(name)
            ? 13
            : /^(?:ถนน|ทางหลวง)/.test(name)
              ? 14
              : 15
        return [
          {
            type: 'longdo',
            label: name,
            description: 'location',
            query: name,
            detail: address || (/^(?:ถนน|ซอย|ทางหลวง)/.test(name) ? 'ถนน / ซอย' : 'สถานที่ / ทำเล'),
            place: { name, address, lat, lon, zoom },
          },
        ]
      })
      .slice(0, 10)
    if (suggestions.length) {
      cache.set(cacheKey, { expires: Date.now() + 300000, suggestions })
      if (cache.size > 150) cache.delete(cache.keys().next().value!)
    }
    return NextResponse.json({ suggestions }, { headers: longdoNoStoreHeaders })
  } catch {
    return NextResponse.json({ suggestions: [], unavailable: true }, { status: 502, headers: longdoNoStoreHeaders })
  }
}
