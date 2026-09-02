'use client'

import {
  getMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  type UserNotification,
} from '@/lib/notifications'
import { useCallback, useEffect, useMemo, useState } from 'react'

const NOTIFICATION_CHANGE_EVENT = 'mapxprop-notification-change'

type NotificationCenterOptions = {
  isAuthenticated: boolean
  locale: 'th' | 'en'
}

export type LocalizedNotification = UserNotification & {
  title: string
  body: string
}

export const useNotificationCenter = ({ isAuthenticated, locale }: NotificationCenterOptions) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(isAuthenticated)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      setError('')
      return
    }
    try {
      const result = await getMyNotifications()
      setNotifications(result.notifications || [])
      setUnreadCount(result.unread_count || 0)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot load notifications')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void reload()
    if (!isAuthenticated) return

    const handleChange = () => void reload()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    const interval = window.setInterval(() => void reload(), 60_000)
    window.addEventListener(NOTIFICATION_CHANGE_EVENT, handleChange)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener(NOTIFICATION_CHANGE_EVENT, handleChange)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isAuthenticated, reload])

  const localizedNotifications = useMemo<LocalizedNotification[]>(
    () =>
      notifications.map((notification) => ({
        ...notification,
        title: locale === 'th' ? notification.title_th : notification.title_en,
        body: locale === 'th' ? notification.body_th : notification.body_en,
      })),
    [locale, notifications]
  )

  const markAsRead = useCallback(async (notificationId: number) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId && !item.read_at ? { ...item, read_at: new Date().toISOString() } : item
      )
    )
    setUnreadCount((current) => Math.max(0, current - 1))
    try {
      await markMyNotificationRead(notificationId)
      window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT))
    } catch {
      void reload()
    }
  }, [reload])

  const markAllAsRead = useCallback(async () => {
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || readAt })))
    setUnreadCount(0)
    try {
      await markAllMyNotificationsRead()
      window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT))
    } catch {
      void reload()
    }
  }, [reload])

  return {
    notifications: localizedNotifications,
    unreadCount,
    isUnread: unreadCount > 0,
    loading,
    error,
    reload,
    markAsRead,
    markAllAsRead,
    panelLabel: locale === 'th' ? 'การแจ้งเตือน' : 'Notifications',
    sourceLabel: locale === 'th' ? 'ข้อความจาก MapXProp' : 'Messages from MapXProp',
    unreadSummary:
      locale === 'th'
        ? `มี ${unreadCount} รายการใหม่`
        : `${unreadCount} new ${unreadCount === 1 ? 'item' : 'items'}`,
  }
}
