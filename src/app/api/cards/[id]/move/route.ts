import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireActor, UnauthorizedError } from '@/lib/auth'
import { boardWriteAccess } from '@/lib/permissions'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (req.headers.get('x-simulate-failure') === 'true') {
    return err('SIMULATED_FAILURE', 'Simulated network error for demo', 500)
  }

  let actor
  try {
    actor = await requireActor(req)
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id } = await params
  const body = await req.json() as { targetColumnId?: unknown; newOrderIndex?: unknown }

  if (!body.targetColumnId || typeof body.targetColumnId !== 'string') {
    return err('VALIDATION_ERROR', 'targetColumnId is required', 400)
  }
  if (typeof body.newOrderIndex !== 'number' || !isFinite(body.newOrderIndex)) {
    return err('VALIDATION_ERROR', 'newOrderIndex must be a finite number', 400)
  }

  const card = await db.card.findFirst({
    where: { id, column: { board: boardWriteAccess(actor.userId) } },
    include: { column: { select: { boardId: true } } },
  })
  if (!card) return err('NOT_FOUND', 'Card not found', 404)

  const targetColumn = await db.column.findFirst({
    where: { id: body.targetColumnId, board: boardWriteAccess(actor.userId) },
    select: { id: true, boardId: true },
  })
  if (!targetColumn) return err('NOT_FOUND', 'Target column not found', 404)

  if (card.column.boardId !== targetColumn.boardId) {
    return err('INVALID_OPERATION', 'Cannot move card to a column on a different board', 400)
  }

  const updated = await db.card.update({
    where: { id },
    data: {
      columnId: body.targetColumnId,
      orderIndex: body.newOrderIndex,
    },
    include: {
      assignee: true,
      labels: { include: { label: true } },
    },
  })

  return ok({ ...updated, labels: updated.labels.map((cl) => cl.label) })
}
