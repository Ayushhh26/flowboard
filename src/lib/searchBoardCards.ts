import 'server-only'

import { db } from '@/lib/db'
import { type FilterState } from '@/lib/filterCards'
import { boardReadAccess } from '@/lib/permissions'
import { searchCardsInBoard } from '@/lib/searchCardsInBoard'
import type { SearchCardResult, SearchCardsInput } from '@/types/agent'
import type { Card } from '@/types/card'

type CardRow = {
  id: string
  columnId: string
  title: string
  description: string | null
  priority: Card['priority']
  orderIndex: number
  assigneeId: string | null
  assignee: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    createdAt: Date
  } | null
  labels: { label: Card['labels'][number] }[]
  createdAt: Date
  updatedAt: Date
}

function toDomainCard(card: CardRow): Card {
  return {
    id: card.id,
    columnId: card.columnId,
    title: card.title,
    description: card.description,
    priority: card.priority,
    orderIndex: card.orderIndex,
    assigneeId: card.assigneeId,
    assignee: card.assignee
      ? { ...card.assignee, createdAt: card.assignee.createdAt.toISOString() }
      : null,
    labels: card.labels.map((cl) => cl.label),
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  }
}

const DEFAULT_LIMIT = 50

export async function searchBoardCards(
  boardId: string,
  userId: string,
  input: Omit<SearchCardsInput, 'boardId'>
): Promise<{ cards: SearchCardResult[]; total: number; limit: number } | null> {
  const board = await db.board.findFirst({
    where: { id: boardId, ...boardReadAccess(userId) },
    select: {
      columns: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          title: true,
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

  if (!board) return null

  const limit = input.limit ?? DEFAULT_LIMIT
  const filters: FilterState = {
    search: input.search ?? '',
    priorities: input.priorities ?? [],
    assigneeIds: input.assigneeIds ?? [],
    labelIds: input.labelIds ?? [],
  }

  const columns = board.columns.map((col) => ({
    id: col.id,
    title: col.title,
    cards: col.cards.map(toDomainCard),
  }))

  const { cards, total } = searchCardsInBoard(columns, filters, limit)
  return { cards, total, limit }
}
