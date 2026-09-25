import { permanentRedirect } from 'next/navigation'

// Retired template: MapxProp currently offers free listings and takes no payments here.
export default function Page() {
  permanentRedirect('/listing-plans')
}
