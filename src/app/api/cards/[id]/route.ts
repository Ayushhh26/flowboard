import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireActor, UnauthorizedError } from '@/lib/auth'
import { boardWriteAccess } from '@/lib/permissions'
import type { UpdateCardPayload } from '@/types/card'

async function cardWriteAccess(cardId: string, userId: string) {
  return db.card.findFirst({
    where: { id: cardId, column: { board: boardWriteAccess(userId) } },
    include: {
      column: { select: { boardId: true } },
    },
  })
}

export async function PATCH(
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

  const { id } = await params
  const body: UpdateCardPayload = await req.json()

  const card = await cardWriteAccess(id, actor.userId)
  if (!card) return err('NOT_FOUND', 'Card not found', 404)

  if (body.assigneeId !== undefined && body.assigneeId !== null) {
    const member = await db.boardMember.findFirst({
      where: { boardId: card.column.boardId, userId: body.assigneeId },
    })
    const board = await db.board.findFirst({
      where: { id: card.column.boardId },
      select: { ownerId: true },
    })
    const isOwner = board?.ownerId === body.assigneeId
    if (!member && !isOwner) {
      return err('VALIDATION_ERROR', 'Assignee must be a board member', 400)
    }
  }

  if (body.labelIds !== undefined) {
    const labels = await db.label.findMany({
      where: { id: { in: body.labelIds }, boardId: card.column.boardId },
      select: { id: true },
    })
    if (labels.length !== body.labelIds.length) {
      return err('VALIDATION_ERROR', 'Invalid label IDs', 400)
    }
  }

  const updated = await db.card.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
      ...(body.labelIds !== undefined && {
        labels: {
          deleteMany: {},
          create: body.labelIds.map((labelId) => ({ labelId })),
        },
      }),
    },
    include: { assignee: true, labels: { include: { label: true } } },
  })

  return ok({ ...updated, labels: updated.labels.map((cl) => cl.label) })
}

export async function DELETE(
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

  const { id } = await params

  const card = await db.card.findFirst({
    where: { id, column: { board: boardWriteAccess(actor.userId) } },
    select: { id: true },
  })
  if (!card) return err('NOT_FOUND', 'Card not found', 404)

  await db.card.delete({ where: { id } })

  return ok({ id })
}
