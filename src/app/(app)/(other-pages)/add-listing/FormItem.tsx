'use client'

import { Description, Field, Label } from '@/shared/fieldset'
import React, { FC } from 'react'

interface FormItemProps {
  className?: string
  label?: string
  desccription?: string
  children?: React.ReactNode
}

const FormItem: FC<FormItemProps> = ({ children, className = '', label, desccription }) => {
  const clearErrorWhenValid = (event: React.FormEvent<HTMLElement>) => {
    const control = event.target
    if (
      !(control instanceof HTMLInputElement) &&
      !(control instanceof HTMLSelectElement) &&
      !(control instanceof HTMLTextAreaElement)
    ) {
      return
    }
    const requiredBlank =
      control.required &&
      !(control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) &&
      control.value.trim() === ''
    if (!control.validity.valid || requiredBlank) return

    const field = event.currentTarget
    const errorSlot = field.querySelector<HTMLElement>('[data-listing-validation-error]')
    field.removeAttribute('data-listing-invalid')
    control.removeAttribute('aria-invalid')
    const previousDescribedBy = control.dataset.listingPreviousDescribedby
    if (previousDescribedBy) control.setAttribute('aria-describedby', previousDescribedBy)
    else control.removeAttribute('aria-describedby')
    delete control.dataset.listingPreviousDescribedby
    if (errorSlot) {
      errorSlot.hidden = true
      errorSlot.textContent = ''
      errorSlot.removeAttribute('id')
    }
  }

  return (
    <Field
      className={className}
      data-listing-field
      data-listing-label={label || ''}
      onInput={clearErrorWhenValid}
      onChange={clearErrorWhenValid}
    >
      {label && <Label>{label}</Label>}
      <div className="mt-1">{children}</div>
      {desccription && <Description className="mt-3 block text-xs">{desccription}</Description>}
      <p
        data-listing-validation-error
        hidden
        role="alert"
        className="mt-2 font-sarabun text-sm font-medium text-red-600 dark:text-red-400"
      />
    </Field>
  )
}

export default FormItem
