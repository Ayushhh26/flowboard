import { z } from 'zod'
import { ok, err } from '@/lib/api'
import { requireActor, UnauthorizedError } from '@/lib/auth'
import { searchBoardCards } from '@/lib/searchBoardCards'
import { prioritySchema } from '@/types/agent'

function parseArrayParam(params: URLSearchParams, key: string): string[] {
  const values = params.getAll(key)
  if (values.length === 0) return []
  return values.flatMap((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
}

const searchQuerySchema = z.object({
  search: z.string().max(500).optional(),
  priorities: z.array(prioritySchema).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let actor
  try {
    actor = await requireActor(req)
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id: boardId } = await params
  const url = new URL(req.url)

  const parsed = searchQuerySchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    priorities: (() => {
      const raw = parseArrayParam(url.searchParams, 'priorities')
      return raw.length > 0 ? raw : undefined
    })(),
    assigneeIds: (() => {
      const raw = parseArrayParam(url.searchParams, 'assigneeIds')
      return raw.length > 0 ? raw : undefined
    })(),
    labelIds: (() => {
      const raw = parseArrayParam(url.searchParams, 'labelIds')
      return raw.length > 0 ? raw : undefined
    })(),
    limit: url.searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid query', 400)
  }

  const result = await searchBoardCards(boardId, actor.userId, parsed.data)
  if (!result) return err('NOT_FOUND', 'Board not found', 404)

  return ok(result)
}
