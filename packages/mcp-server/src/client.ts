export type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } }

export class FlowboardApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(`${code}: ${message}`)
    this.name = 'FlowboardApiError'
    this.code = code
    this.status = status
  }
}

export type FlowboardClientOptions = {
  baseUrl: string
  apiToken: string
  fetchImpl?: typeof fetch
}

export class FlowboardClient {
  private readonly baseUrl: string
  private readonly apiToken: string
  private readonly fetchImpl: typeof fetch

  constructor(options: FlowboardClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.apiToken = options.apiToken
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    const res = await this.fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
    if (!json || typeof json !== 'object' || !('data' in json)) {
      throw new FlowboardApiError('INVALID_RESPONSE', `Non-JSON or malformed response (${res.status})`, res.status)
    }

    if (json.error) {
      throw new FlowboardApiError(json.error.code, json.error.message, res.status)
    }

    return json.data as T
  }
}
