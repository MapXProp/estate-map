'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getStoredUser, type AuthUser } from '@/lib/auth'
import {
  loadListingContactProfile,
  saveListingContactProfile,
  type ListingContactProfile,
} from '@/lib/listingContactProfile'
import Input from '@/shared/Input'
import { Check, ChevronDown, ContactRound, LoaderCircle, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import styles from './AccountDashboard.module.css'

const roles = [
  ['owner', 'เจ้าของทรัพย์', 'Property owner', 'self'],
  ['owner_representative', 'ตัวแทนเจ้าของ', 'Owner representative', 'property_owner'],
  ['independent_broker', 'นายหน้าอิสระ', 'Independent broker', ''],
  ['agency_broker', 'นายหน้าบริษัท', 'Agency broker', 'brokerage_company'],
  [
    'developer_investor_representative',
    'ตัวแทนโครงการ / นักลงทุน',
    'Developer / investor representative',
    'developer_project',
  ],
  ['property_manager', 'ผู้ดูแลทรัพย์', 'Property manager', 'property_management_company'],
] as const
const authorities = [
  ['property_owner', 'เจ้าของทรัพย์', 'Property owner'],
  ['brokerage_company', 'บริษัทนายหน้า / ทีม', 'Brokerage / team'],
  ['developer_project', 'โครงการ / ผู้พัฒนา', 'Project / developer'],
  ['investor_asset_holder', 'นักลงทุน / ผู้ถือทรัพย์', 'Investor / asset holder'],
  ['co_broker', 'นายหน้าร่วม (Co-broker)', 'Co-broker'],
  ['property_management_company', 'บริษัทบริหารทรัพย์', 'Property management company'],
] as const
const blankProfile = (user: AuthUser): ListingContactProfile => ({
  contact_name: [user.name, user.surname].filter(Boolean).join(' '),
  contact_phone: '',
  contact_phone_secondary: '',
  contact_email: '',
  line_id: '',
  instagram_handle: '',
  role_code: '',
  authority_source_code: '',
  organization_name: '',
  organization_registration_no: '',
})

export default function AccountListingContactForm({ user }: { user: AuthUser }) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const [profile, setProfile] = useState(() => blankProfile(user))
  const [saved, setSaved] = useState<ListingContactProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const pending = useRef(false)
  const mounted = useRef(true)
  const initial = useRef(blankProfile(user))
  const dirty = JSON.stringify(profile) !== JSON.stringify(saved || initial.current)
  const companyRequired = ['agency_broker', 'developer_investor_representative'].includes(profile.role_code)
  const showCompany = Boolean(profile.role_code && profile.role_code !== 'owner') || Boolean(profile.organization_name)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(false)
    loadListingContactProfile(controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return
        setSaved(value)
        setProfile(value || initial.current)
        setLoading(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError(true)
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [attempt])
  const update = (key: keyof ListingContactProfile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }))
    setMessage('')
    setError('')
  }
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current || loading || loadError || !dirty) return
    pending.current = true
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = Object.fromEntries(
        Object.entries(profile).map(([key, value]) => [key, value.trim()])
      ) as ListingContactProfile
      if (payload.role_code === 'owner') payload.authority_source_code = 'self'
      if (!payload.organization_name) payload.organization_registration_no = ''
      const value = await saveListingContactProfile(payload)
      if (!mounted.current || getStoredUser()?.public_user_id !== user.public_user_id) return
      setProfile(value)
      setSaved(value)
      setOpen(false)
      setMessage(th ? 'บันทึกแล้ว พร้อมใช้กับประกาศใหม่' : 'Saved. Ready for your next listing.')
    } catch {
      if (mounted.current)
        setError(
          th ? 'ยังบันทึกไม่ได้ ตรวจข้อมูลและลองอีกครั้งได้ครับ' : 'Could not save. Check your details and try again.'
        )
    } finally {
      pending.current = false
      if (mounted.current) setSaving(false)
    }
  }
  const field = (
    key: keyof ListingContactProfile,
    label: string,
    options: {
      type?: string
      autoComplete?: string
      required?: boolean
      maxLength?: number
      placeholder?: string
      pattern?: string
    } = {}
  ) => (
    <label className="block min-w-0" key={key}>
      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</span>
      <Input
        name={key}
        value={profile[key]}
        onChange={(event) => update(key, event.target.value)}
        className="mt-2"
        fontClass="text-base"
        maxLength={160}
        {...options}
      />
    </label>
  )
  return (
    <section className={styles.panel} data-account-listing-contact aria-busy={loading || saving}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf5ef] text-[#176b50]">
          <ContactRound size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <h2>{th ? 'ข้อมูลสำหรับลงประกาศ' : 'Listing contact details'}</h2>
          <p className={styles.panelDescription}>
            {th ? 'กรอกครั้งเดียว ใช้กับประกาศใหม่' : 'Fill in once. Reuse on new listings.'}
          </p>
        </div>
      </div>
      {loading ? (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-neutral-500">
          <LoaderCircle size={16} className="animate-spin" />
          {th ? 'กำลังโหลดข้อมูล…' : 'Loading…'}
        </p>
      ) : loadError ? (
        <div role="alert" className="mt-4 text-sm">
          <p>{th ? 'ยังโหลดข้อมูลติดต่อไม่ได้' : 'Unable to load contact details.'}</p>
          <button
            type="button"
            className="min-h-11 text-[#176b50] underline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {th ? 'ลองอีกครั้ง' : 'Retry'}
          </button>
        </div>
      ) : (
        <>
          {!open && saved && (
            <div className="mt-5 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800">
              <p className="font-medium [overflow-wrap:anywhere]">{saved.contact_name}</p>
              <p className="mt-1 text-sm [overflow-wrap:anywhere] text-neutral-500">
                {[saved.contact_phone, saved.line_id ? `LINE: ${saved.line_id}` : ''].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-1 text-xs text-[#176b50] dark:text-emerald-300">
                {roles.find((role) => role[0] === saved.role_code)?.[th ? 1 : 2]}
              </p>
            </div>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="listing-contact-fields"
            disabled={saving}
            onClick={() => setOpen((value) => !value)}
            className="mt-3 flex min-h-11 w-full items-center justify-between gap-2 text-sm font-medium text-[#176b50] dark:text-emerald-300"
          >
            <span className="inline-flex items-center gap-2">
              {!saved && !open && <Plus size={17} />}
              {th
                ? open
                  ? 'ซ่อนแบบฟอร์ม'
                  : saved
                    ? 'แก้ไขข้อมูลติดต่อ'
                    : 'เพิ่มข้อมูลติดต่อ'
                : open
                  ? 'Hide form'
                  : saved
                    ? 'Edit contact details'
                    : 'Add contact details'}
            </span>
            <ChevronDown size={18} className={open ? 'rotate-180' : ''} />
          </button>
          {!saved && !open && (
            <p className="text-xs text-neutral-500">
              {th ? 'ยังไม่ลงประกาศ ข้ามส่วนนี้ได้เลย' : 'Just browsing? You can skip this.'}
            </p>
          )}
          <form id="listing-contact-fields" onSubmit={save} hidden={!open} className="mt-3 space-y-5">
            <fieldset disabled={saving} className="space-y-5">
              {field('contact_name', th ? 'ชื่อสำหรับติดต่อ' : 'Contact name', {
                required: true,
                autoComplete: 'section-listing name',
                placeholder: th ? 'ชื่อที่ให้ลูกค้าเรียกคุณ' : 'Name customers should use',
              })}
              <div className="grid gap-5 sm:grid-cols-2">
                {field('contact_phone', th ? 'เบอร์โทรศัพท์' : 'Phone number', {
                  required: true,
                  type: 'tel',
                  autoComplete: 'section-listing tel',
                  maxLength: 64,
                  placeholder: '08x xxx xxxx',
                })}
                {field('line_id', th ? 'LINE ID (ถ้ามี)' : 'LINE ID (optional)', {
                  autoComplete: 'off',
                  placeholder: th ? 'เช่น @mapxprop' : 'e.g. @mapxprop',
                })}
              </div>
              {field('contact_email', th ? 'อีเมลสำหรับติดต่อ (ถ้ามี)' : 'Contact email (optional)', {
                type: 'email',
                autoComplete: 'section-listing email',
                maxLength: 320,
                placeholder: th ? 'ใช้อีเมลที่ต่างจากบัญชีได้' : 'Can differ from your account email',
              })}
              <fieldset>
                <legend className="mb-2 text-sm font-medium">{th ? 'คุณลงประกาศในฐานะ' : 'You list as'}</legend>
                <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                  {roles.map(([value, thai, english, authority]) => (
                    <label
                      key={value}
                      className={`relative flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${profile.role_code === value ? 'border-[#8ab29f] bg-[#edf6f0] text-[#14573f] dark:bg-emerald-950 dark:text-emerald-200' : 'border-neutral-200 dark:border-neutral-700'}`}
                    >
                      <input
                        type="radio"
                        name="role_code"
                        value={value}
                        required
                        checked={profile.role_code === value}
                        onChange={() => {
                          setProfile((current) => ({ ...current, role_code: value, authority_source_code: authority }))
                          setMessage('')
                          setError('')
                        }}
                        className="size-4 shrink-0 border-neutral-300 text-[#176b50] focus:ring-[#176b50]"
                      />
                      <span>{th ? thai : english}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {profile.role_code && profile.role_code !== 'owner' && (
                <label className="block">
                  <span className="text-sm font-medium">
                    {th ? 'ได้รับสิทธิลงประกาศจาก' : 'Authority to list comes from'}
                  </span>
                  <select
                    name="authority_source_code"
                    required
                    value={profile.authority_source_code}
                    onChange={(event) => update('authority_source_code', event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-2xl border-neutral-200 bg-transparent text-base dark:border-neutral-700"
                  >
                    <option value="">{th ? 'เลือกผู้มอบสิทธิ' : 'Select authority source'}</option>
                    {authorities.map(([value, thai, english]) => (
                      <option key={value} value={value}>
                        {th ? thai : english}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {showCompany &&
                field(
                  'organization_name',
                  th
                    ? `บริษัท / สังกัด${companyRequired ? '' : ' (ถ้ามี)'}`
                    : `Company${companyRequired ? '' : ' (optional)'}`,
                  { required: companyRequired, autoComplete: 'section-listing organization' }
                )}
              <details className="rounded-xl border border-neutral-200 px-4 dark:border-neutral-700" data-contact-more>
                <summary className="cursor-pointer py-3 text-sm font-medium">
                  {th ? 'ช่องทางเพิ่มเติม' : 'More contact options'}
                </summary>
                <div className="space-y-4 pb-4">
                  {field('contact_phone_secondary', th ? 'เบอร์สำรอง (ถ้ามี)' : 'Secondary phone (optional)', {
                    type: 'tel',
                    maxLength: 64,
                  })}
                  {field('instagram_handle', th ? 'Instagram (ถ้ามี)' : 'Instagram (optional)', {
                    maxLength: 64,
                    placeholder: '@username',
                  })}
                </div>
              </details>
              <p className="text-xs leading-5 text-neutral-500">
                {th
                  ? 'ตรวจทานได้ก่อนเผยแพร่ทุกครั้ง การแก้ไขที่นี่ไม่เปลี่ยนข้อมูลติดต่อในประกาศเดิม'
                  : 'Review before publishing. Changes here do not update contact details on existing listings.'}
              </p>
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-5 dark:border-neutral-700">
                <button
                  type="submit"
                  disabled={!dirty || saving}
                  className={`${styles.primaryAction} flex-1 disabled:opacity-50 sm:flex-none`}
                >
                  {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
                  {th ? 'บันทึกข้อมูลติดต่อ' : 'Save contact details'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfile(saved || initial.current)
                    setOpen(false)
                    setError('')
                  }}
                  className={styles.secondaryAction}
                >
                  {th ? 'ยกเลิก' : 'Cancel'}
                </button>
              </div>
            </fieldset>
          </form>
        </>
      )}
      {message && (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm text-[#176b50] dark:text-emerald-300">
          <Check size={16} />
          {message}
        </p>
      )}
    </section>
  )
}
