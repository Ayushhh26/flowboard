import 'server-only'
import type { BoardParseContext } from '@/types/agent'

export const PARSE_CARD_SYSTEM_PROMPT = `You extract Kanban card fields from unstructured user text for FlowBoard.

Rules:
- title: short imperative phrase; strip filler ("please", "can you"). Max 300 chars.
- description: extra detail not in the title, or null if none.
- priority: map "urgent", "asap", "P0" → urgent; "low priority", "nice to have" → low; default none when unclear.
- columnId: pick the closest column by title from the provided list (e.g. todo → Backlog, doing → In Progress). Must be an exact id from columns.
- assigneeId: match a member display name (case-insensitive). If ambiguous or no match, use null. Must be an exact userId from members or null.
- labelIds: only labels explicitly mentioned by name; empty array if none. Each id must be from labels.

Use defaults from boardContext.defaults when column or priority is not specified.
Never invent UUIDs — only use ids present in boardContext.`

export function buildParseCardUserMessage(
  text: string,
  boardContext: BoardParseContext
): string {
  return JSON.stringify({ boardContext, userText: text })
}
