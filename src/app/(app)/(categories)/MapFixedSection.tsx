import CarCard from '@/components/CarCard'
import ExperiencesCard from '@/components/ExperiencesCard'
import PropertyCard from '@/components/PropertyCard'
import StayCard from '@/components/StayCard'
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map'
import { TCarListing, TExperienceListing, TRealEstateListing, TStayListing } from '@/data/listings'
import { Button } from '@/shared/Button'
import ButtonClose from '@/shared/ButtonClose'
import { ListingType } from '@/type'
import T from '@/utils/getT'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'

interface Props {
  currentHoverID: string
  listings: TStayListing[] | TExperienceListing[] | TRealEstateListing[] | TCarListing[]
  // The type of listing being displayed on the map.
  // This is used to determine the type of markers and interactions on the map.
  listingType: ListingType
  // The href for the close button, which will redirect to the category page.
  // This is used to close the map and return to the category listings.
  closeButtonHref: string
}

const MapFixedSection = ({ closeButtonHref, currentHoverID: selectedID, listings, listingType }: Props) => {
  const [currentHoverID, setCurrentHoverID] = useState<string>('')

  useEffect(() => {
    setCurrentHoverID(selectedID)
  }, [selectedID])

  return (
    <div className="fixed inset-0 top-0 z-40 flex-1/2 xl:static xl:z-0">
      <div className="fixed start-0 top-0 size-full overflow-hidden xl:sticky xl:top-0 xl:h-screen">
        <Map center={listings[0].map} zoom={11}>
          <MapControls position="bottom-right" showZoom showFullscreen />
          {listings.map((listing) => (
            <MapMarker key={listing.id} longitude={listing.map.lng} latitude={listing.map.lat}>
              <MarkerContent>
                <p
                  className={`flex min-w-max items-center justify-center rounded-lg px-3.5 py-1.5 text-sm font-medium shadow-lg transition-all ${
                    currentHoverID === listing.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-white text-neutral-900 hover:scale-110 dark:bg-neutral-600 dark:text-white'
                  }`}
                >
                  {listing.price}
                </p>
              </MarkerContent>
              <MarkerPopup className="rounded-2xl! p-0!">
                <div className="w-60 focus:outline-none sm:w-80">
                  {listingType === 'Stays' && <StayCard size="small" data={listing as TStayListing} />}
                  {listingType === 'Experiences' && (
                    <ExperiencesCard
                      size="small"
                      data={listing as TExperienceListing}
                      ratioClass="aspect-w-12 aspect-h-10"
                      className="rounded-3xl bg-white dark:bg-neutral-900"
                    />
                  )}
                  {listingType === 'Cars' && (
                    <CarCard className="border-0!" size="small" data={listing as TCarListing} />
                  )}
                  {listingType === 'RealEstates' && <PropertyCard data={listing as TRealEstateListing} />}
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>

        <div className="absolute top-3 left-3">
          <ButtonClose color="white" href={closeButtonHref} />
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 shadow-2xl">
          <Button color="white" href={closeButtonHref}>
            <XMarkIcon className="size-6" />
            <span>{T['common']['Hide map']}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MapFixedSection
