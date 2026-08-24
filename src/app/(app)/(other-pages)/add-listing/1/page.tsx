'use client'

import ListingAuthCheckpoint from '@/components/add-listing/ListingAuthCheckpoint'
import {
  businessSpaceTypes,
  getListingScope,
  getOfferType,
  getPropertyGroup,
  getPropertyType,
  getPropertyTypesForGroup,
  getUseCase,
  listingScopes,
  mapUseCasesToLegacyUsage,
  normalizeLegacyPropertyType,
  offersToLegacyListingType,
  offerTypes,
  propertyGroups,
  useCases,
  type ListingScopeCode,
  type OfferTypeCode,
  type PropertyGroupCode,
  type PropertyTypeCode,
  type UseCaseCode,
} from '@/data/propertyTaxonomy'
import { useAuth } from '@/hooks/useAuth'
import { getListingDraft, saveListingDraftToCloud, saveListingStep, type ListingDraftValue } from '@/lib/listingDraft'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Textarea from '@/shared/Textarea'
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  HomeModernIcon,
  InformationCircleIcon,
  MapIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import FormItem from '../FormItem'

const groupIcons = {
  residential: HomeModernIcon,
  mixed_use: BuildingStorefrontIcon,
  commercial: BuildingOffice2Icon,
  land: MapIcon,
} satisfies Record<PropertyGroupCode, typeof HomeModernIcon>

