import AuthPage from '@/components/auth/AuthPage'

type Query = Record<string, string | string[] | undefined>

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams
  return (
    <AuthPage
      initialMode="signup"
      redirectPath={typeof query.redirect === 'string' ? query.redirect : undefined}
      providerError={typeof query.error === 'string' ? query.error : undefined}
      status={query.reset === 'success' ? 'reset' : query.logout === 'success' ? 'logout' : undefined}
    />
  )
}
