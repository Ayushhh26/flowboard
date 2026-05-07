import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const board = await db.board.findUnique({
    where: { id },
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
