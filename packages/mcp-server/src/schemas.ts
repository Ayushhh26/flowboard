import { z } from 'zod'

export const prioritySchema = z.enum(['none', 'low', 'medium', 'high', 'urgent'])

export const boardIdArgSchema = z.object({
  boardId: z
    .string()
    .uuid()
    .optional()
    .describe('Board UUID (defaults to FLOWBOARD_BOARD_ID env)'),
})

export const getBoardInputSchema = boardIdArgSchema

export const getBoardSummaryInputSchema = boardIdArgSchema

export const searchCardsInputSchema = boardIdArgSchema.extend({
  search: z.string().max(500).optional(),
  priorities: z.array(prioritySchema).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export const createCardInputSchema = boardIdArgSchema.extend({
  columnId: z.string().uuid().describe('Target column UUID — call get_board first to list columns'),
  title: z.string().trim().min(1).max(300),
  priority: prioritySchema.optional(),
  description: z.string().max(10_000).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
})

export const createCardFromTextInputSchema = boardIdArgSchema.extend({
  text: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .describe('Natural-language description of the task (e.g. "fix the login bug, urgent, assign to Ayush")'),
})

export const moveCardInputSchema = boardIdArgSchema.extend({
  cardId: z.string().uuid(),
  targetColumnId: z.string().uuid(),
  newOrderIndex: z
    .number()
    .finite()
    .optional()
    .describe(
      'Fractional position in target column. Omit to append at end (max orderIndex + 1). Between two cards use (before + after) / 2.'
    ),
})
