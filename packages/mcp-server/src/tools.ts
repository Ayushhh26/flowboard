import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FlowboardClient } from './client.js'
import { resolveBoardId, type FlowboardConfig } from './config.js'
import { buildBoardSummary } from './summary.js'
import {
  createCardInputSchema,
  getBoardInputSchema,
  getBoardSummaryInputSchema,
  moveCardInputSchema,
  searchCardsInputSchema,
} from './schemas.js'

type BoardCard = { id: string; title: string; priority: string; orderIndex?: number }

type BoardSnapshot = {
  id: string
  name: string
  columns: Array<{
    id: string
    title: string
    cards: BoardCard[]
  }>
}

type SearchCardsResponse = {
  cards: unknown[]
  total: number
  limit: number
}

function textResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  }
}

function buildSearchQuery(params: {
  search?: string
  priorities?: string[]
  assigneeIds?: string[]
  labelIds?: string[]
  limit?: number
}): string {
  const sp = new URLSearchParams()
  if (params.search) sp.set('search', params.search)
  if (params.priorities?.length) sp.set('priorities', params.priorities.join(','))
  if (params.assigneeIds?.length) sp.set('assigneeIds', params.assigneeIds.join(','))
  if (params.labelIds?.length) sp.set('labelIds', params.labelIds.join(','))
  if (params.limit !== undefined) sp.set('limit', String(params.limit))
  const q = sp.toString()
  return q ? `?${q}` : ''
}

function appendOrderIndex(cards: { orderIndex: number }[]): number {
  const max = cards.reduce((m, c) => Math.max(m, c.orderIndex), 0)
  return max > 0 ? max + 1.0 : 1.0
}

export function registerFlowboardTools(server: McpServer, config: FlowboardConfig) {
  const client = new FlowboardClient({
    baseUrl: config.baseUrl,
    apiToken: config.apiToken,
  })

  server.registerTool(
    'get_board',
    {
      title: 'Get board',
      description:
        'Returns the full board snapshot (columns, cards, labels, members). Call this first when you need column IDs, titles, or current card layout.',
      inputSchema: getBoardInputSchema,
    },
    async (args) => {
      const boardId = resolveBoardId(args.boardId, config.defaultBoardId)
      const board = await client.get<BoardSnapshot>(`/api/boards/${boardId}`)
      return textResult(board)
    }
  )

  server.registerTool(
    'get_board_summary',
    {
      title: 'Get board summary',
      description:
        'Structured summary: card counts by column and priority, plus urgent cards. Uses get_board data locally (no extra API).',
      inputSchema: getBoardSummaryInputSchema,
    },
    async (args) => {
      const boardId = resolveBoardId(args.boardId, config.defaultBoardId)
      const board = await client.get<BoardSnapshot>(`/api/boards/${boardId}`)
      const summary = buildBoardSummary({
        id: board.id,
        name: board.name,
        columns: board.columns.map((col) => ({
          id: col.id,
          title: col.title,
          cards: col.cards.map((c) => ({
            id: c.id,
            title: c.title,
            priority: c.priority as 'none' | 'low' | 'medium' | 'high' | 'urgent',
          })),
        })),
      })
      return textResult(summary)
    }
  )

  server.registerTool(
    'search_cards',
    {
      title: 'Search cards',
      description:
        'Find cards on a board by title/description text, priority, assignee, or labels. Same filter semantics as the web filter bar.',
      inputSchema: searchCardsInputSchema,
    },
    async (args) => {
      const boardId = resolveBoardId(args.boardId, config.defaultBoardId)
      const query = buildSearchQuery({
        search: args.search,
        priorities: args.priorities,
        assigneeIds: args.assigneeIds,
        labelIds: args.labelIds,
        limit: args.limit,
      })
      const result = await client.get<SearchCardsResponse>(`/api/boards/${boardId}/cards/search${query}`)
      return textResult(result)
    }
  )

  server.registerTool(
    'create_card',
    {
      title: 'Create card',
      description:
        'Creates a card in a column (POST), then optionally PATCHes description, assignee, and labels. Requires editor access. Use get_board to resolve columnId and member IDs.',
      inputSchema: createCardInputSchema,
    },
    async (args) => {
      const { columnId, title, priority, description, assigneeId, labelIds } = args

      const created = await client.post<{ id: string }>(`/api/columns/${columnId}/cards`, {
        title,
        ...(priority !== undefined ? { priority } : {}),
      })

      const patch: Record<string, unknown> = {}
      if (description !== undefined) patch.description = description
      if (assigneeId !== undefined) patch.assigneeId = assigneeId
      if (labelIds !== undefined) patch.labelIds = labelIds

      if (Object.keys(patch).length > 0) {
        const updated = await client.patch<unknown>(`/api/cards/${created.id}`, patch)
        return textResult(updated)
      }

      return textResult(created)
    }
  )

  server.registerTool(
    'move_card',
    {
      title: 'Move card',
      description:
        'Moves a card to another column with a fractional orderIndex. Omit newOrderIndex to append at the end of the target column. Use get_board to inspect orderIndex values when inserting between cards.',
      inputSchema: moveCardInputSchema,
    },
    async (args) => {
      let newOrderIndex = args.newOrderIndex

      if (newOrderIndex === undefined) {
        const boardId = resolveBoardId(args.boardId, config.defaultBoardId)
        const board = await client.get<BoardSnapshot>(`/api/boards/${boardId}`)
        const targetCol = board.columns.find((c) => c.id === args.targetColumnId)
        if (!targetCol) {
          throw new Error('targetColumnId not found on board — call get_board for valid column IDs')
        }
        newOrderIndex = appendOrderIndex(
          targetCol.cards.map((c, i) => ({ orderIndex: c.orderIndex ?? i + 1 }))
        )
      }

      const moved = await client.post<unknown>(`/api/cards/${args.cardId}/move`, {
        targetColumnId: args.targetColumnId,
        newOrderIndex,
      })
      return textResult(moved)
    }
  )
}
