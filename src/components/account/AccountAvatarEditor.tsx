'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { fetchWithAuthRetry, getAuthApiUrl, getStoredUser, setStoredUser, type AuthUser } from '@/lib/auth'
import { Camera, Check, LoaderCircle, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import AccountAvatar from './AccountAvatar'

// Use a small, metadata-free square image for upload and preview the exact crop.
async function preparePhoto(file: File) {
  const source = URL.createObjectURL(file)
  try {
    const image = new window.Image()
    image.src = source
    await image.decode()
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    if (!side) throw new Error('invalid image')
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(side, 512)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('cannot prepare image')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(
      image,
      (image.naturalWidth - side) / 2,
      (image.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height
    )
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('invalid image'))), 'image/jpeg', 0.9)
    )
    return new File([blob], 'profile.jpg', { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(source)
  }
}

export default function AccountAvatarEditor({ user }: { user: AuthUser }) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const input = useRef<HTMLInputElement>(null)
  const pending = useRef(false)
  const mounted = useRef(true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const active = () => mounted.current && getStoredUser()?.public_user_id === user.public_user_id
  const save = async (remove = false) => {
    if (pending.current || (!remove && !file)) return
    pending.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const body = new FormData()
      if (file) body.set('file', file)
      const response = await fetchWithAuthRetry(getAuthApiUrl('me/avatar'), {
        method: remove ? 'DELETE' : 'PUT',
        credentials: 'include',
        ...(remove ? {} : { body }),
      })
      const data = (await response.json()) as { user?: AuthUser }
      if (!response.ok || !data.user) throw new Error('save failed')
      if (!active()) return
      setStoredUser(data.user)
      setFile(null)
      setMessage(th ? (remove ? 'ลบรูปแล้ว' : 'บันทึกรูปแล้ว') : remove ? 'Photo removed' : 'Photo saved')
    } catch {
      if (active()) setError(th ? 'ยังบันทึกรูปไม่ได้ ลองอีกครั้งได้ครับ' : 'Could not save your photo. Please retry.')
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }
  return (
    <div className="flex w-full flex-wrap items-center gap-4" data-account-avatar-editor>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        aria-label={th ? 'เปลี่ยนรูปโปรไฟล์' : 'Change profile photo'}
        className="relative shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-4"
      >
        {preview ? (
          <Image
            src={preview}
            alt={th ? 'ตัวอย่างรูปโปรไฟล์' : 'Profile photo preview'}
            width={72}
            height={72}
            unoptimized
            className="size-[72px] rounded-full border-4 border-white object-cover"
          />
        ) : (
          <AccountAvatar
            src={user.avatar_url}
            name={user.name}
            className="size-[72px] border-4 border-white bg-[#dcecdf] text-2xl font-semibold text-[#245a3e]"
          />
        )}
        <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-white bg-[#176b50] text-white">
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Camera size={14} />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <h2 id="account-title">
          {[user.name, user.surname].filter(Boolean).join(' ') || (th ? 'สมาชิก MapxProp' : 'MapxProp member')}
        </h2>
        <p>{user.email}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4">
          {file ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#176b50] dark:text-emerald-300"
              >
                <Check size={16} />
                {th ? 'บันทึกรูป' : 'Save photo'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setFile(null)}
                className="inline-flex min-h-11 items-center gap-1 text-sm text-neutral-500"
              >
                <X size={16} />
                {th ? 'ยกเลิก' : 'Cancel'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => input.current?.click()}
                className="min-h-11 text-sm font-medium text-[#176b50] dark:text-emerald-300"
              >
                {th ? (user.avatar_url ? 'เปลี่ยนรูป' : 'เพิ่มรูปโปรไฟล์') : 'Change photo'}
              </button>
              {user.avatar_url && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save(true)}
                  className="min-h-11 text-sm text-neutral-500"
                >
                  {th ? 'ลบรูป' : 'Remove'}
                </button>
              )}
            </>
          )}
        </div>
        {file && (
          <p className="text-xs">
            {th
              ? 'รูปนี้จะแสดงในบัญชีและประกาศที่ใช้ข้อมูลติดต่อของคุณ'
              : 'Shown on your account and listings using your contact details.'}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {error && (
          <p role="alert" className="text-red-600!">
            {error}
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label={th ? 'เลือกรูปโปรไฟล์' : 'Choose profile photo'}
        onChange={async (event) => {
          const selected = event.target.files?.[0]
          event.target.value = ''
          if (!selected || pending.current) return
          setError('')
          setMessage('')
          if (
            !['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) ||
            selected.size > 5 * 1024 * 1024 ||
            selected.size === 0
          ) {
            setError(
              th ? 'เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB' : 'Choose a JPG, PNG or WebP image up to 5 MB.'
            )
            return
          }
          pending.current = true
          setBusy(true)
          try {
            const photo = await preparePhoto(selected)
            if (active()) setFile(photo)
          } catch {
            if (active())
              setError(th ? 'เปิดรูปนี้ไม่ได้ กรุณาเลือกรูปอื่น' : 'Cannot open this image. Please choose another.')
          } finally {
            pending.current = false
            if (mounted.current) setBusy(false)
          }
        }}
      />
    </div>
  )
}
