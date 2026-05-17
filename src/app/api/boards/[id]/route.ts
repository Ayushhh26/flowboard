import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'

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
    where: { id, ownerId: user.id },
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

  const transformed = {
    ...board,
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
