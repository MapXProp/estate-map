'use client'

import type { ListingDraft } from '@/lib/listingDraft'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Textarea from '@/shared/Textarea'
import { HomeModernIcon } from '@heroicons/react/24/outline'

type HomesDetailsProps = {
  draft: ListingDraft
  propertyTypeCode: string
  isThai: boolean
}

const houseTypes = ['detached_house', 'semi_detached_house', 'townhouse']

const HomesDetails = ({ draft, propertyTypeCode, isThai }: HomesDetailsProps) => {
  const isLand = propertyTypeCode === 'land'
  const isHouse = houseTypes.includes(propertyTypeCode)

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#9DDEAA] bg-[#F7FCF8] shadow-sm dark:border-[#2A7A3D] dark:bg-[#173520]/60">
      <div className="border-b border-[#C9F0D1] bg-white/80 p-5 sm:p-7 dark:border-[#205E30] dark:bg-neutral-900/75">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#37A14F] text-white">
            <HomeModernIcon className="size-5" />
          </span>
          <div>
            <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {isThai ? 'ข้อมูลเพิ่มเติมของอสังหา' : 'Additional property details'}
            </h2>
            <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {isThai
                ? 'ช่องกรอกจะเปลี่ยนตามหมวดที่เลือก เพื่อให้ผู้ค้นหาเห็นข้อมูลสำคัญครบในหน้าเดียว'
                : 'Fields adapt to the selected category so buyers and tenants can compare the right details.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        {isLand ? (
          <LandDetails draft={draft} isThai={isThai} />
        ) : (
          <PropertyStatusDetails draft={draft} isThai={isThai} />
        )}

        {isHouse ? <HouseDetails draft={draft} propertyTypeCode={propertyTypeCode} isThai={isThai} /> : null}
        {propertyTypeCode === 'condo' ? <CondoDetails draft={draft} isThai={isThai} /> : null}
        {propertyTypeCode === 'shophouse' ? <ShophouseDetails draft={draft} isThai={isThai} /> : null}
        {propertyTypeCode === 'home_office' ? <HomeOfficeDetails draft={draft} isThai={isThai} /> : null}
      </div>
    </section>
  )
}