const Page = () => {
  const router = useRouter()
  const [selectedGroup, setSelectedGroup] = useState<PropertyGroupCode>('residential')
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyTypeCode>('detached_house')
  const [selectedScope, setSelectedScope] = useState<ListingScopeCode>('whole_property')
  const [selectedUseCases, setSelectedUseCases] = useState<UseCaseCode[]>(['residential'])
  const [selectedOffers, setSelectedOffers] = useState<OfferTypeCode[]>(['rent'])
  const [businessSpaceType, setBusinessSpaceType] = useState('')
  const [title, setTitle] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [authCheckpointOpen, setAuthCheckpointOpen] = useState(false)
  const { isAuthenticated, isLoading, refresh } = useAuth()

  const propertyType = getPropertyType(selectedPropertyType) ?? getPropertyType('detached_house')!
  const propertyTypesForGroup = useMemo(() => getPropertyTypesForGroup(selectedGroup), [selectedGroup])
  const availableScopes = listingScopes.filter((scope) => propertyType.allowedScopes.includes(scope.code))
  const availableUseCases = useCases.filter((useCase) => propertyType.allowedUseCases.includes(useCase.code))
  const availableOffers = offerTypes.filter((offer) => propertyType.allowedOffers.includes(offer.code))

  useEffect(() => {
    router.prefetch('/add-listing/2')

    const frame = requestAnimationFrame(() => {
      const draft = getListingDraft()
      const nextPropertyTypeCode = normalizeLegacyPropertyType(readDraftText(draft.property_type_code))
      const nextPropertyType = getPropertyType(nextPropertyTypeCode) ?? getPropertyType('detached_house')!
      const savedUseCases = readDraftValues(draft['useCaseCodes[]']).filter((code): code is UseCaseCode =>
        nextPropertyType.allowedUseCases.includes(code as UseCaseCode)
      )
      const savedOffers = readDraftValues(draft['offerTypes[]']).filter((code): code is OfferTypeCode =>
        nextPropertyType.allowedOffers.includes(code as OfferTypeCode)
      )
      const savedScope = readDraftText(draft.listing_scope) as ListingScopeCode

      setSelectedGroup(nextPropertyType.groupCode)
      setSelectedPropertyType(nextPropertyType.code)
      setSelectedScope(nextPropertyType.allowedScopes.includes(savedScope) ? savedScope : nextPropertyType.defaultScope)
      setSelectedUseCases(
        savedUseCases.length
          ? savedUseCases
          : mapLegacyUsageToUseCases(draft.usage_type, nextPropertyType.defaultUseCases)
      )
      setSelectedOffers(savedOffers.length ? savedOffers : offersFromLegacy(draft.listing_type))
      setBusinessSpaceType(readDraftText(draft.space_type_code))
      setTitle(readDraftText(draft.listingTitle))
      setPlaceName(readDraftText(draft.placeName))
      setDescription(readDraftText(draft.listingDescription))
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  const selectGroup = (groupCode: PropertyGroupCode) => {
    const nextPropertyType = getPropertyTypesForGroup(groupCode)[0]
    if (!nextPropertyType) return

    setSelectedGroup(groupCode)
    setSelectedPropertyType(nextPropertyType.code)
    setSelectedScope(nextPropertyType.defaultScope)
    setSelectedUseCases(nextPropertyType.defaultUseCases)
    setSelectedOffers(nextPropertyType.allowedOffers.includes('rent') ? ['rent'] : [nextPropertyType.allowedOffers[0]])
    setBusinessSpaceType('')
    setError('')
  }

  const selectPropertyType = (propertyTypeCode: PropertyTypeCode) => {
    const nextPropertyType = getPropertyType(propertyTypeCode)
    if (!nextPropertyType) return

    setSelectedPropertyType(propertyTypeCode)
    setSelectedScope(nextPropertyType.defaultScope)
    setSelectedUseCases(nextPropertyType.defaultUseCases)
    setSelectedOffers((current) => {
      const compatible = current.filter((offer) => nextPropertyType.allowedOffers.includes(offer))
      if (compatible.length) return compatible
      return nextPropertyType.allowedOffers.includes('rent') ? ['rent'] : [nextPropertyType.allowedOffers[0]]
    })
    setBusinessSpaceType('')
    setError('')
  }

  const toggleUseCase = (code: UseCaseCode) => {
    setSelectedUseCases((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    )
    setError('')
  }

  const toggleOffer = (code: OfferTypeCode) => {
    setSelectedOffers((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    )
    setError('')
  }

  const handleSubmitForm = async (formData: FormData) => {
    if (!selectedOffers.length) {
      setError('กรุณาเลือกอย่างน้อยหนึ่งรูปแบบการประกาศ')
      return
    }
    if (!title.trim()) {
      setError('กรุณากรอกหัวข้อประกาศ')
      return
    }

    formData.set('property_group_code', selectedGroup)
    formData.set('property_type_code', selectedPropertyType)
    formData.set('listing_scope', selectedScope)
    const effectiveUseCases = selectedUseCases.length ? selectedUseCases : propertyType.defaultUseCases
    formData.delete('useCaseCodes[]')
    effectiveUseCases.forEach((code) => formData.append('useCaseCodes[]', code))
    formData.set('usage_type', mapUseCasesToLegacyUsage(effectiveUseCases))
    formData.set('listing_type', offersToLegacyListingType(selectedOffers))
    const savedDraft = saveListingStep(1, formData)
    const authenticated = isAuthenticated || (isLoading ? Boolean(await refresh()) : false)

    if (!authenticated) {
      setAuthCheckpointOpen(true)
      return
    }

    await saveListingDraftToCloud(savedDraft).catch(() => undefined)
    router.push('/add-listing/2')
  }

  return (
    <>
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
          <PencilSquareIcon className="h-4 w-4" />
          <span>เริ่มลงประกาศ</span>
        </div>
        <div className="space-y-3">
          <h1 className="font-sarabun text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
            เลือกประเภท แล้วเริ่มลงประกาศได้เลย
          </h1>
          <p className="max-w-2xl font-sarabun text-sm leading-6 text-neutral-500 sm:text-base dark:text-neutral-400">
            กรอกเฉพาะข้อมูลที่มีตอนนี้ได้ รายละเอียดเฉพาะประเภท เช่น ระบบไฟ ขนาดล็อก หรือจำนวนยูนิต
            สามารถกลับมาเพิ่มภายหลัง
          </p>
        </div>
      </div>

      <div className="h-px w-16 bg-gradient-to-r from-orange-400 via-orange-200 to-transparent" />

      <div className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 font-sarabun text-sm leading-6 text-neutral-600 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-neutral-300">
        เริ่มกรอกได้ทันที เราจะขอให้เข้าสู่ระบบเมื่อคุณต้องการบันทึกร่างและไปขั้นตอนถัดไป
      </div>

      <Form id="add-listing-form" action={handleSubmitForm} className="space-y-7">
        <input type="hidden" name="property_group_code" value={selectedGroup} />
        <input type="hidden" name="property_type_code" value={selectedPropertyType} />
        <input type="hidden" name="listing_scope" value={selectedScope} />
        <input type="hidden" name="usage_type" value={mapUseCasesToLegacyUsage(selectedUseCases)} />
        <input type="hidden" name="listing_type" value={offersToLegacyListingType(selectedOffers)} />
        {selectedUseCases.map((code) => (
          <input key={code} type="hidden" name="useCaseCodes[]" value={code} />
        ))}
        {selectedOffers.map((code) => (
          <input key={code} type="hidden" name="offerTypes[]" value={code} />
        ))}

        <WizardSection
          number="1"
          title="เลือกกลุ่มทรัพย์"
          description="เลือกภาพรวมที่ใกล้เคียงที่สุด แล้วค่อยระบุประเภททรัพย์ในขั้นถัดไป"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {propertyGroups.map((group) => {
              const Icon = groupIcons[group.code]
              return (
                <ChoiceCard
                  key={group.code}
                  selected={selectedGroup === group.code}
                  title={group.nameTh}
                  subtitle={group.nameEn}
                  description={group.description}
                  icon={<Icon className="h-6 w-6" />}
                  onClick={() => selectGroup(group.code)}
                />
              )
            })}
          </div>
        </WizardSection>

        <WizardSection
          number="2"
          title="เลือกประเภททรัพย์"
          description={`ประเภทในกลุ่ม ${getPropertyGroup(selectedGroup)?.nameTh ?? ''}`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {propertyTypesForGroup.map((item) => (
              <ChoiceCard
                key={item.code}
                selected={selectedPropertyType === item.code}
                title={item.nameTh}
                subtitle={item.nameEn}
                description={item.description}
                onClick={() => selectPropertyType(item.code)}
              />
            ))}
          </div>
        </WizardSection>

        <WizardSection
          number="3"
          title="ต้องการประกาศแบบใด"
          description="เลือกได้มากกว่าหนึ่งแบบ เช่น ขายและให้เช่าในประกาศเดียว"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {availableOffers.map((offer) => (
              <ToggleCard
                key={offer.code}
                checked={selectedOffers.includes(offer.code)}
                title={offer.nameTh}
                subtitle={offer.description}
                onClick={() => toggleOffer(offer.code)}
              />
            ))}
          </div>
        </WizardSection>

        <details className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-sarabun sm:px-7">
            <span>
              <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                จัดหมวดเพิ่มเติม <span className="font-normal text-neutral-400">(ไม่จำเป็น)</span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">
                ระบบเลือกค่าที่เหมาะกับ {propertyType.nameTh} ไว้แล้ว เปิดส่วนนี้เมื่อคุณต้องการระบุให้ละเอียดขึ้น
              </span>
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs text-neutral-500 shadow-sm ring-1 ring-neutral-200 group-open:text-orange-600 dark:bg-neutral-800 dark:ring-neutral-700">
              ปรับรายละเอียด
            </span>
          </summary>

          <div className="space-y-6 border-t border-neutral-200 px-5 py-6 sm:px-7 dark:border-neutral-800">
            <div>
              <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">กำลังประกาศส่วนใด</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {availableScopes.map((scope) => (
                  <ChoiceCard
                    key={scope.code}
                    selected={selectedScope === scope.code}
                    title={scope.nameTh}
                    subtitle={scope.nameEn}
                    description={scope.description}
                    onClick={() => setSelectedScope(scope.code)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">ใช้ทำอะไรได้บ้าง</h3>
              <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500">เลือกได้หลายข้อ และกลับมาแก้ไขได้ภายหลัง</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {availableUseCases.map((useCase) => (
                  <ToggleCard
                    key={useCase.code}
                    checked={selectedUseCases.includes(useCase.code)}
                    title={useCase.nameTh}
                    subtitle={useCase.description}
                    onClick={() => toggleUseCase(useCase.code)}
                  />
                ))}
              </div>
            </div>

            {propertyType.supportsBusinessSpaceType ? (
              <FormItem label="รูปแบบพื้นที่ค้าขาย" desccription="เว้นว่างได้ หากยังไม่แน่ใจ">
                <Select
                  name="space_type_code"
                  value={businessSpaceType}
                  onChange={(event) => setBusinessSpaceType(event.target.value)}
                  className="[&_select]:h-12 [&_select]:rounded-2xl [&_select]:bg-white [&_select]:px-4 dark:[&_select]:bg-neutral-900"
                >
                  <option value="">ยังไม่ระบุ</option>
                  {businessSpaceTypes.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.nameTh} — {item.nameEn}
                    </option>
                  ))}
                </Select>
              </FormItem>
            ) : null}
          </div>
        </details>

        <WizardSection
          number="4"
          title="ข้อมูลเบื้องต้นของประกาศ"
          description="เขียนให้ผู้ค้นหาเข้าใจจุดเด่นของทรัพย์ได้ทันที"
        >
          <div className="grid gap-5">
            <FormItem
              label="หัวข้อประกาศ"
              desccription="ระบุประเภททรัพย์ ทำเล และจุดเด่นสำคัญ โดยไม่ต้องใส่เบอร์โทรในหัวข้อ"
            >
              <Input
                name="listingTitle"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="เช่น ให้เช่าอาคารพาณิชย์ 3 ชั้น ใกล้ BTS อ่อนนุช เปิดร้านอาหารได้"
                maxLength={160}
                required
                className="h-13 rounded-2xl border-neutral-200 bg-neutral-50 px-4 text-[15px] shadow-none dark:bg-neutral-950"
              />
              <p className="mt-2 text-right text-xs text-neutral-400">{title.length}/160</p>
            </FormItem>

            <FormItem label="ชื่อโครงการ อาคาร หรือสถานที่" desccription="เว้นว่างได้ หากทรัพย์ไม่ได้อยู่ในโครงการ">
              <Input
                name="placeName"
                value={placeName}
                onChange={(event) => setPlaceName(event.target.value)}
                placeholder="เช่น Ideo Sukhumvit 93, อาคาร ABC, ตลาดนัด XYZ"
                maxLength={160}
                className="h-13 rounded-2xl border-neutral-200 bg-neutral-50 px-4 text-[15px] shadow-none dark:bg-neutral-950"
              />
            </FormItem>

            <FormItem
              label="คำอธิบายสั้น"
              desccription="สรุปสภาพทรัพย์ จุดเด่น และผู้เช่าหรือผู้ซื้อที่เหมาะสม ยังสามารถเพิ่มรายละเอียดฉบับเต็มในขั้นถัดไป"
            >
              <Textarea
                name="listingDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="อธิบายจุดเด่นของทรัพย์ การเดินทาง และเงื่อนไขสำคัญ..."
                maxLength={1000}
                className="min-h-36 rounded-2xl border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] shadow-none dark:bg-neutral-950"
              />
              <p className="mt-2 text-right text-xs text-neutral-400">{description.length}/1000</p>
            </FormItem>
          </div>
        </WizardSection>

        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">สรุปการจัดหมวด</p>
              <p className="mt-1 leading-6">
                {propertyType.nameTh} · {getListingScope(selectedScope)?.nameTh} ·{' '}
                {selectedUseCases
                  .map((code) => getUseCase(code)?.nameTh)
                  .filter(Boolean)
                  .join(', ') || 'ยังไม่ได้เลือกการใช้งาน'}{' '}
                ·{' '}
                {selectedOffers
                  .map((code) => getOfferType(code)?.nameTh)
                  .filter(Boolean)
                  .join(', ') || 'ยังไม่ได้เลือกรูปแบบประกาศ'}
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        ) : null}
      </Form>

      <ListingAuthCheckpoint
        open={authCheckpointOpen}
        onClose={() => setAuthCheckpointOpen(false)}
        onAuthenticated={() => router.push('/add-listing/2')}
      />
    </>
  )
}

