import { getBrowseResults } from '@/lib/propertyBrowseServer'
import { catalogPageNumber } from '@/lib/propertyCatalog'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const page = catalogPageNumber(request.nextUrl.searchParams.get('page') || undefined)
  if (!page) return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
  try {
    return NextResponse.json(await getBrowseResults(request.nextUrl.searchParams, page))
  } catch {
    return NextResponse.json({ error: 'Listings are temporarily unavailable' }, { status: 503 })
  }
}
