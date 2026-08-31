'use client'

import type { ListingDraft } from '@/lib/listingDraft'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Textarea from '@/shared/Textarea'
import { BuildingOffice2Icon, CheckIcon } from '@heroicons/react/24/outline'

type MonthlyStayDetailsProps = {
  draft: ListingDraft
  propertyTypeCode: string
  listingScope: string
  accommodationModel: string
  isThai: boolean
}

const services = [
  { code: 'housekeeping', th: 'แม่บ้าน', en: 'Housekeeping' },
  { code: 'linen_change', th: 'เปลี่ยนผ้าและเครื่องนอน', en: 'Linen changes' },
  { code: 'reception', th: 'Reception', en: 'Reception' },
  { code: 'breakfast', th: 'อาหารเช้า', en: 'Breakfast' },
  { code: 'water', th: 'ค่าน้ำ', en: 'Water' },
  { code: 'electricity', th: 'ค่าไฟ', en: 'Electricity' },
  { code: 'internet', th: 'อินเทอร์เน็ต', en: 'Internet' },
  { code: 'shuttle', th: 'รถรับส่ง', en: 'Shuttle' },
]

const sharedFacilities = [
  { code: 'bathroom', th: 'ห้องน้ำรวม', en: 'Shared bathroom' },
  { code: 'kitchen', th: 'ครัวรวม', en: 'Shared kitchen' },
  { code: 'living_area', th: 'พื้นที่นั่งเล่นรวม', en: 'Shared living area' },
  { code: 'entrance', th: 'ทางเข้าร่วม', en: 'Shared entrance' },
]

const residentGroups = [
  { code: 'students', th: 'นักเรียน / นักศึกษา', en: 'Students' },
  { code: 'workers', th: 'คนทำงาน', en: 'Workers' },
  { code: 'male', th: 'ชาย', en: 'Male' },
  { code: 'female', th: 'หญิง', en: 'Female' },
  { code: 'mixed', th: 'พักรวมได้', en: 'Mixed residents' },
]

