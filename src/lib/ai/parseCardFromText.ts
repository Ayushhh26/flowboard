import 'server-only'
import { ZodError } from 'zod'
import {
  buildParseCardUserMessage,
  PARSE_CARD_SYSTEM_PROMPT,
} from '@/lib/ai/parseCardPrompt'
import {
  parseDraftJson,
  validateDraftAgainstBoard,
} from '@/lib/ai/parseCardDraft'
import {
  isGroqConfigured,
  requestParsedCardDraft,
  GroqRequestError,
  GroqUnavailableError,
} from '@/lib/ai/groq'
import type { BoardParseContext, ParsedCardDraft } from '@/types/agent'

export type ParseCardFromTextResult =
  | { ok: true; draft: ParsedCardDraft }
  | { ok: false; code: 'AI_UNAVAILABLE' | 'PARSE_FAILED'; message: string }

export async function parseCardFromText(
  text: string,
  boardContext: BoardParseContext
): Promise<ParseCardFromTextResult> {
  if (!isGroqConfigured()) {
    return {
      ok: false,
      code: 'AI_UNAVAILABLE',
      message:
        'Smart Add is not configured (set GROQ_API_KEY from https://console.groq.com)',
    }
  }

  const userMessage = buildParseCardUserMessage(text, boardContext)

  const attempt = async (): Promise<ParsedCardDraft> => {
    const raw = await requestParsedCardDraft(PARSE_CARD_SYSTEM_PROMPT, userMessage)
    const draft = parseDraftJson(raw)
    validateDraftAgainstBoard(draft, boardContext)
    return draft
  }

  try {
    const draft = await attempt()
    return { ok: true, draft }
  } catch (first) {
    if (first instanceof GroqUnavailableError) {
      return { ok: false, code: 'AI_UNAVAILABLE', message: first.message }
    }
    if (first instanceof GroqRequestError) {
      return { ok: false, code: 'PARSE_FAILED', message: first.message }
    }

    try {
      const draft = await requestParsedCardDraft(
        PARSE_CARD_SYSTEM_PROMPT,
        `${userMessage}\n\nYour previous response was invalid. Return only JSON matching the schema. Use only IDs from boardContext.`
      )
      const parsed = parseDraftJson(draft)
      validateDraftAgainstBoard(parsed, boardContext)
      return { ok: true, draft: parsed }
    } catch (second) {
      const message =
        second instanceof ZodError
          ? 'Model output did not match the card schema'
          : second instanceof Error
            ? second.message
            : 'Failed to parse card from text'
      return { ok: false, code: 'PARSE_FAILED', message }
    }
  }
}
