import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export type CurrentUser = {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export type AuthState =
  | { kind: 'unauthenticated' }
  | { kind: 'orphan' }
  | { kind: 'authenticated'; user: CurrentUser }

export async function getAuthState(): Promise<AuthState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { kind: 'unauthenticated' }

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, avatarUrl: true },
  })

  if (!profile) return { kind: 'orphan' }
  return { kind: 'authenticated', user: profile }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const state = await getAuthState()
  return state.kind === 'authenticated' ? state.user : null
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  return user
}
