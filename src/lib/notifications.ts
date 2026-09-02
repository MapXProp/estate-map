import { fetchWithAuthRetry, getAuthApiUrl } from './auth'

export type UserNotification = {
  id: number
  notification_type: 'listing_published' | 'listing_changes_requested' | 'system' | string
  title_th: string
  title_en: string
  body_th: string
  body_en: string
  action_url: string
  public_listing_id?: string
  listing_title?: string
  read_at?: string
  created_at: string
}

type NotificationsResponse = {
  notifications?: UserNotification[]
  unread_count?: number
  error?: string
}

type NotificationMutationResponse = {
  success?: boolean
  error?: string
}

const readResponse = async <T extends { error?: string }>(response: Response) => {
  const data = (await response.json().catch(() => ({}))) as T
  if (!response.ok) throw new Error(data.error || 'Cannot complete this notification request')
  return data
}

export const getMyNotifications = async (limit = 30) => {
  const response = await fetchWithAuthRetry(getAuthApiUrl(`me/notifications?limit=${limit}`), {
    cache: 'no-store',
    credentials: 'include',
  })
  return readResponse<NotificationsResponse>(response)
}

export const markMyNotificationRead = async (notificationId: number) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`me/notifications/${encodeURIComponent(String(notificationId))}/read`),
    { method: 'PATCH', cache: 'no-store', credentials: 'include' }
  )
  return readResponse<NotificationMutationResponse>(response)
}

export const markAllMyNotificationsRead = async () => {
  const response = await fetchWithAuthRetry(getAuthApiUrl('me/notifications/read-all'), {
    method: 'PATCH',
    cache: 'no-store',
    credentials: 'include',
  })
  return readResponse<NotificationMutationResponse>(response)
}
