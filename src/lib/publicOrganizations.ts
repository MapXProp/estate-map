import { cache } from 'react'
import 'server-only'
import { getAuthApiUrl } from './auth'
import type { Organization, OrganizationContact, OrganizationListing } from './organizations'

async function readPublic<T>(path: string): Promise<T | null> {
  const response = await fetch(getAuthApiUrl(path), { next: { revalidate: 300 }, signal: AbortSignal.timeout(15000) })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Organization information is temporarily unavailable')
  return response.json() as Promise<T>
}
export const getPublicOrganizations = cache(async () => {
  const data = await readPublic<{ organizations: Organization[] }>('organizations')
  return data?.organizations || []
})
export const getPublicOrganization = cache(async (identifier: string) => {
  const detail = await readPublic<{ organization: Organization; contacts: OrganizationContact[] }>(
    `organizations/${encodeURIComponent(identifier)}`
  )
  if (!detail) return null
  const data = await readPublic<{ listings: OrganizationListing[] }>(
    `organizations/${encodeURIComponent(identifier)}/listings`
  )
  return { ...detail, listings: data?.listings || [] }
})
