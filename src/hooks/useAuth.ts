'use client'

import {
  AUTH_CHANGE_EVENT,
  AuthStatus,
  AuthUser,
  clearStoredAuth,
  getStoredUser,
  logoutStoredAuth,
  verifyStoredAuth,
} from '@/lib/auth'
import { useCallback, useEffect, useState } from 'react'

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [status, setStatus] = useState<AuthStatus>('loading')

  const refresh = useCallback(async () => {
    setStatus('loading')
    try {
      const verifiedUser = await verifyStoredAuth()
      setUser(verifiedUser)
      setStatus(verifiedUser ? 'authenticated' : 'guest')
      return verifiedUser
    } catch {
      clearStoredAuth()
      setUser(null)
      setStatus('guest')
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    await logoutStoredAuth()
    setUser(null)
    setStatus('guest')
  }, [])

  useEffect(() => {
    let cancelled = false

    verifyStoredAuth()
      .then((verifiedUser) => {
        if (cancelled) {
          return
        }
        setUser(verifiedUser)
        setStatus(verifiedUser ? 'authenticated' : 'guest')
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        clearStoredAuth()
        setUser(null)
        setStatus('guest')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleAuthChange = () => {
      void refresh()
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
  }, [refresh])

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    logout,
    refresh,
    status,
    user,
  }
}
