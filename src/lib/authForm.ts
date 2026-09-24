export type AuthMode = 'signup' | 'login'
export type AuthPurpose = 'default' | 'listing'

// Keep the same policy as registration; these groups make the requirements readable.
export const passwordRequirements = (password: string) => ({
  length: password.length >= 8,
  letters: /[A-Z]/.test(password) && /[a-z]/.test(password),
  numberAndSymbol: /[0-9]/.test(password) && /[\p{P}\p{S}]/u.test(password),
})

export const isStrongPassword = (password: string) => Object.values(passwordRequirements(password)).every(Boolean)

export function safeAuthRedirect(value: string | null | undefined, fallback = '/account') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return fallback
  return value
}
