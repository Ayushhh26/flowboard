import { z } from 'zod'

const prioritySchema = z.enum(['none', 'low', 'medium', 'high', 'urgent'])

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

type BoardSnapshot = {
  id: string
  name: string
  columns: Array<{
    id: string
    title: string
    cards: Array<{ id: string; title: string; priority: z.infer<typeof prioritySchema> }>
  }>
}

/** Same aggregates as src/types/agent.ts buildBoardSummary (kept local for MCP package isolation). */
export function buildBoardSummary(snapshot: BoardSnapshot): BoardSummary {
  const byColumn = snapshot.columns.map((col) => ({
    columnId: col.id,
    title: col.title,
    count: col.cards.length,
  }))

  const priorityCounts: Record<z.infer<typeof prioritySchema>, number> = {
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

  const byPriority = (Object.keys(priorityCounts) as Array<z.infer<typeof prioritySchema>>).map(
    (priority) => ({
      priority,
      count: priorityCounts[priority],
    })
  )

  return boardSummarySchema.parse({
    boardId: snapshot.id,
    boardName: snapshot.name,
    totalCards,
    byColumn,
    byPriority,
    urgentCards,
  })
}
