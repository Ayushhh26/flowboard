import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireActor, UnauthorizedError } from '@/lib/auth'
import { boardWriteAccess } from '@/lib/permissions'

export async function POST(
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
  const body = (await req.json().catch(() => ({}))) as { title?: unknown }

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return err('VALIDATION_ERROR', 'title is required', 400)
  }

  const title = body.title.trim().slice(0, 100)

  const board = await db.board.findFirst({
    where: { id: boardId, ...boardWriteAccess(actor.userId) },
    select: { id: true },
  })
  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  const lastColumn = await db.column.findFirst({
    where: { boardId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true },
  })

  const orderIndex = lastColumn ? lastColumn.orderIndex + 1.0 : 1.0

  const column = await db.column.create({
    data: { boardId, title, orderIndex },
    select: { id: true, boardId: true, title: true, orderIndex: true },
  })

  return ok({ ...column, cards: [] }, 201)
}
