'use client'

import ListingAuthCheckpoint from '@/components/add-listing/ListingAuthCheckpoint'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  discoveryChannels,
  getBusinessSpaceType,
  getDiscoveryChannel,
  getPropertyType,
  getPropertyTypesForDiscoveryChannel,
  listingScopes,
  mapUseCasesToLegacyUsage,
  normalizeLegacyPropertyType,
  offersToLegacyListingType,
  offerTypes,
  primaryBusinessSpaceTypeCodes,
  useCases,
  type BusinessSpaceTypeCode,
  type DiscoveryChannelCode,
  type ListingScopeCode,
  type OfferTypeCode,
  type PropertyTypeCode,
  type UseCaseCode,
} from '@/data/propertyTaxonomy'
import { useAuth } from '@/hooks/useAuth'
import { getListingDraft, saveListingDraftToCloud, saveListingStep, type ListingDraftValue } from '@/lib/listingDraft'
import Input from '@/shared/Input'
import Textarea from '@/shared/Textarea'
import { BuildingStorefrontIcon, CheckCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import {
  BedDouble,
  Building,
  Building2,
  CalendarRange,
  DoorOpen,
  Factory,
  Hotel,
  House,
  LandPlot,
  Store,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import FormItem from '../FormItem'

const propertyTypeIcons = {
  detached_house: House,
  semi_detached_house: House,
  townhouse: Building,
  condo: Building2,
  apartment: Building2,
  dormitory: BedDouble,
  rental_room: DoorOpen,
  flat: Building,
  serviced_apartment: Building2,
  monthly_hotel: Hotel,
  shophouse: Store,
  home_office: Building2,
  office: Building2,
  retail_space: Store,
  warehouse: Warehouse,
  factory: Factory,
  land: LandPlot,
} satisfies Record<PropertyTypeCode, LucideIcon>

const businessSpaceTypeIcons = {
  market_stall: Store,
  mall_kiosk: Building2,
  standalone_shop: House,
  shophouse_ground_floor: Building,
  event_booth: CalendarRange,
} satisfies Record<(typeof primaryBusinessSpaceTypeCodes)[number], LucideIcon>

const primaryBusinessSpaceTypes = primaryBusinessSpaceTypeCodes.flatMap((code) => {
  const item = getBusinessSpaceType(code)
  return item ? [{ ...item, code }] : []
})

const discoveryChannelDescriptionsEn: Record<DiscoveryChannelCode, string> = {
  homes: 'Houses, condos, townhomes, shophouses and land',
  rooms: 'Rental rooms, apartments, dorms, flats and long-term stays',
  business: 'Shophouses, retail spaces, offices, warehouses, factories and land',
}

const businessSpaceTypeDescriptionsEn: Record<(typeof primaryBusinessSpaceTypeCodes)[number], string> = {
  market_stall: 'A permanent stall in a market or community market',
  mall_kiosk: 'A kiosk, counter or common-area retail space in a mall',
  standalone_shop: 'A standalone shop with its own entrance and space',
  shophouse_ground_floor: 'A ground-floor shop in a shophouse or commercial building',
  event_booth: 'A booth available for a specific event or booking period',
}

const discoveryChannelVisuals = {
  homes: {
    Icon: House,
    selected: 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 dark:bg-emerald-950/30',
    icon: 'bg-emerald-600 text-white',
    check: 'text-emerald-700 dark:text-emerald-300',
  },
  rooms: {
    Icon: BedDouble,
    selected: 'border-sky-500 bg-sky-50 ring-1 ring-sky-500 dark:bg-sky-950/30',
    icon: 'bg-sky-600 text-white',
    check: 'text-sky-700 dark:text-sky-300',
  },
  business: {
    Icon: BuildingStorefrontIcon,
    selected: 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/30',
    icon: 'bg-orange-500 text-white',
    check: 'text-orange-700 dark:text-orange-300',
  },
} satisfies Record<
  DiscoveryChannelCode,
  { Icon: React.ComponentType<{ className?: string }>; selected: string; icon: string; check: string }
>

const Page = () => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [selectedChannel, setSelectedChannel] = useState<DiscoveryChannelCode>('homes')
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyTypeCode>('detached_house')
  const [selectedScope, setSelectedScope] = useState<ListingScopeCode>('whole_property')
  const [selectedUseCases, setSelectedUseCases] = useState<UseCaseCode[]>(['residential'])
  const [selectedOffers, setSelectedOffers] = useState<OfferTypeCode[]>(['rent'])
  const [businessSpaceType, setBusinessSpaceType] = useState<BusinessSpaceTypeCode | ''>('')
  const [title, setTitle] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [authCheckpointOpen, setAuthCheckpointOpen] = useState(false)
  const { isAuthenticated, isLoading, refresh } = useAuth()

  const propertyType = getPropertyType(selectedPropertyType) ?? getPropertyType('detached_house')!
  const selectedGroup = propertyType.groupCode
  const propertyTypesForChannel = useMemo(() => getPropertyTypesForDiscoveryChannel(selectedChannel), [selectedChannel])
  const availableScopes = listingScopes.filter((scope) => propertyType.allowedScopes.includes(scope.code))
  const availableUseCases = useCases.filter((useCase) => propertyType.allowedUseCases.includes(useCase.code))
  const availableOffers = offerTypes.filter(
    (offer) =>
      propertyType.allowedOffers.includes(offer.code) &&
      (businessSpaceType === 'event_booth' ? offer.code === 'event_booking' : offer.code !== 'event_booking')
  )

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
      const nextChannel = resolveDiscoveryChannel(
        readDraftText(draft.discovery_channel_code),
        nextPropertyType.code,
        readDraftText(draft.usage_type)
      )

      setSelectedChannel(nextChannel)
      setSelectedPropertyType(nextPropertyType.code)
      setSelectedScope(nextPropertyType.allowedScopes.includes(savedScope) ? savedScope : nextPropertyType.defaultScope)
      setSelectedUseCases(
        savedUseCases.length
          ? savedUseCases
          : mapLegacyUsageToUseCases(draft.usage_type, nextPropertyType.defaultUseCases)
      )
      setSelectedOffers(
        nextChannel === 'rooms' ? ['rent'] : savedOffers.length ? savedOffers : offersFromLegacy(draft.listing_type)
      )
      const savedBusinessSpaceType = getBusinessSpaceType(readDraftText(draft.space_type_code))
      setBusinessSpaceType(savedBusinessSpaceType?.code ?? '')
      setTitle(readDraftText(draft.listingTitle))
      setPlaceName(readDraftText(draft.placeName))
      setDescription(readDraftText(draft.listingDescription))
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  const selectChannel = (channelCode: DiscoveryChannelCode) => {
    const channel = getDiscoveryChannel(channelCode)
    if (!channel) return

    const nextPropertyType =
      (channel.propertyTypeCodes.includes(selectedPropertyType) ? getPropertyType(selectedPropertyType) : undefined) ??
      getPropertyType(channel.defaultPropertyTypeCode)
    if (!nextPropertyType) return

    setSelectedChannel(channelCode)
    setSelectedPropertyType(nextPropertyType.code)
    setSelectedScope(nextPropertyType.defaultScope)
    setSelectedUseCases(nextPropertyType.defaultUseCases)
    setSelectedOffers(
      channelCode === 'rooms'
        ? ['rent']
        : nextPropertyType.allowedOffers.includes('rent')
          ? ['rent']
          : [nextPropertyType.allowedOffers[0]]
    )
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
      if (selectedChannel === 'rooms') return ['rent']
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
    if (propertyType.supportsBusinessSpaceType && !businessSpaceType) {
      setError(isThai ? 'กรุณาเลือกรูปแบบพื้นที่ค้าขาย' : 'Choose a business space type.')
      return
    }
    if (!selectedOffers.length) {
      setError(isThai ? 'กรุณาเลือกอย่างน้อยหนึ่งรูปแบบการประกาศ' : 'Choose at least one listing option.')
      return
    }
    if (!title.trim()) {
      setError(isThai ? 'กรุณากรอกหัวข้อประกาศ' : 'Enter a listing title.')
      return
    }

    formData.set('property_group_code', selectedGroup)
    formData.set('discovery_channel_code', selectedChannel)
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
          <span>{isThai ? 'เริ่มลงประกาศ' : 'Start your listing'}</span>
        </div>
        <h1 className="font-sarabun text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
          {isThai ? 'ทรัพย์ของคุณอยู่ในหมวดไหน' : 'Which category best fits your property?'}
        </h1>
      </div>

      <div className="h-px w-16 bg-gradient-to-r from-orange-400 via-orange-200 to-transparent" />

      <Form id="add-listing-form" action={handleSubmitForm} className="space-y-7">
        <input type="hidden" name="property_group_code" value={selectedGroup} />
        <input type="hidden" name="discovery_channel_code" value={selectedChannel} />
        <input type="hidden" name="property_type_code" value={selectedPropertyType} />
        <input type="hidden" name="listing_scope" value={selectedScope} />
        <input type="hidden" name="space_type_code" value={businessSpaceType} />
        <input type="hidden" name="usage_type" value={mapUseCasesToLegacyUsage(selectedUseCases)} />
        <input type="hidden" name="listing_type" value={offersToLegacyListingType(selectedOffers)} />
        {selectedUseCases.map((code) => (
          <input key={code} type="hidden" name="useCaseCodes[]" value={code} />
        ))}
        {selectedOffers.map((code) => (
          <input key={code} type="hidden" name="offerTypes[]" value={code} />
        ))}

        <WizardSection number="1" title={isThai ? 'เลือกหมวดหลัก' : 'Choose a main category'}>
          <div className="grid gap-3 min-[744px]:grid-cols-3">
            {discoveryChannels.map((channel) => (
              <DiscoveryChannelCard
                key={channel.code}
                channel={channel.code}
                selected={selectedChannel === channel.code}
                title={isThai ? channel.nameTh : channel.nameEn}
                description={isThai ? channel.description : discoveryChannelDescriptionsEn[channel.code]}
                onClick={() => selectChannel(channel.code)}
              />
            ))}
          </div>
        </WizardSection>

        <WizardSection number="2" title={isThai ? 'เลือกประเภทที่ต้องการลง' : 'Choose a property type'}>
          <div className="grid grid-cols-2 gap-2.5 min-[744px]:grid-cols-3">
            {propertyTypesForChannel.map((item) => {
              const Icon = propertyTypeIcons[item.code]
              return (
                <ChoiceCard
                  key={item.code}
                  compact
                  selected={selectedPropertyType === item.code}
                  title={isThai ? item.nameTh : item.nameEn}
                  icon={<Icon className="size-5" />}
                  tone={selectedChannel}
                  onClick={() => selectPropertyType(item.code)}
                />
              )
            })}
          </div>

          {propertyType.supportsBusinessSpaceType ? (
            <div className="mt-5 rounded-3xl border border-orange-200/80 bg-orange-50/60 p-3 min-[744px]:mt-6 min-[744px]:p-5 dark:border-orange-900/60 dark:bg-orange-950/20">
              <h3 className="px-1 font-sarabun text-base font-semibold text-neutral-950 dark:text-white">
                {isThai ? 'พื้นที่ค้าขายของคุณเป็นแบบไหน' : 'What type of business space is this?'}
              </h3>
              <div className="mt-3 grid gap-3 min-[1100px]:grid-cols-3 sm:grid-cols-2">
                {primaryBusinessSpaceTypes.map((item) => {
                  const Icon = businessSpaceTypeIcons[item.code]
                  return (
                    <BusinessSpaceTypeCard
                      key={item.code}
                      selected={businessSpaceType === item.code}
                      title={isThai ? item.nameTh : item.nameEn}
                      description={isThai ? item.description : businessSpaceTypeDescriptionsEn[item.code]}
                      icon={<Icon className="size-5" />}
                      onClick={() => {
                        setBusinessSpaceType(item.code)
                        setSelectedOffers((current) =>
                          item.code === 'event_booth'
                            ? ['event_booking']
                            : current.includes('event_booking')
                              ? ['rent']
                              : current
                        )
                        setError('')
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ) : null}
        </WizardSection>

        <WizardSection
          number="3"
          title={
            selectedChannel === 'rooms' || businessSpaceType === 'event_booth'
              ? isThai
                ? 'รูปแบบประกาศ'
                : 'Listing option'
              : isThai
                ? 'ต้องการขายหรือให้เช่า'
                : 'For sale or rent'
          }
        >
          {businessSpaceType === 'event_booth' ? (
            <div className="flex min-h-20 items-center gap-4 rounded-2xl bg-orange-50 p-4 ring-1 ring-orange-200 ring-inset dark:bg-orange-950/30 dark:ring-orange-800">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                <CalendarRange className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sarabun font-semibold text-orange-950 dark:text-orange-100">
                  {isThai ? 'จองพื้นที่ตามรอบงาน' : 'Book by event period'}
                </p>
                <p className="mt-0.5 font-sarabun text-sm text-orange-700/80 dark:text-orange-300">
                  {isThai
                    ? 'ระบุวันจัดงาน รอบที่เปิดรับ และราคาของแต่ละรอบเพิ่มเติมได้'
                    : 'Add event dates, available rounds and the price for each period.'}
                </p>
              </div>
              <CheckCircleIcon className="size-6 shrink-0 text-orange-600" />
            </div>
          ) : selectedChannel === 'rooms' ? (
            <div className="flex min-h-20 items-center gap-4 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200 ring-inset dark:bg-sky-950/30 dark:ring-sky-800">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
                <BedDouble className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sarabun font-semibold text-sky-950 dark:text-sky-100">
                  {isThai ? 'ให้เช่ารายเดือน' : 'Monthly rental'}
                </p>
                <p className="mt-0.5 font-sarabun text-sm text-sky-700/80 dark:text-sky-300">
                  {isThai
                    ? 'หมวดนี้จะแสดงกับผู้ที่กำลังหาห้องเช่าและที่พักระยะยาว'
                    : 'This category is shown to people looking for rooms and long-term stays.'}
                </p>
              </div>
              <CheckCircleIcon className="size-6 shrink-0 text-sky-600" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableOffers.map((offer) => (
                <ToggleCard
                  key={offer.code}
                  checked={selectedOffers.includes(offer.code)}
                  title={isThai ? offer.nameTh : offer.nameEn}
                  onClick={() => toggleOffer(offer.code)}
                />
              ))}
            </div>
          )}
        </WizardSection>

        <details className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-sarabun sm:px-7">
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {isThai ? 'ตัวเลือกเพิ่มเติม' : 'More options'}{' '}
              <span className="font-normal text-neutral-400">{isThai ? '(ไม่บังคับ)' : '(optional)'}</span>
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs text-neutral-500 shadow-sm ring-1 ring-neutral-200 group-open:text-orange-600 dark:bg-neutral-800 dark:ring-neutral-700">
              {isThai ? 'เปิด' : 'Open'}
            </span>
          </summary>

          <div className="space-y-6 border-t border-neutral-200 px-5 py-6 sm:px-7 dark:border-neutral-800">
            <div>
              <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {isThai ? 'กำลังประกาศส่วนใด' : 'What part are you listing?'}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {availableScopes.map((scope) => (
                  <ChoiceCard
                    key={scope.code}
                    selected={selectedScope === scope.code}
                    title={isThai ? scope.nameTh : scope.nameEn}
                    onClick={() => setSelectedScope(scope.code)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {isThai ? 'ใช้ทำอะไรได้บ้าง' : 'Suitable uses'}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {availableUseCases.map((useCase) => (
                  <ToggleCard
                    key={useCase.code}
                    checked={selectedUseCases.includes(useCase.code)}
                    title={isThai ? useCase.nameTh : useCase.nameEn}
                    onClick={() => toggleUseCase(useCase.code)}
                  />
                ))}
              </div>
            </div>
          </div>
        </details>

        <WizardSection number="4" title={isThai ? 'ข้อมูลประกาศ' : 'Listing information'}>
          <div className="grid gap-5">
            <FormItem label={isThai ? 'หัวข้อประกาศ' : 'Listing title'}>
              <Input
                name="listingTitle"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  isThai
                    ? 'เช่น ให้เช่าอาคารพาณิชย์ 3 ชั้น ใกล้ BTS อ่อนนุช เปิดร้านอาหารได้'
                    : 'e.g. 3-storey shophouse near On Nut BTS, suitable for a restaurant'
                }
                maxLength={160}
                required
                className="h-13 rounded-2xl border-neutral-200 bg-neutral-50 px-4 text-[15px] shadow-none dark:bg-neutral-950"
              />
              <p className="mt-2 text-right text-xs text-neutral-400">{title.length}/160</p>
            </FormItem>

            <FormItem
              label={
                isThai ? 'ชื่อโครงการ อาคาร หรือสถานที่ (ไม่บังคับ)' : 'Project, building or place name (optional)'
              }
            >
              <Input
                name="placeName"
                value={placeName}
                onChange={(event) => setPlaceName(event.target.value)}
                placeholder={
                  isThai
                    ? 'เช่น Ideo Sukhumvit 93, อาคาร ABC, ตลาดนัด XYZ'
                    : 'e.g. Ideo Sukhumvit 93, ABC Building, XYZ Market'
                }
                maxLength={160}
                className="h-13 rounded-2xl border-neutral-200 bg-neutral-50 px-4 text-[15px] shadow-none dark:bg-neutral-950"
              />
            </FormItem>

            <FormItem label={isThai ? 'คำอธิบายสั้น (ไม่บังคับ)' : 'Short description (optional)'}>
              <Textarea
                name="listingDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={
                  isThai
                    ? 'อธิบายจุดเด่นของทรัพย์ การเดินทาง และเงื่อนไขสำคัญ...'
                    : 'Describe the property highlights, transport access and important terms...'
                }
                maxLength={1000}
                className="min-h-52 rounded-2xl border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] shadow-none min-[744px]:min-h-60 dark:bg-neutral-950"
              />
              <p className="mt-2 text-right text-xs text-neutral-400">{description.length}/1000</p>
            </FormItem>
          </div>
        </WizardSection>

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

const WizardSection = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <section className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.32)] dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start gap-3 border-b border-neutral-100 bg-neutral-50/80 px-4 py-4 min-[744px]:gap-4 min-[744px]:px-7 min-[744px]:py-5 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
        {number}
      </span>
      <h2 className="self-center font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
    </div>
    <div className="p-3 min-[744px]:p-7">{children}</div>
  </section>
)

const DiscoveryChannelCard = ({
  channel,
  selected,
  title,
  description,
  onClick,
}: {
  channel: DiscoveryChannelCode
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) => {
  const visual = discoveryChannelVisuals[channel]
  const Icon = visual.Icon

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex min-h-28 w-full items-center gap-4 rounded-3xl border p-4 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 min-[744px]:min-h-44 min-[744px]:flex-col min-[744px]:items-start min-[744px]:p-5 ${
        selected
          ? visual.selected
          : 'border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600'
      }`}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
          selected ? visual.icon : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
        }`}
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sarabun text-base leading-6 font-semibold text-neutral-950 dark:text-white">
          {title}
        </span>
        <span className="mt-1 block font-sarabun text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          {description}
        </span>
      </span>
      {selected ? (
        <CheckCircleIcon
          className={`absolute top-4 right-4 size-6 shrink-0 min-[744px]:top-5 min-[744px]:right-5 ${visual.check}`}
        />
      ) : null}
    </button>
  )
}

const ChoiceCard = ({
  selected,
  title,
  icon,
  tone,
  compact = false,
  onClick,
}: {
  selected: boolean
  title: string
  icon?: React.ReactNode
  tone?: DiscoveryChannelCode
  compact?: boolean
  onClick: () => void
}) => {
  const selectedStyle =
    tone === 'homes'
      ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 dark:bg-emerald-950/25'
      : tone === 'rooms'
        ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500 dark:bg-sky-950/25'
        : 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/25'
  const iconStyle = tone === 'homes' ? 'bg-emerald-600' : tone === 'rooms' ? 'bg-sky-600' : 'bg-orange-500'
  const checkStyle = tone === 'homes' ? 'text-emerald-700' : tone === 'rooms' ? 'text-sky-700' : 'text-orange-600'

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex w-full rounded-2xl border text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
        compact
          ? 'min-h-[5.25rem] flex-col items-start gap-2.5 p-3 min-[744px]:min-h-[4.5rem] min-[744px]:flex-row min-[744px]:items-center'
          : 'min-h-20 items-center gap-4 p-4'
      } ${
        selected
          ? selectedStyle
          : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/60'
      }`}
    >
      {icon ? (
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? 'size-9' : 'h-11 w-11'} ${
            selected
              ? `${iconStyle} text-white`
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          {icon}
        </span>
      ) : null}
      <span className={`min-w-0 flex-1 ${compact ? 'pe-5 min-[744px]:pe-4' : ''}`}>
        <span
          className={`block font-sarabun font-semibold text-neutral-900 dark:text-neutral-50 ${
            compact ? 'text-sm leading-5' : 'text-base'
          }`}
        >
          {title}
        </span>
      </span>
      {selected ? (
        <CheckCircleIcon
          className={`${compact ? 'absolute top-3 right-3 size-5' : 'h-6 w-6 shrink-0'} ${checkStyle}`}
        />
      ) : null}
    </button>
  )
}

const ToggleCard = ({ checked, title, onClick }: { checked: boolean; title: string; onClick: () => void }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onClick}
    className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
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
    <span className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</span>
  </button>
)

const BusinessSpaceTypeCard = ({
  selected,
  title,
  description,
  icon,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`relative flex min-h-24 w-full items-start gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
      selected
        ? 'border-orange-500 bg-white shadow-sm ring-1 ring-orange-500 dark:bg-orange-950/40'
        : 'border-orange-100 bg-white/80 hover:border-orange-300 hover:bg-white dark:border-orange-900/60 dark:bg-neutral-900/80 dark:hover:border-orange-700'
    }`}
  >
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
        selected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
      }`}
    >
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block font-sarabun text-sm leading-5 font-semibold text-neutral-950 dark:text-white">
        {title}
      </span>
      <span className="mt-1 block font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        {description}
      </span>
    </span>
    {selected ? <CheckCircleIcon className="absolute top-3 right-3 size-5 text-orange-600" /> : null}
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
    listingType === 'business_transfer' ||
    listingType === 'event_booking'
  ) {
    return [listingType]
  }
  return ['rent']
}

const resolveDiscoveryChannel = (
  savedChannel: string,
  propertyTypeCode: PropertyTypeCode,
  usageType: string
): DiscoveryChannelCode => {
  if (
    (savedChannel === 'homes' || savedChannel === 'rooms' || savedChannel === 'business') &&
    getDiscoveryChannel(savedChannel)?.propertyTypeCodes.includes(propertyTypeCode)
  ) {
    return savedChannel
  }

  if (
    ['rental_room', 'apartment', 'dormitory', 'flat', 'serviced_apartment', 'monthly_hotel'].includes(propertyTypeCode)
  ) {
    return 'rooms'
  }

  if (
    ['office', 'retail_space', 'warehouse', 'factory'].includes(propertyTypeCode) ||
    ((propertyTypeCode === 'shophouse' || propertyTypeCode === 'home_office' || propertyTypeCode === 'land') &&
      usageType === 'business')
  ) {
    return 'business'
  }

  return 'homes'
}

export default Page
