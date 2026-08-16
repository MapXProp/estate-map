'use client'

import { getAuthApiUrl, setStoredAuth } from '@/lib/auth'
import { syncListingDraftAfterAuth } from '@/lib/listingDraft'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ArrowRightIcon, CheckIcon, EyeIcon, EyeSlashIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export type AuthMode = 'signup' | 'login'
export type AuthPurpose = 'default' | 'listing'

type Props = {
  open: boolean
  onClose: () => void
  onAuthenticated: () => void | Promise<void>
  initialMode?: AuthMode
  purpose?: AuthPurpose
  redirectPath?: string
}

type AuthResponse = {
  token?: string
  access_token?: string
  public_user_id?: string
  name?: string
  surname?: string
  email?: string
  error?: string
}

export default function AuthModal({
  open,
  onClose,
  onAuthenticated,
  initialMode = 'login',
  purpose = 'default',
  redirectPath,
}: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [socialSubmitting, setSocialSubmitting] = useState<'google' | 'line' | null>(null)

  const handleClose = () => {
    if (submitting || socialSubmitting) return
    setMode(initialMode)
    setError('')
    setPassword('')
    setShowPassword(false)
    setSocialSubmitting(null)
    onClose()
  }

  const selectMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setPassword('')
    setShowPassword(false)
    setSocialSubmitting(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail.includes('@')) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง')
      return
    }
    if (mode === 'signup' && !isStrongPassword(password)) {
      setError('รหัสผ่านยังไม่ครบตามเงื่อนไขด้านล่าง')
      return
    }
    if (mode === 'login' && !password) {
      setError('กรุณากรอกรหัสผ่าน')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(getAuthApiUrl(mode === 'signup' ? 'userRegister' : 'userLogin'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = (isJson ? await response.json() : null) as AuthResponse | null

      if (!response.ok) {
        if (mode === 'signup' && response.status === 409) {
          throw new Error('อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ')
        }
        throw new Error(
          data?.error || (mode === 'signup' ? 'ยังสมัครสมาชิกไม่ได้ กรุณาลองอีกครั้ง' : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        )
      }

      setStoredAuth({ ...data, email: data?.email || normalizedEmail })
      await syncListingDraftAfterAuth().catch(() => undefined)
      await onAuthenticated()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  const isSignup = mode === 'signup'
  const isListing = purpose === 'listing'
  const passwordRules = [
    { label: '8+', passed: password.length >= 8 },
    { label: 'A–Z', passed: /[A-Z]/.test(password) },
    { label: 'a–z', passed: /[a-z]/.test(password) },
    { label: '0–9', passed: /[0-9]/.test(password) },
    { label: '!@#$', passed: /[^A-Za-z0-9]/.test(password) },
  ]

  const resolvedRedirectPath = () => {
    if (redirectPath?.startsWith('/')) return redirectPath
    if (typeof window === 'undefined') return '/'
    return `${window.location.pathname}${window.location.search}${window.location.hash}`
  }

  const socialAuthUrl = (provider: 'google' | 'line') => {
    const url = new URL(getAuthApiUrl(`auth/${provider}/start`))
    url.searchParams.set('redirect', resolvedRedirectPath())
    return url.toString()
  }

  const handleSocialAuth = (event: React.MouseEvent<HTMLAnchorElement>, provider: 'google' | 'line') => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (socialSubmitting) return
    setError('')
    setSocialSubmitting(provider)
    const destination = event.currentTarget.href
    window.setTimeout(() => window.location.assign(destination), 120)
  }

  const title = isListing
    ? isSignup
      ? 'ลงทะเบียน เพื่อลงประกาศ'
      : 'เข้าสู่ระบบเพื่อลงประกาศต่อ'
    : isSignup
      ? 'สร้างบัญชี MapxProp'
      : 'เข้าสู่ระบบ MapxProp'
  const submitLabel = isListing
    ? isSignup
      ? 'สมัครและลงประกาศต่อ'
      : 'เข้าสู่ระบบและทำต่อ'
    : isSignup
      ? 'สร้างบัญชี'
      : 'เข้าสู่ระบบ'

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-[100]">
      <DialogBackdrop transition className="fixed inset-0 bg-neutral-950/35 backdrop-blur-[2px] transition duration-200 data-closed:opacity-0" />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel transition className="relative w-full max-w-md rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.24)] transition duration-200 sm:p-7 dark:border-neutral-700 dark:bg-neutral-900 data-closed:translate-y-3 data-closed:scale-[0.98] data-closed:opacity-0">
            <button type="button" onClick={handleClose} disabled={submitting || Boolean(socialSubmitting)} aria-label="ปิด" className="absolute end-4 top-4 grid size-9 place-items-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300">
              <XMarkIcon className="size-5" />
            </button>

            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e8f3ee] text-[#12634b] dark:bg-emerald-950/50 dark:text-emerald-300">
              <UserPlusIcon className="size-6" aria-hidden="true" />
            </div>
            <DialogTitle className="mt-5 px-8 text-center font-sarabun text-xl font-semibold text-neutral-900 dark:text-neutral-50">{title}</DialogTitle>

            <div className="mt-7 grid gap-2">
              <a href={socialAuthUrl('google')} onClick={(event) => handleSocialAuth(event, 'google')} aria-busy={socialSubmitting === 'google'} aria-disabled={Boolean(socialSubmitting)} className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-3 font-sarabun text-sm font-medium transition duration-150 active:scale-[0.985] ${socialSubmitting === 'google' ? 'border-[#9bcabb] bg-[#e8f4ef] text-[#176b50]' : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#b8d9cd] hover:bg-[#f1f8f5] hover:text-[#176b50] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200'} ${socialSubmitting && socialSubmitting !== 'google' ? 'pointer-events-none opacity-50' : ''}`}>
                {socialSubmitting === 'google' ? <LoadingSpinner /> : <GoogleIcon className="size-5 shrink-0" />}
                {socialSubmitting === 'google' ? 'กำลังเชื่อมต่อ Google…' : isSignup ? 'ลงทะเบียนด้วย Google' : 'เข้าสู่ระบบด้วย Google'}
              </a>
              <a href={socialAuthUrl('line')} onClick={(event) => handleSocialAuth(event, 'line')} aria-busy={socialSubmitting === 'line'} aria-disabled={Boolean(socialSubmitting)} className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-3 font-sarabun text-sm font-medium transition duration-150 active:scale-[0.985] ${socialSubmitting === 'line' ? 'border-[#9bcabb] bg-[#e8f4ef] text-[#176b50]' : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#b8d9cd] hover:bg-[#f1f8f5] hover:text-[#176b50] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200'} ${socialSubmitting && socialSubmitting !== 'line' ? 'pointer-events-none opacity-50' : ''}`}>
                {socialSubmitting === 'line' ? <LoadingSpinner /> : <LineIcon className="size-5 shrink-0" />}
                {socialSubmitting === 'line' ? 'กำลังเชื่อมต่อ LINE…' : isSignup ? 'ลงทะเบียนด้วย LINE' : 'เข้าสู่ระบบด้วย LINE'}
              </a>
            </div>

            <div className="relative my-3 text-center">
              <span className="relative z-10 bg-white px-3 font-sarabun text-xs text-neutral-400 dark:bg-neutral-900">หรือใช้อีเมล</span>
              <span className="absolute inset-x-0 top-1/2 border-t border-neutral-100 dark:border-neutral-800" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="block">
                  <span className="font-sarabun text-sm font-medium text-neutral-700 dark:text-neutral-200">อีเมล</span>
                  <input type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="mt-1.5 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-base text-neutral-900 transition outline-none placeholder:text-neutral-400 focus:border-[#147458] focus:ring-4 focus:ring-[#dceee7] sm:text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/70" />
                </label>

                <label className="block">
                  <span className="font-sarabun text-sm font-medium text-neutral-700 dark:text-neutral-200">รหัสผ่าน</span>
                  <span className="relative mt-1.5 block">
                    <input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isSignup ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? 'อย่างน้อย 8 ตัวอักษร' : 'กรอกรหัสผ่าน'} className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 pe-12 text-base text-neutral-900 transition outline-none placeholder:text-neutral-400 focus:border-[#147458] focus:ring-4 focus:ring-[#dceee7] sm:text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/70" />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={showPassword} className="absolute inset-y-0 end-1.5 grid w-10 place-items-center rounded-xl text-neutral-400 transition hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-400 dark:text-neutral-500 dark:hover:text-neutral-300">
                      {showPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                    </button>
                  </span>
                  {isSignup ? (
                    <span className="mt-2 flex flex-wrap gap-1.5" aria-label="เงื่อนไขรหัสผ่าน">
                      {passwordRules.map((rule) => (
                        <span key={rule.label} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] font-medium transition-colors ${rule.passed ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                          {rule.passed ? <CheckIcon className="size-3 stroke-[2.5]" /> : null}{rule.label}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </label>

                {mode === 'login' ? <a href="/forgot-password" className="block text-right font-sarabun text-xs text-neutral-500 hover:underline">ลืมรหัสผ่าน?</a> : null}
                {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 font-sarabun text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
              </div>

              <button type="submit" disabled={submitting} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#176b50] px-5 font-sarabun text-sm font-semibold text-white shadow-[0_8px_20px_rgba(23,107,80,0.18)] transition-colors hover:bg-[#125b44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9c87] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65">
                {submitting ? 'กำลังดำเนินการ...' : submitLabel}{!submitting ? <ArrowRightIcon className="size-4" /> : null}
              </button>
            </form>

            <p className="mt-4 text-center font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
              {isSignup ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}{' '}
              <button type="button" onClick={() => selectMode(isSignup ? 'login' : 'signup')} disabled={submitting} className="font-semibold text-neutral-800 underline-offset-4 hover:underline disabled:opacity-50 dark:text-neutral-100">
                {isSignup ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            </p>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

const isStrongPassword = (password: string) => password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)

const LoadingSpinner = () => <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.25c1.9-1.75 2.97-4.33 2.97-7.43z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.34l-3.25-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.05v2.59A10 10 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.41 13.98A6 6 0 0 1 6.09 12c0-.69.12-1.35.32-1.98V7.43H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.57l3.36-2.59z" />
    <path fill="#EA4335" d="M12 5.89c1.47 0 2.8.51 3.84 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.43l3.36 2.59C7.2 7.65 9.4 5.89 12 5.89z" />
  </svg>
)

const LineIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#06C755" d="M12 3C6.48 3 2 6.7 2 11.26c0 4.09 3.63 7.52 8.53 8.15.33.07.78.22.9.51.1.27.06.68.03.95l-.14.88c-.04.27-.22 1.05.87.57 1.09-.47 5.88-3.45 8.02-5.9A7.45 7.45 0 0 0 22 11.26C22 6.7 17.52 3 12 3z" />
    <path fill="#fff" d="M7.03 9.33h1.02v3.12h1.69v.86H7.03V9.33zm3.24 0h1.02v3.98h-1.02V9.33zm1.77 0h.98l1.59 2.15V9.33h1v3.98h-.94l-1.63-2.23v2.23h-1V9.33zm4.22 0h2.75v.86h-1.73v.67h1.55v.83h-1.55v.76h1.77v.86h-2.79V9.33z" />
  </svg>
)
