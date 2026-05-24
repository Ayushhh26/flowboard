import {
  parsedCardDraftSchema,
  type BoardParseContext,
  type ParsedCardDraft,
} from '@/types/agent'

export const GROK_PARSED_CARD_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', maxLength: 300 },
    description: { type: ['string', 'null'], maxLength: 10000 },
    priority: {
      type: 'string',
      enum: ['none', 'low', 'medium', 'high', 'urgent'],
    },
    columnId: { type: 'string', format: 'uuid' },
    assigneeId: { type: ['string', 'null'], format: 'uuid' },
    labelIds: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
    },
  },
  required: ['title', 'description', 'priority', 'columnId', 'assigneeId', 'labelIds'],
  additionalProperties: false,
} as const

export function parseDraftJson(raw: unknown): ParsedCardDraft {
  return parsedCardDraftSchema.parse(raw)
}

export function validateDraftAgainstBoard(
  draft: ParsedCardDraft,
  context: BoardParseContext
): void {
  const columnIds = new Set(context.columns.map((c) => c.id))
  if (!columnIds.has(draft.columnId)) {
    throw new Error('columnId is not on this board')
  }

  const memberIds = new Set(context.members.map((m) => m.userId))
  if (draft.assigneeId !== null && !memberIds.has(draft.assigneeId)) {
    throw new Error('assigneeId is not a board member')
  }

  const labelIds = new Set(context.labels.map((l) => l.id))
  for (const id of draft.labelIds) {
    if (!labelIds.has(id)) {
      throw new Error('labelIds contains an invalid label')
    }
  }
}
