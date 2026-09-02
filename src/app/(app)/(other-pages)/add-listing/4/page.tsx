'use client'

import {
  initialListingMediaProgress,
  initialListingPendingMedia,
  useListingFlowProgress,
  type ListingPendingMedia,
} from '@/components/add-listing/ListingFlowProgressContext'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { saveListingContactProfile } from '@/lib/listingContactProfile'
import {
  clearCloudListingDraft,
  clearListingDraft,
  getListingDraft,
  LISTING_SUBMISSION_RESULT_KEY,
  ListingMediaUploadError,
  loadMyListingForEdit,
  publishListingDraft,
  saveListingDraftToCloud,
  saveListingStep,
  uploadListingMedia,
  type ListingDraft,
  type ListingDraftValue,
  type ListingMediaType,
} from '@/lib/listingDraft'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MAX_PHOTOS = 10
const MAX_VIDEOS = 4
const MAX_PANORAMAS = 4

type SubmissionStage = 'preparing' | 'uploading' | 'saving' | 'success' | 'error'
type FailureStage = 'files' | 'upload' | 'save'

type SubmissionResult = {
  publicListingId: string
  slug: string
  draft: ListingDraft
}

type SubmissionFailure = {
  stage: FailureStage
  message: string
  detail?: string
}

const Page = () => {
  const router = useRouter()
  const { locale } = usePreferences()
  const { pendingMedia, setPendingMedia, mediaProgress, setMediaProgress } = useListingFlowProgress()
  const isThai = locale === 'th'
  const [stage, setStage] = useState<SubmissionStage>('preparing')
  const [failure, setFailure] = useState<SubmissionFailure | null>(null)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [isOpeningEdit, setIsOpeningEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [sessionChecked, setSessionChecked] = useState(false)
  const processLockRef = useRef(false)
  const autoStartedRef = useRef(false)

  const persistMedia = useCallback(
    (photoUrls: string[], videoUrls: string[], panoramaUrls: string[], syncCloud = false) => {
      const formData = new FormData()
      replaceFormDataValues(formData, 'listingPhotoUrls[]', photoUrls)
      replaceFormDataValues(formData, 'listingVideoUrls[]', videoUrls)
      replaceFormDataValues(formData, 'listingPanoramaUrls[]', panoramaUrls)
      const savedDraft = saveListingStep(3, formData, { resumeStep: 4 })
      return syncCloud ? saveListingDraftToCloud(savedDraft).catch(() => null) : Promise.resolve(null)
    },
    []
  )

  const processSubmission = useCallback(async () => {
    if (processLockRef.current) return
    processLockRef.current = true
    setFailure(null)

    const startingDraft = getListingDraft()
    if (!Object.keys(startingDraft).length) {
      setFailure({
        stage: 'save',
        message: isThai ? 'ไม่พบข้อมูลประกาศที่กำลังส่ง' : 'The listing data could not be found.',
      })
      setStage('error')
      processLockRef.current = false
      return
    }

    let photoUrls = readValues(startingDraft['listingPhotoUrls[]'])
    let videoUrls = readValues(startingDraft['listingVideoUrls[]'])
    let panoramaUrls = readValues(startingDraft['listingPanoramaUrls[]'])
    const missingFileCount =
      Math.max(0, readCount(startingDraft.selectedPhotoCount) - photoUrls.length - pendingMedia.photos.length) +
      Math.max(0, readCount(startingDraft.selectedVideoCount) - videoUrls.length - pendingMedia.videos.length) +
      Math.max(0, readCount(startingDraft.selectedPanoramaCount) - panoramaUrls.length - pendingMedia.panoramas.length)

    if (missingFileCount > 0) {
      setFailure({
        stage: 'files',
        message: isThai
          ? 'ไฟล์ที่เลือกไว้ไม่อยู่ในหน้านี้แล้ว กรุณากลับไปเลือกเฉพาะไฟล์ที่ยังขาดอีกครั้ง'
          : 'Some selected files are no longer available. Return and select only the missing files again.',
      })
      setStage('error')
      setMediaProgress({ ...initialListingMediaProgress, phase: 'error' })
      processLockRef.current = false
      return
    }

    const totalCount = pendingMedia.photos.length + pendingMedia.videos.length + pendingMedia.panoramas.length
    let completedCount = 0
    let uploadedCount = photoUrls.length + videoUrls.length + panoramaUrls.length
    setStage(totalCount ? 'uploading' : 'saving')
    setMediaProgress({
      phase: totalCount ? 'uploading' : 'saving',
      pendingCount: totalCount,
      uploadedCount,
      completedCount,
      totalCount,
      currentFileName: '',
    })

    const uploadQueue = async (
      files: File[],
      mediaType: ListingMediaType,
      existingUrls: string[],
      limit: number,
      pendingKey: keyof ListingPendingMedia
    ) => {
      let urls = existingUrls
      for (const [index, file] of files.entries()) {
        const remaining = files.slice(index)
        setPendingMedia((current) => ({ ...current, [pendingKey]: remaining }))
        setMediaProgress({
          phase: 'uploading',
          pendingCount: totalCount - completedCount,
          uploadedCount,
          completedCount,
          totalCount,
          currentFileName: file.name,
        })

        const uploaded = await uploadListingMedia([file], mediaType)
        urls = [...new Set([...urls, ...uploaded])].slice(0, limit)
        completedCount += 1
        uploadedCount += uploaded.length
        setPendingMedia((current) => ({ ...current, [pendingKey]: files.slice(index + 1) }))

        if (mediaType === 'image') photoUrls = urls
        if (mediaType === 'video') videoUrls = urls
        if (mediaType === '360') panoramaUrls = urls
        await persistMedia(photoUrls, videoUrls, panoramaUrls)

        setMediaProgress({
          phase: 'uploading',
          pendingCount: totalCount - completedCount,
          uploadedCount,
          completedCount,
          totalCount,
          currentFileName: file.name,
        })
      }
      return urls
    }

    try {
      photoUrls = await uploadQueue(pendingMedia.photos, 'image', photoUrls, MAX_PHOTOS, 'photos')
      videoUrls = await uploadQueue(pendingMedia.videos, 'video', videoUrls, MAX_VIDEOS, 'videos')
      panoramaUrls = await uploadQueue(pendingMedia.panoramas, '360', panoramaUrls, MAX_PANORAMAS, 'panoramas')
    } catch (error) {
      await persistMedia(photoUrls, videoUrls, panoramaUrls, true)
      setFailure({
        stage: 'upload',
        message: getMediaUploadErrorMessage(error, isThai),
        detail: error instanceof Error ? error.message : undefined,
      })
      setStage('error')
      setMediaProgress((current) => ({ ...current, phase: 'error', currentFileName: '' }))
      processLockRef.current = false
      return
    }

    setPendingMedia(initialListingPendingMedia)
    setStage('saving')
    setMediaProgress({
      phase: 'saving',
      pendingCount: 0,
      uploadedCount,
      completedCount,
      totalCount,
      currentFileName: '',
    })

    try {
      const completedDraft = getListingDraft()
      await saveListingContactProfile(contactProfileFromDraft(completedDraft)).catch(() => undefined)
      await saveListingDraftToCloud(completedDraft).catch(() => undefined)
      const response = await publishListingDraft()
      const slug = response.slug || ''
      if (!slug) throw new Error('Listing was saved without a page address')

      const publicListingId = response.public_listing_id || ''
      if (!publicListingId) throw new Error('Listing was saved without a listing ID')

      const submissionResult: SubmissionResult = {
        publicListingId,
        slug,
        draft: getListingDraft(),
      }
      sessionStorage.setItem(LISTING_SUBMISSION_RESULT_KEY, JSON.stringify(submissionResult))
      await clearCloudListingDraft().catch(() => undefined)
      clearListingDraft()
      setMediaProgress(initialListingMediaProgress)
      setResult(submissionResult)
      setStage('success')
    } catch (error) {
      setFailure({
        stage: 'save',
        message: getListingSaveErrorMessage(error, isThai),
        detail: error instanceof Error ? error.message : undefined,
      })
      setStage('error')
      setMediaProgress((current) => ({ ...current, phase: 'error', currentFileName: '' }))
    } finally {
      processLockRef.current = false
    }
  }, [isThai, pendingMedia, persistMedia, setMediaProgress, setPendingMedia])

  useEffect(() => {
    const storedResult = readSubmissionResult()
    if (storedResult) {
      autoStartedRef.current = true
      setResult(storedResult)
      setStage('success')
    }
    setSessionChecked(true)
  }, [])

  useEffect(() => {
    if (!sessionChecked || result || autoStartedRef.current) return
    autoStartedRef.current = true
    void processSubmission()
  }, [processSubmission, result, sessionChecked])

  const progressPercent = useMemo(() => {
    if (stage === 'success') return 100
    if (stage === 'saving') return 88
    if (stage === 'uploading' && mediaProgress.totalCount > 0) {
      return Math.max(8, Math.round((mediaProgress.completedCount / mediaProgress.totalCount) * 78))
    }
    return stage === 'error' ? 0 : 6
  }, [mediaProgress.completedCount, mediaProgress.totalCount, stage])

  const handleEdit = async () => {
    if (!result || isOpeningEdit) return
    setIsOpeningEdit(true)
    setEditError('')
    try {
      // Reload the committed listing so media comes from listing_media instead
      // of the pre-publish browser snapshot.
      await loadMyListingForEdit(result.publicListingId)
      router.push('/add-listing/1')
    } catch {
      setEditError(
        isThai
          ? 'ยังโหลดข้อมูลสำหรับแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง'
          : 'The listing could not be loaded for editing. Please try again.'
      )
    } finally {
      setIsOpeningEdit(false)
    }
  }

  if (stage === 'success' && result) {
    const viewHref = `/real-estate-listings/${encodeURIComponent(result.slug)}`

    return (
      <StatusCard tone="success">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e9f8ed] text-[#37a14f] ring-8 ring-[#f4fcf6] dark:bg-[#173520] dark:ring-[#10271a]">
          <CheckCircleIcon className="size-10" />
        </span>
        <p className="mt-5 font-sarabun text-xs font-semibold tracking-[0.12em] text-[#27823d] uppercase">
          {isThai ? 'บันทึกสำเร็จ' : 'Saved successfully'}
        </p>
        <h1 className="mt-2 font-sarabun text-2xl font-semibold text-neutral-950 sm:text-3xl dark:text-white">
          {isThai ? 'ลงประกาศเรียบร้อยแล้ว' : 'Your listing is now live'}
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {isThai
            ? `ข้อมูลและไฟล์ทั้งหมดถูกบันทึกและเผยแพร่แล้ว · รหัสประกาศ ${result.publicListingId}`
            : `All information and media have been saved and published · Listing ID ${result.publicListingId}`}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <ButtonSecondary
            type="button"
            onClick={() => void handleEdit()}
            disabled={isOpeningEdit}
            className="h-12 justify-center"
          >
            {isOpeningEdit ? <ArrowPathIcon className="size-5 animate-spin" /> : <PencilSquareIcon className="size-5" />}
            {isThai ? 'แก้ไขประกาศ' : 'Edit listing'}
          </ButtonSecondary>
          <ButtonPrimary href={viewHref} className="h-12 justify-center">
            <EyeIcon className="size-5" />
            {isThai ? 'ดูหน้าประกาศ' : 'View listing'}
          </ButtonPrimary>
        </div>
        {editError ? <p className="mt-3 font-sarabun text-sm text-red-600">{editError}</p> : null}
      </StatusCard>
    )
  }

  if (stage === 'error' && failure) {
    const needsFiles = failure.stage === 'files'
    return (
      <StatusCard tone="error">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50 dark:bg-red-950/60 dark:ring-red-950/30">
          <ExclamationTriangleIcon className="size-9" />
        </span>
        <p className="mt-5 font-sarabun text-xs font-semibold tracking-[0.12em] text-red-600 uppercase">
          {isThai ? 'ยังลงประกาศไม่สำเร็จ' : 'Listing not completed'}
        </p>
        <h1 className="mt-2 font-sarabun text-2xl font-semibold text-neutral-950 dark:text-white">
          {needsFiles
            ? isThai
              ? 'กรุณาเลือกไฟล์ที่ขาดอีกครั้ง'
              : 'Select the missing files again'
            : isThai
              ? 'ข้อมูลของคุณยังอยู่ ลองต่อได้ทันที'
              : 'Your information is safe—try again'}
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {failure.message}
        </p>
        <p className="mx-auto mt-2 max-w-xl font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {isThai
            ? 'ไฟล์ที่อัปโหลดสำเร็จและข้อมูลที่กรอกไว้จะไม่ต้องเริ่มใหม่'
            : 'Uploaded files and completed information do not need to be entered again.'}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <ButtonSecondary type="button" onClick={() => router.push('/add-listing/3')} className="h-12 justify-center">
            <ArrowLeftIcon className="size-5" />
            {isThai ? 'กลับไปแก้ไข' : 'Back to edit'}
          </ButtonSecondary>
          {!needsFiles ? (
            <ButtonPrimary type="button" onClick={() => void processSubmission()} className="h-12 justify-center">
              <ArrowPathIcon className="size-5" />
              {isThai ? 'ลองอีกครั้ง' : 'Try again'}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary type="button" onClick={() => router.push('/add-listing/3')} className="h-12 justify-center">
              {isThai ? 'ไปเลือกไฟล์' : 'Select files'}
            </ButtonPrimary>
          )}
        </div>
        {failure.detail ? (
          <details className="mt-5 text-left font-sarabun text-xs text-neutral-400">
            <summary className="cursor-pointer">{isThai ? 'รายละเอียดสำหรับตรวจสอบ' : 'Technical details'}</summary>
            <p className="mt-2 break-words rounded-xl bg-neutral-100 px-3 py-2 dark:bg-neutral-800">{failure.detail}</p>
          </details>
        ) : null}
      </StatusCard>
    )
  }

  return (
    <StatusCard tone="processing">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-orange-50 text-orange-600 ring-8 ring-orange-50/60 dark:bg-orange-950/50 dark:ring-orange-950/25">
        <CloudArrowUpIcon className="size-9 animate-pulse" />
      </span>
      <p className="mt-5 font-sarabun text-xs font-semibold tracking-[0.12em] text-orange-600 uppercase">
        {isThai ? 'กำลังลงประกาศ' : 'Publishing listing'}
      </p>
      <h1 className="mt-2 font-sarabun text-2xl font-semibold text-neutral-950 sm:text-3xl dark:text-white">
        {stage === 'saving'
          ? isThai
            ? 'กำลังบันทึกข้อมูลประกาศ'
            : 'Saving your listing'
          : isThai
            ? 'กำลังอัปโหลดไฟล์'
            : 'Uploading your media'}
      </h1>
      <p className="mx-auto mt-3 max-w-xl font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        {isThai ? 'กรุณารอสักครู่และอย่าปิดหน้านี้' : 'Please wait and keep this page open.'}
      </p>

      <div className="mt-7 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-2 truncate font-sarabun text-xs text-neutral-400">
        {stage === 'uploading' && mediaProgress.totalCount
          ? isThai
            ? `อัปโหลดแล้ว ${mediaProgress.completedCount} จาก ${mediaProgress.totalCount} ไฟล์${mediaProgress.currentFileName ? ` · ${mediaProgress.currentFileName}` : ''}`
            : `Uploaded ${mediaProgress.completedCount} of ${mediaProgress.totalCount}${mediaProgress.currentFileName ? ` · ${mediaProgress.currentFileName}` : ''}`
          : isThai
            ? 'กำลังตรวจความครบถ้วนและบันทึกลงฐานข้อมูล'
            : 'Checking and saving the listing to the database'}
      </p>

      <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
        <ProcessStep
          icon={<CloudArrowUpIcon className="size-5" />}
          title={isThai ? 'อัปโหลดรูปและวิดีโอ' : 'Upload photos and videos'}
          complete={stage === 'saving'}
          active={stage === 'uploading' || stage === 'preparing'}
        />
        <ProcessStep
          icon={<DocumentCheckIcon className="size-5" />}
          title={isThai ? 'บันทึกข้อมูลประกาศ' : 'Save listing information'}
          complete={false}
          active={stage === 'saving'}
        />
      </div>
    </StatusCard>
  )
}

