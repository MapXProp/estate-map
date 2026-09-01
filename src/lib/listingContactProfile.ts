import { fetchWithAuthRetry, getAuthApiUrl } from './auth'

export type ListingContactProfile = {
  contact_name: string
  contact_phone: string
  contact_phone_secondary: string
  contact_email: string
  line_id: string
  instagram_handle: string
  role_code: string
  authority_source_code: string
  organization_name: string
  organization_registration_no: string
}

type ListingContactProfileResponse = {
  profile?: ListingContactProfile | null
  error?: string
}

export const loadListingContactProfile = async () => {
  const response = await fetchWithAuthRetry(getAuthApiUrl('me/listing-contact'), {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Cannot load listing contact details')
  }
  const data = (await response.json()) as ListingContactProfileResponse
  return data.profile ?? null
}

export const saveListingContactProfile = async (profile: ListingContactProfile) => {
  const response = await fetchWithAuthRetry(getAuthApiUrl('me/listing-contact'), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  const data = (await response.json().catch(() => ({}))) as ListingContactProfileResponse
  if (!response.ok) {
    throw new Error(data.error || 'Cannot save listing contact details')
  }
  return data.profile ?? profile
}
