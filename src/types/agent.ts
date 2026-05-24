import { z } from 'zod'
import type { Board } from '@/types/board'
import type { Card, Label, Priority, User } from '@/types/card'
import type { Column } from '@/types/column'

/** Full board payload returned by GET /api/boards/[id] (agent + MCP get_board). */
export type BoardSnapshot = Board

export const prioritySchema = z.enum(['none', 'low', 'medium', 'high', 'urgent'])
export type PriorityInput = z.infer<typeof prioritySchema>

export const createCardInputSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().trim().min(1).max(300),
  priority: prioritySchema.optional(),
})
export type CreateCardInput = z.infer<typeof createCardInputSchema>

export const updateCardInputSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(10_000).nullable().optional(),
  priority: prioritySchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
})
export type UpdateCardInput = z.infer<typeof updateCardInputSchema>

export const moveCardInputSchema = z.object({
  cardId: z.string().uuid(),
  targetColumnId: z.string().uuid(),
  newOrderIndex: z.number().finite(),
})
export type MoveCardInput = z.infer<typeof moveCardInputSchema>

export const searchCardsInputSchema = z.object({
  boardId: z.string().uuid(),
  search: z.string().max(500).optional(),
  priorities: z.array(prioritySchema).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})
export type SearchCardsInput = z.infer<typeof searchCardsInputSchema>

/** Flat card row returned by search_cards (MCP + future search API). */
export type SearchCardResult = Card & {
  columnTitle: string
}

export const boardSummarySchema = z.object({
  boardId: z.string().uuid(),
  boardName: z.string(),
  totalCards: z.number().int().nonnegative(),
  byColumn: z.array(
    z.object({
      columnId: z.string().uuid(),
      title: z.string(),
      count: z.number().int().nonnegative(),
    })
  ),
  byPriority: z.array(
    z.object({
      priority: prioritySchema,
      count: z.number().int().nonnegative(),
    })
  ),
  urgentCards: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      columnId: z.string().uuid(),
      columnTitle: z.string(),
    })
  ),
})
export type BoardSummary = z.infer<typeof boardSummarySchema>

/** Smart Add / parse endpoint output (Phase 1). */
export const parsedCardDraftSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(10_000).nullable(),
  priority: prioritySchema,
  columnId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
  labelIds: z.array(z.string().uuid()),
})
export type ParsedCardDraft = z.infer<typeof parsedCardDraftSchema>

export const parseCardTextInputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
})
export type ParseCardTextInput = z.infer<typeof parseCardTextInputSchema>

/** Context sent to the LLM for parsing (IDs + display names). */
export type BoardParseContext = {
  columns: Array<{ id: string; title: string }>
  members: Array<{ userId: string; name: string; email: string }>
  labels: Array<{ id: string; name: string }>
  defaults: { columnId: string; priority: Priority }
}

export function buildBoardSummary(snapshot: BoardSnapshot): BoardSummary {
  const byColumn = snapshot.columns.map((col) => ({
    columnId: col.id,
    title: col.title,
    count: col.cards.length,
  }))

  const priorityCounts: Record<Priority, number> = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  }

  const urgentCards: BoardSummary['urgentCards'] = []
  let totalCards = 0

  for (const col of snapshot.columns) {
    for (const card of col.cards) {
      totalCards += 1
      priorityCounts[card.priority] += 1
      if (card.priority === 'urgent') {
        urgentCards.push({
          id: card.id,
          title: card.title,
          columnId: col.id,
          columnTitle: col.title,
        })
      }
    }
  }

  const byPriority = (Object.keys(priorityCounts) as Priority[]).map((priority) => ({
    priority,
    count: priorityCounts[priority],
  }))

  return boardSummarySchema.parse({
    boardId: snapshot.id,
    boardName: snapshot.name,
    totalCards,
    byColumn,
    byPriority,
    urgentCards,
  })
}

/** Re-export domain types used in agent tool descriptions. */
export type { Board, Card, Column, Label, User, Priority }
