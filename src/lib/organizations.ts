import { fetchWithAuthRetry, getAuthApiUrl } from './auth'

export type OrganizationRoleCode = 'owner' | 'admin' | 'publisher' | 'editor' | 'viewer'
export type OrganizationVerificationStatus = 'unverified' | 'contact_checked' | 'verified' | 'rejected'
export type OrganizationSpecialtyCode =
  | 'sale'
  | 'rent'
  | 'npa'
  | 'condo'
  | 'house'
  | 'land'
  | 'commercial'
  | 'warehouse_factory'
  | 'hotel_resort'
  | 'beachfront'
  | 'investment'

export type Organization = {
  public_organization_id: string
  slug: string
  display_name: string
  legal_name: string
  organization_type: string
  website_url: string
  logo_url: string
  description: string
  verification_status: OrganizationVerificationStatus
  verification_note?: string
  verified_at?: string
  specialty_codes: OrganizationSpecialtyCode[]
  role_code?: OrganizationRoleCode
  is_primary_owner?: boolean
  member_count: number
  listing_count: number
}

export type OrganizationContact = {
  id?: number
  channel_type: 'phone' | 'email' | 'line' | 'website'
  channel_value: string
  label: string
  is_primary: boolean
  is_verified?: boolean
  verified_at?: string
}

export type OrganizationMember = {
  public_user_id: string
  name: string
  surname: string
  email: string
  role_code: OrganizationRoleCode
  status: 'active' | 'suspended' | 'removed'
  is_primary_owner: boolean
  joined_at?: string
}

export type OrganizationInvitation = {
  public_invitation_id: string
  email: string
  role_code: Exclude<OrganizationRoleCode, 'owner'>
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expires_at: string
  accepted_at?: string
  created_at: string
}

export type OrganizationInvitationPreview = {
  organization_name: string
  role_code: Exclude<OrganizationRoleCode, 'owner'>
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  email: string
  expires_at: string
}

export type OrganizationListing = {
  public_listing_id: string
  slug: string
  title: string
  property_type_code: string
  listing_type: string
  address: string
  province: string
  district: string
  offer_amount?: number
  price_unit: string
  currency: string
  primary_image_url: string
  published_at?: string
}

type APIError = { error?: string }

const readResponse = async <T extends APIError>(response: Response, fallback: string) => {
  const data = (await response.json().catch(() => ({}))) as T
  if (!response.ok) throw new Error(data.error || fallback)
  return data
}

export const getMyOrganizations = async () => {
  const response = await fetchWithAuthRetry(getAuthApiUrl('me/organizations'), {
    cache: 'no-store',
    credentials: 'include',
  })
  const data = await readResponse<{ organizations?: Organization[]; error?: string }>(
    response,
    'Cannot load organizations'
  )
  return data.organizations || []
}

export const listOrganizations = async (filters?: { organizationType?: string; specialty?: string }) => {
  const params = new URLSearchParams()
  if (filters?.organizationType) params.set('organization_type', filters.organizationType)
  if (filters?.specialty) params.set('specialty', filters.specialty)
  const suffix = params.size ? `?${params.toString()}` : ''
  const response = await fetch(getAuthApiUrl(`organizations${suffix}`), { cache: 'no-store' })
  const data = await readResponse<{ organizations?: Organization[]; error?: string }>(
    response,
    'Cannot load organizations'
  )
  return data.organizations || []
}

export const createOrganization = async (input: {
  display_name: string
  legal_name: string
  organization_type: string
  website_url: string
  specialty_codes?: OrganizationSpecialtyCode[]
}) => {
  const response = await fetchWithAuthRetry(getAuthApiUrl('organizations'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return readResponse<{ success?: boolean; public_organization_id: string; slug: string; error?: string }>(
    response,
    'Cannot create organization'
  )
}

export const getOrganization = async (publicOrganizationId: string) => {
  const response = await fetch(getAuthApiUrl(`organizations/${encodeURIComponent(publicOrganizationId)}`), {
    cache: 'no-store',
  })
  return readResponse<{ organization: Organization; contacts: OrganizationContact[]; error?: string }>(
    response,
    'Cannot load organization'
  )
}

export const updateOrganization = async (
  publicOrganizationId: string,
  input: Pick<
    Organization,
    'display_name' | 'legal_name' | 'organization_type' | 'website_url' | 'logo_url' | 'description' | 'specialty_codes'
  >
) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`organizations/${encodeURIComponent(publicOrganizationId)}`),
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  )
  return readResponse<{ success?: boolean; error?: string }>(response, 'Cannot update organization')
}

