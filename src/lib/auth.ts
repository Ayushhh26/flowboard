import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { hashApiToken, isApiTokenFormat } from '@/lib/apiToken'

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

export type Actor = {
  userId: string
  via: 'session' | 'apiToken'
}

async function resolveUserIdFromApiToken(plaintext: string): Promise<string | null> {
  if (!isApiTokenFormat(plaintext)) return null

  const tokenHash = hashApiToken(plaintext)
  const record = await db.apiToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  })

  if (!record) return null
  if (record.expiresAt && record.expiresAt < new Date()) return null

  await db.apiToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  })

  return record.userId
}

/** Session cookie or Bearer API token (for MCP / agents). */
export async function requireActor(req: Request): Promise<Actor> {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    const userId = token ? await resolveUserIdFromApiToken(token) : null
    if (!userId) throw new UnauthorizedError()
    return { userId, via: 'apiToken' }
  }

  const user = await requireUser()
  return { userId: user.id, via: 'session' }
}
