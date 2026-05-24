import type { Card, Priority } from '@/types/card'

export interface FilterState {
  priorities: Priority[]
  assigneeIds: string[]
  labelIds: string[]
  search: string
}

export const EMPTY_FILTERS: FilterState = {
  priorities: [],
  assigneeIds: [],
  labelIds: [],
  search: '',
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.priorities.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.labelIds.length > 0 ||
    filters.search.trim().length > 0
  )
}

export function matchesFilters(card: Card, filters: FilterState): boolean {
  if (filters.priorities.length > 0 && !filters.priorities.includes(card.priority)) {
    return false
  }

  if (filters.assigneeIds.length > 0) {
    if (!card.assigneeId || !filters.assigneeIds.includes(card.assigneeId)) {
      return false
    }
  }

  if (filters.labelIds.length > 0) {
    const cardLabelIds = card.labels.map((l) => l.id)
    if (!filters.labelIds.some((id) => cardLabelIds.includes(id))) {
      return false
    }
  }

  const q = filters.search.trim().toLowerCase()
  if (q) {
    const haystack = `${card.title} ${card.description ?? ''}`.toLowerCase()
    if (!haystack.includes(q)) return false
  }

  return true
}

export function filterCards(cards: Card[], filters: FilterState): Card[] {
  if (!hasActiveFilters(filters)) return cards
  return cards.filter((c) => matchesFilters(c, filters))
}
