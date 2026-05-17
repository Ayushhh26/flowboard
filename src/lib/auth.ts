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

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, avatarUrl: true },
  })

  return profile
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  return user
}
