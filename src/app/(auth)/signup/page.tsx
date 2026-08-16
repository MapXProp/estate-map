'use client'

import { getAuthApiUrl, setStoredAuth } from '@/lib/auth'
import { syncListingDraftAfterAuth } from '@/lib/listingDraft'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Logo from '@/shared/Logo'
import T from '@/utils/getT'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX } from 'react'

const socials: {
  labelKey: 'Continue with Google' | 'Continue with Facebook' | 'Continue with LINE'
  href: string
  provider?: 'google' | 'facebook' | 'line'
  disabled?: boolean
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
}[] = [
  {
    labelKey: 'Continue with Google',
    href: '#',
    provider: 'google',
    icon: (props) => (
      <svg viewBox="0 0 24 24" {...props}>
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.25c1.9-1.75 2.97-4.33 2.97-7.43z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.98-.9 6.63-2.34l-3.25-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.05v2.59A10 10 0 0 0 12 22z"
        />
        <path
          fill="#FBBC05"
          d="M6.41 13.98A6 6 0 0 1 6.09 12c0-.69.12-1.35.32-1.98V7.43H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.57l3.36-2.59z"
        />
        <path
          fill="#EA4335"
          d="M12 5.89c1.47 0 2.8.51 3.84 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.43l3.36 2.59C7.2 7.65 9.4 5.89 12 5.89z"
        />
      </svg>
    ),
  },
  {
    labelKey: 'Continue with Facebook',
    href: '#',
    provider: 'facebook',
    disabled: true,
    icon: (props) => (
      <svg viewBox="0 0 24 24" {...props}>
        <path
          fill="#1877F2"
          fillRule="evenodd"
          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    labelKey: 'Continue with LINE',
    href: '#',
    provider: 'line',
    icon: (props) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path
          fill="#06C755"
          d="M12 3C6.48 3 2 6.7 2 11.26c0 4.09 3.63 7.52 8.53 8.15.33.07.78.22.9.51.1.27.06.68.03.95l-.14.88c-.04.27-.22 1.05.87.57 1.09-.47 5.88-3.45 8.02-5.9A7.45 7.45 0 0 0 22 11.26C22 6.7 17.52 3 12 3z"
        />
        <path
          fill="#fff"
          d="M7.03 9.33h1.02v3.12h1.69v.86H7.03V9.33zm3.24 0h1.02v3.98h-1.02V9.33zm1.77 0h.98l1.59 2.15V9.33h1v3.98h-.94l-1.63-2.23v2.23h-1V9.33zm4.22 0h2.75v.86h-1.73v.67h1.55v.83h-1.55v.76h1.77v.86h-2.79V9.33z"
        />
      </svg>
    ),
  },
]

type SignupResponse = {
  token?: string
  access_token?: string
  public_user_id?: string
  name?: string
  surname?: string
  email?: string
  error?: string
}

const Page = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [redirectPath, setRedirectPath] = useState('')

  useEffect(() => {
    const nextRedirect = new URLSearchParams(window.location.search).get('redirect') || ''
    setRedirectPath(nextRedirect.startsWith('/') && !nextRedirect.startsWith('//') ? nextRedirect : '')
  }, [])

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass)
    const hasLower = /[a-z]/.test(pass)
    const hasNumber = /[0-9]/.test(pass)
    const hasSpecial = /[^A-Za-z0-9]/.test(pass)
    return pass.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail.includes('@')) {
      setError('รูปแบบ Email ไม่ถูกต้อง')
      return
    }

    if (!validatePassword(password)) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร รวมถึงตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(getAuthApiUrl('userRegister'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      })

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const data = (isJson ? await response.json() : null) as SignupResponse | null

      if (!response.ok) {
        throw new Error(data?.error || `Signup failed (${response.status})`)
      }

      setStoredAuth({ ...data, email: data?.email || trimmedEmail })
      await syncListingDraftAfterAuth().catch(() => undefined)
      router.push(redirectPath || '/account?login=success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถสร้างบัญชีได้')
    } finally {
      setIsLoading(false)
    }
  }

  const getSocialHref = (item: (typeof socials)[number]) => {
    if (item.provider !== 'google' && item.provider !== 'facebook' && item.provider !== 'line') {
      return item.href
    }

    const url = new URL(getAuthApiUrl(`auth/${item.provider}/start`))
    if (redirectPath) url.searchParams.set('redirect', redirectPath)
    return url.toString()
  }

  return (
    <div className="container">
      <div className="mt-16 mb-10 flex justify-center">
        <Logo className="w-32" />
      </div>

      <div className="mx-auto max-w-lg space-y-7">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {T['login']['Create an account']}
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
            {T['login']['Sign up to start using MapxProp']}
          </p>
        </div>

        <div className="grid gap-3.5">
          {socials
            .filter((item) => !item.disabled)
            .map((item, index) => (
              <Link
                key={index}
                href={getSocialHref(item)}
                className="flex h-12 w-full items-center rounded-lg bg-primary-50 px-5 transition-transform hover:translate-y-0.5 dark:bg-neutral-800"
              >
                <item.icon className="size-5.5 shrink-0" />
                <p className="grow text-center text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
                  {T['login'][item.labelKey]}
                </p>
              </Link>
            ))}
        </div>

        <div className="relative text-center">
          <span className="relative z-10 inline-block bg-white px-4 text-sm font-medium dark:bg-neutral-900 dark:text-neutral-400">
            {T['login']['OR']}
          </span>
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 transform border border-neutral-100 dark:border-neutral-800"></div>
        </div>

        <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
          <Field className="block">
            <Label className="text-neutral-800 dark:text-neutral-200">{T['login']['Email address']}</Label>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="example@example.com"
              className="mt-1.5"
              sizeClass="h-12 px-5 py-3"
              fontClass="text-base font-normal sm:text-[15px]"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field className="block">
            <Label className="flex items-center justify-between text-neutral-800 dark:text-neutral-200">
              {T['login']['Password']}
            </Label>
            <Input
              type="password"
              name="password"
              autoComplete="new-password"
              className="mt-1.5"
              sizeClass="h-12 px-5 py-3"
              fontClass="text-base font-normal sm:text-[15px]"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <ButtonPrimary type="submit" disabled={isLoading} className="h-12 text-base font-semibold">
            {isLoading ? 'Processing...' : T['login']['Create an account']}
          </ButtonPrimary>
        </form>

        <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
          {T['login']['Already have an account?']} {` `}
          <Link
            href={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'}
            className="font-medium underline"
          >
            {T['login']['Sign in']}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Page
