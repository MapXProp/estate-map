'use client'

import type { ListingDraft } from '@/lib/listingDraft'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Textarea from '@/shared/Textarea'
import { BuildingOffice2Icon, CheckIcon } from '@heroicons/react/24/outline'

type BusinessDetailsProps = {
  draft: ListingDraft
  propertyTypeCode: string
  isThai: boolean
}

type CommonProps = { draft: ListingDraft; isThai: boolean }
type Option = { code: string; th: string; en: string }

const allowedBusinessOptions: Option[] = [
  { code: 'retail', th: 'ร้านค้าปลีก', en: 'Retail' },
  { code: 'restaurant', th: 'ร้านอาหาร', en: 'Restaurant' },
  { code: 'cafe', th: 'คาเฟ่ / เครื่องดื่ม', en: 'Café / beverages' },
  { code: 'services', th: 'ธุรกิจบริการ', en: 'Services' },
  { code: 'beauty', th: 'ความงาม / ร้านทำผม', en: 'Beauty / salon' },
  { code: 'clinic', th: 'คลินิก', en: 'Clinic' },
  { code: 'showroom', th: 'โชว์รูม', en: 'Showroom' },
  { code: 'education', th: 'สถาบันสอน / กวดวิชา', en: 'Education / tutoring' },
]

const hotelFacilityOptions: Option[] = [
  { code: 'restaurant', th: 'ห้องอาหาร', en: 'Restaurant' },
  { code: 'swimming_pool', th: 'สระว่ายน้ำ', en: 'Swimming pool' },
  { code: 'fitness', th: 'ฟิตเนส', en: 'Fitness center' },
  { code: 'meeting_room', th: 'ห้องประชุม', en: 'Meeting rooms' },
  { code: 'spa', th: 'สปา', en: 'Spa' },
  { code: 'parking', th: 'ที่จอดรถ', en: 'Parking' },
  { code: 'laundry', th: 'ซักรีด', en: 'Laundry' },
  { code: 'shuttle', th: 'รถรับส่ง', en: 'Shuttle service' },
]

const BusinessDetails = ({ draft, propertyTypeCode, isThai }: BusinessDetailsProps) => {
  const isLand = propertyTypeCode === 'land'

  return (
    <section className="overflow-hidden rounded-[28px] border border-orange-200 bg-orange-50/40 shadow-sm dark:border-orange-900/70 dark:bg-orange-950/15">
      <div className="border-b border-orange-100 bg-white/85 p-5 sm:p-7 dark:border-orange-900/60 dark:bg-neutral-900/75">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white">
            <BuildingOffice2Icon className="size-5" />
          </span>
          <div>
            <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {isThai ? 'ข้อมูลเฉพาะของพื้นที่ทำธุรกิจ' : 'Business property details'}
            </h2>
            <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {isThai
                ? 'ระบบแสดงเฉพาะข้อมูลที่ผู้เช่า ผู้ซื้อ และผู้ประกอบการต้องใช้ตัดสินใจในหมวดนี้'
                : 'Fields are tailored to what tenants, buyers and operators need for this property type.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        {isLand ? (
          <BusinessLandDetails draft={draft} isThai={isThai} />
        ) : (
          <BusinessStatus draft={draft} isThai={isThai} />
        )}
        {propertyTypeCode === 'shophouse' ? <ShophouseDetails draft={draft} isThai={isThai} /> : null}
        {propertyTypeCode === 'home_office' ? <HomeOfficeDetails draft={draft} isThai={isThai} /> : null}
        {propertyTypeCode === 'office' ? <OfficeDetails draft={draft} isThai={isThai} /> : null}
        {propertyTypeCode === 'retail_space' ? <RetailDetails draft={draft} isThai={isThai} /> : null}
        {propertyTypeCode === 'warehouse' ? <WarehouseDetails draft={draft} isThai={isThai} /> : null}
        {propertyTypeCode === 'factory' ? <FactoryDetails draft={draft} isThai={isThai} /> : null}
        {propertyTypeCode === 'hotel_resort' ? <HotelDetails draft={draft} isThai={isThai} /> : null}
      </div>
    </section>
  )
}