const WizardSection = ({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children: React.ReactNode
}) => (
  <section className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.32)] dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start gap-4 border-b border-neutral-100 bg-neutral-50/80 px-5 py-5 sm:px-7 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
        {number}
      </span>
      <div>
        <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
        <p className="mt-1 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
    </div>
    <div className="p-5 sm:p-7">{children}</div>
  </section>
)

const ChoiceCard = ({
  selected,
  title,
  subtitle,
  description,
  icon,
  onClick,
}: {
  selected: boolean
  title: string
  subtitle: string
  description: string
  icon?: React.ReactNode
  onClick: () => void
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`relative flex min-h-32 w-full items-start gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
      selected
        ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/25'
        : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/60'
    }`}
  >
    {icon ? (
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'}`}
      >
        {icon}
      </span>
    ) : null}
    <span className="min-w-0 flex-1">
      <span className="block font-sarabun text-base font-semibold text-neutral-900 dark:text-neutral-50">{title}</span>
      <span className="mt-0.5 block text-xs font-medium tracking-wide text-neutral-400 uppercase">{subtitle}</span>
      <span className="mt-2 block font-sarabun text-sm leading-5 text-neutral-500 dark:text-neutral-400">
        {description}
      </span>
    </span>
    {selected ? <CheckCircleIcon className="h-6 w-6 shrink-0 text-orange-600" /> : null}
  </button>
)

