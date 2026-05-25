import { ok, err } from '@/lib/api'
import { loadBoardParseContext } from '@/lib/ai/loadBoardParseContext'
import { parseCardFromText } from '@/lib/ai/parseCardFromText'
import { requireActor, UnauthorizedError } from '@/lib/auth'
import { createCardFromDraft } from '@/lib/createCardFromDraft'
import { parseCardTextInputSchema } from '@/types/agent'

/**
 * One-shot natural language → card.
 *
 * Used by the MCP `create_card_from_text` tool. The browser keeps the
 * preview-and-confirm flow on POST /cards/parse + the existing create routes.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let actor
  try {
    actor = await requireActor(req)
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id: boardId } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = parseCardTextInputSchema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400)
  }

  const boardContext = await loadBoardParseContext(boardId, actor.userId)
  if (!boardContext) {
    return err('NOT_FOUND', 'Board not found', 404)
  }

  const result = await parseCardFromText(parsed.data.text, boardContext)
  if (!result.ok) {
    const status = result.code === 'AI_UNAVAILABLE' ? 503 : 422
    return err(result.code, result.message, status)
  }

  const card = await createCardFromDraft(result.draft)
  return ok({ card, draft: result.draft }, 201)
}
