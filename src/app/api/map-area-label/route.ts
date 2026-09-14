import { mapAreaQuery, readMapArea, type MapArea } from '@/lib/mapAreaLabel'
import { getLongdoApiKey, longdoNoStoreHeaders, takeLongdoQuota } from '@/lib/server/longdoQuota'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const cache = new Map<string, { area: MapArea; expires: number }>()
const pending = new Map<string, Promise<MapArea | null>>()
const reply = (area: MapArea | null, status = 200) =>
  NextResponse.json(
    { area },
    {
      status,
      headers: { ...longdoNoStoreHeaders, ...(status === 429 ? { 'Retry-After': '60' } : {}) },
    }
  )

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const lat = params.get('lat')?.trim()
  const lon = params.get('lon')?.trim()
  const query =
    lat && lon ? mapAreaQuery({ lat: Number(lat), lon: Number(lon) }, params.get('locale') === 'en' ? 'en' : 'th') : ''
  if (!query) return reply(null, 400)
  const cached = cache.get(query)
  if (cached && cached.expires > Date.now()) return reply(cached.area)
  const inFlight = pending.get(query)
  if (inFlight) {
    const area = await inFlight
    return reply(area, area ? 200 : 502)
  }
  const key = getLongdoApiKey()
  if (!key) return reply(null, 503)
  if (!takeLongdoQuota(request)) return reply(null, 429)

  const lookup = async () => {
    try {
      const upstream = new URLSearchParams(query)
      upstream.set('key', key)
      upstream.set('noelevation', '1')
      upstream.set('noroad', '1')
      const response = await fetch(`https://api.longdo.com/map/services/address?${upstream}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) return null
      const area = readMapArea(await response.json())
      if (area) {
        if (cache.size >= 1000) cache.delete(cache.keys().next().value!)
        cache.set(query, { area, expires: Date.now() + 86_400_000 })
      }
      return area
    } catch {
      return null
    }
  }
  const result = lookup()
  pending.set(query, result)
  try {
    const area = await result
    return reply(area, area ? 200 : 502)
  } finally {
    pending.delete(query)
  }
}