const ToggleCard = ({
  checked,
  title,
  subtitle,
  onClick,
}: {
  checked: boolean
  title: string
  subtitle: string
  onClick: () => void
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onClick}
    className={`flex min-h-24 w-full items-start gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
      checked
        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/25'
        : 'border-neutral-200 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500'
    }`}
  >
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-orange-500 bg-orange-500 text-white' : 'border-neutral-300 dark:border-neutral-600'}`}
    >
      {checked ? <CheckCircleIcon className="h-4 w-4" /> : null}
    </span>
    <span>
      <span className="block font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</span>
      <span className="mt-1 block font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        {subtitle}
      </span>
    </span>
  </button>
)

const readDraftText = (value: ListingDraftValue | undefined) => (Array.isArray(value) ? value[0] || '' : value || '')
const readDraftValues = (value: ListingDraftValue | undefined) =>
  value ? (Array.isArray(value) ? value : [value]) : []

const mapLegacyUsageToUseCases = (value: ListingDraftValue | undefined, fallback: UseCaseCode[]) => {
  const usage = readDraftText(value)
  if (usage === 'residence') return ['residential'] as UseCaseCode[]
  if (usage === 'business') return fallback.filter((code) => code !== 'residential')
  return fallback
}

const offersFromLegacy = (value: ListingDraftValue | undefined): OfferTypeCode[] => {
  const listingType = readDraftText(value)
  if (listingType === 'sale_and_rent') return ['sale', 'rent']
  if (
    listingType === 'sale' ||
    listingType === 'rent' ||
    listingType === 'sublease' ||
    listingType === 'business_transfer'
  ) {
    return [listingType]
  }
  return ['rent']
}

export default Page
