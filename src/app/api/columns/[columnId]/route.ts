import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import { boardWriteAccess } from '@/lib/permissions'

async function getColumnWithAccess(columnId: string, userId: string) {
  return db.column.findFirst({
    where: { id: columnId, board: boardWriteAccess(userId) },
    include: {
      _count: { select: { cards: true } },
      board: { select: { id: true, columns: { select: { id: true }, orderBy: { orderIndex: 'asc' } } } },
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
  }

  const { columnId } = await params
  const body = (await req.json().catch(() => ({}))) as { title?: unknown }

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return err('VALIDATION_ERROR', 'title is required', 400)
  }

  const column = await getColumnWithAccess(columnId, user!.id)
  if (!column) return err('NOT_FOUND', 'Column not found', 404)

  const updated = await db.column.update({
    where: { id: columnId },
    data: { title: body.title.trim().slice(0, 100) },
    select: { id: true, boardId: true, title: true, orderIndex: true },
  })

  return ok(updated)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
  }

  const { columnId } = await params
  const body = (await req.json().catch(() => ({}))) as {
    moveCardsToColumnId?: unknown
    deleteCards?: unknown
  }

  const column = await getColumnWithAccess(columnId, user!.id)
  if (!column) return err('NOT_FOUND', 'Column not found', 404)

  if (column.board.columns.length <= 1) {
    return err('INVALID_OPERATION', 'Cannot delete the last column on a board', 400)
  }

  const cardCount = column._count.cards

  if (cardCount > 0) {
    const moveTo =
      typeof body.moveCardsToColumnId === 'string' ? body.moveCardsToColumnId : null
    const deleteCards = body.deleteCards === true

    if (!moveTo && !deleteCards) {
      return err(
        'VALIDATION_ERROR',
        'Column has cards — provide moveCardsToColumnId or deleteCards: true',
        400
      )
    }

    if (moveTo) {
      if (moveTo === columnId) {
        return err('VALIDATION_ERROR', 'Cannot move cards to the same column', 400)
      }
      const target = column.board.columns.find((c) => c.id === moveTo)
      if (!target) return err('NOT_FOUND', 'Target column not found', 404)

      const cards = await db.card.findMany({
        where: { columnId },
        orderBy: { orderIndex: 'asc' },
      })

      const lastInTarget = await db.card.findFirst({
        where: { columnId: moveTo },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      })

      let nextOrder = lastInTarget ? lastInTarget.orderIndex + 1.0 : 1.0

      await db.$transaction(
        cards.map((card) => {
          const orderIndex = nextOrder
          nextOrder += 1.0
          return db.card.update({
            where: { id: card.id },
            data: { columnId: moveTo, orderIndex },
          })
        })
      )
    } else {
      await db.card.deleteMany({ where: { columnId } })
    }
  }

  await db.column.delete({ where: { id: columnId } })

  return ok({ id: columnId })
}