export const updateOrganizationContacts = async (publicOrganizationId: string, contacts: OrganizationContact[]) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`organizations/${encodeURIComponent(publicOrganizationId)}/contacts`),
    {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: contacts.map(({ channel_type, channel_value, label, is_primary }) => ({
          channel_type,
          channel_value,
          label,
          is_primary,
        })),
      }),
    }
  )
  return readResponse<{ success?: boolean; error?: string }>(response, 'Cannot update organization contacts')
}

export const getOrganizationMembers = async (publicOrganizationId: string) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`organizations/${encodeURIComponent(publicOrganizationId)}/members`),
    { cache: 'no-store', credentials: 'include' }
  )
  return readResponse<{ members?: OrganizationMember[]; my_role_code: OrganizationRoleCode; error?: string }>(
    response,
    'Cannot load organization members'
  )
}

export const getOrganizationInvitations = async (publicOrganizationId: string) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`organizations/${encodeURIComponent(publicOrganizationId)}/invitations`),
    { cache: 'no-store', credentials: 'include' }
  )
  const data = await readResponse<{ invitations?: OrganizationInvitation[]; error?: string }>(
    response,
    'Cannot load organization invitations'
  )
  return data.invitations || []
}

export const inviteOrganizationMember = async (
  publicOrganizationId: string,
  email: string,
  roleCode: Exclude<OrganizationRoleCode, 'owner'>
) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`organizations/${encodeURIComponent(publicOrganizationId)}/invitations`),
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role_code: roleCode }),
    }
  )
  return readResponse<{ success?: boolean; public_invitation_id?: string; expires_at?: string; error?: string }>(
    response,
    'Cannot invite organization member'
  )
}

export const updateOrganizationMember = async (
  publicOrganizationId: string,
  publicUserId: string,
  roleCode: Exclude<OrganizationRoleCode, 'owner'>,
  status: 'active' | 'suspended' | 'removed'
) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(
      `organizations/${encodeURIComponent(publicOrganizationId)}/members/${encodeURIComponent(publicUserId)}`
    ),
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_code: roleCode, status }),
    }
  )
  return readResponse<{ success?: boolean; error?: string }>(response, 'Cannot update organization member')
}

export const transferOrganizationOwnership = async (publicOrganizationId: string, publicUserId: string) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`organizations/${encodeURIComponent(publicOrganizationId)}/transfer-ownership`),
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_user_id: publicUserId }),
    }
  )
  return readResponse<{ success?: boolean; error?: string }>(response, 'Cannot transfer organization ownership')
}

export const getOrganizationInvitation = async (token: string) => {
  const response = await fetch(getAuthApiUrl(`organization-invitations/${encodeURIComponent(token)}`), {
    cache: 'no-store',
  })
  return readResponse<OrganizationInvitationPreview & APIError>(response, 'Cannot load invitation')
}

export const getOrganizationListings = async (identifier: string) => {
  const response = await fetch(getAuthApiUrl(`organizations/${encodeURIComponent(identifier)}/listings`), {
    cache: 'no-store',
  })
  const data = await readResponse<{ listings?: OrganizationListing[]; error?: string }>(
    response,
    'Cannot load organization listings'
  )
  return data.listings || []
}

export const acceptOrganizationInvitation = async (token: string) => {
  const response = await fetchWithAuthRetry(
    getAuthApiUrl(`organization-invitations/${encodeURIComponent(token)}/accept`),
    { method: 'POST', cache: 'no-store', credentials: 'include' }
  )
  return readResponse<{
    success?: boolean
    public_organization_id: string
    organization_name: string
    role_code: OrganizationRoleCode
    error?: string
  }>(response, 'Cannot accept invitation')
}
