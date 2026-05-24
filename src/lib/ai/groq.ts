import 'server-only'
import { GROK_PARSED_CARD_JSON_SCHEMA } from '@/lib/ai/parseCardDraft'

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
/** Supports json_schema on Groq — see https://console.groq.com/docs/structured-outputs#supported-models */
const DEFAULT_MODEL = 'openai/gpt-oss-20b'
const REQUEST_TIMEOUT_MS = 45_000

type GroqChatResponse = {
  choices?: Array<{
    message?: { content?: string | null }
  }>
  error?: { message?: string }
}

export function isGroqConfigured(): boolean {
  return Boolean(getGroqApiKey())
}

function getGroqApiKey(): string | undefined {
  return (
    process.env.GROQ_API_KEY?.trim() ||
    process.env.XAI_API_KEY?.trim() ||
    undefined
  )
}

function supportsStrictSchema(model: string): boolean {
  return model.includes('gpt-oss') && !model.includes('safeguard')
}

function isJsonSchemaUnsupported(message: string): boolean {
  return (
    message.includes('json_schema') ||
    message.includes('response format') ||
    message.includes('structured')
  )
}

async function callGroq(
  apiKey: string,
  body: Record<string, unknown>,
  signal: AbortSignal
): Promise<GroqChatResponse> {
  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  const parsed = (await res.json().catch(() => ({}))) as GroqChatResponse

  if (!res.ok) {
    const msg = parsed.error?.message ?? `Groq request failed (${res.status})`
    throw new GroqRequestError(msg)
  }

  return parsed
}

export async function requestStructuredJson<T>(options: {
  system: string
  user: string
  schemaName: string
  jsonSchema: Record<string, unknown>
}): Promise<T> {
  const apiKey = getGroqApiKey()
  if (!apiKey) {
    throw new GroqUnavailableError(
      'Smart Add is not configured (set GROQ_API_KEY from https://console.groq.com)'
    )
  }

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL
  const strict = supportsStrictSchema(model)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const schemaBody = {
      model,
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user },
      ],
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: options.schemaName,
          strict,
          schema: options.jsonSchema,
        },
      },
    }

    let body: GroqChatResponse
    try {
      body = await callGroq(apiKey, schemaBody, controller.signal)
    } catch (e) {
      if (
        e instanceof GroqRequestError &&
        isJsonSchemaUnsupported(e.message)
      ) {
        const jsonObjectSystem = `${options.system}

Return a single JSON object (no markdown) matching this schema exactly:
${JSON.stringify(options.jsonSchema)}`

        body = await callGroq(
          apiKey,
          {
            model,
            messages: [
              { role: 'system', content: jsonObjectSystem },
              { role: 'user', content: options.user },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          },
          controller.signal
        )
      } else {
        throw e
      }
    }

    const text = body.choices?.[0]?.message?.content
    if (!text) {
      throw new GroqRequestError('Groq returned no structured output')
    }

    return JSON.parse(text) as T
  } catch (e) {
    if (e instanceof GroqUnavailableError || e instanceof GroqRequestError) throw e
    if (e instanceof Error && e.name === 'AbortError') {
      throw new GroqRequestError('Groq request timed out')
    }
    throw new GroqRequestError(e instanceof Error ? e.message : 'Groq request failed')
  } finally {
    clearTimeout(timeout)
  }
}

export async function requestParsedCardDraft(
  system: string,
  user: string
): Promise<unknown> {
  return requestStructuredJson<unknown>({
    system,
    user,
    schemaName: 'ParsedCardDraft',
    jsonSchema: GROK_PARSED_CARD_JSON_SCHEMA,
  })
}

export class GroqUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GroqUnavailableError'
  }
}

export class GroqRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GroqRequestError'
  }
}
