// Tracks which card IDs currently have an in-flight mutation. Used by
// useBoardRealtime to suppress echo events on the originating tab — when our
// own optimistic update already wrote the new state and the post-onSettled
// refetch will normalize it, the Realtime event from the same DB write is
// redundant and (worse) may apply stale assignee/label data.
//
// Multiset semantics: nested or overlapping mutations on the same card are
// rare but possible, so we count rather than just track presence.

const counts = new Map<string, number>()

export function beginCardMutation(cardId: string): void {
  counts.set(cardId, (counts.get(cardId) ?? 0) + 1)
}

export function endCardMutation(cardId: string): void {
  const next = (counts.get(cardId) ?? 0) - 1
  if (next <= 0) counts.delete(cardId)
  else counts.set(cardId, next)
}

export function isCardMutating(cardId: string): boolean {
  return counts.has(cardId)
}
