import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import { boardOwnerAccess, boardReadAccess, resolveViewerRole } from '@/lib/permissions'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id } = await params

  const board = await db.board.findFirst({
    where: { id, ...boardReadAccess(user.id) },
    include: {
      columns: {
        orderBy: { orderIndex: 'asc' },
        include: {
          cards: {
            orderBy: { orderIndex: 'asc' },
            include: {
              assignee: true,
              labels: { include: { label: true } },
            },
          },
        },
      },
    },
  })

  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  const viewerRole = await resolveViewerRole(id, user.id)

  const transformed = {
    ...board,
    viewerRole,
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.map((card) => ({
        ...card,
        labels: card.labels.map((cl) => cl.label),
      })),
    })),
  }

  return ok(transformed)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { name?: unknown }

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return err('VALIDATION_ERROR', 'name is required', 400)
  }

  const name = body.name.trim().slice(0, 200)

  const board = await db.board.findFirst({
    where: { id, ...boardOwnerAccess(user.id) },
    select: { id: true },
  })
  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  const updated = await db.board.update({
    where: { id },
    data: { name },
    select: { id: true, name: true },
  })

  return ok(updated)
}