const BusinessStatus = ({ draft, isThai }: CommonProps) => (
  <DetailGroup title={isThai ? 'สภาพทรัพย์และความพร้อมใช้งาน' : 'Condition & availability'}>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label={isThai ? 'สภาพทรัพย์' : 'Property condition'}>
        <SelectField name="propertyCondition" defaultValue={readText(draft.propertyCondition)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="new">{isThai ? 'ใหม่ / สร้างเสร็จใหม่' : 'Newly completed'}</option>
          <option value="like_new">{isThai ? 'สภาพเหมือนใหม่' : 'Like new'}</option>
          <option value="good">{isThai ? 'สภาพดี พร้อมใช้งาน' : 'Good, ready to use'}</option>
          <option value="needs_renovation">{isThai ? 'ควรปรับปรุง' : 'Needs renovation'}</option>
          <option value="under_construction">{isThai ? 'อยู่ระหว่างก่อสร้าง' : 'Under construction'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'สถานะปัจจุบัน' : 'Current occupancy'}>
        <SelectField name="occupancyStatus" defaultValue={readText(draft.occupancyStatus)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="vacant">{isThai ? 'ว่าง พร้อมใช้งาน' : 'Vacant'}</option>
          <option value="owner_operated">{isThai ? 'เจ้าของใช้งานอยู่' : 'Owner operated'}</option>
          <option value="tenant_occupied">{isThai ? 'มีผู้เช่าอยู่' : 'Tenant occupied'}</option>
          <option value="business_operating">{isThai ? 'มีกิจการดำเนินงานอยู่' : 'Business operating'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'พร้อมส่งมอบวันที่' : 'Available from'}>
        <Input name="availableFrom" type="date" defaultValue={readText(draft.availableFrom)} />
      </Field>
      <NumberField
        name="yearBuilt"
        label={isThai ? 'ปีที่สร้างเสร็จ' : 'Year completed'}
        draft={draft}
        min="1900"
        max="2600"
      />
      <NumberField
        name="renovatedYear"
        label={isThai ? 'ปีที่ปรับปรุงล่าสุด' : 'Last renovated year'}
        draft={draft}
        min="1900"
        max="2600"
      />
      <Field label={isThai ? 'รูปแบบสิทธิ์' : 'Tenure'}>
        <SelectField name="tenureType" defaultValue={readText(draft.tenureType)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="freehold">{isThai ? 'กรรมสิทธิ์ (Freehold)' : 'Freehold'}</option>
          <option value="leasehold">{isThai ? 'สิทธิการเช่า (Leasehold)' : 'Leasehold'}</option>
          <option value="sublease_right">{isThai ? 'สิทธิการเช่าช่วง' : 'Sublease right'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'อนุญาตใช้เชิงพาณิชย์' : 'Commercial use permitted'}>
        <YesNoSelect name="commercialUseAllowed" defaultValue={readText(draft.commercialUseAllowed)} isThai={isThai} />
      </Field>
      <Field label={isThai ? 'สภาพตอนส่งมอบ' : 'Handover condition'}>
        <SelectField name="handoverCondition" defaultValue={readText(draft.handoverCondition)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="bare_shell">{isThai ? 'พื้นที่เปล่า (Bare shell)' : 'Bare shell'}</option>
          <option value="partly_fitted">{isThai ? 'ตกแต่งบางส่วน' : 'Partly fitted'}</option>
          <option value="fully_fitted">{isThai ? 'ตกแต่งพร้อมใช้' : 'Fully fitted'}</option>
          <option value="as_is">{isThai ? 'ตามสภาพ' : 'As is'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'ข้อจำกัดเวลาเปิด–ปิด' : 'Operating-hour restrictions'}>
        <Input
          name="operatingHours"
          defaultValue={readText(draft.operatingHours)}
          placeholder={isThai ? 'เช่น 06:00–22:00 หรือไม่มีข้อจำกัด' : 'e.g. 06:00–22:00 or unrestricted'}
        />
      </Field>
    </div>
  </DetailGroup>
)

const ShophouseDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <BuildingDimensions draft={draft} isThai={isThai} />
    <DetailGroup
      title={isThai ? 'หน้าร้าน ระบบอาคาร และธุรกิจที่รองรับ' : 'Storefront, building systems & permitted uses'}
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <UnitPosition draft={draft} isThai={isThai} />
        <YesNoField name="hasMezzanine" label={isThai ? 'มีชั้นลอย' : 'Mezzanine'} draft={draft} isThai={isThai} />
        <YesNoField name="hasElevator" label={isThai ? 'มีลิฟต์' : 'Elevator'} draft={draft} isThai={isThai} />
        <YesNoField
          name="signageSpace"
          label={isThai ? 'ติดป้ายหน้าร้านได้' : 'Storefront signage'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="threePhasePower"
          label={isThai ? 'ไฟฟ้า 3 เฟส' : 'Three-phase power'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="separateEntrance"
          label={isThai ? 'ทางเข้าพื้นที่ธุรกิจแยก' : 'Separate business entrance'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="cookingAllowed"
          label={isThai ? 'อนุญาตประกอบอาหาร' : 'Cooking allowed'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="exhaustDuctAvailable"
          label={isThai ? 'มีทางเดินท่อดูดควัน' : 'Exhaust duct available'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="greaseTrapAvailable"
          label={isThai ? 'มีบ่อดักไขมัน' : 'Grease trap'}
          draft={draft}
          isThai={isThai}
        />
      </div>
      <CheckboxGrid
        name="allowedBusinessTypes[]"
        options={allowedBusinessOptions}
        selected={readValues(draft['allowedBusinessTypes[]'])}
        isThai={isThai}
      />
    </DetailGroup>
  </>
)

const HomeOfficeDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <BuildingDimensions draft={draft} isThai={isThai} />
    <DetailGroup title={isThai ? 'พื้นที่สำนักงานและการแยกสัดส่วน' : 'Office layout & separation'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <UnitPosition draft={draft} isThai={isThai} />
        <NumberField name="officeRoomCount" label={isThai ? 'จำนวนห้องทำงาน' : 'Private office rooms'} draft={draft} />
        <NumberField name="meetingRoomCount" label={isThai ? 'จำนวนห้องประชุม' : 'Meeting rooms'} draft={draft} />
        <NumberField
          name="workstationCapacity"
          label={isThai ? 'รองรับที่นั่งทำงาน' : 'Workstation capacity'}
          draft={draft}
          suffix={isThai ? 'ที่นั่ง' : 'seats'}
        />
        <YesNoField
          name="receptionArea"
          label={isThai ? 'มีพื้นที่ต้อนรับ' : 'Reception area'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField name="hasPantry" label={isThai ? 'มีแพนทรี' : 'Pantry'} draft={draft} isThai={isThai} />
        <YesNoField name="serverRoom" label={isThai ? 'มีห้อง Server' : 'Server room'} draft={draft} isThai={isThai} />
        <YesNoField
          name="separateEntrance"
          label={isThai ? 'ทางเข้าสำนักงานแยก' : 'Separate office entrance'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField name="hasElevator" label={isThai ? 'มีลิฟต์' : 'Elevator'} draft={draft} isThai={isThai} />
        <YesNoField
          name="threePhasePower"
          label={isThai ? 'ไฟฟ้า 3 เฟส' : 'Three-phase power'}
          draft={draft}
          isThai={isThai}
        />
        <MoneyField
          name="projectCommonFeeMonthly"
          label={isThai ? 'ค่าส่วนกลางต่อเดือน' : 'Monthly common fee'}
          draft={draft}
        />
      </div>
    </DetailGroup>
  </>
)

const OfficeDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <DetailGroup title={isThai ? 'รูปแบบพื้นที่สำนักงาน' : 'Office specification'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={isThai ? 'เกรดอาคารสำนักงาน' : 'Office grade'}>
          <SelectField name="officeGrade" defaultValue={readText(draft.officeGrade)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="a">Grade A</option>
            <option value="b">Grade B</option>
            <option value="c">Grade C</option>
            <option value="non_graded">{isThai ? 'อาคารทั่วไป / ไม่จัดเกรด' : 'Non-graded building'}</option>
          </SelectField>
        </Field>
        <Field label={isThai ? 'รูปแบบสำนักงาน' : 'Office layout'}>
          <SelectField name="officeLayout" defaultValue={readText(draft.officeLayout)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="open_plan">Open plan</option>
            <option value="partitioned">{isThai ? 'แบ่งห้องแล้ว' : 'Partitioned'}</option>
            <option value="serviced_office">Serviced office</option>
            <option value="coworking">Co-working</option>
            <option value="bare_shell">Bare shell</option>
          </SelectField>
        </Field>
        <NumberField
          name="workstationCapacity"
          label={isThai ? 'รองรับที่นั่งทำงาน' : 'Workstation capacity'}
          draft={draft}
          suffix={isThai ? 'ที่นั่ง' : 'seats'}
        />
        <NumberField name="officeRoomCount" label={isThai ? 'ห้องทำงานส่วนตัว' : 'Private offices'} draft={draft} />
        <NumberField name="meetingRoomCount" label={isThai ? 'ห้องประชุม' : 'Meeting rooms'} draft={draft} />
        <NumberField
          name="ceilingHeightM"
          label={isThai ? 'ความสูงฝ้า' : 'Ceiling height'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <YesNoField
          name="centralAirConditioning"
          label={isThai ? 'แอร์ส่วนกลาง' : 'Central air conditioning'}
          draft={draft}
          isThai={isThai}
        />
        <Field label={isThai ? 'เวลาให้บริการแอร์' : 'Air-conditioning hours'}>
          <Input
            name="airConditioningHours"
            defaultValue={readText(draft.airConditioningHours)}
            placeholder="08:00–18:00"
          />
        </Field>
        <YesNoField
          name="raisedFloor"
          label={isThai ? 'พื้นยกสำหรับงานระบบ' : 'Raised floor'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="accessControl"
          label={isThai ? 'ระบบควบคุมการเข้าออก' : 'Access control'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="backupGenerator"
          label={isThai ? 'เครื่องกำเนิดไฟฟ้าสำรอง' : 'Backup generator'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="freightElevator"
          label={isThai ? 'ลิฟต์ขนของ' : 'Freight elevator'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField name="hasPantry" label={isThai ? 'มีแพนทรี' : 'Pantry'} draft={draft} isThai={isThai} />
      </div>
    </DetailGroup>
  </>
)

const RetailDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <DetailGroup title={isThai ? 'หน้าร้านและระบบสำหรับค้าขาย' : 'Storefront & retail systems'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NumberField
          name="frontageM"
          label={isThai ? 'หน้ากว้างพื้นที่' : 'Storefront width'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <NumberField
          name="ceilingHeightM"
          label={isThai ? 'ความสูงฝ้า' : 'Ceiling height'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <YesNoField
          name="waterConnection"
          label={isThai ? 'มีจุดน้ำประปา' : 'Water connection'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="drainageAvailable"
          label={isThai ? 'มีท่อน้ำทิ้ง' : 'Drainage'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="threePhasePower"
          label={isThai ? 'ไฟฟ้า 3 เฟส' : 'Three-phase power'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="signageSpace"
          label={isThai ? 'ติดป้ายหน้าร้านได้' : 'Signage permitted'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="cookingAllowed"
          label={isThai ? 'อนุญาตประกอบอาหาร' : 'Cooking allowed'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="exhaustDuctAvailable"
          label={isThai ? 'มีทางเดินท่อดูดควัน' : 'Exhaust duct'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField
          name="greaseTrapAvailable"
          label={isThai ? 'มีบ่อดักไขมัน' : 'Grease trap'}
          draft={draft}
          isThai={isThai}
        />
      </div>
      <CheckboxGrid
        name="allowedBusinessTypes[]"
        options={allowedBusinessOptions}
        selected={readValues(draft['allowedBusinessTypes[]'])}
        isThai={isThai}
      />
      <Field
        label={isThai ? 'ทำเลภายในโครงการ จุดสังเกต และทราฟฟิกลูกค้า' : 'Position, nearby anchors & customer traffic'}
      >
        <Textarea name="footTrafficNotes" defaultValue={readText(draft.footTrafficNotes)} />
      </Field>
    </DetailGroup>
  </>
)

const WarehouseDetails = ({ draft, isThai }: CommonProps) => (
  <DetailGroup title={isThai ? 'สเปกโกดังและการขนส่ง' : 'Warehouse & logistics specification'}>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label={isThai ? 'ประเภทโกดัง' : 'Warehouse type'}>
        <SelectField name="warehouseType" defaultValue={readText(draft.warehouseType)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="general">{isThai ? 'โกดังทั่วไป' : 'General warehouse'}</option>
          <option value="distribution">{isThai ? 'ศูนย์กระจายสินค้า' : 'Distribution center'}</option>
          <option value="cold_storage">{isThai ? 'ห้องเย็น / Cold storage' : 'Cold storage'}</option>
          <option value="temperature_controlled">{isThai ? 'ควบคุมอุณหภูมิ' : 'Temperature controlled'}</option>
          <option value="self_storage">Self storage</option>
        </SelectField>
      </Field>
      <NumberField
        name="clearHeightM"
        label={isThai ? 'ความสูงใช้งานใต้คาน' : 'Clear height'}
        draft={draft}
        suffix={isThai ? 'ม.' : 'm'}
      />
      <NumberField
        name="floorLoadKgSqm"
        label={isThai ? 'น้ำหนักพื้นที่รับได้' : 'Floor load'}
        draft={draft}
        suffix="kg/ตร.ม."
      />
      <NumberField
        name="officeAreaSqm"
        label={isThai ? 'พื้นที่สำนักงาน' : 'Office area'}
        draft={draft}
        suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
      />
      <NumberField
        name="yardAreaSqm"
        label={isThai ? 'พื้นที่ลาน' : 'Yard area'}
        draft={draft}
        suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
      />
      <NumberField name="loadingDockCount" label={isThai ? 'จำนวนช่องโหลดสินค้า' : 'Loading docks'} draft={draft} />
      <NumberField name="driveInDoorCount" label={isThai ? 'จำนวนประตูรถเข้าโกดัง' : 'Drive-in doors'} draft={draft} />
      <TruckSizeField draft={draft} isThai={isThai} />
      <YesNoField
        name="threePhasePower"
        label={isThai ? 'ไฟฟ้า 3 เฟส' : 'Three-phase power'}
        draft={draft}
        isThai={isThai}
      />
      <YesNoField
        name="fireSprinkler"
        label={isThai ? 'ระบบดับเพลิง Sprinkler' : 'Fire sprinkler'}
        draft={draft}
        isThai={isThai}
      />
      <YesNoField
        name="temperatureControlled"
        label={isThai ? 'ควบคุมอุณหภูมิได้' : 'Temperature controlled'}
        draft={draft}
        isThai={isThai}
      />
    </div>
    <Field label={isThai ? 'ใบอนุญาตโกดัง / เงื่อนไขการเก็บสินค้า' : 'Warehouse licence / storage restrictions'}>
      <Textarea name="warehouseLicenseInfo" defaultValue={readText(draft.warehouseLicenseInfo)} />
    </Field>
  </DetailGroup>
)

const FactoryDetails = ({ draft, isThai }: CommonProps) => (
  <DetailGroup title={isThai ? 'ใบอนุญาต กำลังผลิต และระบบโรงงาน' : 'Factory licences, capacity & systems'}>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label={isThai ? 'สถานะใบอนุญาตโรงงาน' : 'Factory licence status'}>
        <SelectField name="factoryLicenseStatus" defaultValue={readText(draft.factoryLicenseStatus)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="valid">{isThai ? 'มีและยังมีผล' : 'Valid'}</option>
          <option value="renewal_required">{isThai ? 'มี ต้องต่ออายุ' : 'Renewal required'}</option>
          <option value="not_required">{isThai ? 'กิจการไม่เข้าข่าย' : 'Not required'}</option>
          <option value="none">{isThai ? 'ไม่มี' : 'None'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'เลขที่ใบอนุญาต รง.4 / ใบรับแจ้ง' : 'Factory licence number'}>
        <Input name="factoryLicenseNumber" defaultValue={readText(draft.factoryLicenseNumber)} />
      </Field>
      <Field label={isThai ? 'นิคม / เขตอุตสาหกรรม' : 'Industrial estate / zone'}>
        <Input name="industrialEstateName" defaultValue={readText(draft.industrialEstateName)} />
      </Field>
      <NumberField
        name="productionAreaSqm"
        label={isThai ? 'พื้นที่ผลิต' : 'Production area'}
        draft={draft}
        suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
      />
      <NumberField
        name="warehouseAreaSqm"
        label={isThai ? 'พื้นที่คลังสินค้า' : 'Warehouse area'}
        draft={draft}
        suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
      />
      <NumberField
        name="officeAreaSqm"
        label={isThai ? 'พื้นที่สำนักงาน' : 'Office area'}
        draft={draft}
        suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
      />
      <NumberField
        name="clearHeightM"
        label={isThai ? 'ความสูงใช้งานใต้คาน' : 'Clear height'}
        draft={draft}
        suffix={isThai ? 'ม.' : 'm'}
      />
      <NumberField
        name="floorLoadKgSqm"
        label={isThai ? 'น้ำหนักพื้นที่รับได้' : 'Floor load'}
        draft={draft}
        suffix="kg/ตร.ม."
      />
      <NumberField
        name="powerCapacityKva"
        label={isThai ? 'กำลังไฟฟ้า' : 'Power capacity'}
        draft={draft}
        suffix="kVA"
      />
      <NumberField
        name="craneCapacityTon"
        label={isThai ? 'เครนรับน้ำหนักสูงสุด' : 'Crane capacity'}
        draft={draft}
        suffix={isThai ? 'ตัน' : 'tons'}
      />
      <TruckSizeField draft={draft} isThai={isThai} />
      <YesNoField
        name="threePhasePower"
        label={isThai ? 'ไฟฟ้า 3 เฟส' : 'Three-phase power'}
        draft={draft}
        isThai={isThai}
      />
      <YesNoField
        name="fireSprinkler"
        label={isThai ? 'ระบบดับเพลิง Sprinkler' : 'Fire sprinkler'}
        draft={draft}
        isThai={isThai}
      />
      <YesNoField
        name="wastewaterTreatment"
        label={isThai ? 'ระบบบำบัดน้ำเสีย' : 'Wastewater treatment'}
        draft={draft}
        isThai={isThai}
      />
      <YesNoField
        name="airEmissionSystem"
        label={isThai ? 'ระบบบำบัดอากาศ / ฝุ่น' : 'Air-emission treatment'}
        draft={draft}
        isThai={isThai}
      />
      <YesNoField
        name="hazardousMaterialsAllowed"
        label={isThai ? 'รองรับวัตถุอันตราย' : 'Hazardous materials permitted'}
        draft={draft}
        isThai={isThai}
      />
    </div>
  </DetailGroup>
)

const HotelDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <DetailGroup title={isThai ? 'ประเภทและสถานะกิจการที่พัก' : 'Hospitality property & operation'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={isThai ? 'ประเภทกิจการที่พัก' : 'Hospitality property type'}>
          <SelectField name="hospitalityPropertyType" defaultValue={readText(draft.hospitalityPropertyType)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="hotel">{isThai ? 'โรงแรม' : 'Hotel'}</option>
            <option value="resort">{isThai ? 'รีสอร์ต' : 'Resort'}</option>
            <option value="hostel">Hostel</option>
            <option value="boutique_hotel">Boutique hotel</option>
            <option value="serviced_residence">Serviced residence</option>
          </SelectField>
        </Field>
        <NumberField name="starRating" label={isThai ? 'ระดับดาว' : 'Star rating'} draft={draft} min="0" max="5" />
        <Field label={isThai ? 'สถานะการดำเนินงาน' : 'Operating status'}>
          <SelectField name="currentOperationStatus" defaultValue={readText(draft.currentOperationStatus)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="operating">{isThai ? 'เปิดดำเนินการอยู่' : 'Operating'}</option>
            <option value="temporarily_closed">{isThai ? 'ปิดชั่วคราว' : 'Temporarily closed'}</option>
            <option value="vacant">{isThai ? 'ว่าง ไม่มีการดำเนินงาน' : 'Vacant'}</option>
            <option value="under_development">{isThai ? 'อยู่ระหว่างพัฒนา' : 'Under development'}</option>
          </SelectField>
        </Field>
        <NumberField name="totalUnits" label={isThai ? 'จำนวนห้องทั้งหมด' : 'Total rooms'} draft={draft} />
        <NumberField
          name="operationalRoomCount"
          label={isThai ? 'ห้องที่เปิดใช้งาน' : 'Operational rooms'}
          draft={draft}
        />
        <NumberField
          name="averageOccupancyPercent"
          label={isThai ? 'อัตราเข้าพักเฉลี่ย' : 'Average occupancy'}
          draft={draft}
          min="0"
          max="100"
          suffix="%"
        />
        <MoneyField
          name="averageDailyRate"
          label={isThai ? 'ราคาห้องเฉลี่ยต่อคืน' : 'Average daily rate'}
          draft={draft}
        />
        <NumberField name="restaurantCount" label={isThai ? 'จำนวนห้องอาหาร' : 'Restaurants'} draft={draft} />
        <NumberField
          name="meetingCapacity"
          label={isThai ? 'รองรับงานประชุมสูงสุด' : 'Meeting capacity'}
          draft={draft}
          suffix={isThai ? 'คน' : 'people'}
        />
        <Field label={isThai ? 'สถานะใบอนุญาตโรงแรม' : 'Hotel licence status'}>
          <SelectField name="hotelLicenseStatus" defaultValue={readText(draft.hotelLicenseStatus)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="valid">{isThai ? 'มีและยังมีผล' : 'Valid'}</option>
            <option value="renewal_required">{isThai ? 'มี ต้องต่ออายุ' : 'Renewal required'}</option>
            <option value="application_in_progress">{isThai ? 'อยู่ระหว่างยื่นขอ' : 'Application in progress'}</option>
            <option value="none">{isThai ? 'ไม่มี' : 'None'}</option>
          </SelectField>
        </Field>
        <Field label={isThai ? 'เลขที่ใบอนุญาตโรงแรม' : 'Hotel licence number'}>
          <Input name="hotelLicenseNumber" defaultValue={readText(draft.hotelLicenseNumber)} />
        </Field>
        <Field label={isThai ? 'สัญญาบริหารโรงแรม' : 'Management contract'}>
          <SelectField name="managementContractStatus" defaultValue={readText(draft.managementContractStatus)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="none">{isThai ? 'ไม่มีสัญญาบริหาร' : 'No management contract'}</option>
            <option value="transferable">{isThai ? 'มีและโอนได้' : 'Transferable'}</option>
            <option value="non_transferable">{isThai ? 'มีแต่โอนไม่ได้' : 'Non-transferable'}</option>
            <option value="negotiable">{isThai ? 'เจรจากับผู้บริหารได้' : 'Negotiable'}</option>
          </SelectField>
        </Field>
      </div>
      <Field label={isThai ? 'ประเภทห้องพักและจำนวนโดยสรุป' : 'Room mix summary'}>
        <Textarea
          name="roomTypeSummary"
          defaultValue={readText(draft.roomTypeSummary)}
          placeholder={isThai ? 'เช่น Deluxe 30 ห้อง, Suite 5 ห้อง' : 'e.g. 30 Deluxe rooms, 5 Suites'}
        />
      </Field>
      <CheckboxGrid
        name="hotelFacilities[]"
        options={hotelFacilityOptions}
        selected={readValues(draft['hotelFacilities[]'])}
        isThai={isThai}
      />
    </DetailGroup>
  </>
)

const BusinessLandDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <DetailGroup title={isThai ? 'ขนาด เอกสารสิทธิ์ และศักยภาพแปลง' : 'Land size, title & development potential'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NumberField name="landAreaRai" label={isThai ? 'ไร่' : 'Rai'} draft={draft} />
        <NumberField name="landAreaNgan" label={isThai ? 'งาน' : 'Ngan'} draft={draft} max="3" />
        <NumberField name="landAreaSqWah" label={isThai ? 'ตารางวา' : 'Square wah'} draft={draft} max="99.99" />
        <Field label={isThai ? 'ประเภทเอกสารสิทธิ์' : 'Title deed type'}>
          <SelectField name="titleDeedType" defaultValue={readText(draft.titleDeedType)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="chanote">{isThai ? 'โฉนดที่ดิน (น.ส.4)' : 'Chanote (Nor Sor 4)'}</option>
            <option value="nor_sor_3_gor">น.ส.3 ก.</option>
            <option value="nor_sor_3">น.ส.3</option>
            <option value="other">{isThai ? 'อื่น ๆ' : 'Other'}</option>
          </SelectField>
        </Field>
        <Field label={isThai ? 'รูปทรงแปลง' : 'Plot shape'}>
          <SelectField name="landShape" defaultValue={readText(draft.landShape)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="rectangular">{isThai ? 'สี่เหลี่ยมผืนผ้า' : 'Rectangular'}</option>
            <option value="square">{isThai ? 'สี่เหลี่ยมจัตุรัส' : 'Square'}</option>
            <option value="irregular">{isThai ? 'รูปทรงไม่สม่ำเสมอ' : 'Irregular'}</option>
          </SelectField>
        </Field>
        <NumberField
          name="landWidthM"
          label={isThai ? 'หน้ากว้างแปลง' : 'Plot width'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <NumberField
          name="landDepthM"
          label={isThai ? 'ความลึกแปลง' : 'Plot depth'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <NumberField
          name="frontageM"
          label={isThai ? 'หน้ากว้างติดถนน' : 'Road frontage'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <NumberField
          name="roadWidthM"
          label={isThai ? 'ความกว้างถนน' : 'Road width'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <NumberField name="farRatio" label="FAR" draft={draft} />
        <NumberField name="osrRatio" label="OSR" draft={draft} suffix="%" />
      </div>
    </DetailGroup>
    <DetailGroup title={isThai ? 'ผังเมือง การเข้าถึง และสาธารณูปโภค' : 'Zoning, access & utilities'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={isThai ? 'ทางเข้าแปลง' : 'Access'}>
          <SelectField name="accessType" defaultValue={readText(draft.accessType)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="public_road">{isThai ? 'ติดถนนสาธารณะ' : 'Public road'}</option>
            <option value="private_road">{isThai ? 'ถนนส่วนบุคคล / ภาระจำยอม' : 'Private road / easement'}</option>
            <option value="landlocked">{isThai ? 'ไม่มีทางออกสาธารณะ' : 'Landlocked'}</option>
          </SelectField>
        </Field>
        <Field label={isThai ? 'พื้นผิวถนน' : 'Road surface'}>
          <SelectField name="roadSurface" defaultValue={readText(draft.roadSurface)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="asphalt">{isThai ? 'ลาดยาง' : 'Asphalt'}</option>
            <option value="concrete">{isThai ? 'คอนกรีต' : 'Concrete'}</option>
            <option value="gravel">{isThai ? 'ลูกรัง / หินคลุก' : 'Gravel'}</option>
            <option value="dirt">{isThai ? 'ถนนดิน' : 'Dirt road'}</option>
          </SelectField>
        </Field>
        <Field label={isThai ? 'สถานะการถมดิน' : 'Land fill status'}>
          <SelectField name="landFillStatus" defaultValue={readText(draft.landFillStatus)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="filled">{isThai ? 'ถมแล้ว' : 'Filled'}</option>
            <option value="partially_filled">{isThai ? 'ถมบางส่วน' : 'Partially filled'}</option>
            <option value="not_filled">{isThai ? 'ยังไม่ถม' : 'Not filled'}</option>
          </SelectField>
        </Field>
        <YesNoField
          name="electricityAvailable"
          label={isThai ? 'ไฟฟ้าเข้าถึง' : 'Electricity'}
          draft={draft}
          isThai={isThai}
        />
        <YesNoField name="waterAvailable" label={isThai ? 'ประปาเข้าถึง' : 'Water'} draft={draft} isThai={isThai} />
        <YesNoField
          name="drainageAvailable"
          label={isThai ? 'มีระบบระบายน้ำ' : 'Drainage'}
          draft={draft}
          isThai={isThai}
        />
        <Field label={isThai ? 'สีผังเมือง / โซนนิ่ง' : 'Planning zone / zoning color'}>
          <Input
            name="zoningColor"
            defaultValue={readText(draft.zoningColor)}
            placeholder={isThai ? 'เช่น สีม่วง สีแดง' : 'e.g. purple or red zone'}
          />
        </Field>
        <Field label={isThai ? 'การใช้ประโยชน์ปัจจุบัน' : 'Current land use'}>
          <Input name="currentLandUse" defaultValue={readText(draft.currentLandUse)} />
        </Field>
      </div>
      <Field
        label={
          isThai
            ? 'สิ่งปลูกสร้างเดิม ข้อจำกัด หรือหมายเหตุพัฒนาโครงการ'
            : 'Existing structures, restrictions or development notes'
        }
      >
        <Textarea name="existingStructures" defaultValue={readText(draft.existingStructures)} />
      </Field>
    </DetailGroup>
  </>
)

const BuildingDimensions = ({ draft, isThai }: CommonProps) => (
  <DetailGroup title={isThai ? 'ขนาดอาคารและทางเข้า' : 'Building & access dimensions'}>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <NumberField
        name="buildingWidthM"
        label={isThai ? 'หน้ากว้างอาคาร' : 'Building width'}
        draft={draft}
        suffix={isThai ? 'ม.' : 'm'}
      />
      <NumberField
        name="buildingDepthM"
        label={isThai ? 'ความลึกอาคาร' : 'Building depth'}
        draft={draft}
        suffix={isThai ? 'ม.' : 'm'}
      />
      <NumberField
        name="frontageM"
        label={isThai ? 'หน้ากว้างติดถนน' : 'Road frontage'}
        draft={draft}
        suffix={isThai ? 'ม.' : 'm'}
      />
      <NumberField
        name="roadWidthM"
        label={isThai ? 'ความกว้างถนน' : 'Road width'}
        draft={draft}
        suffix={isThai ? 'ม.' : 'm'}
      />
    </div>
  </DetailGroup>
)

const TruckSizeField = ({ draft, isThai }: CommonProps) => (
  <Field label={isThai ? 'รถใหญ่สุดที่เข้าถึงได้' : 'Largest truck access'}>
    <SelectField name="maxTruckSize" defaultValue={readText(draft.maxTruckSize)}>
      <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
      <option value="pickup">{isThai ? 'รถกระบะ' : 'Pickup'}</option>
      <option value="six_wheel">{isThai ? 'รถ 6 ล้อ' : '6-wheel truck'}</option>
      <option value="ten_wheel">{isThai ? 'รถ 10 ล้อ' : '10-wheel truck'}</option>
      <option value="trailer">{isThai ? 'รถพ่วง / เทรลเลอร์' : 'Trailer'}</option>
    </SelectField>
  </Field>
)

const UnitPosition = ({ draft, isThai }: CommonProps) => (
  <Field label={isThai ? 'ตำแหน่งยูนิต' : 'Unit position'}>
    <SelectField name="unitPosition" defaultValue={readText(draft.unitPosition)}>
      <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
      <option value="middle">{isThai ? 'ยูนิตกลาง' : 'Middle unit'}</option>
      <option value="end">{isThai ? 'ยูนิตริม' : 'End unit'}</option>
      <option value="corner">{isThai ? 'หัวมุม' : 'Corner unit'}</option>
      <option value="standalone">{isThai ? 'อาคารเดี่ยว' : 'Standalone'}</option>
    </SelectField>
  </Field>
)

const DetailGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 border-b border-orange-100 pb-7 last:border-b-0 last:pb-0 dark:border-orange-900/50">
    <h3 className="font-sarabun text-sm font-semibold text-orange-950 dark:text-orange-100">{title}</h3>
    {children}
  </div>
)

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-2 font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">
    <span>{label}</span>
    {children}
  </label>
)

const SelectField = ({
  name,
  defaultValue,
  children,
}: {
  name: string
  defaultValue: string
  children: React.ReactNode
}) => (
  <Select name={name} defaultValue={defaultValue} className="[&_select]:h-11 [&_select]:rounded-2xl">
    {children}
  </Select>
)

const YesNoSelect = ({ name, defaultValue, isThai }: { name: string; defaultValue: string; isThai: boolean }) => (
  <SelectField name={name} defaultValue={defaultValue}>
    <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
    <option value="yes">{isThai ? 'มี / ใช่' : 'Yes'}</option>
    <option value="no">{isThai ? 'ไม่มี / ไม่ใช่' : 'No'}</option>
  </SelectField>
)

const YesNoField = ({
  name,
  label,
  draft,
  isThai,
}: {
  name: string
  label: string
  draft: ListingDraft
  isThai: boolean
}) => (
  <Field label={label}>
    <YesNoSelect name={name} defaultValue={readText(draft[name])} isThai={isThai} />
  </Field>
)

const NumberField = ({
  name,
  label,
  draft,
  suffix,
  min = '0',
  max,
}: {
  name: string
  label: string
  draft: ListingDraft
  suffix?: string
  min?: string
  max?: string
}) => (
  <Field label={label}>
    <div className="relative">
      <Input
        name={name}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step="any"
        defaultValue={readText(draft[name])}
        placeholder="0"
        className={suffix ? 'pe-20!' : undefined}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center font-sarabun text-xs text-neutral-500">
          {suffix}
        </span>
      ) : null}
    </div>
  </Field>
)

const MoneyField = ({ name, label, draft }: { name: string; label: string; draft: ListingDraft }) => (
  <Field label={label}>
    <div className="relative">
      <Input
        name={name}
        defaultValue={readText(draft[name])}
        inputMode="decimal"
        pattern="[0-9,]*(\.[0-9]{1,2})?"
        placeholder="0"
        className="pe-16!"
      />
      <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center font-sarabun text-xs text-neutral-500">
        THB
      </span>
    </div>
  </Field>
)

const CheckboxGrid = ({
  name,
  options,
  selected,
  isThai,
}: {
  name: string
  options: Option[]
  selected: string[]
  isThai: boolean
}) => (
  <div>
    <input type="hidden" name={name} value="" />
    <p className="mb-3 font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">
      {isThai ? 'เลือกสิ่งที่มีหรือธุรกิจที่รองรับ' : 'Select available features or permitted businesses'}
    </p>
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => (
        <label
          key={option.code}
          className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 transition hover:border-orange-300 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <input
            type="checkbox"
            name={name}
            value={option.code}
            defaultChecked={selected.includes(option.code)}
            className="peer sr-only"
          />
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-neutral-300 text-transparent transition peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:text-white dark:border-neutral-600">
            <CheckIcon className="size-4" />
          </span>
          <span className="font-sarabun text-sm text-neutral-700 dark:text-neutral-200">
            {isThai ? option.th : option.en}
          </span>
        </label>
      ))}
    </div>
  </div>
)

const readText = (value: ListingDraft[string] | undefined) => (Array.isArray(value) ? value[0] || '' : value || '')
const readValues = (value: ListingDraft[string] | undefined) => (value ? (Array.isArray(value) ? value : [value]) : [])

export default BusinessDetails
