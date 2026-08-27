import { redirect } from 'next/navigation'

export default function HomePage() {
  // Keep the root URL as a stable entry point, but make Homes the default
  // discovery surface without rendering the legacy landing page first.
  redirect('/homes')
}
