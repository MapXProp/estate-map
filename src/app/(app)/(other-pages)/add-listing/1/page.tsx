'use client'

import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Textarea from '@/shared/Textarea'
import T from '@/utils/getT'
import { HomeModernIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import FormItem from '../FormItem'

const Page = () => {
  const router = useRouter()
  const pageT = T['addListings']['page1']

  // Prefetch the next step to improve performance
  useEffect(() => {
    router.prefetch('/add-listing/2')
  }, [router])

  const handleSubmitForm = async (formData: FormData) => {
    const formObject = Object.fromEntries(formData.entries())
    // Handle form submission logic here
    console.log('Form submitted:', formObject)

    // Redirect to the next step
    router.push('/add-listing/2')
  }

  return (
    <>
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
          <PencilSquareIcon className="h-4 w-4" />
          <span>{pageT['introBadge'] || 'Step 1 of 10'}</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl">
            {pageT['pageTitle']}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400 sm:text-base">
            {pageT['pageDescription'] || 'Start with the essentials so your title, property type, and short overview feel polished from the first glance.'}
          </p>
        </div>
      </div>
      <div className="h-px w-16 bg-gradient-to-r from-orange-400 via-orange-200 to-transparent"></div>
      {/* FORM */}
      <Form id="add-listing-form" action={handleSubmitForm} className="flex flex-col gap-y-6">
        <div className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 bg-gradient-to-br from-orange-50 via-white to-white px-5 py-5 dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 sm:px-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                <HomeModernIcon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {pageT['sectionTitle'] || 'Build the first impression of your listing'}
                </h2>
                <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {pageT['sectionDescription'] || 'Choose the property format, then add a strong title and short description that quickly sell the space.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-5 py-6 sm:px-7 sm:py-7">
            <div className="grid gap-5 rounded-3xl border border-neutral-200/70 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-800/40 sm:grid-cols-2 sm:p-5">
              <FormItem
                className="font-sarabun"
                label={pageT['Choose a property type']}
                desccription={pageT['propertyTypeDescription']}
              >
                <Select name="propertyType" className="[&_select]:h-12 [&_select]:rounded-2xl [&_select]:border-neutral-200 [&_select]:bg-white [&_select]:px-4">
                  <option value="Apartment">Apartment</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Cottage">Cottage</option>
                  <option value="Villa">Villa</option>
                  <option value="Cabin">Cabin</option>
                  <option value="Farm stay">Farm stay</option>
                  <option value="Houseboat">Houseboat</option>
                  <option value="Lighthouse">Lighthouse</option>
                </Select>
              </FormItem>
              <FormItem
                label={pageT['Rental form']}
                desccription={pageT['rentalFormDescription']}
              >
                <Select name="rentalForm" className="[&_select]:h-12 [&_select]:rounded-2xl [&_select]:border-neutral-200 [&_select]:bg-white [&_select]:px-4">
                  <option value="Entire place">Entire place</option>
                  <option value="Private room">Private room</option>
                  <option value="Share room">Share room</option>
                </Select>
              </FormItem>
            </div>

            <div className="grid gap-6">
              <FormItem
                label={pageT['Title'] || 'Listing title'}
                desccription={pageT['titleDescription'] || 'Keep it short, clear, and highlight the strongest selling point of the property.'}
              >
                <Input
                  name="listingTitle"
                  placeholder={pageT['titlePlaceholder'] || 'Luxury corner condo near BTS with skyline view'}
                  className="h-13 rounded-2xl border-neutral-200 bg-neutral-50 px-4 text-[15px] shadow-none"
                />
              </FormItem>

              <FormItem
                label={pageT['Place name']}
                desccription={pageT['placeNameDescription']}
              >
                <Input
                  placeholder={pageT['Place name']}
                  name="placeName"
                  className="h-13 rounded-2xl border-neutral-200 bg-neutral-50 px-4 text-[15px] shadow-none"
                />
              </FormItem>

              <FormItem
                label={pageT['Description'] || 'Short description'}
                desccription={
                  pageT['descriptionDescription'] ||
                  'Write 2-4 sentences about the vibe, key features, and nearby landmarks to make the listing feel more inviting.'
                }
              >
                <Textarea
                  name="listingDescription"
                  placeholder={
                    pageT['descriptionPlaceholder'] ||
                    'Bright and airy apartment with a private balcony, fully equipped kitchen, and easy access to cafes, transit, and shopping.'
                  }
                  className="min-h-36 rounded-2xl border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] shadow-none"
                />
              </FormItem>
            </div>
          </div>
        </div>
      </Form>
    </>
  )
}

export default Page