const MonthlyStayDetails = ({
  draft,
  propertyTypeCode,
  listingScope,
  accommodationModel,
  isThai,
}: MonthlyStayDetailsProps) => {
  const isMultiUnit = listingScope === 'multi_unit' || listingScope === 'whole_property'
  const isServicedApartment = propertyTypeCode === 'apartment' && accommodationModel === 'serviced'

  return (
    <section className="overflow-hidden rounded-[28px] border border-sky-200 bg-sky-50/45 shadow-sm dark:border-sky-900/70 dark:bg-sky-950/15">
      <div className="border-b border-sky-100 bg-white/75 p-5 sm:p-7 dark:border-sky-900/60 dark:bg-neutral-900/70">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white">
            <BuildingOffice2Icon className="size-5" />
          </span>
          <div>
            <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {isThai ? 'ข้อมูลเฉพาะสำหรับที่พักรายเดือน' : 'Monthly-stay details'}
            </h2>
            <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {isThai
                ? 'ข้อมูลส่วนนี้เปลี่ยนตามประเภทที่เลือกและใช้แสดงในหน้าประกาศจริง'
                : 'These fields adapt to the selected type and appear on the live listing.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        <DetailGroup title={isThai ? 'ห้องและวันพร้อมเข้าอยู่' : 'Room & availability'}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={isThai ? 'รูปแบบห้อง' : 'Room type'}>
              <Select
                name="roomTypeCode"
                defaultValue={readText(draft.roomTypeCode)}
                className="[&_select]:h-11 [&_select]:rounded-2xl"
              >
                <option value="">{isThai ? 'เลือกประเภทห้อง' : 'Choose a room type'}</option>
                <option value="room">{isThai ? 'ห้องทั่วไป' : 'Room'}</option>
                <option value="studio">{isThai ? 'สตูดิโอ' : 'Studio'}</option>
                <option value="one_bedroom">{isThai ? '1 ห้องนอน' : '1 bedroom'}</option>
                <option value="two_bedroom">{isThai ? '2 ห้องนอน' : '2 bedrooms'}</option>
                <option value="shared_room">{isThai ? 'ห้องพักร่วม' : 'Shared room'}</option>
                <option value="suite">{isThai ? 'ห้องสวีต' : 'Suite'}</option>
                <option value="other">{isThai ? 'อื่น ๆ' : 'Other'}</option>
              </Select>
            </Field>
            <Field label={isThai ? 'พร้อมเข้าอยู่วันที่' : 'Available from'}>
              <Input name="availableFrom" type="date" defaultValue={readText(draft.availableFrom)} />
            </Field>
            <Field label={isThai ? 'จำนวนห้องว่าง' : 'Rooms available'}>
              <Input
                name="availableRoomCount"
                type="number"
                min="0"
                defaultValue={readText(draft.availableRoomCount)}
                placeholder="1"
              />
            </Field>
            <Field label={isThai ? 'จำนวนผู้พักสูงสุดต่อห้อง' : 'Maximum occupants per room'}>
              <Input name="Guests" type="number" min="1" defaultValue={readText(draft.Guests)} placeholder="2" />
            </Field>
            <Field label={isThai ? 'ลักษณะห้องน้ำ' : 'Bathroom arrangement'}>
              <Select
                name="bathroomType"
                defaultValue={readText(draft.bathroomType)}
                className="[&_select]:h-11 [&_select]:rounded-2xl"
              >
                <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                <option value="private">{isThai ? 'ห้องน้ำส่วนตัว' : 'Private bathroom'}</option>
                <option value="shared">{isThai ? 'ห้องน้ำรวม' : 'Shared bathroom'}</option>
              </Select>
            </Field>
            <Field label={isThai ? 'สภาพห้อง' : 'Room condition'}>
              <Select
                name="propertyCondition"
                defaultValue={readText(draft.propertyCondition)}
                className="[&_select]:h-11 [&_select]:rounded-2xl"
              >
                <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                <option value="new">{isThai ? 'ใหม่ / เพิ่งปรับปรุง' : 'New or renovated'}</option>
                <option value="good">{isThai ? 'สภาพดี' : 'Good'}</option>
                <option value="needs_renovation">{isThai ? 'ต้องปรับปรุง' : 'Needs renovation'}</option>
              </Select>
            </Field>
          </div>
          {isMultiUnit ? (
            <Field label={isThai ? 'รายละเอียดห้องแต่ละแบบ' : 'Room inventory by type'}>
              <Textarea
                name="roomInventoryDetails"
                defaultValue={readText(draft.roomInventoryDetails)}
                placeholder={
                  isThai
                    ? 'เช่น Studio 24 ตร.ม. ว่าง 3 ห้อง เดือนละ 7,500 บาท; 1 ห้องนอน 35 ตร.ม. ว่าง 1 ห้อง เดือนละ 12,000 บาท'
                    : 'e.g. Studio, 24 sq.m., 3 available, THB 7,500/month'
                }
              />
            </Field>
          ) : null}
        </DetailGroup>

        <DetailGroup title={isThai ? 'ค่าใช้จ่ายก่อนเข้าอยู่และค่าสาธารณูปโภค' : 'Move-in costs & utilities'}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <MoneyField name="securityDepositAmount" label={isThai ? 'เงินประกัน' : 'Security deposit'} draft={draft} />
            <Field label={isThai ? 'ค่าเช่าล่วงหน้า (เดือน)' : 'Advance rent (months)'}>
              <Input
                name="advanceRentMonths"
                type="number"
                min="0"
                step="1"
                defaultValue={readText(draft.advanceRentMonths)}
                placeholder="1"
              />
            </Field>
            <MoneyField
              name="utilityDepositAmount"
              label={isThai ? 'ประกันค่าน้ำ/ไฟ' : 'Utility deposit'}
              draft={draft}
            />
            <Field label={isThai ? 'การคิดค่าน้ำ' : 'Water billing'}>
              <Select
                name="waterBillingType"
                defaultValue={readText(draft.waterBillingType)}
                className="[&_select]:h-11 [&_select]:rounded-2xl"
              >
                <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                <option value="included">{isThai ? 'รวมในค่าเช่า' : 'Included'}</option>
                <option value="government_rate">{isThai ? 'ตามบิลจริง' : 'Government bill'}</option>
                <option value="per_unit">{isThai ? 'คิดต่อหน่วย' : 'Per unit'}</option>
                <option value="flat_rate">{isThai ? 'เหมาจ่าย' : 'Flat rate'}</option>
              </Select>
            </Field>
            <MoneyField
              name="waterRate"
              label={isThai ? 'ค่าน้ำต่อหน่วย/เดือน' : 'Water rate per unit/month'}
              draft={draft}
            />
            <Field label={isThai ? 'การคิดค่าไฟ' : 'Electricity billing'}>
              <Select
                name="electricityBillingType"
                defaultValue={readText(draft.electricityBillingType)}
                className="[&_select]:h-11 [&_select]:rounded-2xl"
              >
                <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                <option value="included">{isThai ? 'รวมในค่าเช่า' : 'Included'}</option>
                <option value="government_rate">{isThai ? 'ตามบิลการไฟฟ้า' : 'Government bill'}</option>
                <option value="per_unit">{isThai ? 'คิดต่อหน่วย' : 'Per unit'}</option>
              </Select>
            </Field>
            <MoneyField
              name="electricityRate"
              label={isThai ? 'ค่าไฟต่อหน่วย' : 'Electricity rate per unit'}
              draft={draft}
            />
            <Field label={isThai ? 'รวมค่าสาธารณูปโภคหลักหรือไม่' : 'Main utilities included'}>
              <YesNoSelect name="utilitiesIncluded" defaultValue={readText(draft.utilitiesIncluded)} isThai={isThai} />
            </Field>
            <MoneyField
              name="parkingFeeMonthly"
              label={isThai ? 'ค่าที่จอดรถต่อเดือน' : 'Monthly parking fee'}
              draft={draft}
            />
            <Field label={isThai ? 'มีบริการซักรีดหรือไม่' : 'Laundry available'}>
              <YesNoSelect name="laundryAvailable" defaultValue={readText(draft.laundryAvailable)} isThai={isThai} />
            </Field>
          </div>
        </DetailGroup>

        <DetailGroup title={isThai ? 'นโยบายผู้พัก' : 'Resident policies'}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={isThai ? 'สัตว์เลี้ยง' : 'Pets'}>
              <Select
                name="Pets"
                defaultValue={readText(draft.Pets)}
                className="[&_select]:h-11 [&_select]:rounded-2xl"
              >
                <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                <option value="allowed">{isThai ? 'เลี้ยงได้' : 'Allowed'}</option>
                <option value="case_by_case">{isThai ? 'สอบถามเป็นกรณี' : 'Case by case'}</option>
                <option value="not_allowed">{isThai ? 'ไม่อนุญาต' : 'Not allowed'}</option>
              </Select>
            </Field>
            <Field label={isThai ? 'การสูบบุหรี่' : 'Smoking'}>
              <Select
                name="smokingPolicy"
                defaultValue={readText(draft.smokingPolicy)}
                className="[&_select]:h-11 [&_select]:rounded-2xl"
              >
                <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                <option value="not_allowed">{isThai ? 'ห้ามสูบ' : 'Not allowed'}</option>
                <option value="designated_area">{isThai ? 'สูบได้เฉพาะจุด' : 'Designated area only'}</option>
                <option value="allowed">{isThai ? 'อนุญาต' : 'Allowed'}</option>
              </Select>
            </Field>
            <Field label={isThai ? 'ผู้เช่าต่างชาติ' : 'Foreign tenants'}>
              <YesNoSelect
                name="foreignTenantAllowed"
                defaultValue={readText(draft.foreignTenantAllowed)}
                isThai={isThai}
              />
            </Field>
          </div>
          <Field label={isThai ? 'กฎผู้พัก ผู้มาติดต่อ และเงื่อนไขสำคัญ' : 'Resident, visitor and key rules'}>
            <Textarea name="visitorPolicy" defaultValue={readText(draft.visitorPolicy)} />
          </Field>
        </DetailGroup>

        {propertyTypeCode === 'rental_room' ? (
          <DetailGroup title={isThai ? 'ข้อมูลห้องแบ่งเช่า' : 'Room-in-property details'}>
            <CheckboxGrid
              name="sharedFacilities[]"
              options={sharedFacilities}
              selected={readValues(draft['sharedFacilities[]'])}
              isThai={isThai}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={isThai ? 'มีทางเข้าส่วนตัวหรือไม่' : 'Private entrance'}>
                <YesNoSelect name="privateEntrance" defaultValue={readText(draft.privateEntrance)} isThai={isThai} />
              </Field>
              <Field label={isThai ? 'พักร่วมกับเจ้าของหรือไม่' : 'Owner lives on site'}>
                <YesNoSelect name="ownerLivesOnSite" defaultValue={readText(draft.ownerLivesOnSite)} isThai={isThai} />
              </Field>
            </div>
          </DetailGroup>
        ) : null}

        {propertyTypeCode === 'apartment' ? (
          <DetailGroup title={isThai ? 'ข้อมูลอพาร์ตเมนต์' : 'Apartment details'}>
            {isServicedApartment ? (
              <>
                <CheckboxGrid
                  name="servicesIncluded[]"
                  options={services}
                  selected={readValues(draft['servicesIncluded[]'])}
                  isThai={isThai}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={isThai ? 'ความถี่แม่บ้าน/เปลี่ยนผ้า' : 'Housekeeping / linen frequency'}>
                    <Input
                      name="housekeepingFrequency"
                      defaultValue={readText(draft.housekeepingFrequency)}
                      placeholder={isThai ? 'เช่น สัปดาห์ละ 2 ครั้ง' : 'e.g. twice a week'}
                    />
                  </Field>
                  <Field label={isThai ? 'เวลาให้บริการแผนกต้อนรับ' : 'Reception hours'}>
                    <Input
                      name="receptionHours"
                      defaultValue={readText(draft.receptionHours)}
                      placeholder="08:00–20:00"
                    />
                  </Field>
                </div>
              </>
            ) : null}
            {listingScope === 'whole_property' ? <WholeBuildingFields draft={draft} isThai={isThai} /> : null}
          </DetailGroup>
        ) : null}

        {propertyTypeCode === 'dormitory' ? (
          <DetailGroup title={isThai ? 'ข้อมูลหอพัก' : 'Dormitory details'}>
            <CheckboxGrid
              name="residentGroups[]"
              options={residentGroups}
              selected={readValues(draft['residentGroups[]'])}
              isThai={isThai}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={isThai ? 'เวลาเข้าออก' : 'Curfew / access hours'}>
                <Input
                  name="curfewTime"
                  defaultValue={readText(draft.curfewTime)}
                  placeholder={isThai ? 'เช่น เข้าได้ตลอด 24 ชม.' : 'e.g. 24-hour access'}
                />
              </Field>
              <Field label={isThai ? 'สถานศึกษาหรือสถานที่ทำงานใกล้เคียง' : 'Nearby school or workplace'}>
                <Input name="nearbyInstitution" defaultValue={readText(draft.nearbyInstitution)} />
              </Field>
              {listingScope === 'whole_property' ? (
                <Field label={isThai ? 'เลขที่ใบอนุญาตหอพัก' : 'Dormitory licence number'}>
                  <Input name="dormitoryLicenseNumber" defaultValue={readText(draft.dormitoryLicenseNumber)} />
                </Field>
              ) : null}
            </div>
          </DetailGroup>
        ) : null}

        {propertyTypeCode === 'flat' ? (
          <DetailGroup title={isThai ? 'ข้อมูลแฟลตและสิทธิการเข้าอยู่' : 'Flat & occupancy rights'}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={isThai ? 'หน่วยงานหรือผู้ดูแลโครงการ' : 'Managing agency'}>
                <Input
                  name="managingAgency"
                  defaultValue={readText(draft.managingAgency)}
                  placeholder={isThai ? 'เช่น การเคหะแห่งชาติ' : 'e.g. National Housing Authority'}
                />
              </Field>
              <Field label={isThai ? 'ลักษณะสิทธิ' : 'Occupancy right'}>
                <Select
                  name="occupancyRightType"
                  defaultValue={readText(draft.occupancyRightType)}
                  className="[&_select]:h-11 [&_select]:rounded-2xl"
                >
                  <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                  <option value="rent">{isThai ? 'สัญญาเช่า' : 'Rental contract'}</option>
                  <option value="assignment">{isThai ? 'โอน/รับช่วงสิทธิ' : 'Right assignment'}</option>
                  <option value="organization_welfare">{isThai ? 'สวัสดิการหน่วยงาน' : 'Organization welfare'}</option>
                </Select>
              </Field>
              <Field label={isThai ? 'โอนสิทธิได้หรือไม่' : 'Rights transferable'}>
                <YesNoSelect
                  name="rightsTransferAllowed"
                  defaultValue={readText(draft.rightsTransferAllowed)}
                  isThai={isThai}
                />
              </Field>
            </div>
            <Field label={isThai ? 'เงื่อนไขของโครงการหรือข้อจำกัดสิทธิ' : 'Project conditions or rights restrictions'}>
              <Textarea name="projectConditions" defaultValue={readText(draft.projectConditions)} />
            </Field>
          </DetailGroup>
        ) : null}

        {propertyTypeCode === 'condo' ? (
          <DetailGroup title={isThai ? 'ข้อมูลคอนโดให้เช่ารายเดือน' : 'Monthly condo details'}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={isThai ? 'รวมค่าส่วนกลางในค่าเช่าหรือไม่' : 'Common fee included'}>
                <YesNoSelect
                  name="commonFeeIncluded"
                  defaultValue={readText(draft.commonFeeIncluded)}
                  isThai={isThai}
                />
              </Field>
              <Field label={isThai ? 'สถานะห้องปัจจุบัน' : 'Current occupancy'}>
                <Select
                  name="occupancyStatus"
                  defaultValue={readText(draft.occupancyStatus)}
                  className="[&_select]:h-11 [&_select]:rounded-2xl"
                >
                  <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                  <option value="vacant">{isThai ? 'ว่าง พร้อมเข้าอยู่' : 'Vacant'}</option>
                  <option value="owner_occupied">{isThai ? 'เจ้าของพักอยู่' : 'Owner occupied'}</option>
                  <option value="tenant_occupied">{isThai ? 'มีผู้เช่าอยู่' : 'Tenant occupied'}</option>
                </Select>
              </Field>
            </div>
            <Field label={isThai ? 'กฎนิติบุคคลที่ผู้เช่าควรรู้' : 'Condominium rules tenants should know'}>
              <Textarea name="juristicRules" defaultValue={readText(draft.juristicRules)} />
            </Field>
          </DetailGroup>
        ) : null}

        {propertyTypeCode === 'monthly_hotel' ? (
          <DetailGroup title={isThai ? 'ข้อมูลโรงแรมรายเดือน' : 'Monthly hotel details'}>
            <CheckboxGrid
              name="servicesIncluded[]"
              options={services}
              selected={readValues(draft['servicesIncluded[]'])}
              isThai={isThai}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={isThai ? 'รอบทำความสะอาด/เปลี่ยนผ้า' : 'Cleaning / linen schedule'}>
                <Input
                  name="housekeepingFrequency"
                  defaultValue={readText(draft.housekeepingFrequency)}
                  placeholder={isThai ? 'เช่น ทุก 3 วัน' : 'e.g. every 3 days'}
                />
              </Field>
              <Field label={isThai ? 'เวลาให้บริการแผนกต้อนรับ' : 'Reception hours'}>
                <Input
                  name="receptionHours"
                  defaultValue={readText(draft.receptionHours)}
                  placeholder={isThai ? 'ตลอด 24 ชั่วโมง' : '24 hours'}
                />
              </Field>
            </div>
            <Field label={isThai ? 'เงื่อนไขยกเลิกและคืนเงินประกัน' : 'Cancellation and deposit refund policy'}>
              <Textarea name="cancellationPolicy" defaultValue={readText(draft.cancellationPolicy)} />
            </Field>
          </DetailGroup>
        ) : null}
      </div>
    </section>
  )
}

const WholeBuildingFields = ({ draft, isThai }: { draft: ListingDraft; isThai: boolean }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    <Field label={isThai ? 'จำนวนห้องทั้งหมด' : 'Total units'}>
      <Input name="totalUnits" type="number" min="0" defaultValue={readText(draft.totalUnits)} />
    </Field>
    <Field label={isThai ? 'จำนวนห้องที่มีผู้เช่า' : 'Occupied units'}>
      <Input name="occupiedUnits" type="number" min="0" defaultValue={readText(draft.occupiedUnits)} />
    </Field>
    <MoneyField name="monthlyIncome" label={isThai ? 'รายได้ต่อเดือน' : 'Monthly income'} draft={draft} />
    <MoneyField name="monthlyExpenses" label={isThai ? 'ค่าใช้จ่ายต่อเดือน' : 'Monthly expenses'} draft={draft} />
    <Field label={isThai ? 'ใบอนุญาต/ข้อมูลอาคาร' : 'Building licence / permit'}>
      <Input name="buildingLicenseInfo" defaultValue={readText(draft.buildingLicenseInfo)} />
    </Field>
  </div>
)

const DetailGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 border-b border-sky-100 pb-7 last:border-b-0 last:pb-0 dark:border-sky-900/50">
    <h3 className="font-sarabun text-sm font-semibold text-sky-950 dark:text-sky-100">{title}</h3>
    {children}
  </div>
)

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-2 font-sarabun text-sm font-medium text-neutral-800 dark:text-neutral-200">
    <span>{label}</span>
    {children}
  </label>
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

