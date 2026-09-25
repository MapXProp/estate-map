export const COOKIE_CONSENT_KEY = 'mapxprop_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'mapxprop:cookie-consent'
export const COOKIE_SETTINGS_EVENT = 'mapxprop:cookie-settings'
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000
export type CookieChoice = { version: 1; analytics: boolean; updatedAt: number }
export type ConsentWindow = Window & { __mapxpropCookieChoice?: CookieChoice }

export function parseCookieChoice(raw: string | null, now = Date.now()): CookieChoice | null {
  try {
    const value = JSON.parse(raw || 'null')
    return value?.version === 1 &&
      typeof value.analytics === 'boolean' &&
      Number.isFinite(value.updatedAt) &&
      value.updatedAt <= now &&
      now - value.updatedAt < CONSENT_MAX_AGE
      ? { version: 1, analytics: value.analytics, updatedAt: value.updatedAt }
      : null
  } catch {
    return null
  }
}

export function readCookieChoice(win: ConsentWindow = window): CookieChoice | null {
  if (win.__mapxpropCookieChoice) return parseCookieChoice(JSON.stringify(win.__mapxpropCookieChoice))
  try {
    return parseCookieChoice(win.localStorage.getItem(COOKIE_CONSENT_KEY))
  } catch {
    return null
  }
}

export const hasAnalyticsConsent = (win: ConsentWindow = window) => readCookieChoice(win)?.analytics === true

export function saveCookieChoice(analytics: boolean, win: ConsentWindow = window) {
  const choice: CookieChoice = { version: 1, analytics, updatedAt: Date.now() }
  // Keep the current choice effective even when the browser refuses storage.
  win.__mapxpropCookieChoice = choice
  try {
    win.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(choice))
  } catch {
    /* Session only. */
  }
  win.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
}

export function clearAnalyticsCookies(doc: Document, hostname: string) {
  const names = doc.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('=')[0])
    .filter((name) => /^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name))
  const hostParts = hostname.split('.')
  const domains = ['', ...hostParts.map((_, index) => hostParts.slice(index).join('.'))]
  for (const name of names)
    for (const domain of domains) {
      doc.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ''}`
    }
}
