import 'server-only'
import { db } from '@/lib/db'
import { boardWriteAccess } from '@/lib/permissions'
import type { BoardParseContext } from '@/types/agent'
import type { Priority } from '@/types/card'

export async function loadBoardParseContext(
  boardId: string,
  userId: string
): Promise<BoardParseContext | null> {
  const board = await db.board.findFirst({
    where: { id: boardId, ...boardWriteAccess(userId) },
    select: {
      columns: {
        orderBy: { orderIndex: 'asc' },
        select: { id: true, title: true },
      },
      labels: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      },
      owner: { select: { id: true, name: true, email: true } },
      members: {
        select: {
          userId: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!board || board.columns.length === 0) return null

  const members: BoardParseContext['members'] = [
    {
      userId: board.owner.id,
      name: board.owner.name,
      email: board.owner.email,
    },
    ...board.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
    })),
  ]

  const defaultColumnId = board.columns[0]!.id
  const defaults: { columnId: string; priority: Priority } = {
    columnId: defaultColumnId,
    priority: 'none',
  }

  return {
    columns: board.columns,
    members,
    labels: board.labels,
    defaults,
  }
}
