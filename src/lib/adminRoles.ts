import { fetchWithAuthRetry, getAuthApiUrl, type PlatformRoleCode } from './auth'

export type PlatformRole = {
  code: PlatformRoleCode
  name_th: string
  name_en: string
  description_th: string
  description_en: string
  permission_level: number
  is_assignable: boolean
}

export type AdminUser = {
  public_user_id: string
  name: string
  surname: string
  email: string
  role_code: PlatformRoleCode
  role_name_th: string
  role_name_en: string
  is_active: boolean
  is_verified: boolean
  is_primary_super_admin: boolean
  listing_count: number
  created_at: string
  role_updated_at?: string
}

type RolesResponse = {
  roles?: PlatformRole[]
  error?: string
}

type UsersResponse = {
  users?: AdminUser[]
  total?: number
  limit?: number
  offset?: number
  error?: string
}

type UpdateRoleResponse = {
  success?: boolean
  role_code?: PlatformRoleCode
  error?: string
}

const readResponse = async <T extends { error?: string }>(response: Response) => {
  const data = (await response.json().catch(() => ({}))) as T
  if (!response.ok) {
    throw new Error(data.error || 'Cannot complete this admin request')
  }
  return data
}

export const getPlatformRoles = async () => {
  const response = await fetchWithAuthRetry(getAuthApiUrl('admin/roles'), {
    cache: 'no-store',
    credentials: 'include',
  })
  const data = await readResponse<RolesResponse>(response)
  return data.roles || []
}

export const getAdminUsers = async (query = '', offset = 0, limit = 50) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (query.trim()) params.set('q', query.trim())
  const response = await fetchWithAuthRetry(getAuthApiUrl(`admin/users?${params.toString()}`), {
    cache: 'no-store',
    credentials: 'include',
  })
  return readResponse<UsersResponse>(response)
}

export const updateAdminUserRole = async (publicUserId: string, roleCode: PlatformRoleCode) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`admin/users/${encodeURIComponent(publicUserId)}/role`),
    {
      method: 'PATCH',
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_code: roleCode }),
    }
  )
  return readResponse<UpdateRoleResponse>(response)
}
