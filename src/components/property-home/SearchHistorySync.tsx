'use client'
import { useAuth } from '@/hooks/useAuth'
import {
  refreshHistoryFromStorage,
  setSearchHistoryAccount,
  suspendSearchHistoryAccount,
  syncSearchHistory,
} from '@/lib/propertySearchHistory'
import { useEffect } from 'react'

export default function SearchHistorySync() {
  const { status, user } = useAuth()
  useEffect(() => {
    if (status === 'loading') suspendSearchHistoryAccount()
    else setSearchHistoryAccount(status === 'authenticated' && user?.public_user_id ? user.public_user_id : null)
  }, [status, user?.public_user_id])
  useEffect(() => {
    const refresh = () => void syncSearchHistory()
    const storage = (event: StorageEvent) => {
      if (event.key?.startsWith('mapxprop_search_history_v2:')) refreshHistoryFromStorage()
    }
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', storage)
    return () => {
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', storage)
    }
  }, [])
  return null
}
