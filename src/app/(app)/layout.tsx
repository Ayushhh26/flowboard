import { redirect } from 'next/navigation'
import { getAuthState } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const state = await getAuthState()
  if (state.kind === 'unauthenticated') redirect('/login')
  if (state.kind === 'orphan') redirect('/auth/repair')
  return <>{children}</>
}