const YesNoSelect = ({ name, defaultValue, isThai }: { name: string; defaultValue: string; isThai: boolean }) => (
  <Select name={name} defaultValue={defaultValue} className="[&_select]:h-11 [&_select]:rounded-2xl">
    <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
    <option value="yes">{isThai ? 'ใช่' : 'Yes'}</option>
    <option value="no">{isThai ? 'ไม่ใช่' : 'No'}</option>
  </Select>
)

const CheckboxGrid = ({
  name,
  options,
  selected,
  isThai,
}: {
  name: string
  options: Array<{ code: string; th: string; en: string }>
  selected: string[]
  isThai: boolean
}) => (
  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
    {options.map((option) => (
      <label
        key={option.code}
        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-sky-100 bg-white p-3 dark:border-sky-900/60 dark:bg-neutral-900"
      >
        <input
          type="checkbox"
          name={name}
          value={option.code}
          defaultChecked={selected.includes(option.code)}
          className="peer sr-only"
        />
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-neutral-300 text-transparent peer-checked:border-sky-600 peer-checked:bg-sky-600 peer-checked:text-white dark:border-neutral-600">
          <CheckIcon className="size-4" />
        </span>
        <span className="font-sarabun text-sm text-neutral-700 dark:text-neutral-200">
          {isThai ? option.th : option.en}
        </span>
      </label>
    ))}
  </div>
)

const readText = (value: ListingDraft[string]) => (Array.isArray(value) ? value[0] || '' : value || '')
const readValues = (value: ListingDraft[string]) => (!value ? [] : Array.isArray(value) ? value : [value])

export default MonthlyStayDetails
