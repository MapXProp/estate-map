'use client'

import FormItem from '@/app/(app)/(other-pages)/add-listing/FormItem'
import Input from '@/shared/Input'
import { CalendarDaysIcon, PhotoIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { ChangeEvent } from 'react'

export type EventRoundDraft = {
  id: string
  startsOn: string
  endsOn: string
}

type EventDetailsPanelProps = {
  isThai: boolean
  eventName: string
  onEventNameChange: (value: string) => void
  venueName: string
  onVenueNameChange: (value: string) => void
  venueFloor: string
  onVenueFloorChange: (value: string) => void
  rounds: EventRoundDraft[]
  onRoundChange: (id: string, field: 'startsOn' | 'endsOn', value: string) => void
  onAddRound: () => void
  onRemoveRound: (id: string) => void
  floorPlanPreviewUrl: string
  floorPlanFileName: string
  onFloorPlanChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveFloorPlan: () => void
  disabled: boolean
}

const EventDetailsPanel = ({
  isThai,
  eventName,
  onEventNameChange,
  venueName,
  onVenueNameChange,
  venueFloor,
  onVenueFloorChange,
  rounds,
  onRoundChange,
  onAddRound,
  onRemoveRound,
  floorPlanPreviewUrl,
  floorPlanFileName,
  onFloorPlanChange,
  onRemoveFloorPlan,
  disabled,
}: EventDetailsPanelProps) => (
  <section className="overflow-hidden rounded-[30px] border border-emerald-200 bg-white shadow-[0_18px_50px_-34px_rgba(5,150,105,0.45)] dark:border-emerald-900/60 dark:bg-neutral-900">
    <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-4 sm:px-7 sm:py-5 dark:border-emerald-950 dark:from-emerald-950/35 dark:via-neutral-900 dark:to-neutral-900">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
          <CalendarDaysIcon className="size-6" />
        </span>
        <div>
          <h2 className="font-sarabun text-xl font-semibold text-neutral-950 dark:text-white">
            {isThai ? 'ข้อมูลงานและรอบจัดงาน' : 'Event and dates'}
          </h2>
          <p className="mt-1 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {isThai
              ? 'หนึ่งประกาศรวมได้หลายรอบ หากเป็นงาน ผู้จัด และสถานที่เดียวกัน'
              : 'One listing can contain multiple rounds for the same event, organizer and venue.'}
          </p>
        </div>
      </div>
    </div>

    <div className="space-y-7 p-5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormItem label={isThai ? 'ชื่องาน' : 'Event name'}>
          <Input
            name="eventName"
            value={eventName}
            onChange={(event) => onEventNameChange(event.target.value)}
            placeholder={isThai ? 'เช่น Food & Tea Festival 2026' : 'e.g. Food & Tea Festival 2026'}
            maxLength={200}
            required
          />
        </FormItem>
        <FormItem label={isThai ? 'ชื่อสถานที่จัดงาน' : 'Venue name'}>
          <Input
            name="eventVenueName"
            value={venueName}
            onChange={(event) => onVenueNameChange(event.target.value)}
            placeholder={isThai ? 'เช่น Siam Paragon' : 'e.g. Siam Paragon'}
            maxLength={200}
            required
          />
        </FormItem>
        <FormItem label={isThai ? 'ฮอลล์ / ชั้น / โซน (ถ้ามี)' : 'Hall / floor / zone (optional)'}>
          <Input
            name="eventVenueFloor"
            value={venueFloor}
            onChange={(event) => onVenueFloorChange(event.target.value)}
            placeholder={isThai ? 'เช่น ชั้น M · โซน A' : 'e.g. Floor M · Zone A'}
            maxLength={120}
          />
        </FormItem>
      </div>

      <div className="border-t border-neutral-100 pt-6 dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-sarabun text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {isThai ? 'วันจัดงาน' : 'Event rounds'}
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-sarabun text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            {isThai ? `${rounds.length} รอบ` : `${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'}`}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {rounds.map((round, index) => (
            <div
              key={round.id}
              className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-950/70"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {isThai ? `รอบที่ ${index + 1}` : `Round ${index + 1}`}
                </p>
                {rounds.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemoveRound(round.id)}
                    disabled={disabled}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 font-sarabun text-xs font-medium text-neutral-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30"
                    aria-label={isThai ? `ลบรอบที่ ${index + 1}` : `Remove round ${index + 1}`}
                  >
                    <TrashIcon className="size-4" />
                    {isThai ? 'ลบรอบ' : 'Remove'}
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormItem label={isThai ? 'วันเริ่มงาน' : 'Start date'}>
                  <Input
                    name="eventRoundStarts[]"
                    type="date"
                    value={round.startsOn}
                    max={round.endsOn || undefined}
                    onChange={(event) => onRoundChange(round.id, 'startsOn', event.target.value)}
                    required
                  />
                </FormItem>
                <FormItem label={isThai ? 'วันสิ้นสุดงาน' : 'End date'}>
                  <Input
                    name="eventRoundEnds[]"
                    type="date"
                    value={round.endsOn}
                    min={round.startsOn || undefined}
                    onChange={(event) => onRoundChange(round.id, 'endsOn', event.target.value)}
                    required
                  />
                </FormItem>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onAddRound}
          disabled={disabled || rounds.length >= 12}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 font-sarabun text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:bg-neutral-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
        >
          <PlusIcon className="size-4" />
          {isThai ? 'เพิ่มรอบงาน' : 'Add another round'}
        </button>
      </div>

      <div className="border-t border-neutral-100 pt-6 dark:border-neutral-800">
        <h3 className="font-sarabun text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {isThai ? 'แปลนพื้นที่ (ถ้ามี)' : 'Floor plan (optional)'}
        </h3>
        <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {isThai
            ? 'แนบภาพแปลนเพื่อให้ผู้สนใจเห็นตำแหน่งและรูปแบบบูธก่อนติดต่อผู้จัด'
            : 'Attach a plan so prospects can understand booth positions before contacting the organizer.'}
        </p>

        {floorPlanPreviewUrl ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-950">
            <div
              className="aspect-[4/3] w-28 shrink-0 rounded-xl bg-white bg-contain bg-center bg-no-repeat ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700"
              style={{ backgroundImage: `url(${floorPlanPreviewUrl})` }}
              aria-label={isThai ? 'ตัวอย่างแปลนพื้นที่' : 'Floor plan preview'}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {floorPlanFileName || (isThai ? 'แปลนพื้นที่ที่บันทึกไว้' : 'Saved floor plan')}
              </p>
              <p className="mt-1 font-sarabun text-xs text-neutral-500">JPG, PNG หรือ WebP · ไม่เกิน 8 MB</p>
            </div>
            <button
              type="button"
              onClick={onRemoveFloorPlan}
              disabled={disabled}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:bg-neutral-800 dark:ring-neutral-700"
              aria-label={isThai ? 'ลบแปลนพื้นที่' : 'Remove floor plan'}
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>
        ) : (
          <label className="mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-5 transition hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-neutral-700 dark:bg-neutral-950">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-neutral-800 dark:text-emerald-400">
              <PhotoIcon className="size-6" />
            </span>
            <span>
              <span className="block font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {isThai ? 'เลือกภาพแปลนพื้นที่' : 'Choose a floor-plan image'}
              </span>
              <span className="mt-1 block font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                JPG, PNG, WebP · {isThai ? 'ไม่เกิน 8 MB' : 'up to 8 MB'}
              </span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={onFloorPlanChange}
              className="sr-only"
            />
          </label>
        )}
      </div>
    </div>
  </section>
)

export default EventDetailsPanel
