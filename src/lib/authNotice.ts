export type AuthNoticeAction = 'login' | 'signup' | 'logout' | 'reset-request' | 'reset-password' | 'verify-email'

export const AUTH_NOTICE_EVENT = 'mapxprop-auth-notice'

export const showAuthNotice = (action: AuthNoticeAction) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<AuthNoticeAction>(AUTH_NOTICE_EVENT, { detail: action }))
}

export const withAuthNotice = (path: string, action: AuthNoticeAction) => {
  const url = new URL(path, 'https://mapxprop.local')
  url.searchParams.set('auth', 'success')
  url.searchParams.set('auth_action', action)
  return `${url.pathname}${url.search}${url.hash}`
}

export const isAuthNoticeAction = (value: string | null): value is AuthNoticeAction =>
  value === 'login' ||
  value === 'signup' ||
  value === 'logout' ||
  value === 'reset-request' ||
  value === 'reset-password' ||
  value === 'verify-email'
