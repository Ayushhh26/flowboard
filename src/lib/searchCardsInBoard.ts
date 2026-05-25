import { matchesFilters, type FilterState } from '@/lib/filterCards'
import type { SearchCardResult } from '@/types/agent'
import type { Card } from '@/types/card'

/** Search over an in-memory column/card tree (same rules as the board filter bar). */
export function searchCardsInBoard(
  columns: Array<{ id: string; title: string; cards: Card[] }>,
  filters: FilterState,
  limit: number
): { cards: SearchCardResult[]; total: number } {
  const cards: SearchCardResult[] = []
  let total = 0

  for (const col of columns) {
    for (const card of col.cards) {
      if (!matchesFilters(card, filters)) continue
      total += 1
      if (cards.length < limit) {
        cards.push({ ...card, columnTitle: col.title })
      }
    }
  }

  return { cards, total }
}
