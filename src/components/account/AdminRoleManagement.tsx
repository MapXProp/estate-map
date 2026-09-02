'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import {
  getAdminUsers,
  getPlatformRoles,
  updateAdminUserRole,
  type AdminUser,
  type PlatformRole,
} from '@/lib/adminRoles'
import type { PlatformRoleCode } from '@/lib/auth'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { FormEvent, useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 50

type PendingRoleChange = {
  user: AdminUser
  roleCode: PlatformRoleCode
}

const AdminRoleManagement = () => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const { isLoading: authLoading, user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role_code === 'super_admin'
  const [roles, setRoles] = useState<PlatformRole[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (authLoading || !isSuperAdmin) return

    let cancelled = false
    Promise.all([getPlatformRoles(), getAdminUsers(appliedQuery, offset, PAGE_SIZE)])
      .then(([nextRoles, result]) => {
        if (cancelled) return
        setRoles(nextRoles)
        setUsers(result.users || [])
        setTotal(result.total || 0)
        setError('')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Cannot load role management')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [appliedQuery, authLoading, isSuperAdmin, offset, reloadKey])

  const assignableRoles = useMemo(() => roles.filter((role) => role.is_assignable), [roles])
  const roleByCode = useMemo(() => new Map(roles.map((role) => [role.code, role])), [roles])
  const pageStart = total === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + users.length, total)

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setOffset(0)
    setAppliedQuery(query.trim())
    setReloadKey((value) => value + 1)
  }

  const confirmRoleChange = async () => {
    if (!pendingChange || updating) return
    setUpdating(true)
    setError('')
    try {
      await updateAdminUserRole(pendingChange.user.public_user_id, pendingChange.roleCode)
      const role = roleByCode.get(pendingChange.roleCode)
      setUsers((current) =>
        current.map((user) =>
          user.public_user_id === pendingChange.user.public_user_id
            ? {
                ...user,
                role_code: pendingChange.roleCode,
                role_name_th: role?.name_th || pendingChange.roleCode,
                role_name_en: role?.name_en || pendingChange.roleCode,
                role_updated_at: new Date().toISOString(),
              }
            : user
        )
      )
      setPendingChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot update user role')
      setPendingChange(null)
    } finally {
      setUpdating(false)
    }
  }

  if (authLoading) {
    return <AdminLoading isThai={isThai} />
  }

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <ShieldCheckIcon className="mx-auto size-10 text-neutral-400" />
        <h1 className="mt-4 font-sarabun text-xl font-semibold">
          {isThai ? 'สำหรับผู้ดูแลระบบสูงสุดเท่านั้น' : 'Super admin access only'}
        </h1>
        <p className="mt-2 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
          {isThai ? 'บัญชีนี้ไม่มีสิทธิ์จัดการ Role ของผู้ใช้งาน' : 'This account cannot manage platform roles.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-sarabun text-xs font-semibold tracking-wide text-[#176b50] uppercase dark:text-emerald-300">
            Super Admin
          </p>
          <h1 className="mt-2 font-sarabun text-3xl font-semibold text-neutral-950 dark:text-white">
            {isThai ? 'จัดการสิทธิ์ผู้ใช้งาน' : 'User role management'}
          </h1>
          <p className="mt-2 max-w-2xl font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'กำหนดสิทธิ์การทำงานของทีมโดยไม่กระทบบทบาทผู้ติดต่อในประกาศ'
              : 'Assign team permissions independently from each listing’s contact role.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            setReloadKey((value) => value + 1)
          }}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 font-sarabun text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        >
          <ArrowPathIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          {isThai ? 'รีเฟรช' : 'Refresh'}
        </button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {roles.map((role) => (
          <div
            key={role.code}
            className={`rounded-2xl border p-4 ${
              role.code === 'super_admin'
                ? 'border-[#176b50]/25 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/20'
                : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-white">
                {isThai ? role.name_th : role.name_en}
              </span>
              <span className="font-mono text-[11px] text-neutral-400">{role.permission_level}</span>
            </div>
            <p className="mt-2 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {isThai ? role.description_th : role.description_en}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              <UserGroupIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-sarabun font-semibold text-neutral-950 dark:text-white">
                {isThai ? `ผู้ใช้งานทั้งหมด ${total} คน` : `${total} users`}
              </h2>
              <p className="font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                {isThai ? 'การเปลี่ยนทุกครั้งจะถูกบันทึกประวัติ' : 'Every role change is recorded.'}
              </p>
            </div>
          </div>
          <form onSubmit={submitSearch} className="flex w-full max-w-md gap-2">
            <label className="relative flex-1">
              <span className="sr-only">{isThai ? 'ค้นหาผู้ใช้' : 'Search users'}</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={120}
                placeholder={isThai ? 'ค้นหาชื่อหรืออีเมล' : 'Search name or email'}
                className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 ps-10 pe-3 font-sarabun text-sm outline-none transition focus:border-[#176b50] focus:ring-2 focus:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </label>
            <button
              type="submit"
              className="h-10 rounded-xl bg-neutral-900 px-4 font-sarabun text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              {isThai ? 'ค้นหา' : 'Search'}
            </button>
          </form>
        </div>

        {error ? (
          <div className="m-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="px-5 py-14 text-center font-sarabun text-sm text-neutral-500">
            {isThai ? 'ไม่พบผู้ใช้งาน' : 'No users found'}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {users.map((user) => (
              <div key={user.public_user_id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-neutral-100 font-sarabun text-sm font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {userInitials(user)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-sarabun font-semibold text-neutral-950 dark:text-white">
                        {[user.name, user.surname].filter(Boolean).join(' ') || user.email}
                      </h3>
                      {user.is_verified ? <CheckBadgeIcon className="size-4 text-[#176b50]" title={isThai ? 'ยืนยันแล้ว' : 'Verified'} /> : null}
                      {user.is_primary_super_admin ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-sarabun text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {isThai ? 'บัญชีหลัก' : 'Primary'}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate font-sarabun text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
                    <p className="mt-1 font-sarabun text-xs text-neutral-400">
                      {isThai ? `${user.listing_count} ประกาศ · สมัคร ${formatDate(user.created_at, 'th-TH')}` : `${user.listing_count} listings · Joined ${formatDate(user.created_at, 'en-US')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className={`size-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                  {user.is_primary_super_admin ? (
                    <span className="min-w-44 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-sarabun text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      {isThai ? user.role_name_th : user.role_name_en}
                    </span>
                  ) : (
                    <select
                      value={user.role_code}
                      onChange={(event) =>
                        setPendingChange({ user, roleCode: event.target.value as PlatformRoleCode })
                      }
                      className="min-w-44 rounded-xl border border-neutral-200 bg-white px-3 py-2 font-sarabun text-sm font-semibold text-neutral-700 outline-none focus:border-[#176b50] focus:ring-2 focus:ring-[#176b50]/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                    >
                      {assignableRoles.map((role) => (
                        <option key={role.code} value={role.code}>
                          {isThai ? role.name_th : role.name_en}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {total > PAGE_SIZE ? (
          <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <span className="font-sarabun text-xs text-neutral-500">
              {pageStart}-{pageEnd} / {total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={offset === 0 || loading}
                onClick={() => {
                  setLoading(true)
                  setOffset((value) => Math.max(0, value - PAGE_SIZE))
                }}
                className="h-9 rounded-full border border-neutral-200 px-4 font-sarabun text-xs font-semibold disabled:opacity-40 dark:border-neutral-700"
              >
                {isThai ? 'ก่อนหน้า' : 'Previous'}
              </button>
              <button
                type="button"
                disabled={offset + users.length >= total || loading}
                onClick={() => {
                  setLoading(true)
                  setOffset((value) => value + PAGE_SIZE)
                }}
                className="h-9 rounded-full border border-neutral-200 px-4 font-sarabun text-xs font-semibold disabled:opacity-40 dark:border-neutral-700"
              >
                {isThai ? 'ถัดไป' : 'Next'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <RoleChangeDialog
        change={pendingChange}
        role={pendingChange ? roleByCode.get(pendingChange.roleCode) : undefined}
        isThai={isThai}
        updating={updating}
        onClose={() => {
          if (!updating) setPendingChange(null)
        }}
        onConfirm={() => void confirmRoleChange()}
      />
    </div>
  )
}

const RoleChangeDialog = ({
  change,
  role,
  isThai,
  updating,
  onClose,
  onConfirm,
}: {
  change: PendingRoleChange | null
  role?: PlatformRole
  isThai: boolean
  updating: boolean
  onClose: () => void
  onConfirm: () => void
}) => (
  <Dialog open={Boolean(change)} onClose={onClose} className="relative z-[110]">
    <DialogBackdrop className="fixed inset-0 bg-neutral-950/45 backdrop-blur-[1px]" />
    <div className="fixed inset-0 overflow-y-auto p-4">
      <div className="flex min-h-full items-center justify-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:p-7">
          <span className="grid size-11 place-items-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
            <ExclamationTriangleIcon className="size-6" />
          </span>
          <DialogTitle className="mt-5 font-sarabun text-xl font-semibold text-neutral-950 dark:text-white">
            {isThai ? 'ยืนยันการเปลี่ยนสิทธิ์' : 'Confirm role change'}
          </DialogTitle>
          <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {isThai
              ? `เปลี่ยน ${change?.user.email || ''} เป็น “${role?.name_th || change?.roleCode || ''}”`
              : `Change ${change?.user.email || ''} to “${role?.name_en || change?.roleCode || ''}”.`}
          </p>
          <p className="mt-3 rounded-2xl bg-neutral-50 px-4 py-3 font-sarabun text-xs leading-5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {isThai
              ? 'สิทธิ์ใหม่จะมีผลกับคำขอถัดไปทันที และระบบจะบันทึกประวัติการเปลี่ยนแปลง'
              : 'The new permission applies on the next request and the change will be audited.'}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="h-11 rounded-full border border-neutral-200 px-5 font-sarabun text-sm font-semibold dark:border-neutral-700"
            >
              {isThai ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={updating}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#124e3c] px-5 font-sarabun text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
            >
              {updating ? <ArrowPathIcon className="size-4 animate-spin" /> : <ShieldCheckIcon className="size-4" />}
              {updating ? (isThai ? 'กำลังบันทึก…' : 'Saving…') : isThai ? 'ยืนยันเปลี่ยนสิทธิ์' : 'Confirm change'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
)

const AdminLoading = ({ isThai }: { isThai: boolean }) => (
  <div className="py-20 text-center font-sarabun text-sm text-neutral-500">
    <ArrowPathIcon className="mx-auto mb-3 size-6 animate-spin" />
    {isThai ? 'กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ…' : 'Checking admin permission…'}
  </div>
)

const userInitials = (user: AdminUser) => {
  const initials = `${user.name?.[0] || ''}${user.surname?.[0] || ''}`.trim()
  return (initials || user.email?.[0] || 'U').toUpperCase()
}

const formatDate = (value: string, locale: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed)
}

export default AdminRoleManagement
