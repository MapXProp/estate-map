'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { prepareOrganizationListingDraft, saveListingDraftToCloud } from '@/lib/listingDraft'
import {
  createOrganization,
  getMyOrganizations,
  getOrganization,
  getOrganizationInvitations,
  getOrganizationMembers,
  inviteOrganizationMember,
  transferOrganizationOwnership,
  updateOrganization,
  updateOrganizationContacts,
  updateOrganizationMember,
  type Organization,
  type OrganizationContact,
  type OrganizationInvitation,
  type OrganizationMember,
  type OrganizationRoleCode,
} from '@/lib/organizations'
import {
  BadgeCheck,
  Building2,
  Check,
  CircleAlert,
  MailPlus,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  UserRoundCog,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

const roleOptions: Array<{ code: Exclude<OrganizationRoleCode, 'owner'>; th: string; en: string }> = [
  { code: 'admin', th: 'ผู้ดูแล', en: 'Admin' },
  { code: 'publisher', th: 'ผู้ลงประกาศ', en: 'Publisher' },
  { code: 'editor', th: 'ผู้ช่วยแก้ไข', en: 'Editor' },
  { code: 'viewer', th: 'ผู้ดูข้อมูล', en: 'Viewer' },
]

const organizationTypes = [
  ['agency', 'บริษัทนายหน้า', 'Agency'],
  ['developer', 'ผู้พัฒนาอสังหาริมทรัพย์', 'Developer'],
  ['bank_npa', 'ธนาคาร / ทรัพย์ NPA', 'Bank / NPA'],
  ['asset_manager', 'บริษัทบริหารสินทรัพย์', 'Asset manager'],
  ['property_company', 'บริษัทอสังหาริมทรัพย์', 'Property company'],
  ['corporate', 'บริษัททั่วไป', 'Corporate'],
  ['team', 'ทีมงาน', 'Team'],
  ['other', 'อื่น ๆ', 'Other'],
] as const

const emptyProfile = {
  display_name: '',
  legal_name: '',
  organization_type: 'property_company',
  website_url: '',
  logo_url: '',
  description: '',
}

export default function OrganizationManagementPanel() {
  const router = useRouter()
  const { locale } = usePreferences()
  const { user } = useAuth()
  const isThai = locale === 'th'
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([])
  const [contacts, setContacts] = useState<OrganizationContact[]>([])
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    display_name: '',
    legal_name: '',
    organization_type: 'property_company',
    website_url: '',
  })
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Exclude<OrganizationRoleCode, 'owner'>>('publisher')

  const selectedSummary = organizations.find((item) => item.public_organization_id === selectedId)
  const myRole = selectedSummary?.role_code || 'viewer'
  const canAdmin = myRole === 'owner' || myRole === 'admin'
  const canPublish = canAdmin || myRole === 'publisher'
  const isPrimaryOwner = Boolean(selectedSummary?.is_primary_owner)

  const loadOrganizations = useCallback(async (preferredId?: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await getMyOrganizations()
      setOrganizations(result)
      setSelectedId((current) => preferredId || current || result[0]?.public_organization_id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot load organizations')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSelectedOrganization = useCallback(async () => {
    if (!selectedId) {
      setOrganization(null)
      setMembers([])
      setInvitations([])
      setContacts([])
      return
    }
    setBusy('load')
    setError('')
    try {
      const [detail, memberData] = await Promise.all([getOrganization(selectedId), getOrganizationMembers(selectedId)])
      setOrganization(detail.organization)
      setMembers(memberData.members || [])
      setContacts(detail.contacts || [])
      setProfile({
        display_name: detail.organization.display_name,
        legal_name: detail.organization.legal_name || '',
        organization_type: detail.organization.organization_type,
        website_url: detail.organization.website_url || '',
        logo_url: detail.organization.logo_url || '',
        description: detail.organization.description || '',
      })
      if (['owner', 'admin'].includes(memberData.my_role_code)) {
        setInvitations(await getOrganizationInvitations(selectedId))
      } else {
        setInvitations([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot load organization')
    } finally {
      setBusy('')
    }
  }, [selectedId])

  useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  useEffect(() => {
    void loadSelectedOrganization()
  }, [loadSelectedOrganization])

  const activeInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.status === 'pending'),
    [invitations]
  )

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    setBusy('create')
    setError('')
    setMessage('')
    try {
      const result = await createOrganization(createForm)
      setShowCreate(false)
      setCreateForm({ display_name: '', legal_name: '', organization_type: 'property_company', website_url: '' })
      await loadOrganizations(result.public_organization_id)
      setMessage(
        isThai ? 'สร้างองค์กรแล้ว คุณเป็นเจ้าขององค์กรคนแรก' : 'Organization created. You are its primary owner.'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot create organization')
    } finally {
      setBusy('')
    }
  }

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedId) return
    setBusy('profile')
    setError('')
    setMessage('')
    try {
      await updateOrganization(selectedId, profile)
      await loadOrganizations(selectedId)
      await loadSelectedOrganization()
      setMessage(isThai ? 'บันทึกข้อมูลองค์กรแล้ว' : 'Organization profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot update organization')
    } finally {
      setBusy('')
    }
  }

  const handleSaveContacts = async () => {
    if (!selectedId) return
    setBusy('contacts')
    setError('')
    setMessage('')
    try {
      await updateOrganizationContacts(selectedId, contacts)
      await loadSelectedOrganization()
      setMessage(isThai ? 'บันทึกช่องทางติดต่อแล้ว' : 'Organization contacts saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot update contacts')
    } finally {
      setBusy('')
    }
  }

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedId) return
    setBusy('invite')
    setError('')
    setMessage('')
    try {
      await inviteOrganizationMember(selectedId, inviteEmail, inviteRole)
      setInviteEmail('')
      setInvitations(await getOrganizationInvitations(selectedId))
      setMessage(
        isThai ? 'ส่งอีเมลเชิญแล้ว ลิงก์มีอายุ 72 ชั่วโมง' : 'Invitation sent. The link is valid for 72 hours.'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot invite member')
    } finally {
      setBusy('')
    }
  }

  const handleMemberChange = async (
    member: OrganizationMember,
    role: Exclude<OrganizationRoleCode, 'owner'>,
    status: 'active' | 'suspended' | 'removed'
  ) => {
    if (!selectedId) return
    setBusy(`member:${member.public_user_id}`)
    setError('')
    try {
      await updateOrganizationMember(selectedId, member.public_user_id, role, status)
      await loadSelectedOrganization()
      setMessage(isThai ? 'อัปเดตสมาชิกแล้ว' : 'Member updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot update member')
    } finally {
      setBusy('')
    }
  }

  const handleTransfer = async (member: OrganizationMember) => {
    if (!selectedId) return
    const confirmed = window.confirm(
      isThai
        ? `ยืนยันยกสิทธิ์เจ้าขององค์กรให้ ${member.name || member.email}? หลังโอนแล้วคุณจะเป็นผู้ดูแล`
        : `Transfer primary ownership to ${member.name || member.email}? You will become an admin.`
    )
    if (!confirmed) return
    setBusy(`transfer:${member.public_user_id}`)
    setError('')
    try {
      await transferOrganizationOwnership(selectedId, member.public_user_id)
      await loadOrganizations(selectedId)
      await loadSelectedOrganization()
      setMessage(isThai ? 'โอนสิทธิ์เจ้าขององค์กรแล้ว' : 'Organization ownership transferred.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot transfer ownership')
    } finally {
      setBusy('')
    }
  }

  const startOrganizationListing = async () => {
    if (!organization || !canPublish) return
    const draft = prepareOrganizationListingDraft(organization.public_organization_id, organization.display_name)
    await saveListingDraftToCloud(draft).catch(() => null)
    router.push('/add-listing/1')
  }

  return (
    <div className="font-sarabun">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950 dark:text-white">
            {isThai ? 'องค์กรและทีมงาน' : 'Organizations & teams'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'แยกบัญชีของพนักงานออกจากองค์กร แต่เก็บประกาศ ประวัติ และสิทธิ์ไว้กับองค์กรอย่างต่อเนื่อง'
              : 'Keep employee accounts separate while listings, history, and permissions remain with the organization.'}
          </p>
        </div>
        <button type="button" onClick={() => setShowCreate((value) => !value)} className="primary-button">
          <Plus className="size-4" />
          {isThai ? 'สร้างองค์กร' : 'Create organization'}
        </button>
      </div>

      <RoleGuide isThai={isThai} />

      {showCreate ? (
        <form onSubmit={handleCreate} className="panel mt-6 grid gap-4 sm:grid-cols-2">
          <h2 className="text-lg font-semibold sm:col-span-2">
            {isThai ? 'สร้างโปรไฟล์องค์กร' : 'Create organization profile'}
          </h2>
          <Field label={isThai ? 'ชื่อที่ใช้แสดง' : 'Display name'} required>
            <input
              className="field"
              value={createForm.display_name}
              onChange={(event) => setCreateForm({ ...createForm, display_name: event.target.value })}
              required
              minLength={2}
            />
          </Field>
          <Field label={isThai ? 'ชื่อจดทะเบียน (ถ้ามี)' : 'Legal name (optional)'}>
            <input
              className="field"
              value={createForm.legal_name}
              onChange={(event) => setCreateForm({ ...createForm, legal_name: event.target.value })}
            />
          </Field>
          <Field label={isThai ? 'ประเภทองค์กร' : 'Organization type'}>
            <select
              className="field"
              value={createForm.organization_type}
              onChange={(event) => setCreateForm({ ...createForm, organization_type: event.target.value })}
            >
              {organizationTypes.map(([code, th, en]) => (
                <option key={code} value={code}>
                  {isThai ? th : en}
                </option>
              ))}
            </select>
          </Field>
          <Field label={isThai ? 'เว็บไซต์ (ถ้ามี)' : 'Website (optional)'}>
            <input
              className="field"
              type="url"
              value={createForm.website_url}
              onChange={(event) => setCreateForm({ ...createForm, website_url: event.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>
              {isThai ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button type="submit" className="primary-button" disabled={busy === 'create'}>
              {busy === 'create' ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
              {isThai ? 'สร้างองค์กร' : 'Create'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <Notice tone="error" text={error} /> : null}
      {message ? <Notice tone="success" text={message} /> : null}

      {loading ? <div className="mt-8 h-44 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" /> : null}
      {!loading && organizations.length === 0 ? (
        <div className="panel mt-8 text-center">
          <Building2 className="mx-auto size-10 text-neutral-400" />
          <p className="mt-3 font-semibold">{isThai ? 'ยังไม่มีองค์กรในบัญชีนี้' : 'No organizations yet'}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {isThai ? 'สร้างองค์กรแล้วเชิญทีมงานด้วยอีเมลได้ทันที' : 'Create one, then invite teammates by email.'}
          </p>
        </div>
      ) : null}

      {organizations.length > 0 ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-2">
            {organizations.map((item) => (
              <button
                key={item.public_organization_id}
                type="button"
                onClick={() => setSelectedId(item.public_organization_id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === item.public_organization_id ? 'border-[#176b50] bg-emerald-50/70 ring-1 ring-[#176b50] dark:bg-emerald-950/30' : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-neutral-950 dark:text-white">{item.display_name}</span>
                  {item.verification_status === 'verified' ? (
                    <BadgeCheck className="size-5 shrink-0 text-blue-600" />
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {roleLabel(item.role_code || 'viewer', isThai)} · {item.member_count} {isThai ? 'สมาชิก' : 'members'}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  {item.listing_count} {isThai ? 'ประกาศ' : 'listings'}
                </p>
              </button>
            ))}
          </aside>

          <main className="min-w-0 space-y-6">
            {busy === 'load' || !organization ? (
              <div className="h-52 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <>
                <section className="panel">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white">
                          {organization.display_name}
                        </h2>
                        <VerificationBadge status={organization.verification_status} isThai={isThai} />
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">
                        {isThai ? `สิทธิ์ของคุณ: ${roleLabel(myRole, true)}` : `Your role: ${roleLabel(myRole, false)}`}
                      </p>
                    </div>
                    {canPublish ? (
                      <button type="button" className="primary-button" onClick={() => void startOrganizationListing()}>
                        <Send className="size-4" />
                        {isThai ? 'ลงประกาศในนามองค์กร' : 'Create organization listing'}
                      </button>
                    ) : null}
                  </div>
                </section>

                {canAdmin ? (
                  <form onSubmit={handleSaveProfile} className="panel grid gap-4 sm:grid-cols-2">
                    <h3 className="text-lg font-semibold sm:col-span-2">
                      {isThai ? 'ข้อมูลองค์กร' : 'Organization profile'}
                    </h3>
                    <Field label={isThai ? 'ชื่อที่ใช้แสดง' : 'Display name'} required>
                      <input
                        className="field"
                        value={profile.display_name}
                        onChange={(event) => setProfile({ ...profile, display_name: event.target.value })}
                        required
                      />
                    </Field>
                    <Field label={isThai ? 'ชื่อจดทะเบียน' : 'Legal name'}>
                      <input
                        className="field"
                        value={profile.legal_name}
                        onChange={(event) => setProfile({ ...profile, legal_name: event.target.value })}
                      />
                    </Field>
                    <Field label={isThai ? 'ประเภทองค์กร' : 'Organization type'}>
                      <select
                        className="field"
                        value={profile.organization_type}
                        onChange={(event) => setProfile({ ...profile, organization_type: event.target.value })}
                      >
                        {organizationTypes.map(([code, th, en]) => (
                          <option key={code} value={code}>
                            {isThai ? th : en}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={isThai ? 'เว็บไซต์' : 'Website'}>
                      <input
                        className="field"
                        type="url"
                        value={profile.website_url}
                        onChange={(event) => setProfile({ ...profile, website_url: event.target.value })}
                      />
                    </Field>
                    <Field label={isThai ? 'URL โลโก้' : 'Logo URL'}>
                      <input
                        className="field"
                        type="url"
                        value={profile.logo_url}
                        onChange={(event) => setProfile({ ...profile, logo_url: event.target.value })}
                      />
                    </Field>
                    <Field label={isThai ? 'คำอธิบาย' : 'Description'}>
                      <textarea
                        className="field min-h-24"
                        value={profile.description}
                        onChange={(event) => setProfile({ ...profile, description: event.target.value })}
                      />
                    </Field>
                    <div className="flex justify-end sm:col-span-2">
                      <button type="submit" className="primary-button" disabled={busy === 'profile'}>
                        {busy === 'profile' ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        {isThai ? 'บันทึกข้อมูล' : 'Save profile'}
                      </button>
                    </div>
                  </form>
                ) : null}

                <section className="panel">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{isThai ? 'ช่องทางติดต่อสาธารณะ' : 'Public contacts'}</h3>
                    {canAdmin ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          setContacts((current) => [
                            ...current,
                            { channel_type: 'phone', channel_value: '', label: '', is_primary: current.length === 0 },
                          ])
                        }
                      >
                        <Plus className="size-4" />
                        {isThai ? 'เพิ่ม' : 'Add'}
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-3">
                    {contacts.length === 0 ? (
                      <p className="text-sm text-neutral-500">
                        {isThai ? 'ยังไม่มีช่องทางติดต่อ' : 'No public contacts.'}
                      </p>
                    ) : (
                      contacts.map((contact, index) => (
                        <div
                          key={`${contact.channel_type}-${index}`}
                          className="grid gap-2 rounded-2xl bg-neutral-50 p-3 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_auto] dark:bg-neutral-800/60"
                        >
                          <select
                            disabled={!canAdmin}
                            className="field"
                            value={contact.channel_type}
                            onChange={(event) =>
                              setContacts((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        channel_type: event.target.value as OrganizationContact['channel_type'],
                                      }
                                    : item
                                )
                              )
                            }
                          >
                            <option value="phone">Phone</option>
                            <option value="email">Email</option>
                            <option value="line">LINE</option>
                            <option value="website">Website</option>
                          </select>
                          <input
                            disabled={!canAdmin}
                            className="field"
                            value={contact.channel_value}
                            placeholder={isThai ? 'ข้อมูลติดต่อ' : 'Contact value'}
                            onChange={(event) =>
                              setContacts((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, channel_value: event.target.value } : item
                                )
                              )
                            }
                          />
                          <input
                            disabled={!canAdmin}
                            className="field"
                            value={contact.label}
                            placeholder={isThai ? 'ป้ายกำกับ' : 'Label'}
                            onChange={(event) =>
                              setContacts((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, label: event.target.value } : item
                                )
                              )
                            }
                          />
                          {canAdmin ? (
                            <button
                              type="button"
                              aria-label={isThai ? 'ลบช่องทาง' : 'Remove contact'}
                              className="icon-button text-red-600"
                              onClick={() =>
                                setContacts((current) => current.filter((_, itemIndex) => itemIndex !== index))
                              }
                            >
                              <Trash2 className="size-4" />
                            </button>
                          ) : contact.is_verified ? (
                            <BadgeCheck className="m-3 size-5 text-blue-600" />
                          ) : null}
                          {canAdmin ? (
                            <label className="flex items-center gap-2 text-xs text-neutral-600 sm:col-span-4 dark:text-neutral-300">
                              <input
                                type="checkbox"
                                checked={contact.is_primary}
                                onChange={(event) =>
                                  setContacts((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, is_primary: event.target.checked } : item
                                    )
                                  )
                                }
                              />
                              {isThai ? 'ช่องทางหลักของประเภทนี้' : 'Primary for this channel type'}
                              {contact.is_verified ? (
                                <span className="ml-auto text-blue-600">{isThai ? 'ตรวจสอบแล้ว' : 'Verified'}</span>
                              ) : null}
                            </label>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                  {canAdmin ? (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="primary-button"
                        disabled={busy === 'contacts'}
                        onClick={() => void handleSaveContacts()}
                      >
                        {busy === 'contacts' ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        {isThai ? 'บันทึกช่องทาง' : 'Save contacts'}
                      </button>
                    </div>
                  ) : null}
                </section>

                <section className="panel">
                  <h3 className="text-lg font-semibold">{isThai ? 'สมาชิกและสิทธิ์' : 'Members & permissions'}</h3>
                  {canAdmin ? (
                    <form
                      onSubmit={handleInvite}
                      className="mt-4 grid gap-2 rounded-2xl border border-dashed border-neutral-300 p-4 sm:grid-cols-[minmax(0,1fr)_170px_auto] dark:border-neutral-700"
                    >
                      <input
                        className="field"
                        type="email"
                        required
                        value={inviteEmail}
                        placeholder={isThai ? 'อีเมลพนักงาน' : 'Employee email'}
                        onChange={(event) => setInviteEmail(event.target.value)}
                      />
                      <select
                        className="field"
                        value={inviteRole}
                        onChange={(event) =>
                          setInviteRole(event.target.value as Exclude<OrganizationRoleCode, 'owner'>)
                        }
                      >
                        {roleOptions
                          .filter((role) => myRole === 'owner' || role.code !== 'admin')
                          .map((role) => (
                            <option key={role.code} value={role.code}>
                              {isThai ? role.th : role.en}
                            </option>
                          ))}
                      </select>
                      <button className="primary-button" type="submit" disabled={busy === 'invite'}>
                        {busy === 'invite' ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <MailPlus className="size-4" />
                        )}
                        {isThai ? 'ส่งคำเชิญ' : 'Invite'}
                      </button>
                    </form>
                  ) : null}
                  {activeInvitations.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {activeInvitations.map((invitation) => (
                        <div
                          key={invitation.public_invitation_id}
                          className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                        >
                          {invitation.email} · {roleLabel(invitation.role_code, isThai)} ·{' '}
                          {isThai ? 'รอตอบรับ' : 'Pending'}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
                    {members.map((member) => {
                      const isSelf = member.public_user_id === user?.public_user_id
                      const canManageMember =
                        canAdmin &&
                        !member.is_primary_owner &&
                        !isSelf &&
                        !(myRole === 'admin' && member.role_code === 'admin')
                      return (
                        <div
                          key={member.public_user_id}
                          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                        >
                          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#176b50] dark:bg-emerald-950/40">
                            <UserRoundCog className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">
                              {[member.name, member.surname].filter(Boolean).join(' ') || member.email}
                              {isSelf ? ` (${isThai ? 'คุณ' : 'you'})` : ''}
                            </p>
                            <p className="truncate text-xs text-neutral-500">
                              {member.email} · {roleLabel(member.role_code, isThai)}
                              {member.is_primary_owner ? ` · ${isThai ? 'เจ้าของหลัก' : 'Primary owner'}` : ''}
                            </p>
                          </div>
                          {canManageMember ? (
                            <div className="flex flex-wrap gap-2">
                              <select
                                className="field w-auto"
                                value={member.role_code}
                                disabled={busy === `member:${member.public_user_id}`}
                                onChange={(event) =>
                                  void handleMemberChange(
                                    member,
                                    event.target.value as Exclude<OrganizationRoleCode, 'owner'>,
                                    member.status === 'active' ? 'active' : 'suspended'
                                  )
                                }
                              >
                                {roleOptions
                                  .filter((role) => myRole === 'owner' || role.code !== 'admin')
                                  .map((role) => (
                                    <option key={role.code} value={role.code}>
                                      {isThai ? role.th : role.en}
                                    </option>
                                  ))}
                              </select>
                              <button
                                type="button"
                                className="secondary-button"
                                disabled={Boolean(busy)}
                                onClick={() =>
                                  void handleMemberChange(
                                    member,
                                    member.role_code as Exclude<OrganizationRoleCode, 'owner'>,
                                    member.status === 'active' ? 'suspended' : 'active'
                                  )
                                }
                              >
                                {member.status === 'active'
                                  ? isThai
                                    ? 'พักสิทธิ์'
                                    : 'Suspend'
                                  : isThai
                                    ? 'เปิดสิทธิ์'
                                    : 'Activate'}
                              </button>
                              {isPrimaryOwner && member.status === 'active' ? (
                                <button
                                  type="button"
                                  className="secondary-button"
                                  disabled={Boolean(busy)}
                                  onClick={() => void handleTransfer(member)}
                                >
                                  {isThai ? 'โอนเจ้าของ' : 'Make owner'}
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <VerificationBadge
                              status={member.status === 'active' ? 'contact_checked' : 'rejected'}
                              label={
                                member.status === 'active'
                                  ? isThai
                                    ? 'ใช้งาน'
                                    : 'Active'
                                  : isThai
                                    ? 'พักสิทธิ์'
                                    : 'Suspended'
                              }
                              isThai={isThai}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      ) : null}

      <style jsx>{`
        .panel {
          border: 1px solid rgb(229 229 229);
          border-radius: 24px;
          background: white;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
        }
        .field {
          min-height: 42px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgb(212 212 212);
          background: white;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
        }
        .field:focus {
          border-color: #176b50;
          box-shadow: 0 0 0 3px rgba(23, 107, 80, 0.12);
        }
        .primary-button,
        .secondary-button {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s;
        }
        .primary-button {
          background: #124e3c;
          color: white;
        }
        .primary-button:hover {
          background: #0d3d2f;
        }
        .secondary-button {
          border: 1px solid rgb(212 212 212);
          background: white;
          color: rgb(64 64 64);
        }
        .icon-button {
          display: grid;
          min-height: 42px;
          min-width: 42px;
          place-items: center;
          border-radius: 12px;
        }
        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
        @media (prefers-color-scheme: dark) {
          .panel {
            border-color: rgb(38 38 38);
            background: rgb(23 23 23);
          }
          .field,
          .secondary-button {
            border-color: rgb(64 64 64);
            background: rgb(23 23 23);
            color: rgb(245 245 245);
          }
        }
      `}</style>
    </div>
  )
}

function RoleGuide({ isThai }: { isThai: boolean }) {
  const roles = [
    [
      'owner',
      isThai ? 'เจ้าขององค์กร' : 'Owner',
      isThai ? 'สิทธิ์สูงสุดและโอนความเป็นเจ้าของได้' : 'Full access and ownership transfer',
    ],
    [
      'admin',
      isThai ? 'ผู้ดูแล' : 'Admin',
      isThai ? 'จัดการโปรไฟล์ สมาชิก และประกาศ' : 'Manage profile, members, and listings',
    ],
    [
      'publisher',
      isThai ? 'ผู้ลงประกาศ' : 'Publisher',
      isThai ? 'สร้างและแก้ไขประกาศขององค์กร' : 'Create and edit organization listings',
    ],
  ]
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      {roles.map(([code, title, description]) => (
        <div
          key={code}
          className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <ShieldCheck className="size-5 text-[#176b50]" />
          <p className="mt-2 font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
        </div>
      ))}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
      <span className="mb-1.5 block">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}

function Notice({ tone, text }: { tone: 'error' | 'success'; text: string }) {
  const Icon = tone === 'error' ? CircleAlert : Check
  return (
    <div
      className={`mt-5 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${tone === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      {text}
    </div>
  )
}

function VerificationBadge({ status, isThai, label }: { status: string; isThai: boolean; label?: string }) {
  const verified = status === 'verified' || status === 'contact_checked'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${verified ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'}`}
    >
      {verified ? <BadgeCheck className="size-3.5" /> : <CircleAlert className="size-3.5" />}
      {label ||
        (status === 'verified' ? (isThai ? 'ตรวจสอบแล้ว' : 'Verified') : isThai ? 'ยังไม่ตรวจสอบ' : 'Unverified')}
    </span>
  )
}

function roleLabel(role: OrganizationRoleCode | string, isThai: boolean) {
  if (role === 'owner') return isThai ? 'เจ้าขององค์กร' : 'Owner'
  const option = roleOptions.find((item) => item.code === role)
  return option ? (isThai ? option.th : option.en) : role
}
