import { z } from 'zod'
import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import { generateApiTokenPlaintext, hashApiToken } from '@/lib/apiToken'
import type { ApiTokenCreated, ApiTokenListItem } from '@/types/apiToken'

const createTokenSchema = z.object({
  name: z.string().trim().min(1).max(100),
})

function toListItem(row: {
  id: string
  name: string
  createdAt: Date
  lastUsedAt: Date | null
  expiresAt: Date | null
}): ApiTokenListItem {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  }
}

export async function GET() {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const tokens = await db.apiToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  })

  return ok(tokens.map(toListItem))
}

export async function POST(req: Request) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const body = await req.json().catch(() => ({}))
  const parsed = createTokenSchema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400)
  }

  const plaintext = generateApiTokenPlaintext()
  const tokenHash = hashApiToken(plaintext)

  const row = await db.apiToken.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      tokenHash,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  })

  const created: ApiTokenCreated = {
    ...toListItem(row),
    token: plaintext,
  }

  return ok(created, 201)
}
