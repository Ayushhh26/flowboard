export type ApiTokenListItem = {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
}

export type ApiTokenCreated = ApiTokenListItem & {
  /** Shown once at creation; never stored or returned again. */
  token: string
}
