'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getAuthApiUrl, setStoredAuth } from '@/lib/auth'
import {
  isStrongPassword,
  passwordRequirements,
  safeAuthRedirect,
  type AuthMode,
  type AuthPurpose,
} from '@/lib/authForm'
import { withAuthNotice } from '@/lib/authNotice'
import { syncListingDraftAfterAuth } from '@/lib/listingDraft'
import { DialogTitle } from '@headlessui/react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Heart, Mail, Plus, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import styles from './AuthCard.module.css'
import AuthLoadingSpinner from './AuthLoadingSpinner'
import { GoogleIcon, LineIcon } from './AuthProviderIcons'

type Props = {
  initialMode: AuthMode
  initialEmailStep?: boolean
  purpose?: AuthPurpose
  redirectPath?: string
  titleId?: string
  headingLevel?: 1 | 2
  dialogTitle?: boolean
  initialError?: string
  notice?: string
  onClose?: () => void
  onBusyChange?: (busy: boolean) => void
  onAuthenticated: (mode: AuthMode) => void | Promise<void>
  onModeChange?: (mode: AuthMode) => void
}

export default function AuthCard({
  initialMode,
  initialEmailStep = false,
  purpose = 'default',
  redirectPath,
  titleId,
  headingLevel = 2,
  dialogTitle = false,
  initialError = '',
  notice,
  onClose,
  onBusyChange,
  onAuthenticated,
  onModeChange,
}: Props) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const [mode, setMode] = useState(initialMode)
  const [emailStep, setEmailStep] = useState(initialEmailStep)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(initialError)
  const [invalidField, setInvalidField] = useState<'email' | 'password' | null>(null)
  const [busy, setBusy] = useState<'email' | 'google' | 'line' | null>(null)
  const pending = useRef(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const emailChoiceRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const signup = mode === 'signup'
  const listing = purpose === 'listing'
  const Heading = dialogTitle ? DialogTitle : headingLevel === 1 ? 'h1' : 'h2'
  const requirements = passwordRequirements(password)
  const say = (thai: string, english: string) => (th ? thai : english)

  useEffect(() => {
    setError(initialError)
  }, [initialError])
  useEffect(() => {
    onBusyChange?.(Boolean(busy))
  }, [busy, onBusyChange])
  useEffect(() => {
    const reset = () => {
      pending.current = false
      setBusy(null)
    }
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  const selectMode = () => {
    if (pending.current) return
    const next = signup ? 'login' : 'signup'
    if (onModeChange) {
      onModeChange(next)
      return
    }
    setMode(next)
    setPassword('')
    setShowPassword(false)
    setError('')
    setInvalidField(null)
  }

  const chooseEmail = () => {
    setEmailStep(true)
    setError('')
    // Move focus without opening the mobile keyboard before the user chooses a field.
    requestAnimationFrame(() => backRef.current?.focus({ preventScroll: true }))
  }
  const chooseAnother = () => {
    setEmailStep(false)
    setPassword('')
    setShowPassword(false)
    setError('')
    setInvalidField(null)
    requestAnimationFrame(() => emailChoiceRef.current?.focus({ preventScroll: true }))
  }
  const destination = () =>
    safeAuthRedirect(
      redirectPath,
      typeof window === 'undefined'
        ? '/'
        : `${window.location.pathname}${window.location.search}${window.location.hash}`
    )
  const socialUrl = (provider: 'google' | 'line') => {
    const url = new URL(getAuthApiUrl(`auth/${provider}/start`))
    url.searchParams.set('redirect', withAuthNotice(destination(), mode))
    return url.toString()
  }
  const socialAuth = (event: React.MouseEvent<HTMLAnchorElement>, provider: 'google' | 'line') => {
    if (pending.current) {
      event.preventDefault()
      return
    }
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    pending.current = true
    setError('')
    setBusy(provider)
    const href = event.currentTarget.href
    window.setTimeout(() => window.location.assign(href), 120)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current) return
    setError('')
    setInvalidField(null)
    // Read actual input values so browser/password-manager autofill is submitted too.
    const values = new FormData(event.currentTarget)
    const submittedEmail = String(values.get('email') || '')
      .trim()
      .toLowerCase()
    const submittedPassword = String(values.get('password') || '')
    setEmail(submittedEmail)
    setPassword(submittedPassword)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submittedEmail)) {
      setInvalidField('email')
      setError(say('กรุณากรอกอีเมลให้ถูกต้อง', 'Enter a valid email address.'))
      emailRef.current?.focus()
      return
    }
    if (!submittedPassword || (signup && !isStrongPassword(submittedPassword))) {
      setInvalidField('password')
      setError(
        signup
          ? say('เพิ่มรหัสผ่านให้ครบตามคำแนะนำด้านล่าง', 'Complete the password requirements below.')
          : say('กรุณากรอกรหัสผ่าน', 'Enter your password.')
      )
      passwordRef.current?.focus()
      return
    }
    pending.current = true
    setBusy('email')
    try {
      const response = await fetch(getAuthApiUrl(signup ? 'userRegister' : 'userLogin'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: submittedEmail, password: submittedPassword }),
      })
      const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null
      if (!response.ok) {
        if (signup && response.status === 409) {
          setInvalidField('email')
          throw new Error(
            say(
              'อีเมลนี้มีบัญชีแล้ว เลือก “เข้าสู่ระบบ” ด้านล่างได้เลย',
              'This email already has an account. Choose “Sign in” below.'
            )
          )
        }
        throw new Error(
          data?.error ||
            (signup
              ? say('ยังสมัครไม่ได้ กรุณาลองอีกครั้ง', 'Unable to create your account. Please try again.')
              : say('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'Incorrect email or password.'))
        )
      }
      setStoredAuth({ ...data, email: data?.email || submittedEmail })
      await syncListingDraftAfterAuth().catch(() => undefined)
      await onAuthenticated(mode)
    } catch (failure) {
      setError(
        failure instanceof TypeError
          ? say(
              'เชื่อมต่อไม่สำเร็จ ลองอีกครั้งได้เลย ข้อมูลยังอยู่ครบ',
              'Connection failed. Your entries are still here — please try again.'
            )
          : failure instanceof Error
            ? failure.message
            : say('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง', 'Something went wrong. Please try again.')
      )
    } finally {
      pending.current = false
      setBusy(null)
    }
  }

  const title = signup ? say('สมัครสมาชิกฟรี', 'Create your free account') : say('ยินดีต้อนรับกลับมา', 'Welcome back')
  const description = listing
    ? say('เข้าสู่บัญชี แล้วลงประกาศของคุณต่อได้เลย', 'Access your account to continue your listing.')
    : signup
      ? say('เก็บประกาศที่ชอบ และจัดการประกาศของคุณ', 'Save your favorites and manage your listings.')
      : say('เข้าสู่ระบบ แล้วไปต่อจากที่คุณสนใจ', 'Sign in and pick up where you left off.')

  return (
    <div
      className={styles.card}
      data-email-step={emailStep || undefined}
      data-locale={locale}
      data-listing={listing || undefined}
    >
      <div className={styles.hero} aria-hidden="true">
        <div className={styles.heroCopy}>
          <span className={styles.brand}>MapxProp</span>
          <span className={styles.heroHeadline}>
            {emailStep ? (
              say('พื้นที่ดี ๆ เริ่มที่คุณ', 'Your space.')
            ) : (
              <>
                {listing ? say('ให้คนที่ใช่', 'Share a space.') : say('พื้นที่ดี ๆ', 'Find a place.')}
                <br />
                {listing ? say('ค้นพบพื้นที่ของคุณ', 'Find its people.') : say('เริ่มที่คุณ', 'Share a space.')}
              </>
            )}
          </span>
          <span className={styles.heroNote}>{say('บ้าน · ห้องเช่า · พื้นที่ธุรกิจ', 'Homes · Rooms · Business')}</span>
        </div>
        <Image
          src="/images/listing-cta/neighborhood.webp"
          width={360}
          height={270}
          sizes="220px"
          alt=""
          className={styles.art}
        />
        <span className={styles.heart}>
          <Heart size={16} fill="currentColor" />
        </span>
      </div>
      {onClose ? (
        <button
          type="button"
          className={styles.close}
          disabled={Boolean(busy)}
          onClick={onClose}
          aria-label={say('ปิด', 'Close')}
        >
          <X size={20} />
        </button>
      ) : null}

      <div className={styles.body}>
        {emailStep ? (
          <button ref={backRef} className={styles.back} type="button" disabled={Boolean(busy)} onClick={chooseAnother}>
            <ArrowLeft size={16} />
            {say('เลือกวิธีอื่น', 'Other sign-in options')}
          </button>
        ) : null}
        <Heading id={titleId} className={styles.title}>
          {emailStep
            ? signup
              ? say('สมัครด้วยอีเมล', 'Sign up with email')
              : say('เข้าสู่ระบบด้วยอีเมล', 'Sign in with email')
            : title}
        </Heading>
        <p className={styles.description}>
          {emailStep
            ? signup
              ? say('กรอกเพียงอีเมลและตั้งรหัสผ่านของคุณ', 'Enter your email and create a password.')
              : say('ใช้บัญชีเดิมของคุณเพื่อไปต่อ', 'Use your existing account to continue.')
            : description}
        </p>
        {notice ? (
          <p role="status" className={styles.notice}>
            {notice}
          </p>
        ) : null}

        {signup && (
          <p className="mt-4 text-xs/6 text-neutral-500 dark:text-neutral-400" data-signup-legal>
            {say('การสร้างบัญชีแสดงว่าคุณยอมรับ', 'By creating an account, you accept our ')}{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#176b50] underline underline-offset-4 dark:text-emerald-300"
            >
              {say('เงื่อนไขใช้งาน', 'Terms')}
            </a>{' '}
            {say('และรับทราบ', 'and acknowledge our ')}{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#176b50] underline underline-offset-4 dark:text-emerald-300"
            >
              {say('นโยบายความเป็นส่วนตัว', 'Privacy Policy')}
            </a>
          </p>
        )}

        {!emailStep ? (
          <>
            <div className={styles.methods}>
              {(['google', 'line'] as const).map((provider) => (
                <a
                  key={provider}
                  href={socialUrl(provider)}
                  onClick={(event) => socialAuth(event, provider)}
                  className={`${styles.method} ${provider === 'line' ? styles.line : ''}`}
                  aria-disabled={Boolean(busy)}
                  aria-busy={busy === provider}
                >
                  <span className={styles.providerIcon}>
                    {busy === provider ? (
                      <AuthLoadingSpinner />
                    ) : provider === 'google' ? (
                      <GoogleIcon className="size-6" />
                    ) : (
                      <LineIcon className="size-7" />
                    )}
                  </span>
                  <span>
                    {busy === provider
                      ? say('กำลังเชื่อมต่อ', 'Connecting to')
                      : signup
                        ? say('สมัครด้วย', 'Continue with')
                        : say('เข้าสู่ระบบด้วย', 'Sign in with')}{' '}
                    {provider === 'google' ? 'Google' : 'LINE'}
                    {busy === provider ? '…' : ''}
                  </span>
                  <ArrowRight size={16} className={styles.methodArrow} />
                </a>
              ))}
            </div>
            <div className={styles.divider}>
              <span>{say('หรือ', 'or')}</span>
            </div>
            <button
              ref={emailChoiceRef}
              className={`${styles.method} ${styles.emailMethod}`}
              disabled={Boolean(busy)}
              type="button"
              onClick={chooseEmail}
            >
              <span className={styles.providerIcon}>
                <Mail size={20} />
              </span>
              <span>
                {signup
                  ? say('สมัครด้วยอีเมล', 'Sign up with email')
                  : say('เข้าสู่ระบบด้วยอีเมล', 'Sign in with email')}
              </span>
              <ArrowRight size={16} className={styles.methodArrow} />
            </button>
            <div className={styles.benefits}>
              <span>
                <Heart size={14} />
                {say('เก็บรายการโปรด', 'Save favorites')}
              </span>
              <span>
                <Plus size={14} />
                {say('ลงประกาศฟรี', 'Post a free listing')}
              </span>
            </div>
            {error ? (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            ) : null}
          </>
        ) : (
          <form method="post" onSubmit={submit} noValidate className={styles.form}>
            <div className={styles.field}>
              <label htmlFor={`${id}-email`}>{say('อีเมล', 'Email')}</label>
              <input
                ref={emailRef}
                id={`${id}-email`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                readOnly={Boolean(busy)}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (invalidField === 'email') {
                    setInvalidField(null)
                    setError('')
                  }
                }}
                placeholder="name@example.com"
                aria-invalid={invalidField === 'email' || undefined}
                aria-describedby={invalidField === 'email' ? `${id}-error` : undefined}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor={`${id}-password`}>{say('รหัสผ่าน', 'Password')}</label>
                {!signup ? <a href="/forgot-password">{say('ลืมรหัสผ่าน?', 'Forgot password?')}</a> : null}
              </div>
              <div className={styles.passwordInput}>
                <input
                  ref={passwordRef}
                  id={`${id}-password`}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  required
                  readOnly={Boolean(busy)}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (invalidField === 'password') {
                      setInvalidField(null)
                      setError('')
                    }
                  }}
                  placeholder={
                    signup ? say('ตั้งรหัสผ่านของคุณ', 'Create a password') : say('กรอกรหัสผ่าน', 'Enter your password')
                  }
                  aria-invalid={invalidField === 'password' || undefined}
                  aria-describedby={
                    [signup ? `${id}-requirements` : '', invalidField === 'password' ? `${id}-error` : '']
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? say('ซ่อนรหัสผ่าน', 'Hide password') : say('แสดงรหัสผ่าน', 'Show password')
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {signup ? (
                <ul
                  id={`${id}-requirements`}
                  className={styles.requirements}
                  aria-label={say('เงื่อนไขรหัสผ่าน', 'Password requirements')}
                >
                  {[
                    { passed: requirements.length, text: say('อย่างน้อย 8 ตัวอักษร', 'At least 8 characters') },
                    {
                      passed: requirements.letters,
                      text: say('มีตัวพิมพ์ใหญ่ A–Z และพิมพ์เล็ก a–z', 'Uppercase A–Z and lowercase a–z'),
                    },
                    {
                      passed: requirements.numberAndSymbol,
                      text: say('มีตัวเลขและสัญลักษณ์ เช่น 1 @', 'A number and a symbol, e.g. 1 @'),
                    },
                  ].map((rule) => (
                    <li key={rule.text} data-passed={rule.passed}>
                      {rule.passed ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <span className={styles.requirementDot} aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {rule.passed ? say('ครบแล้ว: ', 'Met: ') : say('ต้องมี: ', 'Required: ')}
                      </span>
                      {rule.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {error ? (
              <p id={`${id}-error`} role="alert" className={styles.error}>
                {error}
              </p>
            ) : null}
            <button className={styles.submit} type="submit" disabled={Boolean(busy)} aria-busy={busy === 'email'}>
              {busy ? <AuthLoadingSpinner /> : null}
              {busy
                ? signup
                  ? say('กำลังสร้างบัญชี…', 'Creating account…')
                  : say('กำลังเข้าสู่ระบบ…', 'Signing in…')
                : listing
                  ? signup
                    ? say('สมัครและลงประกาศต่อ', 'Create account and continue')
                    : say('เข้าสู่ระบบและทำต่อ', 'Sign in and continue')
                  : signup
                    ? say('สร้างบัญชีฟรี', 'Create free account')
                    : say('เข้าสู่ระบบ', 'Sign in')}
              {!busy ? <ArrowRight size={17} /> : null}
            </button>
          </form>
        )}

        <div className={styles.switchMode}>
          <span>
            {signup ? say('มีบัญชีอยู่แล้ว?', 'Already have an account?') : say('ยังไม่มีบัญชี?', 'New to MapxProp?')}
          </span>
          <button type="button" onClick={selectMode} disabled={Boolean(busy)}>
            {signup ? say('เข้าสู่ระบบ', 'Sign in') : say('สมัครสมาชิกฟรี', 'Create an account')}
          </button>
        </div>
      </div>
    </div>
  )
}
