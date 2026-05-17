import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import type { Priority } from '@/types/card'

const VALID_PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

export async function POST(
  req: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { columnId } = await params
  const body = await req.json() as { title?: unknown; priority?: unknown }

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return err('VALIDATION_ERROR', 'title is required', 400)
  }

  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority as Priority)) {
    return err('VALIDATION_ERROR', `priority must be one of: ${VALID_PRIORITIES.join(', ')}`, 400)
  }

  const column = await db.column.findFirst({
    where: { id: columnId, board: { ownerId: user.id } },
    select: { id: true },
  })
  if (!column) return err('NOT_FOUND', 'Column not found', 404)

  const lastCard = await db.card.findFirst({
    where: { columnId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true },
  })

  const orderIndex = (lastCard?.orderIndex ?? 0) + 1.0

  const card = await db.card.create({
    data: {
      columnId,
      title: body.title.trim(),
      priority: (body.priority as Priority | undefined) ?? 'none',
      orderIndex,
    },
    include: {
      assignee: true,
      labels: { include: { label: true } },
    },
  })

  return ok(
    { ...card, labels: card.labels.map((cl) => cl.label) },
    201
  )
}
