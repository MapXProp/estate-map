export type AuthUser = {
  public_user_id: string
  name?: string
  surname?: string
  email: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'guest'

type AuthResponse = {
  authenticated?: boolean
  user?: AuthUser
}

type LoginLikeResponse = Partial<AuthUser> & {
  token?: string
  access_token?: string
}

export const AUTH_TOKEN_KEY = 'mapxprop_token'
export const AUTH_USER_KEY = 'mapxprop_user'
export const AUTH_CHANGE_EVENT = 'mapxprop-auth-change'

const notifyAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
  }
}

export const getApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiUrl) {
    return 'http://localhost:8080'
  }

  const normalizedApiUrl = apiUrl.replace(/\/$/, '')
  const apixIndex = normalizedApiUrl.indexOf('/apix')
  const baseApiUrl = apixIndex >= 0 ? normalizedApiUrl.slice(0, apixIndex) : normalizedApiUrl

  if (typeof window !== 'undefined') {
    try {
      const configuredUrl = new URL(baseApiUrl)
      const pageHostname = window.location.hostname
      const isLocalHostname =
        pageHostname === 'localhost' ||
        pageHostname === '127.0.0.1' ||
        pageHostname.startsWith('192.168.') ||
        pageHostname.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(pageHostname)
      const isLocalApi =
        configuredUrl.hostname === 'localhost' ||
        configuredUrl.hostname === '127.0.0.1' ||
        configuredUrl.hostname.startsWith('192.168.') ||
        configuredUrl.hostname.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(configuredUrl.hostname)

      if (isLocalHostname && isLocalApi) {
        return `${window.location.protocol}//${pageHostname}:${configuredUrl.port || '8080'}`
      }
    } catch {
      return baseApiUrl
    }
  }

  return baseApiUrl
}

export const getAuthApiUrl = (path: string) => `${getApiBaseUrl()}/apix/${path.replace(/^\//, '')}`

export const getStoredToken = () => {
  return null
}

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawUser = localStorage.getItem(AUTH_USER_KEY)
  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

export const setStoredAuth = (data: LoginLikeResponse) => {
  if (typeof window === 'undefined') {
    return null
  }

  localStorage.removeItem(AUTH_TOKEN_KEY)

  if (data.public_user_id || data.email) {
    localStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify({
        public_user_id: data.public_user_id || '',
        name: data.name || '',
        surname: data.surname || '',
        email: data.email || '',
      })
    )
  }

  notifyAuthChange()

  return null
}

export const setStoredUser = (user: AuthUser) => {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  notifyAuthChange()
}

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

let authVerificationPromise: Promise<AuthUser | null> | null = null

export const logoutStoredAuth = async () => {
  try {
    await fetch(getAuthApiUrl('logout'), {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Still clear local auth if the network is unavailable.
  }

  clearStoredAuth()
  notifyAuthChange()
}

const runStoredAuthVerification = async () => {
  let response = await fetch(getAuthApiUrl('me'), {
    cache: 'no-store',
    credentials: 'include',
  })

  if (response.status === 401) {
    response = await fetch(getAuthApiUrl('refresh'), {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
    })
  }

  if (!response.ok) {
    clearStoredAuth()
    return null
  }

  const data = (await response.json()) as AuthResponse
  if (!data.authenticated || !data.user) {
    clearStoredAuth()
    return null
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
  return data.user
}

export const verifyStoredAuth = () => {
  if (authVerificationPromise) {
    return authVerificationPromise
  }

  authVerificationPromise = runStoredAuthVerification().finally(() => {
    authVerificationPromise = null
  })

  return authVerificationPromise
}
