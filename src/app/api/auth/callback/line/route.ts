import { getAuthApiUrl } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export const GET = (request: NextRequest) => {
  const callbackUrl = new URL(getAuthApiUrl('auth/line/callback'))
  const requestHostname =
    (request.headers.get('host') || request.nextUrl.host).split(':')[0] || request.nextUrl.hostname
  const isLocalRequest =
    requestHostname === 'localhost' ||
    requestHostname === '127.0.0.1' ||
    requestHostname.startsWith('192.168.') ||
    requestHostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(requestHostname)
  const isLocalCallback =
    callbackUrl.hostname === 'localhost' ||
    callbackUrl.hostname === '127.0.0.1' ||
    callbackUrl.hostname.startsWith('192.168.') ||
    callbackUrl.hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(callbackUrl.hostname)

  if (isLocalRequest && isLocalCallback) {
    callbackUrl.protocol = request.nextUrl.protocol
    callbackUrl.hostname = requestHostname
  }

  callbackUrl.search = request.nextUrl.search

  return NextResponse.redirect(callbackUrl)
}
