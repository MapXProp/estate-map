export type ContactMethod = 'phone' | 'line'
export type ContactSurface =
  | 'listing_page'
  | 'map_modal'
  | 'map_preview'
  | 'mobile_contact_sheet'
  | 'gallery'
  | 'organization'
  | 'site'

type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  __mapxpropAnalyticsId?: string
}

const surfaces = new Set<ContactSurface>([
  'listing_page',
  'map_modal',
  'map_preview',
  'mobile_contact_sheet',
  'gallery',
  'organization',
  'site',
])

export function initializeAnalytics(gaId: string, win: AnalyticsWindow = window) {
  if (!/^G-[A-Z0-9]+$/.test(gaId)) return false
  if (win.__mapxpropAnalyticsId === gaId) return true
  win.dataLayer = win.dataLayer || []
  win.gtag =
    win.gtag ||
    function () {
      // Preserve Google's documented gtag queue format.
      win.dataLayer!.push(arguments)
    }
  win.__mapxpropAnalyticsId = gaId
  win.gtag('js', new Date())
  // One initial page view. Subsequent SPA views use GA4's existing enhanced
  // history measurement; no second manual page-view listener is installed.
  win.gtag('config', gaId, { page_location: win.location.href })
  return true
}

export function getContactMethod(href: string): ContactMethod | null {
  if (/^tel:\+?[\d().\s-]+$/i.test(href)) return 'phone'
  try {
    const url = new URL(href)
    if (url.protocol === 'https:' && ['line.me', 'www.line.me', 'lin.ee'].includes(url.hostname)) return 'line'
  } catch {
    /* Relative navigation and other schemes are not contact actions. */
  }
  return null
}

const safeIdentifier = (value: string | null | undefined) =>
  value && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : undefined

export function getContactEvent(anchor: Element, pathname: string, pageContext?: Element | null) {
  const method = getContactMethod(anchor.getAttribute('href') || '')
  if (
    !method ||
    /^\/(account|add-listing|admin|api|apix|checkout|forgot-password|login|pay-done|reset-password|signup|subscription|verify-email|organization-invitations)(\/|$)/.test(
      pathname
    )
  )
    return null
  if (anchor.closest('[data-analytics-ignore]')) return null
  const context = anchor.closest('[data-analytics-surface]')
  const pageHandle = pathname.match(/^\/real-estate-listings\/([^/]+)\/?$/)?.[1]
  const fallback = pageHandle ? pageContext : null
  const listingId =
    safeIdentifier(context?.getAttribute('data-analytics-listing-id')) ||
    safeIdentifier(fallback?.getAttribute('data-analytics-listing-id')) ||
    safeIdentifier(pageHandle)
  const surface = context?.getAttribute('data-analytics-surface') as ContactSurface | undefined
  const propertyType =
    safeIdentifier(context?.getAttribute('data-analytics-property-type')) ||
    safeIdentifier(fallback?.getAttribute('data-analytics-property-type'))
  const organizationId = safeIdentifier(context?.getAttribute('data-analytics-organization-id'))
  // Never include href, link text, phone number, email, LINE handle or form data.
  return {
    contact_method: method,
    contact_surface: surface && surfaces.has(surface) ? surface : listingId ? 'listing_page' : 'site',
    ...(listingId ? { listing_id: listingId } : {}),
    ...(propertyType ? { property_type: propertyType } : {}),
    ...(organizationId ? { organization_id: organizationId } : {}),
  }
}

export function installContactAnalytics(win: AnalyticsWindow, doc: Document, loadScript: () => void) {
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || (event.button !== 0 && event.button !== 1)) return
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest('a[href]')
    if (!anchor || !win.__mapxpropAnalyticsId) return
    const params = getContactEvent(
      anchor,
      win.location.pathname,
      doc.querySelector('[data-analytics-surface="listing_page"]')
    )
    if (!params) return
    win.gtag?.('event', 'contact_click', {
      ...params,
      send_to: win.__mapxpropAnalyticsId,
      page_location: win.location.origin + win.location.pathname,
      transport_type: 'beacon',
    })
    // The event is queued synchronously before loading the external tag. Keep
    // the native tel/LINE link behavior: no preventDefault or navigation delay.
    loadScript()
  }
  doc.addEventListener('click', onClick, true)
  doc.addEventListener('auxclick', onClick, true)
  return () => {
    doc.removeEventListener('click', onClick, true)
    doc.removeEventListener('auxclick', onClick, true)
  }
}

export function listingAnalyticsAttributes(
  listing: { public_listing_id: string; property_type_code: string },
  surface: ContactSurface
) {
  return {
    'data-analytics-surface': surface,
    'data-analytics-listing-id': listing.public_listing_id,
    'data-analytics-property-type': listing.property_type_code,
  }
}
