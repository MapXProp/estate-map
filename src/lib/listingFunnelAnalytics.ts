import { getPropertyType } from '@/data/propertyTaxonomy'
import { initializeAnalytics, type AnalyticsWindow } from './contactAnalytics'
import type { ListingDraft } from './listingDraft'

export type ListingStep = 1 | 2 | 3 | 4
export type ListingFailureStage = 'missing_draft' | 'validation' | 'files' | 'upload' | 'publish' | 'finalize'
type ListingAction =
  | { kind: 'step'; step: ListingStep }
  | { kind: 'auth' }
  | { kind: 'error'; stage: ListingFailureStage }
  | { kind: 'success'; listingId: string }

type ListingAnalyticsWindow = AnalyticsWindow & { __mapxpropListingSuccesses?: Set<string> }
const successStorageKey = 'mapxprop_analytics_listing_successes'
const stepNames = { 1: 'property_type', 2: 'details', 3: 'media_price_contact', 4: 'upload_publish' } as const
const failureStages = new Set(['missing_draft', 'validation', 'files', 'upload', 'publish', 'finalize'])
const safeId = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value)

export function buildListingFunnelEvent(action: ListingAction, draft: ListingDraft) {
  const mode = draft.editingPublicListingId ? 'edit' : 'create'
  const step = action.kind === 'step' ? action.step : action.kind === 'auth' ? 1 : 4
  if (!(step in stepNames)) return null
  if (action.kind === 'error' && !failureStages.has(action.stage)) return null
  if (action.kind === 'success' && !safeId(action.listingId)) return null
  const propertyCode = draft.property_type_code || draft.propertyType
  const propertyType = typeof propertyCode === 'string' ? getPropertyType(propertyCode) : undefined
  const suffix = action.kind === 'step' ? `step_${step}` : action.kind === 'auth' ? 'auth_required' : action.kind
  // Only controlled taxonomy/status values and a committed public listing ID.
  // Never forward draft fields, title, price, address, coordinates, file names,
  // contacts, submission keys or server error messages to Analytics.
  return {
    name: `listing_${mode}_${suffix}`,
    step,
    params: {
      flow_mode: mode,
      step_number: step,
      step_name: stepNames[step],
      ...(propertyType ? { property_type: propertyType.code } : {}),
      ...(action.kind === 'error' ? { failure_stage: action.stage } : {}),
      ...(action.kind === 'success' ? { listing_id: action.listingId } : {}),
    },
  }
}

export function recordListingFunnelEvent(
  action: ListingAction,
  draft: ListingDraft,
  win: ListingAnalyticsWindow,
  gaId: string
) {
  try {
    const event = buildListingFunnelEvent(action, draft)
    if (!event || !initializeAnalytics(gaId, win)) return false
    let successKey = ''
    const successes = (win.__mapxpropListingSuccesses ||= new Set<string>())
    if (action.kind === 'success') {
      // Submission keys remain local. Retrying an acknowledged API save must
      // not count another conversion, including after a page reload.
      const submissionKey = safeId(draft.submissionKey) ? draft.submissionKey : ''
      successKey = `${event.params.flow_mode}:${action.listingId}:${submissionKey}`
      try {
        const stored: unknown = JSON.parse(win.sessionStorage.getItem(successStorageKey) || '[]')
        if (Array.isArray(stored)) stored.slice(-50).forEach((key) => typeof key === 'string' && successes.add(key))
      } catch {
        /* Tracking must also work when browser storage is unavailable. */
      }
      if (successes.has(successKey)) return false
    }
    win.gtag?.('event', event.name, {
      ...event.params,
      send_to: gaId,
      page_location: `${win.location.origin}/add-listing/${event.step}`,
    })
    if (successKey) {
      successes.add(successKey)
      try {
        win.sessionStorage.setItem(successStorageKey, JSON.stringify([...successes].slice(-50)))
      } catch {
        /* Best effort. */
      }
    }
    return true
  } catch {
    // A telemetry failure must never block navigation, uploads or publishing.
    return false
  }
}

export function trackListingFunnel(action: ListingAction, draft: ListingDraft) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return false
  return recordListingFunnelEvent(action, draft, window, process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '')
}