const StatusCard = ({
  tone,
  children,
}: {
  tone: 'processing' | 'success' | 'error'
  children: React.ReactNode
}) => (
  <section
    aria-live="polite"
    className={`mx-auto w-full max-w-2xl rounded-[30px] border px-5 py-9 text-center shadow-[0_28px_80px_-52px_rgba(15,23,42,0.38)] sm:px-9 sm:py-11 dark:bg-neutral-900 ${
      tone === 'success'
        ? 'border-[#bfe9c8] bg-[#fbfffc] dark:border-[#205e30]'
        : tone === 'error'
          ? 'border-red-200 bg-white dark:border-red-900/70'
          : 'border-orange-100 bg-white dark:border-orange-900/50'
    }`}
  >
    {children}
  </section>
)

const ProcessStep = ({
  icon,
  title,
  active,
  complete,
}: {
  icon: React.ReactNode
  title: string
  active: boolean
  complete: boolean
}) => (
  <div
    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 font-sarabun text-sm ${
      complete
        ? 'border-[#c9f0d1] bg-[#f1fcf3] text-[#27823d] dark:border-[#205e30] dark:bg-[#173520] dark:text-[#c9f0d1]'
        : active
          ? 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-200'
          : 'border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950'
    }`}
  >
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-neutral-900">
      {complete ? <CheckCircleIcon className="size-5" /> : icon}
    </span>
    <span className="font-medium">{title}</span>
  </div>
)

const replaceFormDataValues = (formData: FormData, key: string, values: string[]) => {
  formData.delete(key)
  if (!values.length) {
    formData.set(key, '')
    return
  }
  values.forEach((value) => formData.append(key, value))
}

const getMediaUploadErrorMessage = (error: unknown, isThai: boolean) => {
  if (!(error instanceof ListingMediaUploadError)) {
    return isThai
      ? 'อัปโหลดไฟล์ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง'
      : 'Media upload failed. Check your connection and try again.'
  }

  const fileLabel = error.fileName ? ` “${error.fileName}”` : ''
  if (isThai) {
    switch (error.code) {
      case 'authentication_required':
        return 'เซสชันเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบอีกครั้งแล้วกดลองใหม่'
      case 'file_too_large':
        return `ไฟล์${fileLabel} มีขนาดเกินกำหนด กรุณากลับไปเปลี่ยนไฟล์นี้`
      case 'unsupported_format':
        return `ไฟล์${fileLabel} เป็นรูปแบบที่ไม่รองรับ กรุณากลับไปเปลี่ยนไฟล์นี้`
      case 'storage_unavailable':
        return 'พื้นที่จัดเก็บไฟล์ขัดข้องชั่วคราว กรุณารอสักครู่แล้วลองอีกครั้ง'
      case 'network_error':
        return `การเชื่อมต่อขาดระหว่างอัปโหลดไฟล์${fileLabel} กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง`
      default:
        return `อัปโหลดไฟล์${fileLabel} ไม่สำเร็จ กรุณาลองอีกครั้ง`
    }
  }

  switch (error.code) {
    case 'authentication_required':
      return 'Your session expired. Sign in again, then retry.'
    case 'file_too_large':
      return `File${fileLabel} is too large. Go back and replace it.`
    case 'unsupported_format':
      return `File${fileLabel} is not supported. Go back and replace it.`
    case 'storage_unavailable':
      return 'Media storage is temporarily unavailable. Wait a moment and try again.'
    case 'network_error':
      return `The connection was interrupted while uploading${fileLabel}. Check your connection and retry.`
    default:
      return `Unable to upload${fileLabel}. Please try again.`
  }
}

const getListingSaveErrorMessage = (error: unknown, isThai: boolean) => {
  const detail = error instanceof Error ? error.message.toLowerCase() : ''
  const validationError = ['required', 'invalid', 'must be', 'not exceed'].some((fragment) => detail.includes(fragment))
  if (validationError) {
    return isThai
      ? 'ข้อมูลบางส่วนยังไม่ถูกต้อง กรุณากลับไปแก้ไขช่องที่ระบบแจ้ง แล้วส่งอีกครั้ง'
      : 'Some information is invalid. Go back, correct the highlighted fields, and submit again.'
  }
  return isThai
    ? 'ยังเชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วกดลองอีกครั้ง'
    : 'The listing could not be saved. Check your connection and try again.'
}

const contactProfileFromDraft = (draft: ListingDraft) => {
  const organizationName = readText(draft.contactOrganizationName).trim()
  const roleCode = readText(draft.contactRoleCode)
  return {
    contact_name: readText(draft.contactName).trim(),
    contact_phone: readText(draft.contactPhone).trim(),
    contact_phone_secondary: readText(draft.contactPhoneSecondary).trim(),
    contact_email: readText(draft.contactEmail).trim(),
    line_id: readText(draft.lineId).trim(),
    instagram_handle: readText(draft.instagramHandle).trim(),
    role_code: roleCode,
    authority_source_code: roleCode === 'owner' ? 'self' : readText(draft.contactAuthorityCode),
    organization_name: organizationName,
    organization_registration_no: organizationName
      ? readText(draft.contactOrganizationRegistrationNo).trim()
      : '',
  }
}

const readSubmissionResult = (): SubmissionResult | null => {
  try {
    const raw = sessionStorage.getItem(LISTING_SUBMISSION_RESULT_KEY)
    return raw ? (JSON.parse(raw) as SubmissionResult) : null
  } catch {
    sessionStorage.removeItem(LISTING_SUBMISSION_RESULT_KEY)
    return null
  }
}

const readText = (value: ListingDraftValue | undefined) => (Array.isArray(value) ? value[0] || '' : value || '')
const readValues = (value: ListingDraftValue | undefined) => (value ? (Array.isArray(value) ? value : [value]) : [])
const readCount = (value: ListingDraftValue | undefined) => Number(readText(value)) || 0

export default Page
