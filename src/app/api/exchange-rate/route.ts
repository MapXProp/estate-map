import { NextResponse } from 'next/server'

export const revalidate = 21600
export const dynamic = 'force-dynamic'

const FALLBACK_USD_PER_THB = 0.029

export async function GET() {
  try {
    const response = await fetch('https://api.frankfurter.dev/v2/rate/THB/USD', {
      next: { revalidate },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) throw new Error(`Exchange-rate service returned ${response.status}`)

    const data = (await response.json()) as { rate?: number; date?: string }
    if (!data.rate || !Number.isFinite(data.rate)) throw new Error('Invalid exchange-rate response')

    return NextResponse.json(
      {
        base: 'THB',
        quote: 'USD',
        rate: data.rate,
        date: data.date ?? '',
        source: 'frankfurter',
      },
      { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } }
    )
  } catch {
    return NextResponse.json(
      {
        base: 'THB',
        quote: 'USD',
        rate: FALLBACK_USD_PER_THB,
        date: '',
        source: 'fallback',
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
    )
  }
}
