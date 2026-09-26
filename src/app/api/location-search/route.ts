import { getPropertyMapLocationPreset } from '@/lib/propertyMapLocations'
import { getLongdoApiKey, longdoNoStoreHeaders, takeLongdoQuota } from '@/lib/server/longdoQuota'
import { findTransitStation, getTransitStation, transitStationPlace } from '@/lib/transitStations'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type LongdoSearchResponse = {
  data?: Array<{
    name?: unknown
    address?: unknown
    lat?: unknown
    lon?: unknown
  }>
}

export async function GET(request: NextRequest) {
  const stationId = request.nextUrl.searchParams.get('station') || undefined
  const query = request.nextUrl.searchParams.get('q')?.trim().replace(/\s+/g, ' ') || ''
  const selectedStation = getTransitStation(stationId)
  if (selectedStation)
    return NextResponse.json({ place: transitStationPlace(selectedStation) }, { headers: longdoNoStoreHeaders })
  if (Array.from(query).length < 2 || query.length > 120) {
    return NextResponse.json({ place: null }, { headers: longdoNoStoreHeaders })
  }

  const preset = getPropertyMapLocationPreset(query)
  if (preset)
    return NextResponse.json(
      { place: { name: preset.nameTh, address: '', lat: preset.latitude, lon: preset.longitude, zoom: preset.zoom } },
      { headers: longdoNoStoreHeaders }
    )
  // A bare area name (e.g. Bang Na) must not silently become its train station.
  const station = /(?:\b(?:bts|mrt|arl|srt|brt)\b|สถานี|รถไฟฟ้า|\([A-Z]{1,2}\d{1,2}\)|^[A-Z]{1,3}\d{1,2}$)/i.test(query)
    ? findTransitStation(query)
    : undefined
  if (station) return NextResponse.json({ place: transitStationPlace(station) }, { headers: longdoNoStoreHeaders })

  const apiKey = getLongdoApiKey()
  if (!apiKey) {
    return NextResponse.json({ place: null, unavailable: true }, { status: 503, headers: longdoNoStoreHeaders })
  }

  if (!takeLongdoQuota(request)) {
    return NextResponse.json(
      { place: null, limited: true },
      { status: 429, headers: { ...longdoNoStoreHeaders, 'Retry-After': '60' } }
    )
  }

  try {
    const searchParams = new URLSearchParams({
      keyword: query,
      limit: '5',
      locale: request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'th',
      key: apiKey,
    })
    const response = await fetch(`https://search.longdo.com/mapsearch/json/search?${searchParams}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`Longdo search returned ${response.status}`)

    const result = (await response.json()) as LongdoSearchResponse
    const match = (result.data || []).find((item) => {
      const lat = Number(item.lat)
      const lon = Number(item.lon)
      return Number.isFinite(lat) && Number.isFinite(lon) && lat >= 5 && lat <= 21 && lon >= 97 && lon <= 106
    })
    const place = match
      ? {
          name: typeof match.name === 'string' ? match.name.trim() : query,
          address: typeof match.address === 'string' ? match.address.trim() : '',
          lat: Number(match.lat),
          lon: Number(match.lon),
          zoom: /^(?:จ\.|จังหวัด)/.test(String(match.name))
            ? 10
            : /^(?:เขต|อ\.|อำเภอ)/.test(String(match.name))
              ? 13
              : /^(?:ถนน|ทางหลวง)/.test(String(match.name))
                ? 14
                : 15,
        }
      : null

    return NextResponse.json({ place }, { headers: longdoNoStoreHeaders })
  } catch {
    return NextResponse.json({ place: null, unavailable: true }, { status: 502, headers: longdoNoStoreHeaders })
  }
}
