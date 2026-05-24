import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import { boardWriteAccess } from '@/lib/permissions'

export async function POST(
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
  const body = (await req.json()) as { newOrderIndex?: unknown }

  if (typeof body.newOrderIndex !== 'number' || !Number.isFinite(body.newOrderIndex)) {
    return err('VALIDATION_ERROR', 'newOrderIndex must be a number', 400)
  }

  const column = await db.column.findFirst({
    where: { id: columnId, board: boardWriteAccess(user!.id) },
    select: { id: true, boardId: true, title: true, orderIndex: true },
  })
  if (!column) return err('NOT_FOUND', 'Column not found', 404)

  const updated = await db.column.update({
    where: { id: columnId },
    data: { orderIndex: body.newOrderIndex },
    select: { id: true, boardId: true, title: true, orderIndex: true },
  })

  return ok(updated)
}