const PropertyStatusDetails = ({ draft, isThai }: CommonProps) => (
  <DetailGroup title={isThai ? 'สภาพทรัพย์และความพร้อม' : 'Condition & availability'}>
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
          <option value="vacant">{isThai ? 'ว่าง พร้อมเข้าอยู่' : 'Vacant'}</option>
          <option value="owner_occupied">{isThai ? 'เจ้าของพักอยู่' : 'Owner occupied'}</option>
          <option value="tenant_occupied">{isThai ? 'มีผู้เช่าอยู่' : 'Tenant occupied'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'พร้อมเข้าอยู่ / พร้อมโอนวันที่' : 'Available from'}>
        <Input name="availableFrom" type="date" defaultValue={readText(draft.availableFrom)} />
      </Field>
      <NumberField
        name="yearBuilt"
        label={isThai ? 'ปีที่สร้างเสร็จ (พ.ศ.)' : 'Year completed'}
        draft={draft}
        min="1900"
        max="2600"
      />
      <NumberField
        name="renovatedYear"
        label={isThai ? 'ปีที่ปรับปรุงล่าสุด (ถ้ามี)' : 'Last renovated year'}
        draft={draft}
        min="1900"
        max="2600"
      />
      <Field label={isThai ? 'รูปแบบสิทธิ์' : 'Tenure'}>
        <SelectField name="tenureType" defaultValue={readText(draft.tenureType)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="freehold">{isThai ? 'กรรมสิทธิ์ (Freehold)' : 'Freehold'}</option>
          <option value="leasehold">{isThai ? 'สิทธิการเช่า (Leasehold)' : 'Leasehold'}</option>
          <option value="right_of_possession">{isThai ? 'สิทธิครอบครอง' : 'Right of possession'}</option>
          <option value="other">{isThai ? 'อื่น ๆ' : 'Other'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'ทิศหน้าทรัพย์ / ระเบียงหลัก' : 'Main facing direction'}>
        <DirectionSelect name="facingDirection" defaultValue={readText(draft.facingDirection)} isThai={isThai} />
      </Field>
    </div>
  </DetailGroup>
)

const HouseDetails = ({ draft, propertyTypeCode, isThai }: CommonProps & { propertyTypeCode: string }) => (
  <>
    <DetailGroup title={isThai ? 'ลักษณะบ้านและพื้นที่' : 'House & plot'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {propertyTypeCode === 'detached_house' ? (
          <Field label={isThai ? 'รูปแบบบ้าน' : 'House style'}>
            <SelectField name="houseStyleCode" defaultValue={readText(draft.houseStyleCode)}>
              <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
              <option value="standard_house">{isThai ? 'บ้านเดี่ยวทั่วไป' : 'Standard detached house'}</option>
              <option value="villa">{isThai ? 'วิลล่า' : 'Villa'}</option>
              <option value="pool_villa">{isThai ? 'พูลวิลล่า' : 'Pool villa'}</option>
              <option value="vacation_home">{isThai ? 'บ้านพักตากอากาศ' : 'Vacation home'}</option>
            </SelectField>
          </Field>
        ) : null}
        {propertyTypeCode !== 'detached_house' ? (
          <Field label={isThai ? 'ตำแหน่งยูนิต' : 'Unit position'}>
            <SelectField name="unitPosition" defaultValue={readText(draft.unitPosition)}>
              <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
              <option value="middle">{isThai ? 'ยูนิตกลาง' : 'Middle unit'}</option>
              <option value="end">{isThai ? 'ยูนิตริม' : 'End unit'}</option>
              <option value="corner">{isThai ? 'หัวมุม' : 'Corner unit'}</option>
            </SelectField>
          </Field>
        ) : null}
        <NumberField
          name="landWidthM"
          label={isThai ? 'หน้ากว้างที่ดิน' : 'Plot width'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <NumberField
          name="landDepthM"
          label={isThai ? 'ความลึกที่ดิน' : 'Plot depth'}
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
          label={isThai ? 'ความกว้างถนนหน้าโครงการ' : 'Road width'}
          draft={draft}
          suffix={isThai ? 'ม.' : 'm'}
        />
        <Field label={isThai ? 'อยู่ในโครงการ / หมู่บ้าน' : 'Inside a managed project'}>
          <YesNoSelect name="gatedCommunity" defaultValue={readText(draft.gatedCommunity)} isThai={isThai} />
        </Field>
        <MoneyField
          name="projectCommonFeeMonthly"
          label={isThai ? 'ค่าส่วนกลางต่อเดือน' : 'Monthly common fee'}
          draft={draft}
        />
      </div>
    </DetailGroup>

    <DetailGroup title={isThai ? 'พื้นที่ใช้งานในบ้าน' : 'Inside the house'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={isThai ? 'รูปแบบครัว' : 'Kitchen type'}>
          <SelectField name="kitchenType" defaultValue={readText(draft.kitchenType)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="thai_kitchen">{isThai ? 'ครัวไทยแยก' : 'Separate Thai kitchen'}</option>
            <option value="closed_kitchen">{isThai ? 'ครัวปิด' : 'Closed kitchen'}</option>
            <option value="open_kitchen">{isThai ? 'ครัวเปิด' : 'Open kitchen'}</option>
            <option value="none">{isThai ? 'ไม่มีครัว' : 'No kitchen'}</option>
          </SelectField>
        </Field>
        <NumberField name="maidRoomCount" label={isThai ? 'ห้องแม่บ้าน' : 'Maid rooms'} draft={draft} />
        <Field label={isThai ? 'สวนส่วนตัว' : 'Private garden'}>
          <YesNoSelect name="privateGarden" defaultValue={readText(draft.privateGarden)} isThai={isThai} />
        </Field>
        <Field label={isThai ? 'สระว่ายน้ำส่วนตัว' : 'Private pool'}>
          <YesNoSelect name="privatePool" defaultValue={readText(draft.privatePool)} isThai={isThai} />
        </Field>
      </div>
    </DetailGroup>
  </>
)

const CondoDetails = ({ draft, isThai }: CommonProps) => (
  <DetailGroup title={isThai ? 'ข้อมูลยูนิตและโครงการ' : 'Unit & project'}>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label={isThai ? 'รูปแบบยูนิต' : 'Unit type'}>
        <SelectField name="condoUnitType" defaultValue={readText(draft.condoUnitType)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="studio">{isThai ? 'สตูดิโอ' : 'Studio'}</option>
          <option value="standard">{isThai ? 'ห้องชุดทั่วไป' : 'Standard unit'}</option>
          <option value="duplex">{isThai ? 'ดูเพล็กซ์' : 'Duplex'}</option>
          <option value="loft">{isThai ? 'ลอฟต์' : 'Loft'}</option>
          <option value="penthouse">{isThai ? 'เพนต์เฮาส์' : 'Penthouse'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'อาคาร / ทาวเวอร์' : 'Building / tower'}>
        <Input
          name="buildingTower"
          defaultValue={readText(draft.buildingTower)}
          placeholder={isThai ? 'เช่น อาคาร A' : 'e.g. Tower A'}
        />
      </Field>
      <Field label={isThai ? 'ทิศระเบียง' : 'Balcony direction'}>
        <DirectionSelect name="balconyDirection" defaultValue={readText(draft.balconyDirection)} isThai={isThai} />
      </Field>
      <Field label={isThai ? 'วิวหลัก' : 'Main view'}>
        <SelectField name="viewType" defaultValue={readText(draft.viewType)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="city">{isThai ? 'วิวเมือง' : 'City'}</option>
          <option value="garden">{isThai ? 'วิวสวน' : 'Garden'}</option>
          <option value="pool">{isThai ? 'วิวสระ' : 'Pool'}</option>
          <option value="river">{isThai ? 'วิวแม่น้ำ' : 'River'}</option>
          <option value="sea">{isThai ? 'วิวทะเล' : 'Sea'}</option>
          <option value="mountain">{isThai ? 'วิวภูเขา' : 'Mountain'}</option>
          <option value="open">{isThai ? 'วิวโล่ง' : 'Open view'}</option>
          <option value="other">{isThai ? 'อื่น ๆ' : 'Other'}</option>
        </SelectField>
      </Field>
      <Field label={isThai ? 'โควตากรรมสิทธิ์' : 'Ownership quota'}>
        <SelectField name="ownershipQuota" defaultValue={readText(draft.ownershipQuota)}>
          <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
          <option value="thai">{isThai ? 'โควตาคนไทย' : 'Thai quota'}</option>
          <option value="foreign">{isThai ? 'โควตาต่างชาติ' : 'Foreign quota'}</option>
          <option value="leasehold">{isThai ? 'สิทธิการเช่า (Leasehold)' : 'Leasehold'}</option>
        </SelectField>
      </Field>
      <MoneyField name="commonFeeMonthly" label={isThai ? 'ค่าส่วนกลางต่อเดือน' : 'Monthly common fee'} draft={draft} />
      <MoneyField
        name="sinkingFundPerSqm"
        label={isThai ? 'เงินกองทุนต่อตร.ม.' : 'Sinking fund per sq.m.'}
        draft={draft}
      />
      <Field label={isThai ? 'มีระเบียงส่วนตัว' : 'Private balcony'}>
        <YesNoSelect name="hasBalcony" defaultValue={readText(draft.hasBalcony)} isThai={isThai} />
      </Field>
    </div>
  </DetailGroup>
)

const ShophouseDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <BuildingDimensions draft={draft} isThai={isThai} />
    <DetailGroup title={isThai ? 'การใช้งานเชิงพาณิชย์' : 'Commercial use'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <UnitPosition draft={draft} isThai={isThai} />
        <Field label={isThai ? 'มีชั้นลอย' : 'Mezzanine'}>
          <YesNoSelect name="hasMezzanine" defaultValue={readText(draft.hasMezzanine)} isThai={isThai} />
        </Field>
        <Field label={isThai ? 'มีลิฟต์' : 'Elevator'}>
          <YesNoSelect name="hasElevator" defaultValue={readText(draft.hasElevator)} isThai={isThai} />
        </Field>
        <Field label={isThai ? 'มีพื้นที่ติดป้ายหน้าร้าน' : 'Storefront signage space'}>
          <YesNoSelect name="signageSpace" defaultValue={readText(draft.signageSpace)} isThai={isThai} />
        </Field>
        <Field label={isThai ? 'รองรับไฟฟ้า 3 เฟส' : 'Three-phase power'}>
          <YesNoSelect name="threePhasePower" defaultValue={readText(draft.threePhasePower)} isThai={isThai} />
        </Field>
      </div>
    </DetailGroup>
  </>
)

const HomeOfficeDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <BuildingDimensions draft={draft} isThai={isThai} />
    <DetailGroup title={isThai ? 'พื้นที่สำนักงาน' : 'Office facilities'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <UnitPosition draft={draft} isThai={isThai} />
        <NumberField name="officeRoomCount" label={isThai ? 'จำนวนห้องทำงาน' : 'Office rooms'} draft={draft} />
        <NumberField name="meetingRoomCount" label={isThai ? 'จำนวนห้องประชุม' : 'Meeting rooms'} draft={draft} />
        <Field label={isThai ? 'มีพื้นที่แพนทรี' : 'Pantry'}>
          <YesNoSelect name="hasPantry" defaultValue={readText(draft.hasPantry)} isThai={isThai} />
        </Field>
        <Field label={isThai ? 'มีลิฟต์' : 'Elevator'}>
          <YesNoSelect name="hasElevator" defaultValue={readText(draft.hasElevator)} isThai={isThai} />
        </Field>
        <MoneyField
          name="projectCommonFeeMonthly"
          label={isThai ? 'ค่าส่วนกลางต่อเดือน' : 'Monthly common fee'}
          draft={draft}
        />
      </div>
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

const LandDetails = ({ draft, isThai }: CommonProps) => (
  <>
    <DetailGroup title={isThai ? 'ขนาดที่ดินแบบไทย' : 'Land size in Thai units'}>
      <p className="font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        {isThai
          ? 'กรอกหน่วยที่สะดวก ระบบจะคำนวณเป็นตารางเมตรให้อัตโนมัติตอนบันทึก'
          : 'Enter Thai land units and the total square metres will be calculated when this step is saved.'}
      </p>
      <div className="grid gap-5 sm:grid-cols-3">
        <NumberField name="landAreaRai" label={isThai ? 'ไร่' : 'Rai'} draft={draft} />
        <NumberField name="landAreaNgan" label={isThai ? 'งาน' : 'Ngan'} draft={draft} max="3" />
        <NumberField name="landAreaSqWah" label={isThai ? 'ตารางวา' : 'Square wah'} draft={draft} max="99.99" />
      </div>
    </DetailGroup>

    <DetailGroup title={isThai ? 'เอกสารสิทธิ์และลักษณะแปลง' : 'Title deed & plot'}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={isThai ? 'ประเภทเอกสารสิทธิ์' : 'Title deed type'}>
          <SelectField name="titleDeedType" defaultValue={readText(draft.titleDeedType)}>
            <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
            <option value="chanote">{isThai ? 'โฉนดที่ดิน (น.ส.4)' : 'Chanote (Nor Sor 4)'}</option>
            <option value="nor_sor_3_gor">{isThai ? 'น.ส.3 ก.' : 'Nor Sor 3 Gor'}</option>
            <option value="nor_sor_3">{isThai ? 'น.ส.3' : 'Nor Sor 3'}</option>
            <option value="sor_kor_1">{isThai ? 'ส.ค.1' : 'Sor Kor 1'}</option>
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
      </div>
    </DetailGroup>

    <DetailGroup title={isThai ? 'การเข้าถึงและสาธารณูปโภค' : 'Access & utilities'}>
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
            <option value="none">{isThai ? 'ไม่มีถนน' : 'No road'}</option>
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
        <Field label={isThai ? 'ไฟฟ้าเข้าถึง' : 'Electricity available'}>
          <YesNoSelect
            name="electricityAvailable"
            defaultValue={readText(draft.electricityAvailable)}
            isThai={isThai}
          />
        </Field>
        <Field label={isThai ? 'ประปาเข้าถึง' : 'Water available'}>
          <YesNoSelect name="waterAvailable" defaultValue={readText(draft.waterAvailable)} isThai={isThai} />
        </Field>
        <Field label={isThai ? 'มีระบบระบายน้ำ' : 'Drainage available'}>
          <YesNoSelect name="drainageAvailable" defaultValue={readText(draft.drainageAvailable)} isThai={isThai} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isThai ? 'สีผังเมือง / โซนนิ่ง (ถ้าทราบ)' : 'Planning zone / zoning color'}>
          <Input
            name="zoningColor"
            defaultValue={readText(draft.zoningColor)}
            placeholder={isThai ? 'เช่น สีเหลือง ย.4' : 'e.g. Yellow zone Y.4'}
          />
        </Field>
        <Field label={isThai ? 'การใช้ประโยชน์ปัจจุบัน' : 'Current land use'}>
          <Input
            name="currentLandUse"
            defaultValue={readText(draft.currentLandUse)}
            placeholder={isThai ? 'เช่น ที่ดินเปล่า สวน หรือที่นา' : 'e.g. vacant land, orchard or paddy field'}
          />
        </Field>
      </div>
      <Field label={isThai ? 'สิ่งปลูกสร้างเดิมหรือข้อสังเกตของแปลง' : 'Existing structures or plot notes'}>
        <Textarea name="existingStructures" defaultValue={readText(draft.existingStructures)} />
      </Field>
    </DetailGroup>
  </>
)

type CommonProps = { draft: ListingDraft; isThai: boolean }

const DetailGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 border-b border-[#C9F0D1] pb-7 last:border-b-0 last:pb-0 dark:border-[#205E30]">
    <h3 className="font-sarabun text-sm font-semibold text-[#17662E] dark:text-[#C9F0D1]">{title}</h3>
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

const DirectionSelect = ({ name, defaultValue, isThai }: { name: string; defaultValue: string; isThai: boolean }) => (
  <SelectField name={name} defaultValue={defaultValue}>
    <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
    <option value="north">{isThai ? 'เหนือ' : 'North'}</option>
    <option value="northeast">{isThai ? 'ตะวันออกเฉียงเหนือ' : 'Northeast'}</option>
    <option value="east">{isThai ? 'ตะวันออก' : 'East'}</option>
    <option value="southeast">{isThai ? 'ตะวันออกเฉียงใต้' : 'Southeast'}</option>
    <option value="south">{isThai ? 'ใต้' : 'South'}</option>
    <option value="southwest">{isThai ? 'ตะวันตกเฉียงใต้' : 'Southwest'}</option>
    <option value="west">{isThai ? 'ตะวันตก' : 'West'}</option>
    <option value="northwest">{isThai ? 'ตะวันตกเฉียงเหนือ' : 'Northwest'}</option>
  </SelectField>
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
        className={suffix ? 'pe-14!' : undefined}
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

const readText = (value: ListingDraft[string]) => (Array.isArray(value) ? value[0] || '' : value || '')

export default HomesDetails
