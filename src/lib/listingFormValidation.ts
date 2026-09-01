type ListingControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const FORM_ID = 'add-listing-form'

const getForm = (formId: string) => document.getElementById(formId) as HTMLFormElement | null

const getFieldLabel = (control: ListingControl, field: HTMLElement | null) =>
  field?.dataset.listingLabel?.trim() || control.getAttribute('aria-label')?.trim() || control.name

const isRequiredBlank = (control: ListingControl) =>
  control.required &&
  !(control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) &&
  control.value.trim() === ''

const getValidationMessage = (control: ListingControl, field: HTMLElement | null, isThai: boolean) => {
  const label = getFieldLabel(control, field)
  const quotedLabel = label ? `“${label}”` : isThai ? 'ช่องนี้' : 'this field'

  if (control.validity.valueMissing || isRequiredBlank(control)) {
    const selectLike = control instanceof HTMLSelectElement || ['checkbox', 'radio'].includes(control.type)
    if (isThai) return `${selectLike ? 'กรุณาเลือก' : 'กรุณากรอก'} ${quotedLabel}`
    return `${selectLike ? 'Please select' : 'Please complete'} ${quotedLabel}.`
  }
  if (control.validity.typeMismatch) {
    return isThai ? `กรุณาตรวจสอบรูปแบบของ ${quotedLabel}` : `Please enter a valid value for ${quotedLabel}.`
  }
  if (control.validity.patternMismatch) {
    return isThai ? `รูปแบบข้อมูลของ ${quotedLabel} ยังไม่ถูกต้อง` : `${quotedLabel} is not in the expected format.`
  }
  if (control.validity.rangeUnderflow || control.validity.rangeOverflow || control.validity.stepMismatch) {
    return isThai ? `กรุณาตรวจสอบค่าของ ${quotedLabel}` : `Please check the value for ${quotedLabel}.`
  }

  return isThai ? `กรุณาตรวจสอบ ${quotedLabel}` : `Please check ${quotedLabel}.`
}

const findControl = (form: HTMLFormElement, fieldName: string) =>
  Array.from(form.elements).find((element): element is ListingControl =>
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
      ? element.name === fieldName
      : false
  )

const markInvalid = (control: ListingControl, isThai: boolean, message?: string) => {
  const field = control.closest<HTMLElement>('[data-listing-field]')
  const errorSlot = field?.querySelector<HTMLElement>('[data-listing-validation-error]')
  const errorId = `${control.name || control.id || 'listing-field'}-validation-error`
  const describedBy = control.getAttribute('aria-describedby') || ''

  control.setAttribute('aria-invalid', 'true')
  if (!control.dataset.listingPreviousDescribedby) {
    control.dataset.listingPreviousDescribedby = describedBy
  }
  control.setAttribute('aria-describedby', [...new Set([...describedBy.split(' ').filter(Boolean), errorId])].join(' '))
  field?.setAttribute('data-listing-invalid', 'true')
  if (errorSlot) {
    errorSlot.id = errorId
    errorSlot.textContent = message || getValidationMessage(control, field, isThai)
    errorSlot.hidden = false
  }

  return field || control
}

const focusInvalid = (target: HTMLElement, control?: ListingControl) => {
  window.requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => control?.focus({ preventScroll: true }), 280)
  })
}

export const clearListingFormErrors = (formId = FORM_ID) => {
  const form = getForm(formId)
  if (!form) return

  form
    .querySelectorAll<ListingControl>('[data-listing-field][data-listing-invalid] [aria-invalid="true"]')
    .forEach((control) => {
      control.removeAttribute('aria-invalid')
      const previousDescribedBy = control.dataset.listingPreviousDescribedby
      if (previousDescribedBy) control.setAttribute('aria-describedby', previousDescribedBy)
      else control.removeAttribute('aria-describedby')
      delete control.dataset.listingPreviousDescribedby
    })
  form.querySelectorAll<HTMLElement>('[data-listing-field][data-listing-invalid]').forEach((field) => {
    field.removeAttribute('data-listing-invalid')
  })
  form.querySelectorAll<HTMLElement>('[data-listing-validation-error]').forEach((slot) => {
    slot.hidden = true
    slot.textContent = ''
    slot.removeAttribute('id')
  })
}

export const showListingFieldError = ({
  fieldName,
  message,
  isThai,
  formId = FORM_ID,
}: {
  fieldName: string
  message: string
  isThai: boolean
  formId?: string
}) => {
  const form = getForm(formId)
  if (!form) return false
  const control = findControl(form, fieldName)
  if (!control) return false

  const target = markInvalid(control, isThai, message)
  focusInvalid(target, control)
  return true
}

export const validateListingForm = ({ isThai, formId = FORM_ID }: { isThai: boolean; formId?: string }) => {
  const form = getForm(formId)
  if (!form) return true

  clearListingFormErrors(formId)
  const invalidControls = Array.from(form.elements).filter(
    (element): element is ListingControl =>
      (element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement) &&
      element.willValidate &&
      (!element.validity.valid || isRequiredBlank(element))
  )
  if (!invalidControls.length) return true

  let firstTarget: HTMLElement | null = null
  invalidControls.forEach((control) => {
    const target = markInvalid(control, isThai)
    firstTarget ||= target
  })
  if (firstTarget) focusInvalid(firstTarget, invalidControls[0])
  return false
}
